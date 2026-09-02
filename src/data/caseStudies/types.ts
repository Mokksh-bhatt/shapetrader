import type { Candle } from '@/engine/candles/types';
import type { Annotation } from '@/engine/annotations/types';

/**
 * The Market History module's data model. Every case study is a real event
 * (dot-com bubble, 2008, COVID, a boring bull market) told as a guided
 * sequence of steps over one candlestick series, ending in a short recap quiz.
 *
 * The candles themselves are NOT tick-accurate history — see each dataset's
 * comment header and the disclaimer shown in the UI. They are index-normalised
 * (start at 100) and hand-shaped from real turning points so the *shape* and
 * *approximate magnitude* of what happened is honest, even though the exact
 * numbers are invented.
 */
export interface NarrativeStep {
  title: string;
  /** 2-4 sentences teaching what to SEE at this point in the chart. */
  narration: string;
  /** Candle-index range this step highlights on the chart. */
  focusStart: number;
  focusEnd: number;
  /** Which of the dataset's `annotations` (by id) are visible at this step. */
  annotationIds: string[];
  /** Optional one-line takeaway, shown as a small callout. */
  lesson?: string;
}

export interface RecapQuestionOption {
  id: string;
  label: string;
}

export interface RecapQuestion {
  id: string;
  question: string;
  options: RecapQuestionOption[];
  correctId: string;
  explanation: string;
}

export interface CaseStudyDataset {
  id: string;
  title: string;
  /** Human-readable span of the real event, e.g. "1998 – 2002". */
  dateRangeLabel: string;
  blurb: string;
  interval: 'daily' | 'weekly';
  candles: Candle[];
  annotations: Annotation[];
  narrativeSteps: NarrativeStep[];
  recapQuestions: RecapQuestion[];
}

// ---------------------------------------------------------------------------
// Small helpers shared by every dataset file. Kept here (rather than
// duplicated four times) because they solve the same problem each dataset
// has: buildSeries() roughens a smooth anchor path with random noise, so the
// visible swing high/low at "the point I meant" can land a candle or two away
// from the anchor's own index. Snapping annotations to the real generated
// data — instead of the idealised anchor position — keeps every marker glued
// to a candle that actually looks like what the label says.
// ---------------------------------------------------------------------------

/** Index of the highest (or lowest) close within [fromIndex, toIndex], inclusive
 *  and order-independent, clamped to the array bounds. */
export function extremeIndex(
  candles: Candle[],
  fromIndex: number,
  toIndex: number,
  mode: 'max' | 'min',
): number {
  if (candles.length === 0) return 0;
  const lo = Math.max(0, Math.min(fromIndex, toIndex));
  const hi = Math.min(candles.length - 1, Math.max(fromIndex, toIndex));
  let bestIdx = lo;
  let bestVal = candles[lo].close;
  for (let i = lo + 1; i <= hi; i += 1) {
    const v = candles[i].close;
    if (mode === 'max' ? v > bestVal : v < bestVal) {
      bestVal = v;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/** Closing price at an index, clamped to the array — for annotation points
 *  that should sit exactly on the generated data. */
export function priceAt(candles: Candle[], index: number): number {
  if (candles.length === 0) return 0;
  const i = Math.max(0, Math.min(index, candles.length - 1));
  return candles[i].close;
}
