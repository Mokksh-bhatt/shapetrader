import type { Candle } from '@/engine/candles/types';
import { candlesFromCloses, makeDates, type Interval } from './pathBuilder';
import { createRng, type Rng } from './seededRng';

export interface RandomWalkOptions {
  count?: number;
  startPrice?: number;
  /** Expected drift per bar, as a fraction (0.001 = +0.1% a bar). */
  drift?: number;
  /** Standard deviation of the per-bar return. */
  volatility?: number;
  startDate?: string;
  interval?: Interval;
}

/**
 * Geometric random walk — the neutral, pattern-free market used for practice
 * charts and for the "no pattern here" answers in the pattern quiz. Trading
 * students need to see plenty of charts where the honest answer is "nothing
 * is forming yet".
 */
export function generateRandomWalk(seed: number | Rng, options: RandomWalkOptions = {}): Candle[] {
  const {
    count = 60,
    startPrice = 100,
    drift = 0.0005,
    volatility = 0.014,
    startDate = '2023-01-02',
    interval = 'daily',
  } = options;

  const rng = typeof seed === 'number' ? createRng(seed) : seed;
  const closes: number[] = [];
  let price = startPrice;
  for (let i = 0; i < count; i += 1) {
    price = Math.max(price * (1 + drift + rng.gauss() * volatility), 1);
    closes.push(price);
  }

  return candlesFromCloses(closes, makeDates(startDate, count, interval), rng, {
    volatility,
  });
}
