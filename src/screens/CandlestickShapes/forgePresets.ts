import type { ShapeId } from '@/engine/candles/types';
import type { ForgeCandleValue } from '@/components/candle/CandleForge';

/**
 * Starting geometry for the forge stage, on the abstract 0-100 scale
 * CandleForge works in. Every value here has been hand-checked against
 * candleClassifier's actual thresholds (see the comments below) — the forge
 * must never claim a shape is right when the classifier disagrees.
 */

/** A plain, undramatic candle — real work is required from every shape. */
const PLAIN: ForgeCandleValue = { open: 45, high: 60, low: 40, close: 55 };

/** Two-candle shapes start with a small, inconclusive second candle so there
 *  is an obvious "not there yet" to fix. */
const SMALL_UP: ForgeCandleValue = { open: 50, high: 54, low: 44, close: 53 };
const SMALL_DOWN: ForgeCandleValue = { open: 53, high: 54, low: 44, close: 50 };

export const FORGE_TARGET_START: Record<ShapeId, ForgeCandleValue> = {
  doji: PLAIN,
  hammer: PLAIN,
  shootingStar: PLAIN,
  bullishMarubozu: PLAIN,
  bearishMarubozu: PLAIN,
  spinningTop: PLAIN,
  bullishEngulfing: SMALL_UP,
  bearishEngulfing: SMALL_DOWN,
};

/** The fixed "candle 1" for the two engulfing shapes — opposite direction of
 *  the candle the learner builds, small enough to be worth swallowing. */
export const FORGE_CONTEXT_START: Partial<Record<ShapeId, ForgeCandleValue>> = {
  bullishEngulfing: { open: 55, high: 58, low: 42, close: 45 }, // small down candle
  bearishEngulfing: { open: 45, high: 58, low: 42, close: 55 }, // small up candle
};

/**
 * A hand-verified example of each shape for "show me". bodyRatio / wick
 * ratios were computed by hand against RULES in candleClassifier and each one
 * clears its threshold with margin, so this can never desync from the
 * classifier's actual behaviour.
 */
export const FORGE_SOLUTION: Record<ShapeId, { target: ForgeCandleValue; context?: ForgeCandleValue }> = {
  // body 1/40 = 2.5% (< 10%)
  doji: { target: { open: 50, high: 70, low: 30, close: 51 } },
  // body 6/46 = 13% (<35%), upper wick 2/46=4% (<=15%), lower wick 38 = 6.3x body (>=2x)
  hammer: { target: { open: 58, high: 66, low: 20, close: 64 } },
  // body 6/46=13%, lower wick 2/46=4%, upper wick 38=6.3x body
  shootingStar: { target: { open: 36, high: 80, low: 34, close: 42 } },
  // body 70/72 = 97% (>=80%), closes near the high
  bullishMarubozu: { target: { open: 20, high: 91, low: 19, close: 90 } },
  bearishMarubozu: { target: { open: 90, high: 91, low: 19, close: 20 } },
  // body 10/50=20% (<=35%), both wicks 20/50=40% (>15%)
  spinningTop: { target: { open: 45, high: 75, low: 25, close: 55 } },
  // candle 1: open55/close45 (body10). candle 2: opens under 45, closes over 55, body22>10
  bullishEngulfing: {
    context: { open: 55, high: 58, low: 42, close: 45 },
    target: { open: 40, high: 64, low: 38, close: 62 },
  },
  // candle 1: open45/close55 (body10). candle 2: opens over 55, closes under 45, body22>10
  bearishEngulfing: {
    context: { open: 45, high: 58, low: 42, close: 55 },
    target: { open: 60, high: 64, low: 36, close: 38 },
  },
};
