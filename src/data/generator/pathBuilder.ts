import type { Candle } from '@/engine/candles/types';
import type { Rng } from './seededRng';

/**
 * The shared engine behind every chart in the app.
 *
 * A price history is authored as a handful of *anchors* — "in March 2000 the
 * index was at 500, by October 2002 it was at 110" — which get interpolated
 * into a smooth path, roughened with market-like noise, then turned into OHLC
 * candles. Chart patterns use it (a head & shoulders is just five anchors) and
 * so do the historical case studies (real turning points as anchors). One
 * renderer, so a textbook pattern and a real crash are drawn by the same code.
 */

export type Interval = 'daily' | 'weekly';

export interface Anchor {
  /** Position along the series, 0 = first candle, 1 = last. */
  x: number;
  /** Price level at that position. */
  y: number;
}

export function makeDates(startISO: string, count: number, interval: Interval): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${startISO}T00:00:00Z`);
  while (dates.length < count) {
    const day = cursor.getUTCDay();
    if (interval === 'weekly') {
      dates.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 7);
    } else {
      // Markets are shut at the weekend; skipping keeps the axis honest.
      if (day !== 0 && day !== 6) dates.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return dates;
}

/** Smoothstep easing — gives anchors a rounded turn rather than a kink,
 *  which is what real tops and bottoms look like. */
function ease(t: number): number {
  return t * t * (3 - 2 * t);
}

export function interpolateAnchors(anchors: Anchor[], count: number, sharpness = 1): number[] {
  if (anchors.length === 0) return new Array(count).fill(100);
  const sorted = [...anchors].sort((a, b) => a.x - b.x);
  const out: number[] = [];

  for (let i = 0; i < count; i += 1) {
    const x = count === 1 ? 0 : i / (count - 1);
    let left = sorted[0];
    let right = sorted[sorted.length - 1];
    for (let k = 0; k < sorted.length - 1; k += 1) {
      if (x >= sorted[k].x && x <= sorted[k + 1].x) {
        left = sorted[k];
        right = sorted[k + 1];
        break;
      }
    }
    const span = right.x - left.x;
    const t = span <= 0 ? 0 : (x - left.x) / span;
    // sharpness > 1 blends toward linear, for V-shaped moves like a crash.
    const eased = ease(t) * (1 / sharpness) + t * (1 - 1 / sharpness);
    out.push(left.y + (right.y - left.y) * eased);
  }
  return out;
}

/**
 * Roughen a smooth path. The noise is auto-correlated (each step keeps 70% of
 * the last one) so the result meanders like a market instead of buzzing like
 * static — that texture is what makes the practice charts feel real.
 */
export function roughen(path: number[], rng: Rng, amount = 0.012): number[] {
  let drift = 0;
  return path.map((value) => {
    drift = drift * 0.7 + rng.gauss() * amount;
    return Math.max(value * (1 + drift), 0.01);
  });
}

export interface CandleBuildOptions {
  /** Typical intrabar movement as a fraction of price. */
  volatility?: number;
  /** Overnight gap size as a fraction of price. */
  gap?: number;
  baseVolume?: number;
  decimals?: number;
}

/** Turn a series of closing prices into believable OHLC candles. */
export function candlesFromCloses(
  closes: number[],
  dates: string[],
  rng: Rng,
  options: CandleBuildOptions = {},
): Candle[] {
  const { volatility = 0.012, gap = 0.003, baseVolume = 1_000_000, decimals = 2 } = options;
  const round = (n: number) => Number(n.toFixed(decimals));

  return closes.map((close, i) => {
    const prevClose = i === 0 ? close * (1 - rng.gauss() * gap) : closes[i - 1];
    const open = prevClose * (1 + rng.gauss() * gap);
    const top = Math.max(open, close);
    const bottom = Math.min(open, close);

    // Wicks scale with the bar's own move, with a floor so flat bars still
    // have a little shadow rather than looking like a bug.
    const reach = Math.max(Math.abs(close - open), close * volatility * 0.35);
    const high = top + Math.abs(rng.gauss()) * reach * 0.8;
    const low = bottom - Math.abs(rng.gauss()) * reach * 0.8;

    const move = Math.abs(close - prevClose) / Math.max(prevClose, 1e-9);
    const volume = Math.round(baseVolume * (0.6 + rng.next() * 0.8 + move * 25));

    return {
      time: dates[i],
      open: round(open),
      high: round(Math.max(high, top)),
      low: round(Math.min(low, bottom)),
      close: round(close),
      volume,
    };
  });
}

/** Anchors → finished candles, the one call most callers actually want. */
export function buildSeries(params: {
  anchors: Anchor[];
  count: number;
  startDate: string;
  interval: Interval;
  rng: Rng;
  noise?: number;
  sharpness?: number;
  candleOptions?: CandleBuildOptions;
}): Candle[] {
  const { anchors, count, startDate, interval, rng, noise = 0.012, sharpness = 1 } = params;
  const smooth = interpolateAnchors(anchors, count, sharpness);
  const rough = roughen(smooth, rng, noise);
  return candlesFromCloses(rough, makeDates(startDate, count, interval), rng, params.candleOptions);
}
