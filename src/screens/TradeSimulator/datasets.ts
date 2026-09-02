import { buildSeries } from '@/data/generator/pathBuilder';
import { createRng } from '@/data/generator/seededRng';
import type { Candle } from '@/engine/candles/types';

export interface SimDataset {
  id: string;
  label: string;
  description: string;
  candles: Candle[];
}

/**
 * Four fixed, seeded scenarios built with the same anchor-path engine that
 * powers the chart-pattern screens. Not imported from the case-study
 * library — this module owns its own practice data — but generated the same
 * way, so a demo run looks identical every time it's rehearsed.
 */
function buildDatasets(): SimDataset[] {
  const count = 110;
  const startDate = '2024-01-02';

  return [
    {
      id: 'steady-uptrend',
      label: 'Steady uptrend',
      description: 'A grinding trend with shallow pullbacks — the friendliest tape for practising size and a trailing stop.',
      candles: buildSeries({
        anchors: [
          { x: 0, y: 100 },
          { x: 0.3, y: 114 },
          { x: 0.55, y: 109 },
          { x: 1, y: 148 },
        ],
        count,
        startDate,
        interval: 'daily',
        rng: createRng(90210),
        noise: 0.01,
        candleOptions: { volatility: 0.01 },
      }),
    },
    {
      id: 'choppy-range',
      label: 'Choppy range',
      description: 'Bounded between support and resistance with no clean trend — good practice for not forcing a trade.',
      candles: buildSeries({
        anchors: [
          { x: 0, y: 100 },
          { x: 0.22, y: 113 },
          { x: 0.45, y: 95 },
          { x: 0.68, y: 111 },
          { x: 0.85, y: 96 },
          { x: 1, y: 105 },
        ],
        count,
        startDate,
        interval: 'daily',
        rng: createRng(4471),
        noise: 0.014,
        candleOptions: { volatility: 0.013 },
      }),
    },
    {
      id: 'selloff-bounce',
      label: 'Sharp selloff and bounce',
      description: 'A fast drawdown followed by a recovery leg — the scenario where a stop loss earns its keep.',
      candles: buildSeries({
        anchors: [
          { x: 0, y: 132 },
          { x: 0.35, y: 128 },
          { x: 0.55, y: 76 },
          { x: 0.68, y: 68 },
          { x: 1, y: 99 },
        ],
        count,
        startDate,
        interval: 'daily',
        rng: createRng(55813),
        noise: 0.016,
        sharpness: 2.2,
        candleOptions: { volatility: 0.02, gap: 0.006 },
      }),
    },
    {
      id: 'volatile-breakout',
      label: 'Volatile breakout',
      description: 'A tight range that snaps into a wide, fast trend — where correct sizing matters most.',
      candles: buildSeries({
        anchors: [
          { x: 0, y: 90 },
          { x: 0.45, y: 95 },
          { x: 0.6, y: 92 },
          { x: 0.72, y: 119 },
          { x: 1, y: 154 },
        ],
        count,
        startDate,
        interval: 'daily',
        rng: createRng(781234),
        noise: 0.018,
        sharpness: 1.6,
        candleOptions: { volatility: 0.022 },
      }),
    },
  ];
}

export const SIM_DATASETS: SimDataset[] = buildDatasets();

export function findDataset(id: string | null): SimDataset | undefined {
  return SIM_DATASETS.find((d) => d.id === id);
}
