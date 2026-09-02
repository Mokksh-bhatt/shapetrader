import type { Candle } from '@/engine/candles/types';
import { clamp } from '@/lib/formatters';
import type { CloseReason, Order, Position } from './types';

/**
 * Market orders fill at the NEXT candle's open, never the current close.
 * Filling at a close the trader is already looking at would be look-ahead
 * bias — in a real market you place the order now and get whatever price it
 * opens at next, which nobody, including this engine, gets to see in advance.
 */
export function fillMarketOrder(order: Order, fillCandle: Candle, fillIndex: number): Order {
  return {
    ...order,
    status: 'filled',
    filledPrice: fillCandle.open,
    filledAtIndex: fillIndex,
    note: 'Filled at next open',
  };
}

/**
 * A limit order rests until price actually trades through it: a buy fills
 * once the market prints low enough (candle.low <= limit), a sell once it
 * prints high enough (candle.high >= limit) — always at the limit price
 * itself. Returns null while the order is still waiting, which may be
 * forever; that possibility is the entire point of a limit order and has to
 * stay visible in the UI rather than being silently resolved.
 */
export function tryFillLimitOrder(order: Order, candle: Candle, index: number): Order | null {
  if (order.type !== 'limit' || order.limitPrice === undefined) return null;
  const crossed = order.side === 'buy' ? candle.low <= order.limitPrice : candle.high >= order.limitPrice;
  if (!crossed) return null;
  return {
    ...order,
    status: 'filled',
    filledPrice: order.limitPrice,
    filledAtIndex: index,
    note: 'Limit price reached',
  };
}

export interface RiskExitResult {
  reason: Extract<CloseReason, 'stop-loss' | 'take-profit'>;
  price: number;
}

/**
 * Stop loss / take profit are checked against every newly revealed candle's
 * high and low, not its close — a level crossed intrabar has to trigger even
 * if price recovered by the time the candle finished.
 *
 * If a single candle's range covers BOTH the stop and the target, OHLC data
 * alone can't tell us which was touched first. We resolve conservatively and
 * assume the stop hit first — the honest assumption, since it never
 * flatters the account with a lucky read of an ambiguous candle.
 *
 * A gap through the level (the candle opens beyond it) is filled at the
 * open, not the level itself — a real stop slips on a gap, and pretending
 * otherwise would be its own kind of look-ahead bias.
 */
export function checkStopAndTarget(position: Position, candle: Candle, _index: number): RiskExitResult | null {
  const stopHit = position.stopLoss !== undefined && candle.low <= position.stopLoss;
  if (stopHit) {
    const stop = position.stopLoss as number;
    const price = candle.open < stop ? candle.open : stop;
    return { reason: 'stop-loss', price };
  }

  const targetHit = position.takeProfit !== undefined && candle.high >= position.takeProfit;
  if (targetHit) {
    const target = position.takeProfit as number;
    const price = candle.open > target ? candle.open : target;
    return { reason: 'take-profit', price };
  }

  return null;
}

export interface PositionSizeInput {
  equity: number;
  entryPrice: number;
  stopPrice: number;
  takeProfitPrice?: number;
  /** Fraction of equity to risk, e.g. 0.01 = 1%. Defaults to 1%. */
  riskPct?: number;
}

export interface PositionSizeResult {
  valid: boolean;
  reason?: string;
  riskPerShare: number;
  qty: number;
  dollarRisk: number;
  positionValue: number;
  /** Reward-to-risk multiple against the take profit, null with no target set. */
  riskRewardRatio: number | null;
}

export const DEFAULT_RISK_PCT = 0.01;

/**
 * The single most valuable habit this module can teach: size the trade from
 * the stop, not the other way round. Risking a fixed, small % of the account
 * per trade is what keeps one bad trade from doing real damage — so this
 * takes account equity, entry and stop as inputs and works backwards to a
 * share count, rather than asking "how many shares do I want" first.
 */
export function computePositionSize(input: PositionSizeInput): PositionSizeResult {
  const invalid = (reason: string): PositionSizeResult => ({
    valid: false,
    reason,
    riskPerShare: 0,
    qty: 0,
    dollarRisk: 0,
    positionValue: 0,
    riskRewardRatio: null,
  });

  if (!Number.isFinite(input.equity) || input.equity <= 0) {
    return invalid('Account equity must be positive');
  }
  if (!Number.isFinite(input.entryPrice) || input.entryPrice <= 0) {
    return invalid('Entry price must be positive');
  }
  if (!Number.isFinite(input.stopPrice)) {
    return invalid('Enter a stop price');
  }

  const riskPerShare = input.entryPrice - input.stopPrice;
  if (riskPerShare <= 0) {
    return invalid('Stop must sit below entry for a long');
  }

  const riskPct = clamp(input.riskPct ?? DEFAULT_RISK_PCT, 0, 1);
  const dollarRisk = input.equity * riskPct;
  const qty = Math.max(0, Math.floor(dollarRisk / riskPerShare));
  const positionValue = qty * input.entryPrice;

  let riskRewardRatio: number | null = null;
  if (input.takeProfitPrice !== undefined && Number.isFinite(input.takeProfitPrice)) {
    const reward = input.takeProfitPrice - input.entryPrice;
    riskRewardRatio = reward / riskPerShare;
  }

  if (qty <= 0) {
    return { ...invalid('Risk per share is bigger than the risk budget'), riskPerShare, riskRewardRatio };
  }

  return { valid: true, riskPerShare, qty, dollarRisk, positionValue, riskRewardRatio };
}
