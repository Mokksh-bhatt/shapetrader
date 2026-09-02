import type { Candle, ShapeId } from '@/engine/candles/types';
import { classify } from '@/engine/candles/candleClassifier';
import { SHAPE_BY_ID } from '@/data/candlestickShapes/shapes';
import { makeDates } from './pathBuilder';
import { createRng, type Rng } from './seededRng';

/**
 * Builds a chart window that ends in a specific candlestick shape, preceded by
 * the trend that gives the shape its meaning (a hammer after a rally is not a
 * hammer signal — the lesson says so, so the generator honours it too).
 *
 * Every sample is verified with the same classifier the lessons quote before it
 * is handed to the learner, so a quiz can never show a "hammer" that isn't one.
 */

export interface ShapeSample {
  shapeId: ShapeId;
  candles: Candle[];
  /** Index range of the candle(s) that form the shape. */
  focusStart: number;
  focusEnd: number;
}

interface RelCandle {
  open: number;
  high: number;
  low: number;
  close: number;
}

/** Build a candle from its proportions, positioned so it opens where the
 *  previous candle closed. */
function shapeCandle(params: {
  bodyRatio: number;
  upperRatio: number;
  isUp: boolean;
  range: number;
  desiredOpen: number;
}): RelCandle {
  const { bodyRatio, upperRatio, isUp, range, desiredOpen } = params;
  const body = range * bodyRatio;
  const upper = range * upperRatio;
  const lower = Math.max(range - body - upper, 0);

  const low = 0;
  const bottom = low + lower;
  const top = bottom + body;
  const high = top + upper;

  const open = isUp ? bottom : top;
  const close = isUp ? top : bottom;
  const shift = desiredOpen - open;

  return {
    open: open + shift,
    high: high + shift,
    low: low + shift,
    close: close + shift,
  };
}

function buildShape(shapeId: ShapeId, prevClose: number, rng: Rng): RelCandle[] {
  const range = prevClose * rng.range(0.018, 0.032);
  const gap = () => prevClose * rng.gauss() * 0.0015;
  const openAt = prevClose + gap();

  switch (shapeId) {
    case 'doji':
      return [
        shapeCandle({
          bodyRatio: rng.range(0.005, 0.055),
          upperRatio: rng.range(0.35, 0.55),
          isUp: rng.bool(),
          range,
          desiredOpen: openAt,
        }),
      ];

    case 'hammer':
      return [
        shapeCandle({
          bodyRatio: rng.range(0.14, 0.24),
          upperRatio: rng.range(0.0, 0.07),
          isUp: rng.bool(0.7),
          range,
          desiredOpen: openAt,
        }),
      ];

    case 'shootingStar':
      return [
        shapeCandle({
          bodyRatio: rng.range(0.14, 0.24),
          upperRatio: rng.range(0.66, 0.78),
          isUp: rng.bool(0.3),
          range,
          desiredOpen: openAt,
        }),
      ];

    case 'bullishMarubozu':
      return [
        shapeCandle({
          bodyRatio: rng.range(0.86, 0.97),
          upperRatio: rng.range(0.0, 0.06),
          isUp: true,
          range,
          desiredOpen: openAt,
        }),
      ];

    case 'bearishMarubozu':
      return [
        shapeCandle({
          bodyRatio: rng.range(0.86, 0.97),
          upperRatio: rng.range(0.0, 0.06),
          isUp: false,
          range,
          desiredOpen: openAt,
        }),
      ];

    case 'spinningTop':
      return [
        shapeCandle({
          bodyRatio: rng.range(0.18, 0.3),
          upperRatio: rng.range(0.3, 0.42),
          isUp: rng.bool(),
          range,
          desiredOpen: openAt,
        }),
      ];

    case 'bullishEngulfing': {
      const first = shapeCandle({
        bodyRatio: rng.range(0.35, 0.5),
        upperRatio: rng.range(0.15, 0.3),
        isUp: false,
        range: range * 0.62,
        desiredOpen: openAt,
      });
      // Opens under the first candle's close and closes clear of its open.
      const secondOpen = first.close - range * rng.range(0.04, 0.12);
      const secondClose = first.open + range * rng.range(0.12, 0.3);
      const bodyHigh = secondClose + range * rng.range(0.02, 0.1);
      const bodyLow = secondOpen - range * rng.range(0.02, 0.1);
      return [first, { open: secondOpen, close: secondClose, high: bodyHigh, low: bodyLow }];
    }

    case 'bearishEngulfing': {
      const first = shapeCandle({
        bodyRatio: rng.range(0.35, 0.5),
        upperRatio: rng.range(0.15, 0.3),
        isUp: true,
        range: range * 0.62,
        desiredOpen: openAt,
      });
      const secondOpen = first.close + range * rng.range(0.04, 0.12);
      const secondClose = first.open - range * rng.range(0.12, 0.3);
      const bodyHigh = secondOpen + range * rng.range(0.02, 0.1);
      const bodyLow = secondClose - range * rng.range(0.02, 0.1);
      return [first, { open: secondOpen, close: secondClose, high: bodyHigh, low: bodyLow }];
    }

    default:
      return [];
  }
}

/** Ordinary candles leading up to the shape, trending in the direction the
 *  shape needs in order to mean anything. */
function buildLeadIn(count: number, startPrice: number, driftPerBar: number, rng: Rng): RelCandle[] {
  const out: RelCandle[] = [];
  let close = startPrice;
  for (let i = 0; i < count; i += 1) {
    const open = close * (1 + rng.gauss() * 0.002);
    close = open * (1 + driftPerBar + rng.gauss() * 0.011);
    const top = Math.max(open, close);
    const bottom = Math.min(open, close);
    const reach = Math.max(Math.abs(close - open), open * 0.004);
    out.push({
      open,
      close,
      high: top + Math.abs(rng.gauss()) * reach * 0.7,
      low: bottom - Math.abs(rng.gauss()) * reach * 0.7,
    });
  }
  return out;
}

export function synthesizeShape(
  shapeId: ShapeId,
  seed: number | Rng,
  options: { leadIn?: number; startPrice?: number; startDate?: string } = {},
): ShapeSample {
  const { leadIn = 12, startPrice = 100, startDate = '2024-01-01' } = options;
  const rng = typeof seed === 'number' ? createRng(seed) : seed;
  const def = SHAPE_BY_ID[shapeId];

  const drift =
    def.context === 'after a downtrend'
      ? -rng.range(0.004, 0.009)
      : def.context === 'after an uptrend'
        ? rng.range(0.004, 0.009)
        : rng.gauss() * 0.002;

  // Try a few times: proportions are randomised, so occasionally a draw lands
  // outside the classifier's thresholds. Better to redraw than to teach a lie.
  let relCandles: RelCandle[] = [];
  let shapeCandles: RelCandle[] = [];
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const lead = buildLeadIn(leadIn, startPrice, drift, rng);
    const prevClose = lead[lead.length - 1]?.close ?? startPrice;
    shapeCandles = buildShape(shapeId, prevClose, rng);
    relCandles = [...lead, ...shapeCandles];

    const probe = relCandles.slice(-2).map((c, i) => ({ time: `2024-01-0${i + 1}`, ...c }));
    if (classify(probe) === shapeId) break;
  }

  const dates = makeDates(startDate, relCandles.length, 'daily');
  const candles: Candle[] = relCandles.map((c, i) => ({
    time: dates[i],
    open: Number(c.open.toFixed(2)),
    high: Number(Math.max(c.high, c.open, c.close).toFixed(2)),
    low: Number(Math.min(c.low, c.open, c.close).toFixed(2)),
    close: Number(c.close.toFixed(2)),
  }));

  const focusEnd = candles.length - 1;
  return {
    shapeId,
    candles,
    focusStart: focusEnd - (shapeCandles.length - 1),
    focusEnd,
  };
}
