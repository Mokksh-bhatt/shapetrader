/**
 * Deterministic PRNG (mulberry32). Every generated chart in the app comes from
 * here — never Math.random() — so a question that looks wrong in rehearsal can
 * be reproduced exactly by replaying its seed.
 */
export interface Rng {
  next(): number; // [0, 1)
  range(min: number, max: number): number;
  int(min: number, max: number): number; // inclusive
  gauss(): number; // ~N(0, 1)
  pick<T>(items: readonly T[]): T;
  bool(probability?: number): boolean;
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0 || 1;

  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const range = (min: number, max: number) => min + next() * (max - min);

  return {
    next,
    range,
    int: (min, max) => Math.floor(range(min, max + 1)),
    // Box–Muller, clamped so a freak tail can't produce an absurd candle.
    gauss: () => {
      const u = Math.max(next(), 1e-9);
      const v = next();
      const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      return Math.max(-3, Math.min(3, g));
    },
    pick: <T,>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    bool: (probability = 0.5) => next() < probability,
  };
}

/** Stable seed from a string, so "question 3 of the patterns quiz" is the same
 *  question every time until the learner asks for a new one. */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
