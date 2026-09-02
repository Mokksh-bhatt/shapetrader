/** A single price bar. `time` is an ISO date string ('2020-03-16'), which is
 *  exactly the format lightweight-charts accepts for business-day data. */
export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type Sentiment = 'bullish' | 'bearish' | 'neutral';

export type ShapeId =
  | 'doji'
  | 'hammer'
  | 'shootingStar'
  | 'bullishMarubozu'
  | 'bearishMarubozu'
  | 'spinningTop'
  | 'bullishEngulfing'
  | 'bearishEngulfing';

/** Derived geometry of one candle — the numbers behind the shape. Shown to the
 *  learner directly in the "candle x-ray" so the shape stops being a vibe and
 *  becomes a measurement. */
export interface CandleMetrics {
  body: number;
  range: number;
  upperWick: number;
  lowerWick: number;
  bodyRatio: number; // body / range
  upperWickRatio: number;
  lowerWickRatio: number;
  isUp: boolean;
}
