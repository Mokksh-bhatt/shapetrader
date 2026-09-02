import { useMemo, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, BookOpen, Check, Minus, Sparkles } from 'lucide-react';
import { Card, Pill } from '@/components/ui/Card';
import { MiniCandles } from '@/components/chart/MiniCandles';
import { SHAPES, type ShapeDefinition } from '@/data/candlestickShapes/shapes';
import { synthesizeShape } from '@/data/generator/shapeSynth';
import { hashSeed } from '@/data/generator/seededRng';
import {
  ANATOMY_LESSON_ID,
  missionOrder,
  nextRecommendedMission,
  summarizeMission,
  type MissionId,
  type MissionSummary,
} from './missionProgress';
import { cn } from '@/lib/cn';

const SENTIMENT_ICON = { bullish: ArrowUp, bearish: ArrowDown, neutral: Minus } as const;
const SENTIMENT_TONE = { bullish: 'bull', bearish: 'bear', neutral: 'neutral' } as const;

export function MissionMap({ lessonsRead, onOpen }: { lessonsRead: string[]; onOpen: (id: MissionId) => void }) {
  const order = missionOrder();
  const recommended = nextRecommendedMission(lessonsRead);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <AnatomyTile
        done={lessonsRead.includes(ANATOMY_LESSON_ID)}
        recommended={recommended === 'anatomy'}
        onOpen={() => onOpen('anatomy')}
      />
      {order
        .filter((id): id is Exclude<MissionId, 'anatomy'> => id !== 'anatomy')
        .map((id) => (
          <ShapeTile
            key={id}
            shape={findShape(id)}
            summary={summarizeMission(id, lessonsRead)}
            recommended={recommended === id}
            onOpen={() => onOpen(id)}
          />
        ))}
    </div>
  );
}

function findShape(id: Exclude<MissionId, 'anatomy'>): ShapeDefinition {
  // SHAPES is small (8 entries) — a find here is cheap and keeps this file
  // free of a second import of SHAPE_BY_ID just for typing convenience.
  return SHAPES.find((s) => s.id === id) as ShapeDefinition;
}

function TileShell({
  recommended,
  onOpen,
  children,
}: {
  recommended: boolean;
  onOpen: () => void;
  children: ReactNode;
}) {
  return (
    <button onClick={onOpen} className="block w-full rounded-[var(--radius-card)] border-0 bg-transparent p-0 text-left">
      <Card
        className={cn(
          'flex h-full flex-col transition hover:-translate-y-0.5 hover:border-brand/50',
          recommended && 'border-brand/60 shadow-[0_0_0_1px_var(--color-brand)]',
        )}
      >
        {children}
      </Card>
    </button>
  );
}

function AnatomyTile({ done, recommended, onOpen }: { done: boolean; recommended: boolean; onOpen: () => void }) {
  return (
    <TileShell recommended={recommended} onOpen={onOpen}>
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-brand/40 bg-brand/12 text-brand">
          <BookOpen className="size-4" />
        </span>
        {done ? (
          <span className="grid size-6 shrink-0 place-items-center rounded-full border border-bull/40 bg-bull/12 text-bull">
            <Check className="size-3.5" />
          </span>
        ) : recommended ? (
          <Pill tone="brand">
            <Sparkles className="size-3" /> up next
          </Pill>
        ) : null}
      </div>
      <h3 className="mt-3 text-[15px] font-semibold tracking-tight">Meet the candle</h3>
      <p className="mt-1 flex-1 text-[12.5px] leading-snug text-ink-muted">
        The anatomy every other mission builds on — body, wicks, open, close.
      </p>
      <p className="mt-3 text-[11px] text-ink-dim">{done ? 'Complete — revisit any time' : 'Not started'}</p>
    </TileShell>
  );
}

function ShapeTile({
  shape,
  summary,
  recommended,
  onOpen,
}: {
  shape: ShapeDefinition;
  summary: MissionSummary;
  recommended: boolean;
  onOpen: () => void;
}) {
  const sample = useMemo(() => synthesizeShape(shape.id, hashSeed(`map-${shape.id}`), { leadIn: 7 }), [shape.id]);
  const Icon = SENTIMENT_ICON[shape.sentiment];

  return (
    <TileShell recommended={recommended} onOpen={onOpen}>
      <div className="flex items-start justify-between gap-3">
        <Pill tone={SENTIMENT_TONE[shape.sentiment]}>
          <Icon className="size-3" />
          {shape.sentiment}
        </Pill>
        {summary.complete ? (
          <span className="grid size-6 shrink-0 place-items-center rounded-full border border-bull/40 bg-bull/12 text-bull">
            <Check className="size-3.5" />
          </span>
        ) : recommended ? (
          <Pill tone="brand">
            <Sparkles className="size-3" /> up next
          </Pill>
        ) : null}
      </div>

      <h3 className="mt-3 text-[15px] font-semibold tracking-tight">{shape.name}</h3>
      <p className="mt-1 text-[12.5px] leading-snug text-ink-muted">{shape.tagline}</p>

      <div className="mt-3 overflow-hidden rounded-lg border border-line bg-base/60 px-2 py-2">
        <MiniCandles candles={sample.candles} width={280} height={56} className="w-full" highlightFrom={sample.focusStart} />
      </div>

      <div className="mt-3 flex items-center gap-1">
        {Array.from({ length: summary.stagesTotal }).map((_, i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < summary.stagesDone ? 'bg-bull' : 'bg-line')} />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-ink-dim">
        {summary.complete ? 'Complete — replay any stage' : summary.stagesDone > 0 ? 'In progress' : 'Not started'}
      </p>
    </TileShell>
  );
}
