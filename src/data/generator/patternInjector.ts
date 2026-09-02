import type { Candle } from '@/engine/candles/types';
import type { Annotation, AnnotationPoint } from '@/engine/annotations/types';
import {
  NO_PATTERN_ID,
  PATTERN_BY_ID,
  type PatternId,
  type QuizPatternId,
} from '@/data/chartPatterns/patterns';
import { buildSeries, candlesFromCloses, interpolateAnchors, makeDates, roughen, type Anchor } from './pathBuilder';
import { generateRandomWalk } from './randomWalk';
import { createRng, type Rng } from './seededRng';

/**
 * Turns a pattern definition's anchors into a full candle series plus the
 * teaching annotations that point at it — the multi-candle counterpart to
 * shapeSynth.ts. Rather than hardcoding the neckline/trendline prices, every
 * annotation is *resolved*: each landmark's x-position tells us roughly where
 * to look, and we scan the actual generated candles in that window for the
 * real highest high or lowest low. That keeps the marks glued to the data
 * even though noise and per-seed jitter move the exact numbers every time.
 *
 * Tone convention used below, kept consistent across every pattern:
 *  - gold    = the neckline / trigger level of a reversal pattern
 *  - bear    = a resistance-type level (price struggles to close above it)
 *  - bull    = a support-type level (price struggles to close below it)
 *  - violet  = the bull flag's consolidation channel
 *  - neutral = a locational marker that isn't itself the decisive point
 */

export interface PatternSample {
  patternId: QuizPatternId;
  candles: Candle[];
  annotations: Annotation[];
  /** Index range where the pattern's distinctive shape sits — for MiniCandles highlighting. */
  focusStart: number;
  focusEnd: number;
}

const PATTERN_CANDLE_COUNT = 90;
const START_DATE = '2024-01-02';

/** Small per-instance variety on top of the textbook geometry, so two draws
 *  of the same pattern never look identical — real shoulders are never
 *  perfectly symmetric. Kept small enough that ordering (head > shoulders,
 *  etc.) never flips. */
function jitterAnchors(anchors: Anchor[], rng: Rng, amount = 0.018): Anchor[] {
  return anchors.map((a) => ({ x: a.x, y: Math.max(a.y * (1 + rng.gauss() * amount), 1) }));
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function toIndex(x: number, count: number): number {
  return Math.round(clamp01(x) * (count - 1));
}

/** Highest high / lowest low within a small window around x — the "resolve
 *  against the real candles" step every annotation builder below uses. */
function extremeNear(candles: Candle[], x: number, kind: 'high' | 'low', radius = 0.06): AnnotationPoint {
  const n = candles.length;
  const center = toIndex(x, n);
  const span = Math.max(1, Math.round(radius * n));
  const from = Math.max(0, center - span);
  const to = Math.min(n - 1, center + span);

  let bestIndex = center;
  let bestValue = kind === 'high' ? -Infinity : Infinity;
  for (let i = from; i <= to; i += 1) {
    const value = kind === 'high' ? candles[i].high : candles[i].low;
    if (kind === 'high' ? value > bestValue : value < bestValue) {
      bestValue = value;
      bestIndex = i;
    }
  }
  return { index: bestIndex, price: bestValue };
}

/** A perfectly flat reference line — averages several touches so noise on any
 *  one of them doesn't tilt a line that is supposed to read as flat. */
function flatLine(candles: Candle[], xs: number[], kind: 'high' | 'low'): [AnnotationPoint, AnnotationPoint] {
  const points = xs.map((x) => extremeNear(candles, x, kind));
  const avg = points.reduce((sum, p) => sum + p.price, 0) / points.length;
  return [
    { index: points[0].index, price: avg },
    { index: points[points.length - 1].index, price: avg },
  ];
}

/** A genuine trendline: connects the first and last real touch, so its slope
 *  comes from the data rather than being asserted. */
function slopeLine(candles: Candle[], xs: number[], kind: 'high' | 'low'): [AnnotationPoint, AnnotationPoint] {
  const first = extremeNear(candles, xs[0], kind);
  const last = extremeNear(candles, xs[xs.length - 1], kind);
  return [first, last];
}

/** A thin full-width band centred on the average of several touches — used
 *  for reference levels where "exactly one price" would be too precise. */
function levelBand(candles: Candle[], xs: number[], kind: 'high' | 'low'): [AnnotationPoint, AnnotationPoint] {
  const points = xs.map((x) => extremeNear(candles, x, kind));
  const avg = points.reduce((sum, p) => sum + p.price, 0) / points.length;
  const half = Math.max(avg * 0.006, 0.05);
  return [
    { index: 0, price: avg + half },
    { index: 0, price: avg - half },
  ];
}

function headShouldersAnnotations(candles: Candle[]): Annotation[] {
  const leftShoulder = extremeNear(candles, 0.22, 'high');
  const neckA = extremeNear(candles, 0.34, 'low');
  const head = extremeNear(candles, 0.5, 'high');
  const neckB = extremeNear(candles, 0.66, 'low');
  const rightShoulder = extremeNear(candles, 0.78, 'high');

  return [
    { id: 'hs-neckline', kind: 'line', points: [neckA, neckB], tone: 'gold', dashed: true, label: 'Neckline' },
    { id: 'hs-left', kind: 'marker', points: [leftShoulder], tone: 'neutral', label: 'Left shoulder' },
    { id: 'hs-head', kind: 'marker', points: [head], tone: 'bear', label: 'Head' },
    { id: 'hs-right', kind: 'marker', points: [rightShoulder], tone: 'neutral', label: 'Right shoulder' },
  ];
}

function inverseHeadShouldersAnnotations(candles: Candle[]): Annotation[] {
  const leftShoulder = extremeNear(candles, 0.22, 'low');
  const neckA = extremeNear(candles, 0.34, 'high');
  const head = extremeNear(candles, 0.5, 'low');
  const neckB = extremeNear(candles, 0.66, 'high');
  const rightShoulder = extremeNear(candles, 0.78, 'low');

  return [
    { id: 'ihs-neckline', kind: 'line', points: [neckA, neckB], tone: 'gold', dashed: true, label: 'Neckline' },
    { id: 'ihs-left', kind: 'marker', points: [leftShoulder], tone: 'neutral', label: 'Left shoulder' },
    { id: 'ihs-head', kind: 'marker', points: [head], tone: 'bull', label: 'Head' },
    { id: 'ihs-right', kind: 'marker', points: [rightShoulder], tone: 'neutral', label: 'Right shoulder' },
  ];
}

function doubleTopAnnotations(candles: Candle[]): Annotation[] {
  const peak1 = extremeNear(candles, 0.3, 'high');
  const peak2 = extremeNear(candles, 0.7, 'high');
  const level = (peak1.price + peak2.price) / 2;
  const half = Math.max(level * 0.006, 0.05);

  return [
    {
      id: 'dt-resistance',
      kind: 'zone',
      points: [
        { index: peak1.index, price: level + half },
        { index: peak2.index, price: level - half },
      ],
      tone: 'bear',
      label: 'Resistance',
    },
    { id: 'dt-neckline', kind: 'band', points: levelBand(candles, [0.5], 'low'), tone: 'gold', dashed: true, label: 'Neckline' },
  ];
}

function doubleBottomAnnotations(candles: Candle[]): Annotation[] {
  const trough1 = extremeNear(candles, 0.3, 'low');
  const trough2 = extremeNear(candles, 0.7, 'low');
  const level = (trough1.price + trough2.price) / 2;
  const half = Math.max(level * 0.006, 0.05);

  return [
    {
      id: 'db-support',
      kind: 'zone',
      points: [
        { index: trough1.index, price: level + half },
        { index: trough2.index, price: level - half },
      ],
      tone: 'bull',
      label: 'Support',
    },
    { id: 'db-neckline', kind: 'band', points: levelBand(candles, [0.5], 'high'), tone: 'gold', dashed: true, label: 'Neckline' },
  ];
}

function ascendingTriangleAnnotations(candles: Candle[]): Annotation[] {
  const resistanceXs = [0.12, 0.38, 0.64, 0.88];
  const supportXs = [0.24, 0.5, 0.76];

  return [
    { id: 'at-resistance', kind: 'line', points: flatLine(candles, resistanceXs, 'high'), tone: 'bear', label: 'Resistance (flat)' },
    { id: 'at-support', kind: 'line', points: slopeLine(candles, supportXs, 'low'), tone: 'bull', label: 'Rising support' },
  ];
}

function descendingTriangleAnnotations(candles: Candle[]): Annotation[] {
  const supportXs = [0.12, 0.38, 0.64, 0.88];
  const resistanceXs = [0.24, 0.5, 0.76];

  return [
    { id: 'dtr-support', kind: 'line', points: flatLine(candles, supportXs, 'low'), tone: 'bull', label: 'Support (flat)' },
    { id: 'dtr-resistance', kind: 'line', points: slopeLine(candles, resistanceXs, 'high'), tone: 'bear', label: 'Falling resistance' },
  ];
}

function bullFlagAnnotations(candles: Candle[]): Annotation[] {
  const poleTop = extremeNear(candles, 0.3, 'high');
  const upperXs = [0.42, 0.64];
  const lowerXs = [0.52, 0.74];

  return [
    {
      id: 'bf-pole',
      kind: 'span',
      points: [
        { index: 0, price: candles[0]?.low ?? 0 },
        { index: poleTop.index, price: poleTop.price },
      ],
      tone: 'gold',
      label: 'Pole',
    },
    { id: 'bf-upper', kind: 'line', points: slopeLine(candles, upperXs, 'high'), tone: 'violet', label: 'Flag — upper' },
    { id: 'bf-lower', kind: 'line', points: slopeLine(candles, lowerXs, 'low'), tone: 'violet', label: 'Flag — lower' },
  ];
}

function rangeAnnotations(candles: Candle[]): Annotation[] {
  const resistanceXs = [0.12, 0.4, 0.68];
  const supportXs = [0.26, 0.54, 0.82];

  return [
    { id: 'rg-resistance', kind: 'band', points: levelBand(candles, resistanceXs, 'high'), tone: 'bear', label: 'Resistance' },
    { id: 'rg-support', kind: 'band', points: levelBand(candles, supportXs, 'low'), tone: 'bull', label: 'Support' },
  ];
}

const ANNOTATION_BUILDERS: Record<PatternId, (candles: Candle[]) => Annotation[]> = {
  headShoulders: headShouldersAnnotations,
  inverseHeadShoulders: inverseHeadShouldersAnnotations,
  doubleTop: doubleTopAnnotations,
  doubleBottom: doubleBottomAnnotations,
  ascendingTriangle: ascendingTriangleAnnotations,
  descendingTriangle: descendingTriangleAnnotations,
  bullFlag: bullFlagAnnotations,
  supportResistanceRange: rangeAnnotations,
};

function focusRange(annotations: Annotation[], count: number): { focusStart: number; focusEnd: number } {
  const indices = annotations.flatMap((a) => a.points.map((p) => p.index)).filter((i) => Number.isFinite(i) && i > 0);
  if (indices.length === 0) return { focusStart: 0, focusEnd: count - 1 };
  const start = Math.max(Math.min(...indices) - 3, 0);
  return { focusStart: start, focusEnd: count - 1 };
}

/**
 * Shape Hunt stage 1 — "click the landmark". Each spec names one or more
 * correct candle indices (a peak, a breakout bar, a support touch — resolved
 * against the real generated candles the same way the annotations are), a
 * handful of *decoys* at plausible-but-wrong candles with a nudge that
 * teaches the actual distinction, and a generic miss message for anywhere
 * else on the chart.
 */
export interface HuntTarget {
  index: number;
  price: number;
  label: string;
}

export interface HuntDecoy extends HuntTarget {
  nudge: string;
}

export interface HuntSpec {
  prompt: string;
  /** Any one of these within `tolerance` candles counts as a win. */
  targets: HuntTarget[];
  decoys: HuntDecoy[];
  tolerance: number;
  missNudge: string;
}

type HuntGeometry = Omit<HuntSpec, 'prompt'>;

/** First candle whose close clears a flat reference level, searching forward
 *  from `searchFromX` — the actual breakout bar, not just "near the edge". */
function breakoutIndex(
  candles: Candle[],
  levelXs: number[],
  kind: 'high' | 'low',
  searchFromX: number,
  direction: 'above' | 'below',
): AnnotationPoint {
  const [level] = flatLine(candles, levelXs, kind);
  const start = toIndex(searchFromX, candles.length);
  for (let i = start; i < candles.length; i += 1) {
    if (direction === 'above' && candles[i].close > level.price) return { index: i, price: candles[i].close };
    if (direction === 'below' && candles[i].close < level.price) return { index: i, price: candles[i].close };
  }
  const last = candles[candles.length - 1];
  return { index: candles.length - 1, price: last.close };
}

function headShouldersHunt(candles: Candle[]): HuntGeometry {
  const left = extremeNear(candles, 0.22, 'high');
  const head = extremeNear(candles, 0.5, 'high');
  const right = extremeNear(candles, 0.78, 'high');
  return {
    tolerance: 3,
    targets: [{ index: head.index, price: head.price, label: 'Head' }],
    decoys: [
      {
        index: left.index,
        price: left.price,
        label: 'Left shoulder',
        nudge: "That's the left shoulder — a real peak, but the head is the highest of the three.",
      },
      {
        index: right.index,
        price: right.price,
        label: 'Right shoulder',
        nudge: "That's the right shoulder — close, but the head still needs to be the tallest peak here.",
      },
    ],
    missNudge: 'Look for the tallest of the three peaks — the head stands above both shoulders.',
  };
}

function inverseHeadShouldersHunt(candles: Candle[]): HuntGeometry {
  const left = extremeNear(candles, 0.22, 'low');
  const head = extremeNear(candles, 0.5, 'low');
  const right = extremeNear(candles, 0.78, 'low');
  return {
    tolerance: 3,
    targets: [{ index: head.index, price: head.price, label: 'Head' }],
    decoys: [
      {
        index: left.index,
        price: left.price,
        label: 'Left shoulder',
        nudge: "That's the left shoulder — a real trough, but the head dips lower than both shoulders.",
      },
      {
        index: right.index,
        price: right.price,
        label: 'Right shoulder',
        nudge: "That's the right shoulder — close, but the head still needs to be the deepest trough here.",
      },
    ],
    missNudge: 'Look for the lowest of the three troughs — the head sits below both shoulders.',
  };
}

function doubleTopHunt(candles: Candle[]): HuntGeometry {
  const peak1 = extremeNear(candles, 0.3, 'high');
  const peak2 = extremeNear(candles, 0.7, 'high');
  const trough = extremeNear(candles, 0.5, 'low');
  return {
    tolerance: 3,
    targets: [{ index: peak2.index, price: peak2.price, label: 'Second peak' }],
    decoys: [
      {
        index: peak1.index,
        price: peak1.price,
        label: 'First peak',
        nudge: "That's the first peak — the one that matters is the second attempt at the same level.",
      },
      {
        index: trough.index,
        price: trough.price,
        label: 'Pullback',
        nudge: "That's the pullback between the two peaks, not a peak itself.",
      },
    ],
    missNudge: 'Find the second peak — the one that tests the same high a second time and fails.',
  };
}

function doubleBottomHunt(candles: Candle[]): HuntGeometry {
  const trough1 = extremeNear(candles, 0.3, 'low');
  const trough2 = extremeNear(candles, 0.7, 'low');
  const peak = extremeNear(candles, 0.5, 'high');
  return {
    tolerance: 3,
    targets: [{ index: trough2.index, price: trough2.price, label: 'Second trough' }],
    decoys: [
      {
        index: trough1.index,
        price: trough1.price,
        label: 'First trough',
        nudge: "That's the first trough — the one that matters is the second retest of the same low.",
      },
      {
        index: peak.index,
        price: peak.price,
        label: 'Bounce',
        nudge: "That's the bounce between the two troughs, not a trough itself.",
      },
    ],
    missNudge: 'Find the second trough — the one that retests the same low a second time and holds.',
  };
}

function ascendingTriangleHunt(candles: Candle[]): HuntGeometry {
  const resistanceXs = [0.12, 0.38, 0.64, 0.88];
  const touchA = extremeNear(candles, 0.38, 'high');
  const touchB = extremeNear(candles, 0.64, 'high');
  const breakout = breakoutIndex(candles, resistanceXs, 'high', 0.88, 'above');
  return {
    tolerance: 4,
    targets: [{ index: breakout.index, price: breakout.price, label: 'Breakout' }],
    decoys: [
      {
        index: touchA.index,
        price: touchA.price,
        label: 'Resistance touch',
        nudge: 'That held at resistance — it did not break through. The breakout candle is further right.',
      },
      {
        index: touchB.index,
        price: touchB.price,
        label: 'Resistance touch',
        nudge: 'Another touch of the flat ceiling, still holding. Keep looking toward the right edge.',
      },
    ],
    missNudge: 'Find the candle that finally closes above the flat resistance line, on the right side of the triangle.',
  };
}

function descendingTriangleHunt(candles: Candle[]): HuntGeometry {
  const supportXs = [0.12, 0.38, 0.64, 0.88];
  const touchA = extremeNear(candles, 0.38, 'low');
  const touchB = extremeNear(candles, 0.64, 'low');
  const breakout = breakoutIndex(candles, supportXs, 'low', 0.88, 'below');
  return {
    tolerance: 4,
    targets: [{ index: breakout.index, price: breakout.price, label: 'Breakout' }],
    decoys: [
      {
        index: touchA.index,
        price: touchA.price,
        label: 'Support touch',
        nudge: 'That held at support — it did not break down. The breakout candle is further right.',
      },
      {
        index: touchB.index,
        price: touchB.price,
        label: 'Support touch',
        nudge: 'Another touch of the flat floor, still holding. Keep looking toward the right edge.',
      },
    ],
    missNudge: 'Find the candle that finally closes below the flat support line, on the right side of the triangle.',
  };
}

function bullFlagHunt(candles: Candle[]): HuntGeometry {
  const poleTop = extremeNear(candles, 0.3, 'high');
  const flagLow = extremeNear(candles, 0.74, 'low');
  return {
    tolerance: 3,
    targets: [{ index: poleTop.index, price: poleTop.price, label: 'Pole top' }],
    decoys: [
      {
        index: flagLow.index,
        price: flagLow.price,
        label: 'Inside the flag',
        nudge: "That's inside the flag's pullback — the pole is the sharp rally before the pause, not the pause itself.",
      },
    ],
    missNudge: 'Find where the sharp, almost straight-line rally runs out of room — that top is the pole.',
  };
}

function rangeHunt(candles: Candle[]): HuntGeometry {
  const supportXs = [0.26, 0.54, 0.82];
  const resistanceXs = [0.12, 0.4, 0.68];
  const supports = supportXs.map((x) => extremeNear(candles, x, 'low'));
  const resistances = resistanceXs.map((x) => extremeNear(candles, x, 'high'));
  return {
    tolerance: 3,
    targets: supports.map((s, i) => ({ index: s.index, price: s.price, label: `Support touch ${i + 1}` })),
    decoys: resistances.map((r, i) => ({
      index: r.index,
      price: r.price,
      label: `Resistance touch ${i + 1}`,
      nudge: "That's resistance — the ceiling. We're hunting the floor buyers keep defending, at the bottom.",
    })),
    missNudge: 'Look for one of the lows where price bounced at the same level more than once.',
  };
}

const HUNT_BUILDERS: Record<PatternId, (candles: Candle[]) => HuntGeometry> = {
  headShoulders: headShouldersHunt,
  inverseHeadShoulders: inverseHeadShouldersHunt,
  doubleTop: doubleTopHunt,
  doubleBottom: doubleBottomHunt,
  ascendingTriangle: ascendingTriangleHunt,
  descendingTriangle: descendingTriangleHunt,
  bullFlag: bullFlagHunt,
  supportResistanceRange: rangeHunt,
};

export function huntSpecFor(id: PatternId, candles: Candle[]): HuntSpec {
  return { prompt: PATTERN_BY_ID[id].huntPrompt, ...HUNT_BUILDERS[id](candles) };
}

/** Was a click on candle `clickedIndex` close enough to a real target? If not,
 *  find the nearest decoy (if any is within tolerance) so the nudge is
 *  specific to what the learner actually pointed at. */
export function evaluateHuntClick(
  spec: HuntSpec,
  clickedIndex: number,
): { correct: boolean; nudge: string; matched: HuntTarget | null } {
  const hit = spec.targets.find((t) => Math.abs(t.index - clickedIndex) <= spec.tolerance);
  if (hit) return { correct: true, nudge: '', matched: hit };

  let nearestDecoy: HuntDecoy | null = null;
  let bestDist = Infinity;
  for (const decoy of spec.decoys) {
    const dist = Math.abs(decoy.index - clickedIndex);
    if (dist <= spec.tolerance && dist < bestDist) {
      bestDist = dist;
      nearestDecoy = decoy;
    }
  }
  return { correct: false, nudge: nearestDecoy?.nudge ?? spec.missNudge, matched: null };
}

/**
 * Shape Hunt stage 3 — "what happened next". Extends the same series forward
 * with a fresh leg of anchors rather than a plain random walk, so a genuine
 * breakout looks like one. The direction is not always the textbook one:
 * real patterns fail a meaningful share of the time, and that has to be true
 * here too or the lesson "this is a probability, not a promise" is a lie.
 */
export type OutcomeDirection = 'up' | 'down' | 'range';

/** Share of rounds where the outcome matches the pattern's textbook
 *  direction — deliberately short of 100%, and quoted directly in the UI. */
export const RESOLVE_PROBABILITY = 0.68;

export function expectedOutcome(id: QuizPatternId): OutcomeDirection {
  if (id === NO_PATTERN_ID) return 'range';
  const sentiment = PATTERN_BY_ID[id].sentiment;
  if (sentiment === 'bullish') return 'up';
  if (sentiment === 'bearish') return 'down';
  return 'range';
}

function rollOutcome(expected: OutcomeDirection, rng: Rng): OutcomeDirection {
  if (rng.bool(RESOLVE_PROBABILITY)) return expected;
  if (expected === 'range') return rng.pick(['up', 'down'] as const);
  // Failing usually means fizzling into a range rather than an outright
  // reversal — a stalled pattern is far more common than a hard inversion.
  return rng.bool(0.7) ? 'range' : (expected === 'up' ? 'down' : 'up');
}

function continuationAnchors(outcome: OutcomeDirection, rng: Rng): Anchor[] {
  const jitter = () => 1 + rng.gauss() * 0.015;
  if (outcome === 'up') {
    return [
      { x: 0, y: 1 },
      { x: 0.45, y: 1.045 * jitter() },
      { x: 1, y: 1.11 * jitter() },
    ];
  }
  if (outcome === 'down') {
    return [
      { x: 0, y: 1 },
      { x: 0.45, y: 0.955 * jitter() },
      { x: 1, y: 0.89 * jitter() },
    ];
  }
  return [
    { x: 0, y: 1 },
    { x: 0.3, y: 1.035 * jitter() },
    { x: 0.65, y: 0.975 * jitter() },
    { x: 1, y: 1.01 * jitter() },
  ];
}

export interface ContinuationResult {
  /** Just the new candles — caller appends them to the original series. */
  candles: Candle[];
  outcome: OutcomeDirection;
  expected: OutcomeDirection;
  resolved: boolean;
}

export function synthesizeContinuation(
  sample: PatternSample,
  targetId: QuizPatternId,
  rng: Rng,
  count = 15,
): ContinuationResult {
  const expected = expectedOutcome(targetId);
  const outcome = rollOutcome(expected, rng);

  const last = sample.candles[sample.candles.length - 1];
  const lastClose = last?.close ?? 100;
  const anchors = continuationAnchors(outcome, rng).map((a) => ({ x: a.x, y: a.y * lastClose }));

  const smooth = interpolateAnchors(anchors, count, 1.1);
  const rough = roughen(smooth, rng, 0.011);
  const allDates = makeDates(START_DATE, sample.candles.length + count, 'daily');
  const dates = allDates.slice(sample.candles.length);
  const candles = candlesFromCloses(rough, dates, rng, { volatility: 0.012 });

  return { candles, outcome, expected, resolved: outcome === expected };
}

/** One instance of a real pattern, verified against nothing but built to
 *  match the definition's anchors — same idea as shapeSynth's synthesizeShape,
 *  scaled up to a whole chart window. */
export function synthesizePattern(
  id: PatternId,
  seed: number | Rng,
  options: { count?: number; startDate?: string } = {},
): PatternSample {
  const rng = typeof seed === 'number' ? createRng(seed) : seed;
  const def = PATTERN_BY_ID[id];
  const count = options.count ?? PATTERN_CANDLE_COUNT;
  const startDate = options.startDate ?? START_DATE;

  const candles = buildSeries({
    anchors: jitterAnchors(def.anchors, rng),
    count,
    startDate,
    interval: 'daily',
    rng,
    noise: 0.011,
    sharpness: def.family === 'reversal' ? 1.7 : 1.3,
  });

  const annotations = ANNOTATION_BUILDERS[id](candles);
  const { focusStart, focusEnd } = focusRange(annotations, candles.length);

  return { patternId: id, candles, annotations, focusStart, focusEnd };
}

/** The honest default: a random walk with nothing forming on it. No
 *  annotations, because there is nothing to point at. */
export function synthesizeNoPattern(
  seed: number | Rng,
  options: { count?: number; startDate?: string } = {},
): PatternSample {
  const rng = typeof seed === 'number' ? createRng(seed) : seed;
  const count = options.count ?? PATTERN_CANDLE_COUNT;

  const candles = generateRandomWalk(rng, {
    count,
    startDate: options.startDate ?? START_DATE,
    startPrice: 100,
    drift: rng.gauss() * 0.0006,
    volatility: 0.013,
  });

  return { patternId: NO_PATTERN_ID, candles, annotations: [], focusStart: 0, focusEnd: candles.length - 1 };
}
