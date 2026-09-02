import { LEVEL_THRESHOLDS, LEVEL_TITLES } from '@/lib/constants';

export interface LevelInfo {
  level: number; // 1-based
  title: string;
  maxLevel: number;
  xpIntoLevel: number;
  xpForLevel: number; // span of the current level, 0 when maxed
  progress: number; // 0..1
  xpToNext: number | null; // null at max level
}

export function levelForXp(xpRaw: number): LevelInfo {
  const xp = Number.isFinite(xpRaw) ? Math.max(0, xpRaw) : 0;
  const maxLevel = LEVEL_THRESHOLDS.length;

  let index = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i += 1) {
    if (xp >= LEVEL_THRESHOLDS[i]) index = i;
  }

  const floor = LEVEL_THRESHOLDS[index];
  const ceiling = LEVEL_THRESHOLDS[index + 1];
  const atMax = ceiling === undefined;

  return {
    level: index + 1,
    title: LEVEL_TITLES[index] ?? LEVEL_TITLES[LEVEL_TITLES.length - 1],
    maxLevel,
    xpIntoLevel: xp - floor,
    xpForLevel: atMax ? 0 : ceiling - floor,
    progress: atMax ? 1 : (xp - floor) / Math.max(ceiling - floor, 1),
    xpToNext: atMax ? null : ceiling - xp,
  };
}
