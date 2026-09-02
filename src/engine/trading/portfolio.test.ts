import { describe, expect, it } from 'vitest';
import type { Candle } from '@/engine/candles/types';
import {
  advanceCandle,
  cancelOrder,
  createPortfolio,
  equityOf,
  maxDrawdownPct,
  submitOrder,
  unrealizedPnl,
  validateOrderRequest,
  winRate,
} from './portfolio';

function candle(partial: Partial<Candle>): Candle {
  return { time: '2024-01-01', open: 100, high: 101, low: 99, close: 100, ...partial };
}

describe('submitOrder / validateOrderRequest', () => {
  it('rejects selling more than is held', () => {
    let p = createPortfolio(10_000);
    const buy = submitOrder(p, { side: 'buy', type: 'market', qty: 10 }, 0, 100);
    if ('error' in buy) throw new Error(buy.error);
    p = advanceCandle(buy.portfolio, candle({ open: 100 }), 1).portfolio;
    expect(p.position?.qty).toBe(10);

    const oversell = validateOrderRequest(p, { side: 'sell', type: 'market', qty: 11 }, 100);
    expect(oversell).toEqual({ ok: false, reason: 'Cannot sell more than the 10 shares held' });

    const result = submitOrder(p, { side: 'sell', type: 'market', qty: 11 }, 1, 100);
    expect('error' in result).toBe(true);
  });

  it('rejects a buy that costs more than available cash', () => {
    const p = createPortfolio(1_000);
    const result = validateOrderRequest(p, { side: 'buy', type: 'market', qty: 100 }, 50);
    expect(result).toEqual({ ok: false, reason: 'Not enough cash for this order size' });
  });

  it('rejects a buy while a position is already open', () => {
    let p = createPortfolio(10_000);
    const buy = submitOrder(p, { side: 'buy', type: 'market', qty: 5 }, 0, 100);
    if ('error' in buy) throw new Error(buy.error);
    p = advanceCandle(buy.portfolio, candle({ open: 100 }), 1).portfolio;

    const second = validateOrderRequest(p, { side: 'buy', type: 'market', qty: 5 }, 100);
    expect(second.ok).toBe(false);
  });
});

describe('market order fill through the book', () => {
  it('fills at the next candle open and deducts cash at that price, not the price it was placed at', () => {
    const p0 = createPortfolio(10_000);
    const submitted = submitOrder(p0, { side: 'buy', type: 'market', qty: 10 }, 0, 100);
    if ('error' in submitted) throw new Error(submitted.error);

    const { portfolio, events } = advanceCandle(submitted.portfolio, candle({ open: 105, close: 108 }), 1);
    expect(events).toEqual([{ kind: 'filled', order: expect.objectContaining({ filledPrice: 105 }) }]);
    expect(portfolio.position).toEqual(
      expect.objectContaining({ qty: 10, avgCost: 105 }),
    );
    expect(portfolio.cash).toBeCloseTo(10_000 - 10 * 105);
    expect(portfolio.restingOrders).toHaveLength(0);
  });
});

describe('P&L and average cost', () => {
  it('realises P&L and average cost correctly across a buy then a partial sell', () => {
    let p = createPortfolio(10_000);

    const buy = submitOrder(p, { side: 'buy', type: 'market', qty: 20 }, 0, 100);
    if ('error' in buy) throw new Error(buy.error);
    p = advanceCandle(buy.portfolio, candle({ open: 100 }), 1).portfolio;
    expect(p.position?.avgCost).toBe(100);

    const sell = submitOrder(p, { side: 'sell', type: 'market', qty: 8 }, 1, 100);
    if ('error' in sell) throw new Error(sell.error);
    const { portfolio, events } = advanceCandle(sell.portfolio, candle({ open: 120 }), 2);

    const closedEvent = events.find((e) => e.kind === 'closed');
    expect(closedEvent?.kind).toBe('closed');
    if (closedEvent?.kind !== 'closed') throw new Error('expected a closed event');
    expect(closedEvent.trade.pnl).toBeCloseTo((120 - 100) * 8);

    // Partial sell — position stays open, same average cost, reduced size.
    expect(portfolio.position).toEqual(expect.objectContaining({ qty: 12, avgCost: 100 }));
    expect(portfolio.cash).toBeCloseTo(10_000 - 20 * 100 + 8 * 120);
  });

  it('never lets unrealizedPnl or equityOf produce NaN from a bad price', () => {
    const position = { qty: 5, avgCost: 100, openedAtIndex: 0 };
    expect(Number.isNaN(unrealizedPnl(position, Number.NaN))).toBe(false);
    expect(unrealizedPnl(position, Number.NaN)).toBe(0);

    const portfolio = createPortfolio(10_000);
    expect(Number.isFinite(equityOf(portfolio, Number.NaN))).toBe(true);
  });
});

describe('stop-loss auto-close reports risk controls', () => {
  it('closes the full position at the stop and flags hadRiskControls', () => {
    let p = createPortfolio(10_000);
    const buy = submitOrder(p, { side: 'buy', type: 'market', qty: 10, stopLoss: 95 }, 0, 100);
    if ('error' in buy) throw new Error(buy.error);
    p = advanceCandle(buy.portfolio, candle({ open: 100 }), 1).portfolio;
    expect(p.position?.stopLoss).toBe(95);

    const { portfolio, events } = advanceCandle(p, candle({ open: 99, low: 90, high: 101 }), 2);
    expect(portfolio.position).toBeNull();
    const closed = events.find((e) => e.kind === 'closed');
    if (closed?.kind !== 'closed') throw new Error('expected a closed event');
    expect(closed.trade.reason).toBe('stop-loss');
    expect(closed.trade.hadRiskControls).toBe(true);
  });
});

describe('cancelOrder', () => {
  it('moves a resting order into history without touching the position', () => {
    const p0 = createPortfolio(10_000);
    const submitted = submitOrder(p0, { side: 'buy', type: 'limit', qty: 5, limitPrice: 80 }, 0, 100);
    if ('error' in submitted) throw new Error(submitted.error);

    const cancelled = cancelOrder(submitted.portfolio, submitted.order.id, 1);
    expect(cancelled.restingOrders).toHaveLength(0);
    expect(cancelled.orderHistory[0]).toEqual(expect.objectContaining({ status: 'cancelled' }));
  });
});

describe('winRate and maxDrawdownPct', () => {
  it('is 0 with no closed trades rather than NaN', () => {
    expect(winRate([])).toBe(0);
  });

  it('computes the largest peak-to-trough decline', () => {
    const curve = [10_000, 11_000, 9_000, 9_500, 12_000, 8_000];
    // Worst drop is 12,000 -> 8,000 = 33.3%
    expect(maxDrawdownPct(curve)).toBeCloseTo((12_000 - 8_000) / 12_000, 5);
  });

  it('is 0 for an empty curve', () => {
    expect(maxDrawdownPct([])).toBe(0);
  });
});
