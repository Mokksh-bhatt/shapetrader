import { useMemo, useState, type KeyboardEvent } from 'react';
import type { Candle } from '@/engine/candles/types';
import { cn } from '@/lib/cn';

interface InteractiveCandleChartProps {
  candles: Candle[];
  selectedIndex: number | null;
  /** Pass the answer index only once the round is won — this is what paints
   *  it gold. Kept null while the learner is still guessing. */
  correctIndex: number | null;
  wrongIndices: number[];
  onSelect: (index: number) => void;
  disabled?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * A dedicated SVG candle strip with real per-candle click targets —
 * lightweight-charts (PriceChart) doesn't expose that, and this stage lives
 * or dies on "click the candle you think it is."
 */
export function InteractiveCandleChart({
  candles,
  selectedIndex,
  correctIndex,
  wrongIndices,
  onSelect,
  disabled = false,
  width = 760,
  height = 260,
  className,
}: InteractiveCandleChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const view = useMemo(() => {
    if (candles.length === 0) return null;
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    const span = Math.max(max - min, 1e-6);
    const pad = 16;
    const usableH = height - pad * 2;
    const slot = width / candles.length;
    const bodyW = Math.max(Math.min(slot * 0.56, 22), 3);
    const y = (price: number) => pad + ((max - price) / span) * usableH;
    return { y, slot, bodyW };
  }, [candles, width, height]);

  if (!view || candles.length === 0) return null;

  const activeIndex = hovered ?? selectedIndex;
  const activeCandle = activeIndex !== null ? candles[activeIndex] : undefined;

  const focus = (i: number) => setHovered(i);
  const blur = (i: number) => setHovered((h) => (h === i ? null : h));

  return (
    <div className={cn('rounded-xl border border-line bg-surface p-3', className)}>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        height={height}
        role="group"
        aria-label="Chart — click the candle showing the target shape"
      >
        {candles.map((c, i) => {
          const x = view.slot * (i + 0.5);
          const up = c.close >= c.open;
          const isCorrectReveal = correctIndex === i;
          const isWrongPick = wrongIndices.includes(i);
          const isSelected = selectedIndex === i;
          const isHovered = hovered === i && !disabled;

          let color = up ? 'var(--color-bull)' : 'var(--color-bear)';
          if (isCorrectReveal) color = 'var(--color-gold)';

          const top = view.y(Math.max(c.open, c.close));
          const bottom = view.y(Math.min(c.open, c.close));

          const handleKeyDown = (e: KeyboardEvent<SVGGElement>) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(i);
            }
          };

          return (
            <g
              key={c.time}
              tabIndex={disabled ? -1 : 0}
              role="button"
              aria-label={`Candle ${i + 1} of ${candles.length}: open ${c.open}, high ${c.high}, low ${c.low}, close ${c.close}`}
              onMouseEnter={() => focus(i)}
              onMouseLeave={() => blur(i)}
              onFocus={() => focus(i)}
              onBlur={() => blur(i)}
              onClick={() => !disabled && onSelect(i)}
              onKeyDown={handleKeyDown}
              className={cn('outline-none', !disabled && 'cursor-pointer')}
              opacity={isWrongPick ? 0.5 : 1}
            >
              {/* generous invisible hit target — the body itself can be a few px wide */}
              <rect x={x - view.slot / 2} y={0} width={view.slot} height={height} fill="transparent" />
              {isHovered || isSelected || isCorrectReveal ? (
                <rect
                  x={x - view.slot / 2 + 1}
                  y={2}
                  width={Math.max(view.slot - 2, 1)}
                  height={height - 4}
                  rx={4}
                  fill={isCorrectReveal ? 'var(--color-gold)' : 'var(--color-brand)'}
                  opacity={0.12}
                />
              ) : null}
              <line x1={x} x2={x} y1={view.y(c.high)} y2={view.y(c.low)} stroke={color} strokeWidth={1.4} />
              <rect
                x={x - view.bodyW / 2}
                y={top}
                width={view.bodyW}
                height={Math.max(bottom - top, 1.5)}
                fill={color}
                rx={1}
              />
              {isWrongPick ? (
                <text x={x} y={height - 4} textAnchor="middle" fontSize={11} fill="var(--color-bear)">
                  ×
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-ink-dim">
        <span>Click the candle — or tab to it and press Enter.</span>
        {activeCandle ? (
          <span className="tnum flex gap-2">
            <span>O {activeCandle.open.toFixed(2)}</span>
            <span>H {activeCandle.high.toFixed(2)}</span>
            <span>L {activeCandle.low.toFixed(2)}</span>
            <span className={activeCandle.close >= activeCandle.open ? 'text-bull' : 'text-bear'}>
              C {activeCandle.close.toFixed(2)}
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
