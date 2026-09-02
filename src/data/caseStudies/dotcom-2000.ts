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

const ID = 'dotcom-2000';
const COUNT = 130;

/**
 * Hand-picked anchors tracing the shape of the Nasdaq's 1998–2002 round trip:
 * a shaky 1998, a two-year melt-up, a head-and-shoulders top, and a roughly
 * 78% peak-to-trough collapse into the October 2002 low. Index-normalised to
 * 100 at the start — this is a stylised reconstruction of the event's shape,
 * not tick-accurate history (see the disclaimer shown in the UI).
 */
const ANCHORS: Anchor[] = [
  { x: 0.0, y: 100 },
  { x: 0.07, y: 76 }, // 1998 Asia/Russia scare
  { x: 0.13, y: 98 }, // V-shaped recovery
  { x: 0.28, y: 145 }, // 1999 climb
  { x: 0.4, y: 185 }, // acceleration
  { x: 0.5, y: 245 }, // parabolic phase
  { x: 0.58, y: 305 }, // left shoulder
  { x: 0.615, y: 270 }, // neckline touch #1
  { x: 0.65, y: 358 }, // head — the all-time high
  { x: 0.685, y: 275 }, // neckline touch #2
  { x: 0.72, y: 315 }, // right shoulder — a lower high than the head
  { x: 0.76, y: 250 }, // neckline gives way
  { x: 0.82, y: 175 },
  { x: 0.86, y: 205 }, // a sharp bear-market rally
  { x: 0.9, y: 140 },
  { x: 0.95, y: 95 },
  { x: 0.985, y: 79 }, // capitulation low — roughly -78% off the head
  { x: 1.0, y: 90 },
];

const rng = createRng(hashSeed(ID));
const candles = buildSeries({
  anchors: ANCHORS,
  count: COUNT,
  startDate: '1998-06-01',
  interval: 'weekly',
  rng,
  noise: 0.011,
  candleOptions: { volatility: 0.018, gap: 0.004 },
});

const idxLeftShoulder = extremeIndex(candles, 70, 81, 'max');
const idxHead = extremeIndex(candles, 80, 90, 'max');
const idxRightShoulder = extremeIndex(candles, 90, 97, 'max');
const idxNeckline1 = extremeIndex(candles, idxLeftShoulder, idxHead, 'min');
const idxNeckline2 = extremeIndex(candles, idxHead, idxRightShoulder, 'min');
const idxBreakdown = Math.min(105, candles.length - 1);
const idxBearRally = extremeIndex(candles, 100, 118, 'max');
const idxCapitulation = extremeIndex(candles, 118, candles.length - 1, 'min');

const annotations: Annotation[] = [
  {
    id: 'left-shoulder',
    kind: 'marker',
    points: [{ index: idxLeftShoulder, price: priceAt(candles, idxLeftShoulder) }],
    label: 'Left shoulder',
    tone: 'gold',
  },
  {
    id: 'head',
    kind: 'marker',
    points: [{ index: idxHead, price: priceAt(candles, idxHead) }],
    label: 'Head — the all-time high',
    tone: 'gold',
  },
  {
    id: 'right-shoulder',
    kind: 'marker',
    points: [{ index: idxRightShoulder, price: priceAt(candles, idxRightShoulder) }],
    label: 'Right shoulder — a lower high',
    tone: 'gold',
  },
  {
    id: 'neckline',
    kind: 'line',
    points: [
      { index: idxNeckline1, price: priceAt(candles, idxNeckline1) },
      { index: idxNeckline2, price: priceAt(candles, idxNeckline2) },
    ],
    label: 'Neckline',
    tone: 'violet',
    dashed: true,
  },
  {
    id: 'breakdown',
    kind: 'marker',
    points: [{ index: idxBreakdown, price: priceAt(candles, idxBreakdown) }],
    label: 'Support breaks',
    tone: 'bear',
  },
  {
    id: 'bear-rally',
    kind: 'zone',
    points: [
      { index: Math.max(idxBearRally - 4, 0), price: priceAt(candles, idxBearRally) * 1.02 },
      { index: Math.min(idxBearRally + 4, candles.length - 1), price: priceAt(candles, idxBearRally) * 0.9 },
    ],
    label: 'Bear-market rally — a trap, not a bottom',
    tone: 'bear',
    dashed: true,
  },
  {
    id: 'capitulation',
    kind: 'marker',
    points: [{ index: idxCapitulation, price: priceAt(candles, idxCapitulation) }],
    label: 'Capitulation low',
    tone: 'bull',
  },
];

const narrativeSteps: NarrativeStep[] = [
  {
    title: 'A shaky start to a historic run',
    narration:
      "1998 opened with a scare — a wave of selling tied to Asian and Russian financial trouble knocked the index down hard before it found its feet. By early 1999 that was forgotten and the climb was underway. Nothing in this stretch predicts what comes next, and that is the point: a sharp dip that recovers is just noise until you know how the story ends.",
    focusStart: 0,
    focusEnd: 30,
    annotationIds: [],
    lesson: 'A recovered dip only looks meaningful in hindsight.',
  },
  {
    title: 'The melt-up',
    narration:
      'Through 1999 the index roughly doubled as internet stocks with no profits, sometimes no revenue, kept getting bid higher. Momentum itself became the reason to buy — a self-feeding loop that is exciting to be inside of and looks reckless afterwards. Watch how much steeper the climb gets toward the end of this stretch.',
    focusStart: 20,
    focusEnd: 65,
    annotationIds: [],
    lesson: 'Acceleration, not just direction, is the tell that a trend has turned speculative.',
  },
  {
    title: 'A textbook head and shoulders at the top',
    narration:
      "Zoom in and the top has real structure: a high (the left shoulder), a pullback, a marginally higher high (the head), another pullback, and a rally that fails to even reach the head (the right shoulder). Connect the two pullback lows and you get the neckline — the same pattern from the chart-patterns module, playing out with real money on the line.",
    focusStart: 68,
    focusEnd: 96,
    annotationIds: ['left-shoulder', 'head', 'right-shoulder', 'neckline'],
    lesson: 'A lower high after an all-time high is the first objective evidence a trend has changed character.',
  },
  {
    title: 'The neckline breaks',
    narration:
      'When price finally closed below the neckline, it confirmed what the shoulders had been suggesting: the buyers who kept pushing to new highs were gone. At first this looked like just another dip to buy — that had worked every time through 1999.',
    focusStart: 92,
    focusEnd: 110,
    annotationIds: ['breakdown'],
    lesson: 'Old support becomes resistance — the level that used to hold now caps every bounce.',
  },
  {
    title: 'A vicious bear-market rally',
    narration:
      'Every crash in this module includes at least one sharp counter-rally that convinces people the worst is over. This one clawed back a meaningful chunk of the losses before rolling over again and taking out the prior low. Bounces inside downtrends are common, and they can be brutal to be short into — they just do not last.',
    focusStart: 100,
    focusEnd: 120,
    annotationIds: ['bear-rally'],
    lesson: 'A strong bounce is not a trend reversal — wait for a higher low, not just a green week.',
  },
  {
    title: 'Capitulation',
    narration:
      'By October 2002 the index was roughly 78% below its peak. This is what capitulation looks like on a weekly chart: relentless lower lows, exhausted sellers, and headlines that assumed the market would never recover. It did — years later, and only after this much pain.',
    focusStart: 112,
    focusEnd: 129,
    annotationIds: ['capitulation'],
    lesson: 'The bottom is usually made on the worst news, not the best — nobody rings a bell.',
  },
  {
    title: 'What hindsight hides',
    narration:
      'Looking at the whole chart, every turn looks obvious: the shoulders, the neckline, the capitulation candle. None of it was obvious living through it. In March 2000 this was the greatest bull market anyone alive had seen. Patterns are probabilistic clues, not certainties — which is exactly why risk management matters more than being right.',
    focusStart: 0,
    focusEnd: 129,
    annotationIds: ['left-shoulder', 'head', 'right-shoulder', 'neckline', 'breakdown', 'bear-rally', 'capitulation'],
    lesson: 'Hindsight makes every chart look predictable. Trading happens on the right-hand edge, without that advantage.',
  },
];

const recapQuestions: RecapQuestion[] = [
  {
    id: 'q1',
    question: 'What chart pattern formed at the March 2000 top?',
    options: [
      { id: 'a', label: 'Head and shoulders' },
      { id: 'b', label: 'Double bottom' },
      { id: 'c', label: 'Ascending triangle' },
      { id: 'd', label: 'Bull flag' },
    ],
    correctId: 'a',
    explanation:
      'A left shoulder, a slightly higher head, and a right shoulder that failed to reach the head — connected underneath by a neckline. It is one of the more reliable reversal patterns precisely because it requires buyers to fail twice in a row.',
  },
  {
    id: 'q2',
    question:
      'The market staged a strong rally in the middle of the 2000–2002 decline. What is the main danger of trading a bounce like that as if the bottom is in?',
    options: [
      { id: 'a', label: 'It usually fails and the downtrend resumes, taking out the prior low' },
      { id: 'b', label: 'Bear-market rallies are illegal to trade' },
      { id: 'c', label: 'There is no danger — any rally confirms a new uptrend' },
      { id: 'd', label: 'Volume always disappears during a real reversal' },
    ],
    correctId: 'a',
    explanation:
      'Bear-market rallies can retrace a large share of the recent losses, which is exactly what makes them convincing. The structural difference from a real bottom: a genuine reversal eventually prints a higher low, not just a bounce that fails.',
  },
  {
    id: 'q3',
    question: 'Why is it misleading to say "the 2000 top was obvious"?',
    options: [
      {
        id: 'a',
        label: 'The pattern is only clean in hindsight — in real time it looked like every other dip that had been bought',
      },
      { id: 'b', label: 'It was not misleading — professional traders called the exact top' },
      { id: 'c', label: 'Because the head and shoulders pattern had never happened before' },
      { id: 'd', label: 'Because the Nasdaq did not actually fall in 2000' },
    ],
    correctId: 'a',
    explanation:
      'This is hindsight bias: a completed chart makes the turning point look inevitable. Traders living through it had a year of prior dips that had all been buying opportunities, with no way to know in advance which one would not recover.',
  },
];

export const DOTCOM_2000: CaseStudyDataset = {
  id: ID,
  title: 'The Dot-Com Bubble',
  dateRangeLabel: '1998 – 2002',
  blurb:
    'Two and a half years of speculative melt-up, then a head-and-shoulders top and a roughly 78% collapse into October 2002.',
  interval: 'weekly',
  candles,
  annotations,
  narrativeSteps,
  recapQuestions,
};
