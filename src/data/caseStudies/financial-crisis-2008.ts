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

const ID = 'financial-crisis-2008';
const COUNT = 110;

/**
 * Anchors tracing the 2007–2009 global financial crisis: a rounded, months-long
 * top (not a sharp spike, unlike the dot-com top), an August 2007 credit-crunch
 * tremor, a spring-2008 "worst is over" rally, the Lehman Brothers shock, and a
 * roughly 57% peak-to-trough collapse into the March 2009 low. Index-normalised
 * to 100 — a stylised reconstruction, not tick-accurate history.
 */
const ANCHORS: Anchor[] = [
  { x: 0.0, y: 100 }, // Jan 2007 — a rally already five years old
  { x: 0.1, y: 108 },
  { x: 0.2, y: 113 }, // first marginal high
  { x: 0.28, y: 101 }, // Aug 2007 credit-crunch tremor
  { x: 0.35, y: 116 }, // Oct 2007 — the actual all-time high
  { x: 0.44, y: 100 }, // Jan 2008 round trip back to base
  { x: 0.5, y: 109 }, // spring 2008 bear-market rally
  { x: 0.58, y: 88 }, // renewed summer decline
  { x: 0.64, y: 74 }, // Lehman Brothers collapses, Sept 2008
  { x: 0.7, y: 54 }, // October 2008 — the fastest, ugliest month
  { x: 0.75, y: 60 }, // brief stabilisation
  { x: 0.82, y: 50 }, // fresh Jan–Feb 2009 leg down
  { x: 0.9, y: 48 }, // March 2009 capitulation low
  { x: 0.95, y: 60 },
  { x: 1.0, y: 66 },
];

const rng = createRng(hashSeed(ID));
const candles = buildSeries({
  anchors: ANCHORS,
  count: COUNT,
  startDate: '2007-01-05',
  interval: 'weekly',
  rng,
  noise: 0.012,
  candleOptions: { volatility: 0.02, gap: 0.005 },
});

const idxFirstHigh = extremeIndex(candles, 12, 26, 'max');
const idxCreditCrunchDip = extremeIndex(candles, idxFirstHigh, 36, 'min');
const idxFinalHigh = extremeIndex(candles, 32, 45, 'max');
const idxSupportBreak = Math.min(50, candles.length - 1);
const idxBearRallyPeak = extremeIndex(candles, 50, 62, 'max');
const idxLehmanLow = extremeIndex(candles, 63, 80, 'min');
const idxCapitulation = extremeIndex(candles, 86, candles.length - 1, 'min');

const toppingHigh = Math.max(priceAt(candles, idxFirstHigh), priceAt(candles, idxFinalHigh));
const toppingLow = priceAt(candles, idxCreditCrunchDip);

const annotations: Annotation[] = [
  {
    id: 'topping-zone',
    kind: 'zone',
    points: [
      { index: 0, price: toppingHigh * 1.015 },
      { index: idxFinalHigh, price: toppingLow * 0.98 },
    ],
    label: 'A slow, rounded top',
    tone: 'gold',
    dashed: true,
  },
  {
    id: 'credit-crunch-dip',
    kind: 'marker',
    points: [{ index: idxCreditCrunchDip, price: priceAt(candles, idxCreditCrunchDip) }],
    label: 'First tremor — Aug 2007 credit crunch',
    tone: 'gold',
  },
  {
    id: 'final-high',
    kind: 'marker',
    points: [{ index: idxFinalHigh, price: priceAt(candles, idxFinalHigh) }],
    label: 'The all-time high',
    tone: 'gold',
  },
  {
    id: 'support-break',
    kind: 'marker',
    points: [{ index: idxSupportBreak, price: priceAt(candles, idxSupportBreak) }],
    label: 'Support breaks',
    tone: 'bear',
  },
  {
    id: 'bear-rally-2008',
    kind: 'zone',
    points: [
      { index: Math.max(idxBearRallyPeak - 5, 0), price: priceAt(candles, idxBearRallyPeak) * 1.03 },
      { index: Math.min(idxBearRallyPeak + 5, candles.length - 1), price: priceAt(candles, idxBearRallyPeak) * 0.9 },
    ],
    label: 'Bear-market rally — "the worst is over"',
    tone: 'bear',
    dashed: true,
  },
  {
    id: 'lehman-collapse',
    kind: 'marker',
    points: [{ index: idxLehmanLow, price: priceAt(candles, idxLehmanLow) }],
    label: 'Lehman collapses — decline becomes crash',
    tone: 'bear',
  },
  {
    id: 'capitulation',
    kind: 'marker',
    points: [{ index: idxCapitulation, price: priceAt(candles, idxCapitulation) }],
    label: 'March 2009 capitulation low',
    tone: 'bull',
  },
];

const narrativeSteps: NarrativeStep[] = [
  {
    title: 'A rally that had already run five years',
    narration:
      'By January 2007 the market had been climbing since 2003, powered in part by cheap credit and a housing boom that was starting to crack underneath the surface. None of that shows up directly on a price chart — it is a reminder that a chart tells you what happened, not always why.',
    focusStart: 0,
    focusEnd: 22,
    annotationIds: [],
    lesson: 'Price is the last thing to know — the story behind a trend is often invisible on the chart itself.',
  },
  {
    title: 'A slow, rounded top',
    narration:
      'Unlike the dot-com bubble\'s clean head and shoulders, the 2007 top was a grind: months of choppy, marginal new highs with a real scare — the August 2007 credit-crunch tremor — in the middle of it. Reversals do not always announce themselves with a textbook shape; sometimes distribution just takes a long time.',
    focusStart: 0,
    focusEnd: 44,
    annotationIds: ['topping-zone', 'credit-crunch-dip', 'final-high'],
    lesson: 'Not every top is a sharp spike — some are a slow, sideways handoff from buyers to sellers.',
  },
  {
    title: 'The first crack',
    narration:
      'The January 2008 break below the year\'s trading range was the first clean technical evidence something had changed. At the time it was widely called a healthy correction in an ongoing bull market — which is exactly what every early stage of a bear market gets called.',
    focusStart: 38,
    focusEnd: 55,
    annotationIds: ['support-break'],
    lesson: 'A level that used to hold now caps every bounce — old support becomes resistance.',
  },
  {
    title: 'The trap',
    narration:
      'Spring 2008 brought a real, multi-week rally that recovered a good chunk of the losses and convinced plenty of people the worst was behind them. It was not. This is the same bear-market-rally trap seen in the dot-com case study, and it will show up again — it is one of the most reliable ways a crash fools people twice.',
    focusStart: 48,
    focusEnd: 65,
    annotationIds: ['bear-rally-2008'],
    lesson: 'A rally that fails to make a new high is still a downtrend, just a less obvious one.',
  },
  {
    title: 'Lehman: the decline becomes a crash',
    narration:
      'When Lehman Brothers filed for bankruptcy in September 2008, an orderly decline turned violent almost overnight. Volatility itself became the news, with some of the largest single-day moves in the market\'s history and the kind of wide, gapping candles the candlestick module associates with panic.',
    focusStart: 60,
    focusEnd: 82,
    annotationIds: ['lehman-collapse'],
    lesson: 'Crises often have a specific trigger that turns a slow decline into a fast one — watch for the gap.',
  },
  {
    title: 'Capitulation',
    narration:
      'The March 2009 low was made on some of the grimmest headlines of the entire crisis — banks nationalised, the financial system openly discussed as broken. Sound familiar? It is the same pattern as the dot-com bottom: maximum pessimism, not a recovering headline, marks the actual low.',
    focusStart: 84,
    focusEnd: 109,
    annotationIds: ['capitulation'],
    lesson: 'The bottom is made when the news is worst, not when it starts to improve.',
  },
  {
    title: 'Hindsight, again',
    narration:
      'Every stage here looks like a clean warning sign once you know the ending — the rounded top, the failed rally, the Lehman gap. Even professional risk managers and central bankers were surprised by how fast it unravelled. The lesson is not that you should have seen it coming; it is that nobody reliably does, which is why position sizing matters more than prediction.',
    focusStart: 0,
    focusEnd: 109,
    annotationIds: [
      'topping-zone',
      'credit-crunch-dip',
      'final-high',
      'support-break',
      'bear-rally-2008',
      'lehman-collapse',
      'capitulation',
    ],
    lesson: 'A clean story in hindsight was chaos and conflicting signals in real time.',
  },
];

const recapQuestions: RecapQuestion[] = [
  {
    id: 'q1',
    question: 'How does the 2007 top compare in shape to the dot-com top studied earlier?',
    options: [
      { id: 'a', label: 'It was a slow, months-long rounded top rather than a clean head and shoulders' },
      { id: 'b', label: 'It was a single, sharp one-day spike' },
      { id: 'c', label: 'It was a textbook double bottom' },
      { id: 'd', label: 'There was no top — the index kept rising' },
    ],
    correctId: 'a',
    explanation:
      'Reversal patterns are not one-size-fits-all. 2007 chopped sideways with a real scare in the middle before finally breaking down — a reminder that patience and confirmation matter more than expecting every top to look like a diagram.',
  },
  {
    id: 'q2',
    question: 'What changed in the market after Lehman Brothers collapsed in September 2008?',
    options: [
      { id: 'a', label: 'A slow decline turned into a sharp, violent crash with huge single-day moves' },
      { id: 'b', label: 'Volatility disappeared and the market stabilised' },
      { id: 'c', label: 'The market immediately made new all-time highs' },
      { id: 'd', label: 'Nothing changed — the decline had already been this steep for a year' },
    ],
    correctId: 'a',
    explanation:
      'Lehman is a good example of a specific trigger event turning an orderly decline into a crisis. Crashes are not always a smooth, evenly-paced slide — the pace itself can suddenly change.',
  },
  {
    id: 'q3',
    question: 'The March 2009 low was made while the news was still extremely bad. What does that suggest about calling a bottom in real time?',
    options: [
      { id: 'a', label: 'Waiting for good news to buy usually means missing the actual low' },
      { id: 'b', label: 'The market only bottoms once every headline is positive' },
      { id: 'c', label: 'Bottoms are announced in advance by regulators' },
      { id: 'd', label: 'It is always possible to identify the exact low as it happens' },
    ],
    correctId: 'a',
    explanation:
      'Both this crash and the dot-com bust bottomed on despair, not optimism. Waiting for confirmation that things are "getting better" is safer, but it also guarantees missing the actual low — a trade-off every trader has to accept.',
  },
];

export const FINANCIAL_CRISIS_2008: CaseStudyDataset = {
  id: ID,
  title: 'The 2008 Financial Crisis',
  dateRangeLabel: '2007 – 2009',
  blurb:
    'A slow, rounded top in 2007, a shock from Lehman Brothers, and a roughly 57% peak-to-trough collapse into March 2009.',
  interval: 'weekly',
  candles,
  annotations,
  narrativeSteps,
  recapQuestions,
};
