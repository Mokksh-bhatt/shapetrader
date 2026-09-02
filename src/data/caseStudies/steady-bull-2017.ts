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

const ID = 'steady-bull-2017';
const COUNT = 104;

/**
 * Anchors tracing 2016–2018: a real but ordinary -10% correction in early
 * 2016, then two years of a healthy, grinding uptrend — the single lowest
 * realised-volatility year on record for the underlying index — capped by a
 * brief, sharp "Volmageddon"-style gut-check in early 2018. The deliberate
 * counterweight to the other three case studies: most of the time, nothing
 * dramatic happens. Index-normalised to 100, stylised, not tick-accurate.
 */
const ANCHORS: Anchor[] = [
  { x: 0.0, y: 100 },
  { x: 0.05, y: 90 }, // Jan–Feb 2016 correction
  { x: 0.1, y: 93 },
  { x: 0.2, y: 100 }, // round trip back to base
  { x: 0.28, y: 101 }, // brief mid-2016 wobble
  { x: 0.35, y: 110 }, // late-2016 rally
  { x: 0.5, y: 120 }, // steady 2017 climb
  { x: 0.58, y: 117 }, // a shallow, healthy pullback — a higher low
  { x: 0.65, y: 130 },
  { x: 0.8, y: 142 }, // year-end 2017 rally
  { x: 0.9, y: 152 }, // Jan 2018 blow-off
  { x: 0.94, y: 135 }, // Feb 2018 "Volmageddon" correction
  { x: 0.97, y: 140 },
  { x: 1.0, y: 145 },
];

const rng = createRng(hashSeed(ID));
const candles = buildSeries({
  anchors: ANCHORS,
  count: COUNT,
  startDate: '2016-01-04',
  interval: 'weekly',
  rng,
  noise: 0.007,
  candleOptions: { volatility: 0.01, gap: 0.002 },
});

const idxDip2016 = extremeIndex(candles, 2, 9, 'min');
const idxLow1 = extremeIndex(candles, 6, 14, 'min');
const idxLow2 = extremeIndex(candles, 55, 65, 'min');
const idxBlowoff = extremeIndex(candles, 88, 96, 'max');
const idxVolSpikeLow = extremeIndex(candles, 94, 101, 'min');

const annotations: Annotation[] = [
  {
    id: 'correction-2016',
    kind: 'zone',
    points: [
      { index: 0, price: priceAt(candles, 0) * 1.02 },
      { index: 14, price: priceAt(candles, idxDip2016) * 0.97 },
    ],
    label: 'A real -10% correction — a shakeout, not a crash',
    tone: 'gold',
    dashed: true,
  },
  {
    id: 'trendline',
    kind: 'line',
    points: [
      { index: idxLow1, price: priceAt(candles, idxLow1) },
      { index: idxLow2, price: priceAt(candles, idxLow2) },
    ],
    label: 'Rising trend line — higher lows',
    tone: 'bull',
    dashed: true,
  },
  {
    id: 'blow-off-top',
    kind: 'marker',
    points: [{ index: idxBlowoff, price: priceAt(candles, idxBlowoff) }],
    label: 'The climb steepens — euphoria creeping in',
    tone: 'gold',
  },
  {
    id: 'vol-spike',
    kind: 'zone',
    points: [
      { index: idxBlowoff, price: priceAt(candles, idxBlowoff) * 1.02 },
      { index: Math.min(idxVolSpikeLow + 2, candles.length - 1), price: priceAt(candles, idxVolSpikeLow) * 0.97 },
    ],
    label: 'A sharp gut-check ("Volmageddon")',
    tone: 'bear',
    dashed: true,
  },
];

const narrativeSteps: NarrativeStep[] = [
  {
    title: 'Most years look like this',
    narration:
      'After three crashes, here is what a normal, healthy market actually looks like most of the time: it goes up, slowly, with the occasional scare. Nothing here is about to fall 60%. That absence of drama is itself the lesson this case study exists to teach.',
    focusStart: 0,
    focusEnd: 21,
    annotationIds: [],
    lesson: 'Most trading days, weeks, and even years are genuinely uneventful.',
  },
  {
    title: 'A real correction, but not a crash',
    narration:
      'Early 2016 brought a real, roughly 10% decline on fears about slowing global growth. It felt urgent at the time. Next to the greater-than-50% drawdowns already studied in this module, though, it barely registers — pullbacks like this happen most years and are not, by themselves, a warning of something bigger.',
    focusStart: 0,
    focusEnd: 14,
    annotationIds: ['correction-2016'],
    lesson: 'A -10% pullback is a normal, roughly annual event, not a crash in miniature.',
  },
  {
    title: 'Higher lows, one at a time',
    narration:
      'The glossary definition of an uptrend is higher highs and higher lows, and this is what it looks like in practice: each pullback over the next two years found buyers above the level of the last one. That rising floor is the single most useful thing to track in a trend you are already in.',
    focusStart: 6,
    focusEnd: 70,
    annotationIds: ['trendline'],
    lesson: 'While the higher-low pattern holds, a pullback is a pause, not a reversal.',
  },
  {
    title: 'Boring is bullish',
    narration:
      '2017 was, in the real market this is modelled on, one of the calmest years on record — long stretches without even a 3% pullback. Low volatility is not a warning sign here; it is often just what a trend getting on with its business looks like, with nothing forcing weak hands out.',
    focusStart: 36,
    focusEnd: 82,
    annotationIds: [],
    lesson: 'Quiet, grinding trends are not suspicious — they are what most healthy bull markets actually feel like.',
  },
  {
    title: 'Euphoria creeps in',
    narration:
      'By early 2018 the climb had visibly steepened — the same acceleration seen at the top of the dot-com bubble, just far smaller in scale. Even a fundamentally healthy trend can get ahead of itself for a few weeks. The slope changing is worth noticing on its own, independent of the price level.',
    focusStart: 78,
    focusEnd: 97,
    annotationIds: ['blow-off-top'],
    lesson: 'A steepening slope is a signal worth watching even inside an intact uptrend.',
  },
  {
    title: 'A sharp gut-check',
    narration:
      'Early February 2018 delivered a fast, roughly 10% correction in a matter of days — sharper than 2016\'s, over faster. The structural difference from 2000 or 2008 is that the higher-low pattern survived: this pullback did not break the trend. Living through it in real time, though, a drop this sharp feels identical to the first days of something much worse — that is genuinely hard to tell apart in the moment.',
    focusStart: 88,
    focusEnd: 103,
    annotationIds: ['vol-spike'],
    lesson: 'A fast, sharp drop and the start of a crash look the same for the first few days.',
  },
  {
    title: 'The actual takeaway',
    narration:
      'Most trading days are uneventful. Most corrections are not the start of a crash. The skill that matters most is not calling every drawdown in advance — nobody reliably does that, as the other three case studies showed — it is sizing positions so that a normal, healthy correction never forces you out of a trend that is still intact.',
    focusStart: 0,
    focusEnd: 103,
    annotationIds: ['correction-2016', 'trendline', 'blow-off-top', 'vol-spike'],
    lesson: 'Position sizing exists precisely so ordinary volatility does not become a forced decision.',
  },
];

const recapQuestions: RecapQuestion[] = [
  {
    id: 'q1',
    question: 'What two things define a healthy uptrend, by the definition used throughout this app?',
    options: [
      { id: 'a', label: 'Higher highs and higher lows' },
      { id: 'b', label: 'A double top followed by a neckline break' },
      { id: 'c', label: 'Zero volatility and no pullbacks at all' },
      { id: 'd', label: 'A single unbroken green candle every week' },
    ],
    correctId: 'a',
    explanation:
      'Every pullback in this case study found buyers above the level of the previous one — that rising floor of higher lows, alongside higher highs, is the actual definition of an uptrend, not the absence of any decline.',
  },
  {
    id: 'q2',
    question: 'How do the 2016 correction and the Feb 2018 "Volmageddon" spike compare to the 2008 decline studied earlier?',
    options: [
      { id: 'a', label: 'Both were far smaller and shorter, and neither broke the underlying higher-low structure' },
      { id: 'b', label: 'They were roughly the same size and speed as the 2008 crash' },
      { id: 'c', label: 'They lasted longer than the 2008 decline' },
      { id: 'd', label: 'They only happened because of a global financial crisis' },
    ],
    correctId: 'a',
    explanation:
      'Both dips were roughly 10% and resolved within weeks, without breaking the pattern of higher lows. 2008 fell about 57% over roughly a year and a half and broke every prior support level on the way down — a difference in kind, not just degree.',
  },
  {
    id: 'q3',
    question: 'What is this module\'s main practical takeaway from studying a boring, healthy bull market?',
    options: [
      { id: 'a', label: 'Size positions so ordinary corrections do not force you out of a trend that is still intact' },
      { id: 'b', label: 'A trader\'s job is to predict every pullback before it happens' },
      { id: 'c', label: 'Healthy markets never have corrections' },
      { id: 'd', label: 'Low volatility years always end in a crash the following year' },
    ],
    correctId: 'a',
    explanation:
      'The other three case studies show that nobody reliably calls the top or the bottom in real time. What is controllable is how much any single normal correction can hurt you — which is a sizing decision, not a prediction.',
  },
];

export const STEADY_BULL_2017: CaseStudyDataset = {
  id: ID,
  title: 'A Steady Bull Market',
  dateRangeLabel: '2016 – 2018',
  blurb:
    'Two years of an ordinary, healthy uptrend: higher highs, higher lows, one real correction, and a sharp but short gut-check at the end.',
  interval: 'weekly',
  candles,
  annotations,
  narrativeSteps,
  recapQuestions,
};
