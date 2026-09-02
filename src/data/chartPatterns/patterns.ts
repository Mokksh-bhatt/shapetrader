import type { Sentiment } from '@/engine/candles/types';
import type { Anchor } from '@/data/generator/pathBuilder';

/**
 * Chart patterns are candlestick shapes zoomed out — the same crowd psychology
 * playing out over dozens of bars instead of one or two. Each entry mirrors
 * the shape of ShapeDefinition (see candlestickShapes/shapes.ts) so the two
 * modules read as one family, plus `anchors`: the control points that
 * `patternInjector.ts` feeds through `buildSeries` to draw an instance of it.
 */

export type PatternFamily = 'reversal' | 'continuation' | 'level';

export type PatternId =
  | 'headShoulders'
  | 'inverseHeadShoulders'
  | 'doubleTop'
  | 'doubleBottom'
  | 'ascendingTriangle'
  | 'descendingTriangle'
  | 'bullFlag'
  | 'supportResistanceRange';

export interface PatternDefinition {
  id: PatternId;
  name: string;
  sentiment: Sentiment;
  family: PatternFamily;
  tagline: string;
  /** What to physically look for on the chart. */
  anatomy: string;
  /** Why crowds of real traders, acting in their own self-interest, produce this shape. */
  psychology: string;
  /** How it's traded, including confirmation and the honest failure rate. */
  tradingNote: string;
  /** Patterns that look similar — used to build quiz distractors that actually teach. */
  confusableWith: PatternId[];
  /** Normalised control points (x: 0..1 across the window, y: price level around 100)
   *  that generate one instance of the pattern via buildSeries. */
  anchors: Anchor[];
  /** The instruction shown in Shape Hunt's first stage — what single landmark
   *  the learner has to click before anything is named for them. */
  huntPrompt: string;
}

export const PATTERNS: PatternDefinition[] = [
  {
    id: 'headShoulders',
    name: 'Head & Shoulders',
    sentiment: 'bearish',
    family: 'reversal',
    tagline: 'Three peaks — a high, a higher one, then a similar high again — and the rally is out of buyers.',
    anatomy:
      'An uptrend forms a peak (left shoulder), pulls back, pushes to a higher peak (the head), pulls back again to about the same level, then forms a third peak roughly level with the first (right shoulder). A line drawn under the two pullback lows is the neckline; the pattern completes when price closes below it.',
    psychology:
      'Each peak is buyers trying again. The head proves demand can still make a new high — but the right shoulder failing to beat the head shows that fewer buyers are willing to chase. Everyone who bought the head and both shoulders is now sitting above the market at once, and when the neckline gives way their selling accelerates the decline.',
    tradingNote:
      'Wait for a daily close below the neckline, not just a touch — a lot of apparent head-and-shoulders tops never break it and just become a wide, choppy range instead. A common target is the neckline minus the head-to-neckline distance, but treat that as a rough guide: this is one of the more reliable reversal patterns in backtests, and it still fails a meaningful share of the time.',
    confusableWith: ['doubleTop', 'inverseHeadShoulders', 'descendingTriangle'],
    huntPrompt: 'Click the head — the tallest of the three peaks.',
    anchors: [
      { x: 0.0, y: 88 },
      { x: 0.22, y: 113 },
      { x: 0.34, y: 100 },
      { x: 0.5, y: 123 },
      { x: 0.66, y: 99 },
      { x: 0.78, y: 112 },
      { x: 1.0, y: 85 },
    ],
  },
  {
    id: 'inverseHeadShoulders',
    name: 'Inverse Head & Shoulders',
    sentiment: 'bullish',
    family: 'reversal',
    tagline: 'Three troughs — a low, a lower one, then a similar low again — and the sell-off is out of sellers.',
    anatomy:
      'A downtrend forms a trough (left shoulder), bounces, drops to a lower trough (the head), bounces again to about the same level, then forms a third trough roughly level with the first (right shoulder). A line drawn over the two bounce highs is the neckline; the pattern completes when price closes above it.',
    psychology:
      "Each trough is sellers pressing for a new low. The head proves they still can — but the right shoulder failing to make a new low shows selling pressure fading. Once the neckline breaks, short sellers from the head and both shoulders have to buy back to cover, and that forced buying adds fuel to the rally.",
    tradingNote:
      'The bullish mirror of head & shoulders, and it needs the same discipline: wait for a close above the neckline. It shows up reliably at the end of real downtrends in backtests, but plenty of attempts fail to clear the neckline and the downtrend simply resumes — treat it as a probability, not a guarantee.',
    confusableWith: ['doubleBottom', 'headShoulders', 'ascendingTriangle'],
    huntPrompt: 'Click the head — the lowest of the three troughs.',
    anchors: [
      { x: 0.0, y: 112 },
      { x: 0.22, y: 87 },
      { x: 0.34, y: 100 },
      { x: 0.5, y: 77 },
      { x: 0.66, y: 101 },
      { x: 0.78, y: 88 },
      { x: 1.0, y: 115 },
    ],
  },
  {
    id: 'doubleTop',
    name: 'Double Top',
    sentiment: 'bearish',
    family: 'reversal',
    tagline: 'Two peaks at almost the same price — the market tried a level twice and got turned away both times.',
    anatomy:
      'Price rallies to a high, pulls back to a trough, rallies again to about the same high, then fails and breaks below the trough. Looks like the letter M.',
    psychology:
      "The first peak is the market discovering a price sellers are eager to defend. The second peak is buyers testing that same level again with the first failure still fresh — when it fails a second time, everyone who bought either top is trapped, and the trough that held twice becomes the level to watch once it breaks.",
    tradingNote:
      'The two peaks do not need to match exactly — within about 1-3% is normal. The pattern is not confirmed until price closes below the trough between them; plenty of apparent double tops just become a range instead. It is also one of the most commonly imagined patterns in hindsight — be honest about whether the second peak really failed, or you are pattern-matching after the fact.',
    confusableWith: ['headShoulders', 'supportResistanceRange', 'descendingTriangle'],
    huntPrompt: 'Click the second peak — the level buyers already failed at once.',
    anchors: [
      { x: 0.0, y: 90 },
      { x: 0.3, y: 115 },
      { x: 0.5, y: 98 },
      { x: 0.7, y: 114 },
      { x: 1.0, y: 90 },
    ],
  },
  {
    id: 'doubleBottom',
    name: 'Double Bottom',
    sentiment: 'bullish',
    family: 'reversal',
    tagline: 'Two troughs at almost the same price — the market tried a level twice and held both times.',
    anatomy:
      'Price falls to a low, bounces to a peak, falls again to about the same low, then breaks above the peak. Looks like the letter W.',
    psychology:
      "The first trough is the market finding a price buyers are willing to defend. The second trough retests it with the first bounce still fresh in traders' minds — when it holds again, the sellers who pushed for a new low and failed are the ones trapped, and the peak that capped it twice becomes support once broken.",
    tradingNote:
      'Give the two lows the same 1-3% tolerance as a double top. Confirmation is a close above the peak between the troughs, not just a bounce off the second low — "it held twice" is not the same as "it will hold forever", and failed double bottoms that break the second low and keep falling are common enough to respect.',
    confusableWith: ['inverseHeadShoulders', 'supportResistanceRange', 'ascendingTriangle'],
    huntPrompt: 'Click the second trough — the level sellers already failed to break once.',
    anchors: [
      { x: 0.0, y: 110 },
      { x: 0.3, y: 85 },
      { x: 0.5, y: 102 },
      { x: 0.7, y: 86 },
      { x: 1.0, y: 110 },
    ],
  },
  {
    id: 'ascendingTriangle',
    name: 'Ascending Triangle',
    sentiment: 'bullish',
    family: 'continuation',
    tagline: 'A flat ceiling and a rising floor, squeezing price into a corner that usually breaks up.',
    anatomy:
      'Price repeatedly touches roughly the same high (a flat resistance line) while each pullback holds at a higher low than the one before it (a rising support trendline). The two lines converge toward the right.',
    psychology:
      'A flat top means sellers keep defending one exact price. Rising lows mean buyers are getting more eager each time — they stop waiting for the old, lower price and pay up sooner. That is demand winning the tug-of-war a little more with every test, and it is usually a matter of time before the fixed supply at the ceiling gets absorbed.',
    tradingNote:
      'Because it forms inside a prior uptrend, this is a continuation pattern, not a reversal — the base-rate case is the trend keeps going. Most traders wait for a close above the flat resistance line, ideally on rising volume, before entering. A triangle that reaches its tip without breaking either way has lost its edge and the direction becomes a coin flip again.',
    confusableWith: ['bullFlag', 'descendingTriangle', 'doubleBottom'],
    huntPrompt: 'Click the candle where price finally breaks above the flat resistance.',
    anchors: [
      { x: 0.0, y: 92 },
      { x: 0.12, y: 108 },
      { x: 0.24, y: 96 },
      { x: 0.38, y: 109 },
      { x: 0.5, y: 100 },
      { x: 0.64, y: 110 },
      { x: 0.76, y: 104 },
      { x: 0.88, y: 109 },
      { x: 1.0, y: 124 },
    ],
  },
  {
    id: 'descendingTriangle',
    name: 'Descending Triangle',
    sentiment: 'bearish',
    family: 'continuation',
    tagline: 'A flat floor and a falling ceiling, squeezing price into a corner that usually breaks down.',
    anatomy:
      'Price repeatedly touches roughly the same low (a flat support line) while each bounce fails at a lower high than the one before it (a falling resistance trendline). The two lines converge toward the right.',
    psychology:
      'A flat bottom means buyers keep defending one exact price. Falling highs mean sellers are getting more impatient each time — they stop waiting for the old, higher price and sell into weaker bounces. That is supply winning the tug-of-war a little more with every test, and the fixed demand at the floor usually gives out eventually.',
    tradingNote:
      'The bearish mirror of the ascending triangle, and just as much a continuation as a fresh signal — it says the prior downtrend is still in charge. Confirmation is a close below the flat support line; a triangle that reaches its tip without breaking is a pattern that has expired, not one about to explode in either direction.',
    confusableWith: ['ascendingTriangle', 'headShoulders', 'supportResistanceRange'],
    huntPrompt: 'Click the candle where price finally breaks below the flat support.',
    anchors: [
      { x: 0.0, y: 108 },
      { x: 0.12, y: 92 },
      { x: 0.24, y: 104 },
      { x: 0.38, y: 91 },
      { x: 0.5, y: 100 },
      { x: 0.64, y: 90 },
      { x: 0.76, y: 96 },
      { x: 0.88, y: 91 },
      { x: 1.0, y: 76 },
    ],
  },
  {
    id: 'bullFlag',
    name: 'Bull Flag',
    sentiment: 'bullish',
    family: 'continuation',
    tagline: 'A sharp rally (the pole), then a brief calm pullback (the flag), before the move resumes.',
    anatomy:
      "A steep, almost straight-line advance (the pole), followed by a shallow pullback that drifts sideways or slightly down between two roughly parallel lines (the flag). Volume typically fades during the flag and picks back up on the breakout above the flag's upper line.",
    psychology:
      "The pole is a burst of urgent buying, often on news or a breakout that catches sellers offside. The flag is everyone catching their breath — early buyers taking some profit, latecomers waiting for a better price — but nobody turning aggressively bearish. A shallow, orderly pullback instead of a sharp reversal is the tell that the original buyers are still in control and just paused.",
    tradingNote:
      "Traders want the flag to stay shallow (well under half the pole's move) and brief — a pullback that drags on or retraces too much starts to look like a trend change rather than a pause. Entry is usually a close back above the flag's upper line. Not every flag resolves upward; one that breaks its lower line instead is telling you the pause turned into a reversal, and the pattern failed.",
    confusableWith: ['ascendingTriangle', 'supportResistanceRange'],
    huntPrompt: "Click the top of the pole — where the sharp rally runs out before the pause.",
    anchors: [
      { x: 0.0, y: 90 },
      { x: 0.3, y: 128 },
      { x: 0.42, y: 120 },
      { x: 0.52, y: 112 },
      { x: 0.64, y: 117 },
      { x: 0.74, y: 110 },
      { x: 1.0, y: 135 },
    ],
  },
  {
    id: 'supportResistanceRange',
    name: 'Support & Resistance Range',
    sentiment: 'neutral',
    family: 'level',
    tagline: 'Price bouncing between a ceiling and a floor without picking a direction.',
    anatomy:
      'Multiple touches of roughly the same high (resistance) and roughly the same low (support), with price oscillating between the two rather than trending. Neither line breaks decisively.',
    psychology:
      "Every touch of the top is a batch of sellers willing to sell at that price, and every touch of the bottom is a batch of buyers willing to buy at that price. As long as both groups keep showing up at the same levels the standoff continues — and every failed breakout attempt reinforces the level in traders' memory, which paradoxically makes the range more likely to hold next time, right up until the level that finally gives way for good.",
    tradingNote:
      'Ranges are the most common state a chart is actually in — more time is spent going nowhere than trending. Range traders buy near support and sell near resistance with a tight stop just outside the line, because a level that has held before eventually stops holding, and the breakout when it comes is often fast. This is the honest default answer for a huge number of real charts: no trend, no trade, just wait.',
    confusableWith: ['doubleTop', 'doubleBottom', 'ascendingTriangle'],
    huntPrompt: 'Click one of the lows where buyers keep defending the same level.',
    anchors: [
      { x: 0.0, y: 100 },
      { x: 0.12, y: 112 },
      { x: 0.26, y: 90 },
      { x: 0.4, y: 111 },
      { x: 0.54, y: 91 },
      { x: 0.68, y: 112 },
      { x: 0.82, y: 90 },
      { x: 1.0, y: 101 },
    ],
  },
];

export const PATTERN_BY_ID: Record<PatternId, PatternDefinition> = Object.fromEntries(
  PATTERNS.map((p) => [p.id, p]),
) as Record<PatternId, PatternDefinition>;

export const PATTERN_IDS: PatternId[] = PATTERNS.map((p) => p.id);

/** The honest, most common answer: nothing has formed yet. Not part of PATTERNS
 *  (it isn't a shape to spot) but shares its shape so the gallery and quiz can
 *  treat it as a first-class option. */
export const NO_PATTERN_ID = 'noPattern' as const;
export type QuizPatternId = PatternId | typeof NO_PATTERN_ID;

export interface NoPatternInfo {
  id: typeof NO_PATTERN_ID;
  name: string;
  tagline: string;
  anatomy: string;
  psychology: string;
  tradingNote: string;
}

export const NO_PATTERN_INFO: NoPatternInfo = {
  id: NO_PATTERN_ID,
  name: 'No Pattern Yet',
  tagline: 'Ordinary noise — price wandering with no completed shape.',
  anatomy:
    'No repeated touches of a level, no clean set of peaks or troughs, no converging trendlines. Just the normal up-and-down chop every chart shows most of the time.',
  psychology:
    "Human brains are built to find shapes — it's the same wiring that sees faces in clouds. Stare at a noisy chart long enough and almost anyone can convince themselves a head and shoulders is forming. Professionals call this apophenia, and it is one of the most expensive habits a new trader can pick up: trading a pattern that was never really there.",
  tradingNote:
    'The right response to a chart like this is to do nothing and wait for a real pattern to finish forming — most windows of most charts, most of the time, look exactly like this. If you find yourself needing to squint or use your imagination to make a pattern fit, that is the signal it is not there yet.',
};
