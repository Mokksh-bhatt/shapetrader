/**
 * One-off authoring helper for the Market History case studies.
 *
 * The app never imports this file. The four datasets under
 * src/data/caseStudies/*.ts call buildSeries() directly and are deterministic
 * at import time — this script exists only to sanity-check the hand-picked
 * anchors while authoring or editing them:
 *
 *  - prints each dataset's realised peak-to-trough drawdown next to the real
 *    event it is modelling, so a magnitude typo ("-78%" vs "-87%") is easy to
 *    catch before it ships as a lesson;
 *  - prints a tiny sparkline so the overall shape is eyeballable without
 *    opening the app;
 *  - checks a few structural invariants (a step's annotationIds all resolve
 *    to a real annotation, focus ranges are in bounds, every recap question
 *    has its correctId among its own options) so a typo doesn't silently ship
 *    as a blank highlight or an unanswerable quiz question.
 *
 * Run with any TypeScript runner that understands ESM + this repo's
 * tsconfig, e.g.:
 *   npx tsx scripts/generateCaseStudyData.ts
 *
 * Deliberately uses relative imports rather than the `@/` alias, so it does
 * not depend on the app's bundler-only path resolution to run standalone.
 */
import { CASE_STUDIES } from '../src/data/caseStudies';
import type { CaseStudyDataset } from '../src/data/caseStudies/types';

const REAL_WORLD_DRAWDOWN: Record<string, { label: string; approxPct: number }> = {
  'dotcom-2000': { label: 'Nasdaq, Mar 2000 → Oct 2002', approxPct: 78 },
  'financial-crisis-2008': { label: 'S&P 500, Oct 2007 → Mar 2009', approxPct: 57 },
  'covid-crash-2020': { label: 'S&P 500, Feb 2020 → Mar 2020', approxPct: 34 },
  'steady-bull-2017': { label: 'S&P 500, worst 2016–2018 pullback', approxPct: 10 },
};

function maxDrawdownPct(closes: number[]): number {
  let peak = closes.length > 0 ? closes[0] : 0;
  let worst = 0;
  for (const close of closes) {
    peak = Math.max(peak, close);
    if (peak > 0) worst = Math.max(worst, (peak - close) / peak);
  }
  return worst * 100;
}

function sparkline(closes: number[], width = 48): string {
  const blocks = '▁▂▃▄▅▆▇█';
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = Math.max(max - min, 1e-9);
  const step = Math.max(1, Math.floor(closes.length / width));

  let out = '';
  for (let i = 0; i < closes.length; i += step) {
    const t = (closes[i] - min) / span;
    out += blocks[Math.min(blocks.length - 1, Math.floor(t * blocks.length))];
  }
  return out;
}

function checkInvariants(dataset: CaseStudyDataset): string[] {
  const problems: string[] = [];
  const annotationIds = new Set(dataset.annotations.map((a) => a.id));
  const lastIndex = dataset.candles.length - 1;

  if (dataset.narrativeSteps.length < 6 || dataset.narrativeSteps.length > 8) {
    problems.push(`has ${dataset.narrativeSteps.length} narrative steps, spec asks for 6-8`);
  }
  if (dataset.recapQuestions.length !== 3) {
    problems.push(`has ${dataset.recapQuestions.length} recap questions, spec asks for 3`);
  }

  dataset.narrativeSteps.forEach((step, i) => {
    if (step.focusStart < 0 || step.focusEnd > lastIndex || step.focusStart > step.focusEnd) {
      problems.push(
        `step ${i + 1} ("${step.title}"): focus range [${step.focusStart}, ${step.focusEnd}] is out of bounds (0-${lastIndex})`,
      );
    }
    step.annotationIds.forEach((id) => {
      if (!annotationIds.has(id)) {
        problems.push(`step ${i + 1} ("${step.title}") references unknown annotation "${id}"`);
      }
    });
  });

  dataset.recapQuestions.forEach((q) => {
    const seen = new Set<string>();
    q.options.forEach((o) => {
      if (seen.has(o.id)) problems.push(`question "${q.id}" has a duplicate option id "${o.id}"`);
      seen.add(o.id);
    });
    if (!q.options.some((o) => o.id === q.correctId)) {
      problems.push(`question "${q.id}" correctId "${q.correctId}" is not one of its own options`);
    }
  });

  return problems;
}

let anyProblems = false;

for (const dataset of CASE_STUDIES) {
  const closes = dataset.candles.map((c) => c.close);
  const drawdown = maxDrawdownPct(closes);
  const real = REAL_WORLD_DRAWDOWN[dataset.id];
  const first = dataset.candles[0];
  const last = dataset.candles[dataset.candles.length - 1];

  console.log(`\n${dataset.title} (${dataset.id})`);
  console.log(`  ${dataset.candles.length} ${dataset.interval} candles, ${first?.time} -> ${last?.time}`);
  console.log(`  max drawdown: ${drawdown.toFixed(1)}%${real ? `  (real: ~${real.approxPct}% - ${real.label})` : ''}`);
  console.log(`  ${sparkline(closes)}`);

  const problems = checkInvariants(dataset);
  if (problems.length > 0) {
    anyProblems = true;
    problems.forEach((p) => console.log(`  ! ${p}`));
  }
}

console.log(anyProblems ? '\nInvariant checks failed - see "!" lines above.' : '\nAll four case studies look structurally sound.');
