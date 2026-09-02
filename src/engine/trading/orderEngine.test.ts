import { describe, expect, it } from 'vitest';
import type { Candle } from '@/engine/candles/types';
import type { Order, Position } from './types';
import { checkStopAndTarget, computePositionSize, fillMarketOrder, tryFillLimitOrder } from './orderEngine';

function candle(partial: Partial<Candle>): Candle {
  return { time: '2024-01-01', open: 100, high: 101, low: 99, close: 100, ...partial };
}

function order(partial: Partial<Order>): Order {
  return {
    id: 'ord-1',
    side: 'buy',
    type: 'market',
    qty: 10,
    status: 'pending',
    submittedAtIndex: 0,
    ...partial,
  };
}

function position(partial: Partial<Position>): Position {
  return { qty: 10, avgCost: 100, openedAtIndex: 0, ...partial };
}

describe('fillMarketOrder', () => {
  it('fills at the NEXT candle open, not its close', () => {
    const o = order({ type: 'market', side: 'buy' });
    const filled = fillMarketOrder(o, candle({ open: 105, close: 110 }), 1);
    expect(filled.status).toBe('filled');
    expect(filled.filledPrice).toBe(105);
    expect(filled.filledPrice).not.toBe(110);
    expect(filled.filledAtIndex).toBe(1);
  });
});

describe('tryFillLimitOrder', () => {
  it('fills a buy limit once the candle range trades down to it', () => {
    const o = order({ type: 'limit', side: 'buy', limitPrice: 95 });
    const notYet = tryFillLimitOrder(o, candle({ low: 96, high: 102 }), 1);
    expect(notYet).toBeNull();

    const filled = tryFillLimitOrder(o, candle({ low: 94, high: 99 }), 2);
    expect(filled?.status).toBe('filled');
    expect(filled?.filledPrice).toBe(95);
    expect(filled?.filledAtIndex).toBe(2);
  });

  it('fills a sell limit once the candle range trades up to it', () => {
    const o = order({ type: 'limit', side: 'sell', limitPrice: 110 });
    const filled = tryFillLimitOrder(o, candle({ low: 105, high: 112 }), 3);
    expect(filled?.status).toBe('filled');
    expect(filled?.filledPrice).toBe(110);
  });

  it('never fills if price never trades through the limit', () => {
    const o = order({ type: 'limit', side: 'buy', limitPrice: 50 });
    const results = [
      candle({ low: 90, high: 100 }),
      candle({ low: 88, high: 96 }),
      candle({ low: 92, high: 99 }),
    ].map((c, i) => tryFillLimitOrder(o, c, i));
    expect(results.every((r) => r === null)).toBe(true);
  });

  it('is a no-op for market orders', () => {
    const o = order({ type: 'market', side: 'buy' });
    expect(tryFillLimitOrder(o, candle({ low: 0, high: 999 }), 1)).toBeNull();
  });
});

describe('checkStopAndTarget', () => {
  it('triggers the stop when the low crosses it', () => {
    const p = position({ avgCost: 100, stopLoss: 95 });
    const result = checkStopAndTarget(p, candle({ low: 94, open: 98, high: 99 }), 5);
    expect(result).toEqual({ reason: 'stop-loss', price: 95 });
  });

  it('slips the stop fill to the open on a gap down through it', () => {
    const p = position({ avgCost: 100, stopLoss: 95 });
    const result = checkStopAndTarget(p, candle({ open: 90, low: 88, high: 91 }), 5);
    expect(result).toEqual({ reason: 'stop-loss', price: 90 });
  });

  it('triggers the take profit when the high crosses it', () => {
    const p = position({ avgCost: 100, takeProfit: 110 });
    const result = checkStopAndTarget(p, candle({ high: 111, open: 105, low: 104 }), 5);
    expect(result).toEqual({ reason: 'take-profit', price: 110 });
  });

  it('resolves an ambiguous candle that covers both stop and target as the stop', () => {
    const p = position({ avgCost: 100, stopLoss: 95, takeProfit: 110 });
    const result = checkStopAndTarget(p, candle({ open: 100, low: 90, high: 115 }), 5);
    expect(result?.reason).toBe('stop-loss');
  });

  it('returns null when neither level is touched', () => {
    const p = position({ avgCost: 100, stopLoss: 90, takeProfit: 120 });
    expect(checkStopAndTarget(p, candle({ low: 96, high: 104 }), 5)).toBeNull();
  });
});

describe('computePositionSize', () => {
  it('sizes a position to risk exactly the requested % of equity', () => {
    const result = computePositionSize({ equity: 10_000, entryPrice: 50, stopPrice: 45, riskPct: 0.01 });
    // $100 budget / $5 risk per share = 20 shares
    expect(result.valid).toBe(true);
    expect(result.qty).toBe(20);
    expect(result.dollarRisk).toBeCloseTo(100);
  });

  it('computes a reward:risk ratio against the take profit', () => {
    const result = computePositionSize({ equity: 10_000, entryPrice: 50, stopPrice: 45, takeProfitPrice: 65, riskPct: 0.01 });
    expect(result.riskRewardRatio).toBeCloseTo(3); // $15 reward / $5 risk
  });

  it('rejects a stop that sits above (or at) the entry for a long', () => {
    const atEntry = computePositionSize({ equity: 10_000, entryPrice: 50, stopPrice: 50 });
    const above = computePositionSize({ equity: 10_000, entryPrice: 50, stopPrice: 55 });
    expect(atEntry.valid).toBe(false);
    expect(above.valid).toBe(false);
  });

  it('never returns NaN or a negative size for degenerate input', () => {
    const zeroEquity = computePositionSize({ equity: 0, entryPrice: 50, stopPrice: 45 });
    const nanStop = computePositionSize({ equity: 10_000, entryPrice: 50, stopPrice: Number.NaN });
    expect(zeroEquity.valid).toBe(false);
    expect(Number.isFinite(zeroEquity.qty)).toBe(true);
    expect(nanStop.valid).toBe(false);
    expect(Number.isFinite(nanStop.qty)).toBe(true);
  });
});
