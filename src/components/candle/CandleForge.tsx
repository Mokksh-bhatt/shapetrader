import { useCallback, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '@/lib/cn';

/**
 * The candle the learner is physically building, in an abstract 0-100 "price"
 * unit — the classifier only cares about ratios, so there is no need for real
 * dollar figures here.
 */
export interface ForgeCandleValue {
  open: number;
  high: number;
  low: number;
  close: number;
}

export const FORGE_DOMAIN = { min: 0, max: 100 } as const;

type HandleKey = 'open' | 'high' | 'low' | 'close';

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Keeps a candle physically valid after one handle moves. Body handles (open,
 * close) are held inside the current wicks — so growing a wick means dragging
 * the wick handle, not just yanking the body past it — unless `constrainBody`
 * is off, which the two-candle shapes use since their wicks are cosmetic and
 * recomputed by the caller after every change.
 */
export function normalizeForgeValue(
  v: ForgeCandleValue,
  moved: HandleKey,
  constrainBody = true,
): ForgeCandleValue {
  const next = { ...v };
  if (moved === 'open' || moved === 'close') {
    next[moved] = constrainBody
      ? clamp(next[moved], next.low, next.high)
      : clamp(next[moved], FORGE_DOMAIN.min, FORGE_DOMAIN.max);
  } else if (moved === 'high') {
    next.high = Math.max(clamp(next.high, FORGE_DOMAIN.min, FORGE_DOMAIN.max), next.open, next.close);
  } else if (moved === 'low') {
    next.low = Math.min(clamp(next.low, FORGE_DOMAIN.min, FORGE_DOMAIN.max), next.open, next.close);
  }
  return next;
}

interface CandleForgeProps {
  value: ForgeCandleValue;
  onChange: (next: ForgeCandleValue) => void;
  /** A second, fixed candle drawn just before it — for the two-candle shapes. */
  context?: ForgeCandleValue;
  /** Which handles are draggable. Two-candle shapes only expose open/close —
   *  the wick on that candle doesn't affect classification. */
  handles?: HandleKey[];
  width?: number;
  height?: number;
  className?: string;
}

const PAD_Y = 30;
const BODY_HALF_W = 20;

export function CandleForge({
  value,
  onChange,
  context,
  handles = ['open', 'high', 'low', 'close'],
  width = 260,
  height = 300,
  className,
}: CandleForgeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const usableH = height - PAD_Y * 2;
  const constrainBody = handles.includes('high') && handles.includes('low');

  const priceToY = useCallback(
    (p: number) => PAD_Y + ((FORGE_DOMAIN.max - p) / (FORGE_DOMAIN.max - FORGE_DOMAIN.min)) * usableH,
    [usableH],
  );
  const yToPrice = useCallback(
    (y: number) =>
      FORGE_DOMAIN.max - ((y - PAD_Y) / usableH) * (FORGE_DOMAIN.max - FORGE_DOMAIN.min),
    [usableH],
  );

  const dragTo = useCallback(
    (key: HandleKey, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const pt = svg.createSVGPoint();
      pt.x = 0;
      pt.y = clientY;
      const local = pt.matrixTransform(ctm.inverse());
      const price = Math.round(clamp(yToPrice(local.y), FORGE_DOMAIN.min, FORGE_DOMAIN.max));
      onChange(normalizeForgeValue({ ...value, [key]: price }, key, constrainBody));
    },
    [value, onChange, yToPrice, constrainBody],
  );

  const nudge = useCallback(
    (key: HandleKey, delta: number) => {
      onChange(
        normalizeForgeValue(
          { ...value, [key]: clamp(value[key] + delta, FORGE_DOMAIN.min, FORGE_DOMAIN.max) },
          key,
          constrainBody,
        ),
      );
    },
    [value, onChange, constrainBody],
  );

  const targetCx = context ? width * 0.66 : width * 0.5;
  const contextCx = width * 0.3;

  return (
    <div className={cn('select-none', className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="group"
        aria-label="Candle forge — drag the handles to reshape the candle"
      >
        {context ? (
          <StaticCandle cx={contextCx} value={context} priceToY={priceToY} faded label="Candle 1 (fixed)" />
        ) : null}
        <StaticCandle cx={targetCx} value={value} priceToY={priceToY} label={context ? 'Candle 2' : undefined} />

        {handles.includes('high') ? (
          <Handle
            label="High"
            letter="H"
            cx={targetCx}
            y={priceToY(value.high)}
            price={value.high}
            color="var(--color-ink-muted)"
            onDrag={(clientY) => dragTo('high', clientY)}
            onNudge={(d) => nudge('high', d)}
          />
        ) : null}
        {handles.includes('low') ? (
          <Handle
            label="Low"
            letter="L"
            cx={targetCx}
            y={priceToY(value.low)}
            price={value.low}
            color="var(--color-ink-muted)"
            onDrag={(clientY) => dragTo('low', clientY)}
            onNudge={(d) => nudge('low', d)}
          />
        ) : null}
        {handles.includes('open') ? (
          <Handle
            label="Open"
            letter="O"
            cx={targetCx - BODY_HALF_W - 16}
            y={priceToY(value.open)}
            price={value.open}
            color="var(--color-brand)"
            onDrag={(clientY) => dragTo('open', clientY)}
            onNudge={(d) => nudge('open', d)}
          />
        ) : null}
        {handles.includes('close') ? (
          <Handle
            label="Close"
            letter="C"
            cx={targetCx + BODY_HALF_W + 16}
            y={priceToY(value.close)}
            price={value.close}
            color="var(--color-brand)"
            onDrag={(clientY) => dragTo('close', clientY)}
            onNudge={(d) => nudge('close', d)}
          />
        ) : null}
      </svg>
      <p className="mt-1.5 text-center text-[10.5px] text-ink-dim">
        drag a dot, or tab to it and use the arrow keys
      </p>
    </div>
  );
}

function StaticCandle({
  cx,
  value,
  priceToY,
  faded,
  label,
}: {
  cx: number;
  value: ForgeCandleValue;
  priceToY: (p: number) => number;
  faded?: boolean;
  label?: string;
}) {
  const up = value.close >= value.open;
  const color = up ? 'var(--color-bull)' : 'var(--color-bear)';
  const top = priceToY(Math.max(value.open, value.close));
  const bottom = priceToY(Math.min(value.open, value.close));
  return (
    <g opacity={faded ? 0.45 : 1}>
      <line x1={cx} x2={cx} y1={priceToY(value.high)} y2={priceToY(value.low)} stroke={color} strokeWidth={2.5} />
      <rect
        x={cx - BODY_HALF_W}
        y={top}
        width={BODY_HALF_W * 2}
        height={Math.max(bottom - top, 1.5)}
        rx={2.5}
        fill={color}
      />
      {label ? (
        <text x={cx} y={priceToY(value.low) + 18} textAnchor="middle" fontSize={10} fill="var(--color-ink-dim)">
          {label}
        </text>
      ) : null}
    </g>
  );
}

function Handle({
  cx,
  y,
  price,
  label,
  letter,
  color,
  onDrag,
  onNudge,
}: {
  cx: number;
  y: number;
  price: number;
  label: string;
  letter: string;
  color: string;
  onDrag: (clientY: number) => void;
  onNudge: (delta: number) => void;
}) {
  const handlePointerDown = (e: PointerEvent<SVGGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    onDrag(e.clientY);
  };
  const handlePointerMove = (e: PointerEvent<SVGGElement>) => {
    if (e.buttons !== 1) return;
    onDrag(e.clientY);
  };
  const handleKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      onNudge(e.shiftKey ? 5 : 1);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      onNudge(e.shiftKey ? -5 : -1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onNudge(-100);
    } else if (e.key === 'End') {
      e.preventDefault();
      onNudge(100);
    }
  };

  return (
    <g
      tabIndex={0}
      role="slider"
      aria-label={label}
      aria-valuenow={Math.round(price)}
      aria-valuemin={FORGE_DOMAIN.min}
      aria-valuemax={FORGE_DOMAIN.max}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onKeyDown={handleKeyDown}
      className="cursor-ns-resize outline-none focus-visible:[&>circle:first-child]:stroke-[3]"
    >
      <circle cx={cx} cy={y} r={9} fill="var(--color-surface)" stroke={color} strokeWidth={2} />
      <text
        x={cx}
        y={y + 3.2}
        textAnchor="middle"
        fontSize={9}
        fontWeight={700}
        fill={color}
        className="pointer-events-none"
      >
        {letter}
      </text>
    </g>
  );
}
