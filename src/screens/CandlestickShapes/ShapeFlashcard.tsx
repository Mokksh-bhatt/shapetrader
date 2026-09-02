import { useMemo } from 'react';
import { ArrowDown, ArrowUp, Check, Minus } from 'lucide-react';
import { Card, Pill } from '@/components/ui/Card';
import { MiniCandles } from '@/components/chart/MiniCandles';
import { synthesizeShape } from '@/data/generator/shapeSynth';
import { hashSeed } from '@/data/generator/seededRng';
import type { ShapeDefinition } from '@/data/candlestickShapes/shapes';

export function ShapeFlashcard({ shape, mastered }: { shape: ShapeDefinition; mastered: boolean }) {
  // Seeded from the shape's own id, so this card looks the same every visit.
  const sample = useMemo(
    () => synthesizeShape(shape.id, hashSeed(`card-${shape.id}`), { leadIn: 7 }),
    [shape.id],
  );

  const tone = shape.sentiment === 'bullish' ? 'bull' : shape.sentiment === 'bearish' ? 'bear' : 'neutral';
  const SentimentIcon = shape.sentiment === 'bullish' ? ArrowUp : shape.sentiment === 'bearish' ? ArrowDown : Minus;

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight">{shape.name}</h3>
          <p className="mt-1 text-[12.5px] leading-snug text-ink-muted">{shape.tagline}</p>
        </div>
        {mastered ? (
          <span
            className="grid size-6 shrink-0 place-items-center rounded-full border border-bull/40 bg-bull/12 text-bull"
            title="You have identified this one correctly"
          >
            <Check className="size-3.5" />
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Pill tone={tone}>
          <SentimentIcon className="size-3" />
          {shape.sentiment}
        </Pill>
        <Pill>{shape.candleCount === 1 ? '1 candle' : '2 candles'}</Pill>
        <Pill tone={shape.context === 'anywhere' ? 'neutral' : 'gold'}>{shape.context}</Pill>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-line bg-base/60 px-2 py-2">
        <MiniCandles
          candles={sample.candles}
          width={320}
          height={80}
          className="w-full"
          highlightFrom={sample.focusStart}
        />
        <p className="mt-1 text-center text-[10.5px] text-ink-dim">
          gold = the shape · grey-green/red = the trend before it
        </p>
      </div>

      <dl className="mt-4 space-y-3 text-[12.5px] leading-relaxed">
        <div>
          <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-dim">
            What to look for
          </dt>
          <dd className="mt-1 text-ink-muted">{shape.anatomy}</dd>
        </div>
        <div>
          <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-dim">
            Why it happens
          </dt>
          <dd className="mt-1 text-ink-muted">{shape.psychology}</dd>
        </div>
        <div>
          <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-dim">
            How traders use it
          </dt>
          <dd className="mt-1 border-l-2 border-line-strong pl-2.5 text-ink-dim">{shape.tradingNote}</dd>
        </div>
      </dl>
    </Card>
  );
}
