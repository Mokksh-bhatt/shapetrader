/**
 * Types for the paper-trading engine. Everything here describes a *long-only*
 * book — one symbol, one position at a time. That's a deliberate scope cut:
 * the teaching goal is order types, sizing, stops and P&L, not portfolio
 * construction, and a single position keeps every formula (avg cost,
 * unrealised P&L) honest without a matrix of edge cases.
 */

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';
export type OrderStatus = 'pending' | 'filled' | 'cancelled';

/** What the trader asked for, before the engine turns it into an `Order`. */
export interface OrderRequest {
  side: OrderSide;
  type: OrderType;
  qty: number;
  /** Required when type === 'limit'. */
  limitPrice?: number;
  /** Only meaningful on a buy — it defines the risk on the position it opens. */
  stopLoss?: number;
  takeProfit?: number;
}

export interface Order {
  id: string;
  side: OrderSide;
  type: OrderType;
  qty: number;
  limitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  status: OrderStatus;
  /** Candle index the order was placed on — a market order fills on the next one. */
  submittedAtIndex: number;
  filledAtIndex?: number;
  filledPrice?: number;
  cancelledAtIndex?: number;
  /** Short human-readable explanation, shown in the history panel. */
  note?: string;
}

export interface Position {
  qty: number;
  avgCost: number;
  stopLoss?: number;
  takeProfit?: number;
  openedAtIndex: number;
}

export type CloseReason = 'stop-loss' | 'take-profit' | 'manual-sell';

/** One realised exit — a sell fill, whether it flattened the position or only
 *  trimmed it. This is what win rate, badges and XP are computed from. */
export interface ClosedTrade {
  id: string;
  qty: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  reason: CloseReason;
  openedAtIndex: number;
  closedAtIndex: number;
  /** Whether a stop loss was in place at the moment this trade closed. */
  hadRiskControls: boolean;
}

export interface PortfolioState {
  startingCash: number;
  cash: number;
  position: Position | null;
  /** Orders still live — an unfilled entry, or a discretionary exit order. */
  restingOrders: Order[];
  /** Every order that has left the resting list: filled or cancelled. */
  orderHistory: Order[];
  closedTrades: ClosedTrade[];
  /** Mark-to-market equity sampled once per revealed candle, for drawdown. */
  equityCurve: number[];
}

/** What happened while advancing one candle, so callers (the store) can
 *  raise toasts and report to progress without re-deriving it from a diff. */
export type SimEvent =
  | { kind: 'filled'; order: Order }
  | { kind: 'closed'; trade: ClosedTrade };
