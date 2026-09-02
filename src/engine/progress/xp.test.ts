import { describe, expect, it } from 'vitest';
import { levelForXp } from './xp';
import { LEVEL_THRESHOLDS } from '@/lib/constants';

describe('levelForXp', () => {
  it('starts at level 1 with no XP', () => {
    const info = levelForXp(0);
    expect(info.level).toBe(1);
    expect(info.progress).toBe(0);
  });

  it('lands exactly on each threshold', () => {
    LEVEL_THRESHOLDS.forEach((threshold, i) => {
      expect(levelForXp(threshold).level).toBe(i + 1);
    });
  });

  it('reports progress through the current level', () => {
    const info = levelForXp(50); // half way from 0 to 100
    expect(info.level).toBe(1);
    expect(info.progress).toBeCloseTo(0.5);
    expect(info.xpToNext).toBe(50);
  });

  it('caps at the top rank without overflowing', () => {
    const info = levelForXp(999_999);
    expect(info.level).toBe(LEVEL_THRESHOLDS.length);
    expect(info.progress).toBe(1);
    expect(info.xpToNext).toBeNull();
  });

  it('survives nonsense input rather than rendering NaN', () => {
    expect(levelForXp(Number.NaN).level).toBe(1);
    expect(levelForXp(-500).level).toBe(1);
    expect(Number.isFinite(levelForXp(Number.NaN).progress)).toBe(true);
  });
});
