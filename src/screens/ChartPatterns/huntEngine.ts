import {
  NO_PATTERN_ID,
  NO_PATTERN_INFO,
  PATTERN_BY_ID,
  PATTERN_IDS,
  type PatternId,
  type QuizPatternId,
} from '@/data/chartPatterns/patterns';
import {
  huntSpecFor,
  synthesizeContinuation,
  synthesizeNoPattern,
  synthesizePattern,
  type ContinuationResult,
  type HuntSpec,
  type PatternSample,
} from '@/data/generator/patternInjector';
import { createRng, hashSeed, type Rng } from '@/data/generator/seededRng';
import type { Choice } from '@/components/feedback/ChoiceGrid';

/** One full run: every real pattern once, plus a couple of honest "nothing
 *  here" rounds — so finishing a run means having hunted the whole field
 *  guide, not just whichever eight the RNG happened to serve up. */
export const ROUNDS_PER_RUN = PATTERN_IDS.length + 2;

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function labelFor(id: QuizPatternId): string {
  return id === NO_PATTERN_ID ? NO_PATTERN_INFO.name : PATTERN_BY_ID[id].name;
}

export function contentFor(id: QuizPatternId) {
  return id === NO_PATTERN_ID ? NO_PATTERN_INFO : PATTERN_BY_ID[id];
}

/** Deterministic order for one run: the 8 real patterns shuffled, with two
 *  "no pattern" rounds dropped into random-but-seeded slots. */
export function buildRunOrder(sessionSeed: number): QuizPatternId[] {
  const rng = createRng(hashSeed(`shape-hunt-order-${sessionSeed}`));
  const real = shuffle(PATTERN_IDS, rng);
  const order: QuizPatternId[] = [...real];
  const slot1 = rng.int(0, order.length);
  order.splice(slot1, 0, NO_PATTERN_ID);
  const slot2 = rng.int(0, order.length);
  order.splice(slot2, 0, NO_PATTERN_ID);
  return order;
}

export interface RoundData {
  targetId: QuizPatternId;
  sample: PatternSample;
  huntSpec: HuntSpec | null; // null for the "no pattern" case — nothing to click
  options: Choice[];
  continuation: ContinuationResult;
}

/** Builds everything a round needs from a single seed, in a fixed order, so
 *  replaying the same seed — including which continuation outcome gets
 *  rolled — reproduces the exact same round. */
export function buildRound(targetId: QuizPatternId, seed: number): RoundData {
  const rng = createRng(seed);
  const sample = targetId === NO_PATTERN_ID ? synthesizeNoPattern(rng) : synthesizePattern(targetId as PatternId, rng);
  const huntSpec = targetId === NO_PATTERN_ID ? null : huntSpecFor(targetId as PatternId, sample.candles);

  let distractorIds: QuizPatternId[];
  if (targetId === NO_PATTERN_ID) {
    distractorIds = shuffle(PATTERN_IDS, rng).slice(0, 3);
  } else {
    const confusable = PATTERN_BY_ID[targetId].confusableWith.filter((id) => id !== targetId);
    const rest: QuizPatternId[] = [...PATTERN_IDS, NO_PATTERN_ID].filter(
      (id) => id !== targetId && !confusable.includes(id as PatternId),
    );
    distractorIds = [...shuffle(confusable, rng), ...shuffle(rest, rng)].slice(0, 3);
  }

  const options: Choice[] = shuffle([targetId, ...distractorIds], rng).map((id) => ({ id, label: labelFor(id) }));
  const continuation = synthesizeContinuation(sample, targetId, rng, 15);

  return { targetId, sample, huntSpec, options, continuation };
}

export interface RunTally {
  hunt: { correct: number; total: number };
  name: { correct: number; total: number };
  call: { correct: number; total: number };
}

export function emptyTally(): RunTally {
  return { hunt: { correct: 0, total: 0 }, name: { correct: 0, total: 0 }, call: { correct: 0, total: 0 } };
}
