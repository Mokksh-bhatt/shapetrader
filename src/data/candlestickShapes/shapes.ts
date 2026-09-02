import type { Sentiment, ShapeId } from '@/engine/candles/types';

export interface ShapeDefinition {
  id: ShapeId;
  name: string;
  sentiment: Sentiment;
  /** How many candles the learner has to look at to call it. */
  candleCount: 1 | 2;
  /** The shape only means something in this context. */
  context: 'after a downtrend' | 'after an uptrend' | 'anywhere';
  tagline: string;
  /** What to physically measure — mirrors the thresholds in candleClassifier. */
  anatomy: string;
  /** Why humans trading real money produce this shape. */
  psychology: string;
  /** What a trader does with it, including the caveat. */
  tradingNote: string;
  /** Shapes that look similar — used to build quiz distractors that actually
   *  teach, instead of obviously-wrong filler options. */
  confusableWith: ShapeId[];
}

export const SHAPES: ShapeDefinition[] = [
  {
    id: 'doji',
    name: 'Doji',
    sentiment: 'neutral',
    candleCount: 1,
    context: 'anywhere',
    tagline: 'Opened and closed at almost the same price — a standoff.',
    anatomy: 'Body is under 10% of the full high-to-low range, so it looks like a cross or a thin line.',
    psychology:
      'Buyers and sellers both showed up in force and neither won. Price travelled during the session but ended where it started, which means the crowd changed its mind and changed it back.',
    tradingNote:
      'A doji is a pause, not a direction. It matters most after a long run: momentum that stops making progress often turns. On its own it is not a trade — wait for the next candle to break its high or low.',
    confusableWith: ['spinningTop', 'hammer'],
  },
  {
    id: 'hammer',
    name: 'Hammer',
    sentiment: 'bullish',
    candleCount: 1,
    context: 'after a downtrend',
    tagline: 'Sold off hard, then bought all the way back before the close.',
    anatomy:
      'Small body near the top, lower wick at least twice the body, almost no upper wick.',
    psychology:
      'Sellers pressed price down during the session and failed. Every buyer who stepped in at the low is now in profit, and the sellers who chased the bottom are trapped. That reversal of fortune is the whole signal.',
    tradingNote:
      'Only counts as a hammer after a decline — the identical shape mid-rally means much less. Traders wait for the next candle to close above the hammer before acting, and place the stop under its low.',
    confusableWith: ['doji', 'spinningTop', 'shootingStar'],
  },
  {
    id: 'shootingStar',
    name: 'Shooting Star',
    sentiment: 'bearish',
    candleCount: 1,
    context: 'after an uptrend',
    tagline: 'Rallied hard, then gave the whole move back.',
    anatomy:
      'Small body near the bottom, upper wick at least twice the body, almost no lower wick.',
    psychology:
      'Buyers pushed to a new high and could not hold it. Everyone who bought the spike is now underwater and becomes a seller on the way back down — supply appears exactly where the rally ran out.',
    tradingNote:
      'The mirror image of a hammer, and it needs the mirror-image context: a prior uptrend. Confirmation is a candle closing below the star\'s body.',
    confusableWith: ['hammer', 'doji', 'spinningTop'],
  },
  {
    id: 'bullishMarubozu',
    name: 'Bullish Marubozu',
    sentiment: 'bullish',
    candleCount: 1,
    context: 'anywhere',
    tagline: 'All body, no wicks — buyers ran it from open to close.',
    anatomy: 'Body fills 80%+ of the range, closing at or near the high.',
    psychology:
      'There was never a moment in the session when sellers took control. Demand simply absorbed everything on offer. This is the signature of conviction, often the first candle of a new leg or a breakout.',
    tradingNote:
      'A continuation signal, not a reversal one. The risk is chasing it: you are buying at the top of a big candle, so the stop sits far away. Size smaller, or wait for a pullback.',
    confusableWith: ['bullishEngulfing', 'bearishMarubozu'],
  },
  {
    id: 'bearishMarubozu',
    name: 'Bearish Marubozu',
    sentiment: 'bearish',
    candleCount: 1,
    context: 'anywhere',
    tagline: 'All body, no wicks — sellers ran it from open to close.',
    anatomy: 'Body fills 80%+ of the range, closing at or near the low.',
    psychology:
      'Supply overwhelmed demand for the entire session and no dip buyer managed to lift price off the floor. Frequently seen on bad news or when a support level finally gives way.',
    tradingNote:
      'Expect follow-through rather than an instant bounce. If you are long, this candle is the market telling you your thesis is wrong.',
    confusableWith: ['bearishEngulfing', 'bullishMarubozu'],
  },
  {
    id: 'spinningTop',
    name: 'Spinning Top',
    sentiment: 'neutral',
    candleCount: 1,
    context: 'anywhere',
    tagline: 'Small body, long wicks both sides — busy, but going nowhere.',
    anatomy: 'Body under about a third of the range, with meaningful wicks above AND below.',
    psychology:
      'Both sides had a go and both were rejected. Unlike a doji, there was real movement in both directions — this is a genuine fight, not a quiet session.',
    tradingNote:
      'Reads as hesitation. A cluster of spinning tops after a strong trend is often the market catching its breath before it either continues or turns.',
    confusableWith: ['doji', 'hammer', 'shootingStar'],
  },
  {
    id: 'bullishEngulfing',
    name: 'Bullish Engulfing',
    sentiment: 'bullish',
    candleCount: 2,
    context: 'after a downtrend',
    tagline: "A down candle, then an up candle that swallows it whole.",
    anatomy:
      "Candle 1 closes lower. Candle 2 opens below candle 1's close and closes above its open — its body completely covers the first.",
    psychology:
      'The market opened weak, agreeing with yesterday, then reversed and undid an entire session of selling in one go. Sentiment did not drift — it flipped.',
    tradingNote:
      'One of the more reliable two-candle reversals, and stronger when the second candle carries heavy volume. Still needs a downtrend behind it: engulfing candles inside a sideways range are noise.',
    confusableWith: ['bullishMarubozu', 'bearishEngulfing', 'hammer'],
  },
  {
    id: 'bearishEngulfing',
    name: 'Bearish Engulfing',
    sentiment: 'bearish',
    candleCount: 2,
    context: 'after an uptrend',
    tagline: 'An up candle, then a down candle that swallows it whole.',
    anatomy:
      "Candle 1 closes higher. Candle 2 opens above candle 1's close and closes below its open, covering the first body entirely.",
    psychology:
      'Buyers were still in charge at the open — the gap up proves it — and then sellers took the day back and more. The people who bought the high are trapped, and that supply hangs over the market.',
    tradingNote:
      'Frequently marks the end of a rally. Look for it at a level that already mattered (a prior high, a resistance zone) — location plus pattern beats pattern alone.',
    confusableWith: ['bearishMarubozu', 'bullishEngulfing', 'shootingStar'],
  },
];

export const SHAPE_BY_ID: Record<ShapeId, ShapeDefinition> = Object.fromEntries(
  SHAPES.map((s) => [s.id, s]),
) as Record<ShapeId, ShapeDefinition>;
