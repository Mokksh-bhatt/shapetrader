import type { Annotation } from '@/engine/annotations/types';
import { buildSeries, type Anchor } from '@/data/generator/pathBuilder';
import { createRng, hashSeed } from '@/data/generator/seededRng';
import {
  extremeIndex,
  priceAt,
  type CaseStudyDataset,
  type NarrativeStep,
  type RecapQuestion,
} from './types';

const ID = 'covid-crash-2020';
const COUNT = 124;

/**
 * Anchors tracing the COVID crash: an all-time high in mid-February 2020, a
 * roughly 34% fall to the March 23 low — the fastest bear market on record —
 * and a V-shaped recovery to new highs by August. Daily bars over about six
 * months means this is the one case study where the anchor positions line up
 * fairly closely with the real calendar; it is still an index-normalised,
 * stylised reconstruction rather than tick-accurate history.
 */
const ANCHORS: Anchor[] = [
  { x: 0.0, y: 100 }, // Feb 3 — still near highs
  { x: 0.089, y: 103 }, // Feb 19 — the all-time high
  { x: 0.15, y: 94 }, // last week of Feb, rolling over
  { x: 0.2, y: 82 }, // early March, growing panic
  { x: 0.24, y: 74 }, // mid-March circuit-breaker week
  { x: 0.276, y: 67 }, // March 23 — the low, roughly -35% off the high
  { x: 0.32, y: 78 }, // the snapback begins
  { x: 0.4, y: 86 },
  { x: 0.5, y: 91 },
  { x: 0.6, y: 95 },
  { x: 0.7, y: 99 }, // close to a full round trip
  { x: 0.8, y: 103 },
  { x: 0.9, y: 107 },
  { x: 1.0, y: 112 }, // new all-time highs
];

const rng = createRng(hashSeed(ID));
const candles = buildSeries({
  anchors: ANCHORS,
  count: COUNT,
  startDate: '2020-02-03',
  interval: 'daily',
  rng,
  noise: 0.018,
  sharpness: 1.6, // sharper turns at the low and the highs — a genuine V, not a rounded one
  candleOptions: { volatility: 0.028, gap: 0.01 },
});

const idxAth = extremeIndex(candles, 4, 16, 'max');
const idxLow = extremeIndex(candles, 26, 42, 'min');
const idxRecoveryPoint = extremeIndex(candles, 70, 100, 'max');
const idxNewHigh = extremeIndex(candles, 105, candles.length - 1, 'max');

const annotations: Annotation[] = [
  {
    id: 'all-time-high',
    kind: 'marker',
    points: [{ index: idxAth, price: priceAt(candles, idxAth) }],
    label: 'All-time high',
    tone: 'gold',
  },
  {
    id: 'circuit-breakers',
    kind: 'zone',
    points: [
      { index: 20, price: priceAt(candles, 20) * 1.06 },
      { index: 34, price: priceAt(candles, 34) * 0.94 },
    ],
    label: 'Trading halts four times in two weeks',
    tone: 'bear',
    dashed: true,
  },
  {
    id: 'capitulation-low',
    kind: 'marker',
    points: [{ index: idxLow, price: priceAt(candles, idxLow) }],
    label: 'The low — fastest bear market on record',
    tone: 'bull',
  },
  {
    id: 'v-recovery',
    kind: 'line',
    points: [
      { index: idxLow, price: priceAt(candles, idxLow) },
      { index: idxRecoveryPoint, price: priceAt(candles, idxRecoveryPoint) },
    ],
    label: 'V-shaped recovery',
    tone: 'bull',
  },
  {
    id: 'new-high',
    kind: 'marker',
    points: [{ index: idxNewHigh, price: priceAt(candles, idxNewHigh) }],
    label: 'New all-time high',
    tone: 'bull',
  },
];

const narrativeSteps: NarrativeStep[] = [
  {
    title: 'No warning on the chart',
    narration:
      'The index made a fresh all-time high just weeks before the fastest crash in market history. There is no topping pattern here, no double top, nothing structural giving it away — a global pandemic is not a technical signal. Some declines are triggered by events entirely outside the chart.',
    focusStart: 0,
    focusEnd: 16,
    annotationIds: ['all-time-high'],
    lesson: 'Charts describe price. They cannot warn you about news that has not happened yet.',
  },
  {
    title: 'The fastest bear market on record',
    narration:
      'This fell roughly a third in about three weeks. The dot-com bust took over two years to fall a comparable amount; 2008 took about a year and a half. Same rough destination, wildly different pacing — speed is its own piece of information, separate from size.',
    focusStart: 8,
    focusEnd: 34,
    annotationIds: [],
    lesson: 'How fast a market falls matters as much as how far.',
  },
  {
    title: 'Circuit breakers and panic',
    narration:
      'Trading was halted market-wide four times in under two weeks — a mechanism designed for exactly this kind of one-directional panic. Visually this stretch is a run of long, heavy-bodied down candles, the same shape taught in the candlesticks module, just repeated day after day instead of appearing once.',
    focusStart: 18,
    focusEnd: 34,
    annotationIds: ['circuit-breakers'],
    lesson: 'A string of marubozu-style down candles in a row is the signature of forced, indiscriminate selling.',
  },
  {
    title: 'The bottom, in real time',
    narration:
      'March 23, 2020 was made on some of the grimmest headlines of the entire pandemic. This is the third time this module has shown a bottom nobody could confidently identify as it happened — that repetition is deliberate. It is the single most consistent pattern across all three crashes.',
    focusStart: 26,
    focusEnd: 42,
    annotationIds: ['capitulation-low'],
    lesson: 'Every crash studied here bottomed on despair, not good news.',
  },
  {
    title: 'A genuine V, not a trap',
    narration:
      'Unlike the bear-market rallies that failed in 2000 and 2008, this bounce kept making higher lows almost immediately and never gave them back. Living through March and April 2020, though, it looked exactly like the rallies that did fail — there was no way yet to know which kind this one was.',
    focusStart: 34,
    focusEnd: 100,
    annotationIds: ['v-recovery'],
    lesson: 'A real reversal and a bear-market trap look identical for the first few weeks.',
  },
  {
    title: 'New highs within six months',
    narration:
      'The index was back above its old high by August 2020 — the fastest full round trip of any crash studied here. Unprecedented, coordinated interest-rate cuts and stimulus played a real role in that speed, not chart mechanics alone.',
    focusStart: 90,
    focusEnd: 123,
    annotationIds: ['new-high'],
    lesson: 'A fast recovery here was partly a policy choice, not a law of markets.',
  },
  {
    title: 'Fast is not the default',
    narration:
      'A V-shaped recovery this quick is the exception among the events in this module, not the rule. The dot-com bust took roughly seven years to reclaim its old high; 2008 took about five and a half. Treating "it always comes back fast" as a lesson from a single, unusually fast example is exactly the kind of mistake this module is trying to prevent.',
    focusStart: 0,
    focusEnd: 123,
    annotationIds: ['all-time-high', 'circuit-breakers', 'capitulation-low', 'v-recovery', 'new-high'],
    lesson: 'One fast recovery does not make fast recoveries the norm — compare it against the other three events.',
  },
];

const recapQuestions: RecapQuestion[] = [
  {
    id: 'q1',
    question: 'What made the COVID crash distinct from the dot-com and 2008 declines studied earlier?',
    options: [
      { id: 'a', label: 'It fell into a bear market faster than any decline in market history' },
      { id: 'b', label: 'It was the largest percentage decline of the three' },
      { id: 'c', label: 'It had no recovery afterward' },
      { id: 'd', label: 'It happened without any news event behind it' },
    ],
    correctId: 'a',
    explanation:
      'The percentage fall was actually smaller than either the dot-com bust or 2008 — what made it unusual was pure speed. Both magnitude and pace matter when you are reading a chart.',
  },
  {
    id: 'q2',
    question: 'What does a run of long, heavy-bodied down candles across several consecutive sessions typically signal?',
    options: [
      { id: 'a', label: 'Forced, indiscriminate selling — panic rather than an orderly decline' },
      { id: 'b', label: 'A guaranteed buying opportunity the next morning' },
      { id: 'c', label: 'That the pattern is fake and should be ignored' },
      { id: 'd', label: 'Low trading volume' },
    ],
    correctId: 'a',
    explanation:
      'It is the same signature as a single bearish marubozu from the candlesticks module — sellers in control from open to close — just repeated. It tells you about the character of the selling, not when it will end.',
  },
  {
    id: 'q3',
    question: 'Why is it risky for a beginner to assume every crash recovers as fast as this one did?',
    options: [
      {
        id: 'a',
        label: 'Because this recovery was unusually fast, partly due to a specific policy response — the dot-com and 2008 recoveries each took years',
      },
      { id: 'b', label: "It isn't risky — every crash in history has recovered within six months" },
      { id: 'c', label: 'Because V-shaped recoveries are technically impossible' },
      { id: 'd', label: 'Because the COVID recovery has not actually happened yet' },
    ],
    correctId: 'a',
    explanation:
      'Generalising from one dramatic, recent example is a common beginner mistake. This module deliberately shows three crashes with three very different recovery timelines so no single one gets mistaken for "how markets work."',
  },
];

export const COVID_CRASH_2020: CaseStudyDataset = {
  id: ID,
  title: 'The COVID Crash & Recovery',
  dateRangeLabel: 'Feb – Aug 2020',
  blurb:
    'The fastest bear market on record — about a 34% fall in weeks — followed by an unusually fast V-shaped recovery to new highs.',
  interval: 'daily',
  candles,
  annotations,
  narrativeSteps,
  recapQuestions,
};
