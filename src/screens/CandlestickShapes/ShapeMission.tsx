import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Check, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, Pill } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ShapeFlashcard } from './ShapeFlashcard';
import { ForgeStage } from './stages/ForgeStage';
import { SpotStage } from './stages/SpotStage';
import { CallStage } from './stages/CallStage';
import { stageLessonIds } from './missionProgress';
import { SHAPE_BY_ID } from '@/data/candlestickShapes/shapes';
import type { ShapeId } from '@/engine/candles/types';
import { useProgressStore } from '@/store/useProgressStore';
import { cn } from '@/lib/cn';

type Stage = 'forge' | 'spot' | 'call' | 'summary';
const STAGE_ORDER: Exclude<Stage, 'summary'>[] = ['forge', 'spot', 'call'];
const STAGE_LABEL: Record<Stage, string> = {
  forge: 'Forge it',
  spot: 'Spot it',
  call: 'Call it',
  summary: 'Done',
};

/**
 * One mission: forge the shape, find it on a real chart, then call what it
 * means. Stage completion is derived from lessonsRead rather than local
 * state, so refreshing the page or coming back later resumes correctly.
 */
export function ShapeMission({ shapeId, onExit }: { shapeId: ShapeId; onExit: () => void }) {
  const lessonsRead = useProgressStore((s) => s.modules.candlesticks.lessonsRead);
  const shapesMastered = useProgressStore((s) => s.shapesMastered);
  const shape = SHAPE_BY_ID[shapeId];
  const keys = stageLessonIds(shapeId);

  const doneMask: Record<Exclude<Stage, 'summary'>, boolean> = {
    forge: lessonsRead.includes(keys.forge),
    spot: lessonsRead.includes(keys.spot),
    call: lessonsRead.includes(keys.call),
  };
  const allDone = doneMask.forge && doneMask.spot && doneMask.call;
  const firstIncomplete = STAGE_ORDER.find((s) => !doneMask[s]);

  const [stage, setStage] = useState<Stage>(allDone ? 'summary' : (firstIncomplete ?? 'forge'));
  const [showCheat, setShowCheat] = useState(false);

  // -1 (all complete) reads as "every stage reachable"; otherwise reachable
  // stages are the completed ones plus the very next one.
  const unlockedIndex = STAGE_ORDER.findIndex((s) => !doneMask[s]);
  const maxReachable = unlockedIndex === -1 ? STAGE_ORDER.length : unlockedIndex;

  const goTo = (target: Stage) => {
    if (target === 'summary') {
      setStage('summary');
      return;
    }
    if (STAGE_ORDER.indexOf(target) <= maxReachable) setStage(target);
  };

  const sentimentTone = shape.sentiment === 'bullish' ? 'bull' : shape.sentiment === 'bearish' ? 'bear' : 'neutral';

  return (
    <div className="animate-rise space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-4" /> Mission map
        </button>

        <div className="flex items-center gap-2">
          <Pill tone={sentimentTone}>{shape.name}</Pill>
          <Button variant="ghost" size="sm" icon={<BookOpen className="size-4" />} onClick={() => setShowCheat(true)}>
            Cheat card
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {STAGE_ORDER.map((s, i) => {
          const reachable = i <= maxReachable;
          const active = stage === s;
          return (
            <button
              key={s}
              disabled={!reachable}
              onClick={() => goTo(s)}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.1em] transition',
                active
                  ? 'border-brand/60 bg-brand/12 text-brand'
                  : doneMask[s]
                    ? 'border-bull/30 bg-bull/8 text-bull hover:bg-bull/12'
                    : reachable
                      ? 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink'
                      : 'cursor-not-allowed border-line bg-surface/50 text-ink-dim opacity-50',
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                {doneMask[s] ? <Check className="size-3.5" /> : null}
                {STAGE_LABEL[s]}
              </span>
            </button>
          );
        })}
      </div>

      {stage === 'forge' ? <ForgeStage shapeId={shapeId} onDone={() => goTo('spot')} /> : null}
      {stage === 'spot' ? <SpotStage shapeId={shapeId} onDone={() => goTo('call')} /> : null}
      {stage === 'call' ? <CallStage shapeId={shapeId} onDone={() => setStage('summary')} /> : null}
      {stage === 'summary' ? (
        <MissionSummary shapeId={shapeId} onExit={onExit} onReplay={goTo} masteredCount={shapesMastered[shapeId] ?? 0} />
      ) : null}

      <Modal open={showCheat} onClose={() => setShowCheat(false)} title="Cheat card" width="max-w-md">
        <ShapeFlashcard shape={shape} mastered={(shapesMastered[shapeId] ?? 0) > 0} />
      </Modal>
    </div>
  );
}

function MissionSummary({
  shapeId,
  onExit,
  onReplay,
  masteredCount,
}: {
  shapeId: ShapeId;
  onExit: () => void;
  onReplay: (s: Stage) => void;
  masteredCount: number;
}) {
  const shape = SHAPE_BY_ID[shapeId];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className="text-center">
        <PartyPopper className="mx-auto size-8 text-gold" />
        <h2 className="mt-3 text-xl font-semibold tracking-tight">Mission complete — {shape.name}</h2>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-muted">{shape.tagline}</p>
        {masteredCount > 0 ? (
          <p className="mt-1 text-[11.5px] text-ink-dim">Spotted correctly {masteredCount}x so far.</p>
        ) : null}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={onExit}>Back to mission map</Button>
          <Button variant="outline" size="sm" onClick={() => onReplay('forge')}>
            Replay forge
          </Button>
          <Button variant="outline" size="sm" onClick={() => onReplay('spot')}>
            Replay spot
          </Button>
          <Button variant="outline" size="sm" onClick={() => onReplay('call')}>
            Replay call
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
