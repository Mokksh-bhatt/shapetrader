import { useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

/**
 * The single most important diagram in the app: what the four numbers behind a
 * candle actually are. Hand-rolled SVG rather than the chart library, because
 * this needs precise labels and leader lines, not panning and zooming.
 */
export function CandleAnatomyDiagram() {
  const [bullish, setBullish] = useState(true);
  const color = bullish ? 'var(--color-bull)' : 'var(--color-bear)';

  // Fixed pixel geometry — one candle, drawn large.
  const cx = 176;
  const bodyW = 54;
  const yHigh = 34;
  const yBodyTop = 96;
  const yBodyBottom = 214;
  const yLow = 272;

  const topLabel = bullish ? 'Close' : 'Open';
  const bottomLabel = bullish ? 'Open' : 'Close';

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Anatomy of a candle</h2>
          <p className="mt-1 max-w-md text-[13px] leading-relaxed text-ink-muted">
            One candle summarises a whole trading period in four numbers. The thick body spans the
            open and the close. The thin wicks show the extremes price reached but could not hold.
          </p>
        </div>

        <button
          onClick={() => setBullish((b) => !b)}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-medium transition',
            bullish
              ? 'border-bull/40 bg-bull/12 text-bull'
              : 'border-bear/40 bg-bear/12 text-bear',
          )}
        >
          {bullish ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
          {bullish ? 'Up candle (close above open)' : 'Down candle (close below open)'}
          <span className="text-ink-dim">· tap to flip</span>
        </button>
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
        <svg viewBox="0 0 420 300" className="w-full" role="img" aria-label="Labelled candlestick diagram">
          {/* measurement brackets */}
          <Bracket x={112} y1={yHigh} y2={yBodyTop} label="Upper wick" />
          <Bracket x={112} y1={yBodyTop} y2={yBodyBottom} label="Body" strong />
          <Bracket x={112} y1={yBodyBottom} y2={yLow} label="Lower wick" />

          {/* the candle */}
          <line x1={cx} x2={cx} y1={yHigh} y2={yLow} stroke={color} strokeWidth={3} />
          <rect
            x={cx - bodyW / 2}
            y={yBodyTop}
            width={bodyW}
            height={yBodyBottom - yBodyTop}
            rx={3}
            fill={color}
          />

          {/* price labels */}
          <PriceLabel x={cx + bodyW / 2} y={yHigh} text="High" sub="highest price traded" />
          <PriceLabel x={cx + bodyW / 2} y={yBodyTop} text={topLabel} sub={bullish ? 'ended here' : 'started here'} />
          <PriceLabel x={cx + bodyW / 2} y={yBodyBottom} text={bottomLabel} sub={bullish ? 'started here' : 'ended here'} />
          <PriceLabel x={cx + bodyW / 2} y={yLow} text="Low" sub="lowest price traded" />
        </svg>

        <ul className="space-y-2.5 text-[13px] leading-relaxed text-ink-muted">
          <li className="flex gap-2.5">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
            <span>
              <strong className="text-ink">Colour is direction.</strong> Green means the close was
              above the open, red means below. It says nothing about whether the price is high — only
              which way it moved during the period.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
            <span>
              <strong className="text-ink">Body size is conviction.</strong> A long body means one
              side dominated from start to finish. A tiny body means the period ended in a draw.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
            <span>
              <strong className="text-ink">Wicks are rejection.</strong> A long wick marks a price
              the market tried and refused. That is usually the most informative part of the candle.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" />
            <span>
              <strong className="text-ink">One candle is never enough.</strong> The same shape means
              opposite things at the top of a rally and the bottom of a selloff. Context first,
              shape second.
            </span>
          </li>
        </ul>
      </div>
    </Card>
  );
}

function Bracket({
  x,
  y1,
  y2,
  label,
  strong,
}: {
  x: number;
  y1: number;
  y2: number;
  label: string;
  strong?: boolean;
}) {
  const stroke = strong ? 'var(--color-ink-muted)' : 'var(--color-line-strong)';
  return (
    <g>
      <line x1={x} x2={x} y1={y1} y2={y2} stroke={stroke} strokeWidth={1.25} />
      <line x1={x} x2={x + 8} y1={y1} y2={y1} stroke={stroke} strokeWidth={1.25} />
      <line x1={x} x2={x + 8} y1={y2} y2={y2} stroke={stroke} strokeWidth={1.25} />
      <text
        x={x - 8}
        y={(y1 + y2) / 2 + 4}
        textAnchor="end"
        fontSize={11.5}
        fill={strong ? 'var(--color-ink)' : 'var(--color-ink-muted)'}
        fontWeight={strong ? 600 : 500}
      >
        {label}
      </text>
    </g>
  );
}

function PriceLabel({ x, y, text, sub }: { x: number; y: number; text: string; sub: string }) {
  return (
    <g>
      <line
        x1={x}
        x2={x + 34}
        y1={y}
        y2={y}
        stroke="var(--color-line-strong)"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <circle cx={x + 34} cy={y} r={2.5} fill="var(--color-ink-muted)" />
      <text x={x + 44} y={y - 2} fontSize={12} fontWeight={600} fill="var(--color-ink)">
        {text}
      </text>
      <text x={x + 44} y={y + 12} fontSize={10.5} fill="var(--color-ink-dim)">
        {sub}
      </text>
    </g>
  );
}
