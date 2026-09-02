import type { Candle, CandleMetrics, ShapeId } from './types';

/**
 * Structural candle analysis. Everything the app claims about a candle is
 * measured here rather than asserted — the quiz uses it to verify that a
 * synthesised candle really is the shape it says it is, and the "x-ray" panel
 * shows the learner the same numbers.
 */

export function getMetrics(c: Candle): CandleMetrics {
  const range = Math.max(c.high - c.low, 1e-9);
  const body = Math.abs(c.close - c.open);
  const upperWick = c.high - Math.max(c.open, c.close);
  const lowerWick = Math.min(c.open, c.close) - c.low;
  return {
    body,
    range,
    upperWick: Math.max(upperWick, 0),
    lowerWick: Math.max(lowerWick, 0),
    bodyRatio: body / range,
    upperWickRatio: Math.max(upperWick, 0) / range,
    lowerWickRatio: Math.max(lowerWick, 0) / range,
    isUp: c.close >= c.open,
  };
}

/** Thresholds are intentionally the same ones the lessons quote, so the
 *  teaching text and the code can never drift apart. */
export const RULES = {
  dojiMaxBody: 0.1,
  marubozuMinBody: 0.8,
  longWickMultiple: 2, // wick at least 2x the body
  shortWickMax: 0.15, // opposite wick under 15% of range
  spinningTopMaxBody: 0.35,
} as const;

export function isDoji(c: Candle): boolean {
  return getMetrics(c).bodyRatio <= RULES.dojiMaxBody;
}

export function isHammer(c: Candle): boolean {
  const m = getMetrics(c);
  return (
    !isDoji(c) &&
    m.bodyRatio < RULES.spinningTopMaxBody &&
    m.lowerWick >= RULES.longWickMultiple * m.body &&
    m.upperWickRatio <= RULES.shortWickMax
  );
}

export function isShootingStar(c: Candle): boolean {
  const m = getMetrics(c);
  return (
    !isDoji(c) &&
    m.bodyRatio < RULES.spinningTopMaxBody &&
    m.upperWick >= RULES.longWickMultiple * m.body &&
    m.lowerWickRatio <= RULES.shortWickMax
  );
}

export function isMarubozu(c: Candle): boolean {
  return getMetrics(c).bodyRatio >= RULES.marubozuMinBody;
}

export function isSpinningTop(c: Candle): boolean {
  const m = getMetrics(c);
  return (
    !isDoji(c) &&
    m.bodyRatio <= RULES.spinningTopMaxBody &&
    m.upperWickRatio > RULES.shortWickMax &&
    m.lowerWickRatio > RULES.shortWickMax
  );
}

/** Engulfing needs the previous candle: a small body completely swallowed by
 *  the next candle's body, in the opposite direction. */
export function isBullishEngulfing(prev: Candle, cur: Candle): boolean {
  const p = getMetrics(prev);
  const c = getMetrics(cur);
  return (
    !p.isUp &&
    c.isUp &&
    cur.close > prev.open &&
    cur.open < prev.close &&
    c.body > p.body
  );
}

export function isBearishEngulfing(prev: Candle, cur: Candle): boolean {
  const p = getMetrics(prev);
  const c = getMetrics(cur);
  return (
    p.isUp &&
    !c.isUp &&
    cur.close < prev.open &&
    cur.open > prev.close &&
    c.body > p.body
  );
}

/**
 * Best-effort identification of the last candle in a window. Order matters:
 * the most specific shapes are tested first, since e.g. a marubozu also
 * technically satisfies "not a doji".
 */
export function classify(candles: Candle[]): ShapeId | null {
  const cur = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  if (!cur) return null;

  if (prev && isBullishEngulfing(prev, cur)) return 'bullishEngulfing';
  if (prev && isBearishEngulfing(prev, cur)) return 'bearishEngulfing';
  if (isDoji(cur)) return 'doji';
  if (isMarubozu(cur)) return cur.close >= cur.open ? 'bullishMarubozu' : 'bearishMarubozu';
  if (isHammer(cur)) return 'hammer';
  if (isShootingStar(cur)) return 'shootingStar';
  if (isSpinningTop(cur)) return 'spinningTop';
  return null;
}
