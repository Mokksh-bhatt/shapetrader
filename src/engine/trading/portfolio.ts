import type { Candle } from '@/engine/candles/types';
import { checkStopAndTarget, fillMarketOrder, tryFillLimitOrder } from './orderEngine';
import type { ClosedTrade, CloseReason, Order, OrderRequest, Position, PortfolioState, SimEvent } from './types';

export function createPortfolio(startingCash: number): PortfolioState {
  const cash = Number.isFinite(startingCash) && startingCash > 0 ? startingCash : 0;
  return {
    startingCash: cash,
    cash,
    position: null,
    restingOrders: [],
    orderHistory: [],
    closedTrades: [],
    equityCurve: [cash],
  };
}

/** Mark-to-market equity. Guarded so a bad price (NaN, a stale 0) can never
 *  turn the account value into something unrenderable. */
export function equityOf(portfolio: Pick<PortfolioState, 'cash' | 'position'>, markPrice: number): number {
  const cash = Number.isFinite(portfolio.cash) ? portfolio.cash : 0;
  if (!portfolio.position) return cash;
  const price = Number.isFinite(markPrice) && markPrice > 0 ? markPrice : portfolio.position.avgCost;
  return cash + portfolio.position.qty * price;
}

export function unrealizedPnl(position: Position | null, markPrice: number): number {
  if (!position || !Number.isFinite(markPrice)) return 0;
  return (markPrice - position.avgCost) * position.qty;
}

export function realizedPnl(closedTrades: ClosedTrade[]): number {
  return closedTrades.reduce((sum, t) => sum + (Number.isFinite(t.pnl) ? t.pnl : 0), 0);
}

/** Guarded against the empty-book case — no trades yet is not a 0% win rate,
 *  it's "no data", but callers just want a safe number to render. */
export function winRate(closedTrades: ClosedTrade[]): number {
  if (closedTrades.length === 0) return 0;
  const wins = closedTrades.filter((t) => t.pnl > 0).length;
  return wins / closedTrades.length;
}

/** Largest peak-to-trough decline in the equity curve, as a 0..1 fraction. */
export function maxDrawdownPct(equityCurve: number[]): number {
  if (equityCurve.length === 0) return 0;
  let peak = equityCurve[0];
  let worst = 0;
  for (const value of equityCurve) {
    if (!Number.isFinite(value)) continue;
    peak = Math.max(peak, value);
    if (peak > 0) worst = Math.max(worst, (peak - value) / peak);
  }
  return worst;
}

export function validateOrderRequest(
  portfolio: PortfolioState,
  request: OrderRequest,
  referencePrice: number,
): { ok: true } | { ok: false; reason: string } {
  if (!Number.isFinite(referencePrice) || referencePrice <= 0) {
    return { ok: false, reason: 'No price to trade against yet' };
  }
  if (!Number.isFinite(request.qty) || !Number.isInteger(request.qty) || request.qty <= 0) {
    return { ok: false, reason: 'Quantity must be a whole number greater than zero' };
  }
  if (request.type === 'limit' && (!Number.isFinite(request.limitPrice) || (request.limitPrice as number) <= 0)) {
    return { ok: false, reason: 'Enter a valid limit price' };
  }

  const hasRestingBuy = portfolio.restingOrders.some((o) => o.side === 'buy');
  const hasRestingSell = portfolio.restingOrders.some((o) => o.side === 'sell');

  if (request.side === 'buy') {
    if (portfolio.position) return { ok: false, reason: 'Close the open position before starting a new one' };
    if (hasRestingBuy) return { ok: false, reason: 'An entry order is already resting' };

    const entryRef = request.type === 'limit' ? (request.limitPrice as number) : referencePrice;

    if (request.stopLoss !== undefined) {
      if (!Number.isFinite(request.stopLoss) || request.stopLoss <= 0) {
        return { ok: false, reason: 'Stop loss must be a positive price' };
      }
      if (request.stopLoss >= entryRef) {
        return { ok: false, reason: 'Stop loss must sit below the entry for a long' };
      }
    }
    if (request.takeProfit !== undefined) {
      if (!Number.isFinite(request.takeProfit) || request.takeProfit <= 0) {
        return { ok: false, reason: 'Take profit must be a positive price' };
      }
      if (request.takeProfit <= entryRef) {
        return { ok: false, reason: 'Take profit must sit above the entry for a long' };
      }
    }

    const estimatedCost = request.qty * entryRef;
    if (estimatedCost > portfolio.cash + 1e-6) {
      return { ok: false, reason: 'Not enough cash for this order size' };
    }
    return { ok: true };
  }

  // side === 'sell'
  if (!portfolio.position) return { ok: false, reason: 'No open position to sell' };
  if (hasRestingSell) return { ok: false, reason: 'An exit order is already resting' };
  if (request.qty > portfolio.position.qty) {
    return { ok: false, reason: `Cannot sell more than the ${portfolio.position.qty} shares held` };
  }
  return { ok: true };
}

let orderSeq = 0;
function nextOrderId(index: number): string {
  orderSeq += 1;
  return `ord-${index}-${orderSeq}`;
}

export function submitOrder(
  portfolio: PortfolioState,
  request: OrderRequest,
  currentIndex: number,
  referencePrice: number,
): { portfolio: PortfolioState; order: Order } | { error: string } {
  const check = validateOrderRequest(portfolio, request, referencePrice);
  if (!check.ok) return { error: check.reason };

  const order: Order = {
    id: nextOrderId(currentIndex),
    side: request.side,
    type: request.type,
    qty: request.qty,
    limitPrice: request.type === 'limit' ? request.limitPrice : undefined,
    stopLoss: request.side === 'buy' ? request.stopLoss : undefined,
    takeProfit: request.side === 'buy' ? request.takeProfit : undefined,
    status: 'pending',
    submittedAtIndex: currentIndex,
  };

  return {
    portfolio: { ...portfolio, restingOrders: [...portfolio.restingOrders, order] },
    order,
  };
}

export function cancelOrder(portfolio: PortfolioState, orderId: string, index: number): PortfolioState {
  const target = portfolio.restingOrders.find((o) => o.id === orderId);
  if (!target) return portfolio;
  const cancelled: Order = { ...target, status: 'cancelled', cancelledAtIndex: index, note: 'Cancelled by trader' };
  return {
    ...portfolio,
    restingOrders: portfolio.restingOrders.filter((o) => o.id !== orderId),
    orderHistory: [...portfolio.orderHistory, cancelled],
  };
}

/** A limit order that never crossed by the time the dataset runs out gets
 *  moved into history rather than left "pending" forever. */
export function expireRestingOrders(portfolio: PortfolioState, index: number): PortfolioState {
  if (portfolio.restingOrders.length === 0) return portfolio;
  const expired = portfolio.restingOrders.map((o) => ({
    ...o,
    status: 'cancelled' as const,
    cancelledAtIndex: index,
    note: 'Never filled — session ended',
  }));
  return { ...portfolio, restingOrders: [], orderHistory: [...portfolio.orderHistory, ...expired] };
}

export function updatePositionRisk(
  portfolio: PortfolioState,
  input: { stopLoss?: number | null; takeProfit?: number | null },
): { portfolio: PortfolioState } | { error: string } {
  if (!portfolio.position) return { error: 'No open position' };

  const stopLoss = input.stopLoss === null ? undefined : (input.stopLoss ?? portfolio.position.stopLoss);
  const takeProfit = input.takeProfit === null ? undefined : (input.takeProfit ?? portfolio.position.takeProfit);

  if (stopLoss !== undefined && (!Number.isFinite(stopLoss) || stopLoss <= 0)) {
    return { error: 'Stop loss must be a positive price' };
  }
  if (takeProfit !== undefined && (!Number.isFinite(takeProfit) || takeProfit <= 0)) {
    return { error: 'Take profit must be a positive price' };
  }
  if (stopLoss !== undefined && takeProfit !== undefined && stopLoss >= takeProfit) {
    return { error: 'Stop loss must sit below take profit' };
  }

  return { portfolio: { ...portfolio, position: { ...portfolio.position, stopLoss, takeProfit } } };
}

function applyBuyFill(
  state: { cash: number; position: Position | null },
  order: Order,
): { cash: number; position: Position } {
  const qty = order.qty;
  const price = order.filledPrice ?? 0;
  const cash = state.cash - qty * price;

  const prevQty = state.position?.qty ?? 0;
  const prevCost = state.position?.avgCost ?? 0;
  const totalQty = prevQty + qty;
  const avgCost = totalQty > 0 ? (prevQty * prevCost + qty * price) / totalQty : price;

  return {
    cash: Number.isFinite(cash) ? cash : state.cash,
    position: {
      qty: totalQty,
      avgCost: Number.isFinite(avgCost) ? avgCost : price,
      stopLoss: order.stopLoss ?? state.position?.stopLoss,
      takeProfit: order.takeProfit ?? state.position?.takeProfit,
      openedAtIndex: state.position?.openedAtIndex ?? order.filledAtIndex ?? 0,
    },
  };
}

function applySellFill(
  state: { cash: number; position: Position | null },
  order: Order,
  index: number,
): { cash: number; position: Position | null; closedTrade: ClosedTrade | null } {
  const position = state.position;
  if (!position || position.qty <= 0) {
    // Defensive: the engine must never let a sell execute against nothing held,
    // even if something upstream failed to catch it.
    return { cash: state.cash, position: state.position, closedTrade: null };
  }

  const qty = Math.min(order.qty, position.qty);
  const price = order.filledPrice ?? position.avgCost;
  const proceeds = qty * price;
  const pnl = (price - position.avgCost) * qty;
  const cash = state.cash + proceeds;
  const remainingQty = position.qty - qty;

  const trade: ClosedTrade = {
    id: order.id,
    qty,
    entryPrice: position.avgCost,
    exitPrice: price,
    pnl: Number.isFinite(pnl) ? pnl : 0,
    reason: 'manual-sell',
    openedAtIndex: position.openedAtIndex,
    closedAtIndex: index,
    hadRiskControls: position.stopLoss !== undefined,
  };

  return {
    cash: Number.isFinite(cash) ? cash : state.cash,
    position: remainingQty > 0 ? { ...position, qty: remainingQty } : null,
    closedTrade: trade,
  };
}

function closePositionAtPrice(
  position: Position,
  cash: number,
  price: number,
  index: number,
  reason: CloseReason,
): { cash: number; trade: ClosedTrade } {
  const proceeds = position.qty * price;
  const pnl = (price - position.avgCost) * position.qty;
  const trade: ClosedTrade = {
    id: `auto-${reason}-${index}`,
    qty: position.qty,
    entryPrice: position.avgCost,
    exitPrice: price,
    pnl: Number.isFinite(pnl) ? pnl : 0,
    reason,
    openedAtIndex: position.openedAtIndex,
    closedAtIndex: index,
    hadRiskControls: position.stopLoss !== undefined,
  };
  const nextCash = cash + proceeds;
  return { cash: Number.isFinite(nextCash) ? nextCash : cash, trade };
}

/**
 * Advance the book by exactly one newly revealed candle: resolve resting
 * orders, apply any fills, then check the resulting position's stop/target
 * against the same candle (price can still move after the fill that opened
 * it). Pure — the caller (the store) owns persistence and side effects like
 * toasts.
 */
export function advanceCandle(
  portfolio: PortfolioState,
  candle: Candle,
  index: number,
): { portfolio: PortfolioState; events: SimEvent[] } {
  let cash = portfolio.cash;
  let position = portfolio.position;
  const restingOrders: Order[] = [];
  const orderHistory = [...portfolio.orderHistory];
  const closedTrades = [...portfolio.closedTrades];
  const events: SimEvent[] = [];

  for (const order of portfolio.restingOrders) {
    const filled = order.type === 'market' ? fillMarketOrder(order, candle, index) : tryFillLimitOrder(order, candle, index);

    if (!filled) {
      restingOrders.push(order);
      continue;
    }

    orderHistory.push(filled);
    events.push({ kind: 'filled', order: filled });

    if (filled.side === 'buy') {
      const applied = applyBuyFill({ cash, position }, filled);
      cash = applied.cash;
      position = applied.position;
    } else {
      const applied = applySellFill({ cash, position }, filled, index);
      cash = applied.cash;
      position = applied.position;
      if (applied.closedTrade) {
        closedTrades.push(applied.closedTrade);
        events.push({ kind: 'closed', trade: applied.closedTrade });
      }
    }
  }

  if (position) {
    const risk = checkStopAndTarget(position, candle, index);
    if (risk) {
      const { cash: cashAfter, trade } = closePositionAtPrice(position, cash, risk.price, index, risk.reason);
      cash = cashAfter;
      position = null;
      closedTrades.push(trade);
      events.push({ kind: 'closed', trade });
    }
  }

  const equity = equityOf({ cash, position }, candle.close);
  const equityCurve = [...portfolio.equityCurve, Number.isFinite(equity) ? equity : portfolio.cash].slice(-1000);

  return {
    portfolio: { ...portfolio, cash, position, restingOrders, orderHistory, closedTrades, equityCurve },
    events,
  };
}

export interface RunSummary {
  finalEquity: number;
  startingCash: number;
  netPnl: number;
  netPnlPct: number;
  trades: number;
  wins: number;
  winRatePct: number;
  noStopTrades: number;
  maxDrawdownPct: number;
}

export function summarizeRun(portfolio: PortfolioState, markPrice: number): RunSummary {
  const finalEquity = equityOf(portfolio, markPrice);
  const netPnl = finalEquity - portfolio.startingCash;
  const trades = portfolio.closedTrades.length;
  const wins = portfolio.closedTrades.filter((t) => t.pnl > 0).length;
  const noStopTrades = portfolio.closedTrades.filter((t) => !t.hadRiskControls).length;

  return {
    finalEquity,
    startingCash: portfolio.startingCash,
    netPnl,
    netPnlPct: portfolio.startingCash > 0 ? netPnl / portfolio.startingCash : 0,
    trades,
    wins,
    winRatePct: trades > 0 ? wins / trades : 0,
    noStopTrades,
    maxDrawdownPct: maxDrawdownPct(portfolio.equityCurve),
  };
}
