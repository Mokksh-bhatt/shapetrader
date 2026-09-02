import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import type { Candle } from '@/engine/candles/types';
import type { Annotation } from '@/engine/annotations/types';
import { PatternAnnotationOverlay, type CoordinateMapper } from '@/components/chart/PatternAnnotationOverlay';
import { cn } from '@/lib/cn';

export type MarkerTone = 'bull' | 'bear' | 'gold' | 'brand' | 'neutral';

export interface HuntMarker {
  index: number;
  price: number;
  tone: MarkerTone;
  label?: string;
  /** ring = a landmark being pointed at; x = a wrong pick. */
  kind?: 'ring' | 'x';
}

const MARKER_COLOR: Record<MarkerTone, string> = {
  bull: 'var(--color-bull)',
  bear: 'var(--color-bear)',
  gold: 'var(--color-gold)',
  brand: 'var(--color-brand)',
  neutral: 'var(--color-ink-dim)',
};

interface Geometry {
  xAt: (index: number) => number;
  yAt: (price: number) => number;
  colWidth: number;
  bodyW: number;
}

/**
 * The Shape Hunt chart. lightweight-charts (used everywhere else) doesn't
 * expose per-candle clicks, so this is a small hand-rolled SVG candle strip
 * — MiniCandles' cousin, scaled up with hover/click/keyboard selection and
 * the same annotation overlay the real chart uses (reused as-is, just fed a
 * coordinate mapper for this chart's own pixel space instead of a lightweight
 * chart's time scale).
 */
export function HuntChart({
  candles,
  totalSlots,
  height = 360,
  className,
  annotations = [],
  dividerIndex,
  markers = [],
  interactive = false,
  focusedIndex = null,
  onFocusChange,
  onSelect,
  newFrom,
}: {
  candles: Candle[];
  /** Column width is computed against this many slots, not candles.length —
   *  keeps bars a stable width while stage 3 grows the array in front of you. */
  totalSlots?: number;
  height?: number;
  className?: string;
  annotations?: Annotation[];
  /** Draws a "today" divider immediately before this candle index. */
  dividerIndex?: number;
  markers?: HuntMarker[];
  interactive?: boolean;
  focusedIndex?: number | null;
  onFocusChange?: (index: number) => void;
  onSelect?: (index: number) => void;
  /** Candles from this index onward get an entrance animation. */
  newFrom?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setSize({ width: el.clientWidth, height: el.clientHeight });
    // jsdom (unit tests) has no ResizeObserver — degrade to a one-off
    // measurement rather than crash; real browsers always have it.
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const slots = Math.max(totalSlots ?? candles.length, 1);

  const geometry: Geometry | null = useMemo(() => {
    if (candles.length === 0 || size.width <= 0 || size.height <= 0) return null;
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    const span = Math.max(max - min, 1e-6);
    const padTop = 18;
    const padBottom = 10;
    const usableH = Math.max(size.height - padTop - padBottom, 1);
    const colWidth = size.width / slots;
    const bodyW = Math.max(Math.min(colWidth * 0.62, 12), 1.5);

    return {
      xAt: (index: number) => colWidth * (index + 0.5),
      yAt: (price: number) => padTop + ((max - price) / span) * usableH,
      colWidth,
      bodyW,
    };
  }, [candles, size, slots]);

  const indexFromClientX = useCallback(
    (clientX: number): number | null => {
      const el = containerRef.current;
      if (!el || !geometry || candles.length === 0) return null;
      const rect = el.getBoundingClientRect();
      const raw = Math.floor((clientX - rect.left) / geometry.colWidth);
      if (!Number.isFinite(raw)) return null;
      return Math.min(Math.max(raw, 0), candles.length - 1);
    },
    [geometry, candles.length],
  );

  const handleClick = (e: MouseEvent) => {
    if (!interactive || !onSelect) return;
    const index = indexFromClientX(e.clientX);
    if (index !== null) onSelect(index);
  };

  const handleMove = (e: MouseEvent) => {
    if (!interactive || !onFocusChange) return;
    const index = indexFromClientX(e.clientX);
    if (index !== null) onFocusChange(index);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!interactive) return;
    const current = focusedIndex ?? Math.floor(candles.length / 2);
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onFocusChange?.(Math.max(0, current - 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onFocusChange?.(Math.min(candles.length - 1, current + 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focusedIndex !== null && focusedIndex !== undefined) onSelect?.(focusedIndex);
    }
  };

  const mapper: CoordinateMapper = useMemo(
    () => ({
      width: size.width,
      height: size.height,
      x: (index: number) => (geometry ? geometry.xAt(index) : null),
      y: (price: number) => (geometry ? geometry.yAt(price) : null),
    }),
    [geometry, size],
  );

  const dividerX = geometry && dividerIndex !== undefined ? geometry.xAt(dividerIndex) - geometry.colWidth / 2 : null;
  const focusX = geometry && interactive && focusedIndex !== null && focusedIndex !== undefined
    ? geometry.xAt(focusedIndex)
    : null;

  return (
    <div
      ref={containerRef}
      role={interactive ? 'application' : 'img'}
      aria-label={interactive ? 'Chart — click or use the arrow keys and Enter to pick a candle' : 'Price chart'}
      tabIndex={interactive ? 0 : undefined}
      onClick={handleClick}
      onMouseMove={handleMove}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative overflow-hidden rounded-xl border border-line bg-surface',
        interactive && 'cursor-crosshair focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
        className,
      )}
      style={{ height }}
    >
      {geometry ? (
        <svg width={size.width} height={size.height} className="absolute inset-0">
          {focusX !== null ? (
            <line
              x1={focusX}
              x2={focusX}
              y1={0}
              y2={size.height}
              stroke="var(--color-line-strong)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          ) : null}

          {dividerX !== null ? (
            <line
              x1={dividerX}
              x2={dividerX}
              y1={0}
              y2={size.height}
              stroke="var(--color-gold)"
              strokeOpacity={0.5}
              strokeWidth={1.25}
              strokeDasharray="2 4"
            />
          ) : null}

          {candles.map((c, i) => {
            const up = c.close >= c.open;
            const color = up ? 'var(--color-bull)' : 'var(--color-bear)';
            const x = geometry.xAt(i);
            const top = geometry.yAt(Math.max(c.open, c.close));
            const bottom = geometry.yAt(Math.min(c.open, c.close));
            const isNew = newFrom !== undefined && i >= newFrom;
            return (
              <motion.g
                key={c.time}
                initial={isNew ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <line x1={x} x2={x} y1={geometry.yAt(c.high)} y2={geometry.yAt(c.low)} stroke={color} strokeWidth={1} />
                <rect
                  x={x - geometry.bodyW / 2}
                  y={top}
                  width={geometry.bodyW}
                  height={Math.max(bottom - top, 1)}
                  fill={color}
                  rx={0.5}
                />
              </motion.g>
            );
          })}
        </svg>
      ) : null}

      <PatternAnnotationOverlay annotations={annotations} map={mapper} />

      {geometry ? (
        <svg width={size.width} height={size.height} className="pointer-events-none absolute inset-0">
          {markers.map((m, i) => {
            const x = geometry.xAt(m.index);
            const y = geometry.yAt(m.price);
            const color = MARKER_COLOR[m.tone];
            return (
              <g key={`${m.index}-${m.tone}-${i}`}>
                {m.kind === 'x' ? (
                  <>
                    <line x1={x - 6} x2={x + 6} y1={y - 6} y2={y + 6} stroke={color} strokeWidth={2} strokeLinecap="round" />
                    <line x1={x - 6} x2={x + 6} y1={y + 6} y2={y - 6} stroke={color} strokeWidth={2} strokeLinecap="round" />
                  </>
                ) : (
                  <circle cx={x} cy={y} r={7} fill="none" stroke={color} strokeWidth={2} />
                )}
              </g>
            );
          })}
        </svg>
      ) : null}
    </div>
  );
}
