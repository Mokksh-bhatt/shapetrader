import { describe, expect, it } from 'vitest';
import { synthesizeShape } from './shapeSynth';
import { classify, getMetrics } from '@/engine/candles/candleClassifier';
import { SHAPES } from '@/data/candlestickShapes/shapes';

/**
 * The quiz must never show a "hammer" that isn't one. Every synthesised sample
 * has to satisfy the same classifier the lessons quote.
 */
describe('synthesizeShape', () => {
  SHAPES.forEach((shape) => {
    it(`always produces a recognisable ${shape.name}`, () => {
      for (let seed = 1; seed <= 40; seed += 1) {
        const sample = synthesizeShape(shape.id, seed);
        const tail = sample.candles.slice(-2);
        expect(classify(tail), `seed ${seed}`).toBe(shape.id);
      }
    });
  });

  it('produces valid OHLC on every candle', () => {
    SHAPES.forEach((shape) => {
      const { candles } = synthesizeShape(shape.id, 99);
      candles.forEach((c) => {
        expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close));
        expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close));
        expect(Number.isFinite(c.open + c.high + c.low + c.close)).toBe(true);
      });
    });
  });

  it('marks the shape candles at the end of the window', () => {
    const single = synthesizeShape('doji', 7);
    expect(single.focusStart).toBe(single.focusEnd);
    expect(single.focusEnd).toBe(single.candles.length - 1);

    const pair = synthesizeShape('bullishEngulfing', 7);
    expect(pair.focusEnd - pair.focusStart).toBe(1);
  });

  it('leads into reversal shapes with the trend that gives them meaning', () => {
    // A hammer only signals a reversal after a decline, so the lead-in must fall.
    const { candles, focusStart } = synthesizeShape('hammer', 11, { leadIn: 14 });
    const lead = candles.slice(0, focusStart);
    expect(lead[lead.length - 1].close).toBeLessThan(lead[0].close);
  });
});

describe('candle metrics', () => {
  it('splits a candle into body and wicks that sum to its range', () => {
    const m = getMetrics({ time: '2024-01-01', open: 100, high: 110, low: 95, close: 105 });
    expect(m.range).toBeCloseTo(15);
    expect(m.body).toBeCloseTo(5);
    expect(m.upperWick).toBeCloseTo(5);
    expect(m.lowerWick).toBeCloseTo(5);
    expect(m.body + m.upperWick + m.lowerWick).toBeCloseTo(m.range);
    expect(m.isUp).toBe(true);
  });

  it('never divides by zero on a flat candle', () => {
    const m = getMetrics({ time: '2024-01-01', open: 50, high: 50, low: 50, close: 50 });
    expect(Number.isFinite(m.bodyRatio)).toBe(true);
  });
});
