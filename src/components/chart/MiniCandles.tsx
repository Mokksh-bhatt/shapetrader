import { useMemo } from 'react';
import type { Candle } from '@/engine/candles/types';

/**
 * A tiny hand-rolled SVG candle strip. Used for thumbnails and decoration —
 * the heavyweight chart library is reserved for charts the learner interacts
 * with, so a card full of thumbnails stays cheap.
 */
export function MiniCandles({
  candles,
  width = 320,
  height = 72,
  className,
  highlightFrom,
}: {
  candles: Candle[];
  width?: number;
  height?: number;
  className?: string;
  /** Index from which candles are drawn in the accent colour. */
  highlightFrom?: number;
}) {
  const view = useMemo(() => {
    if (candles.length === 0) return null;
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    const span = Math.max(max - min, 1e-6);
    const pad = 4;
    const usableH = height - pad * 2;
    const slot = width / candles.length;
    const bodyW = Math.max(Math.min(slot * 0.62, 10), 1.5);

    const y = (price: number) => pad + ((max - price) / span) * usableH;

    return { y, slot, bodyW };
  }, [candles, width, height]);

  if (!view) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      {candles.map((c, i) => {
        const x = view.slot * (i + 0.5);
        const up = c.close >= c.open;
        const accented = highlightFrom !== undefined && i >= highlightFrom;
        const color = accented
          ? 'var(--color-gold)'
          : up
            ? 'var(--color-bull)'
            : 'var(--color-bear)';
        const top = view.y(Math.max(c.open, c.close));
        const bottom = view.y(Math.min(c.open, c.close));
        return (
          <g key={c.time} opacity={accented ? 1 : 0.9}>
            <line x1={x} x2={x} y1={view.y(c.high)} y2={view.y(c.low)} stroke={color} strokeWidth={1} />
            <rect
              x={x - view.bodyW / 2}
              y={top}
              width={view.bodyW}
              height={Math.max(bottom - top, 1)}
              fill={color}
              rx={0.5}
            />
          </g>
        );
      })}
    </svg>
  );
}
