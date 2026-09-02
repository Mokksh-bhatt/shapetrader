import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CircleCheck, Compass, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import {
  RESOLVE_PROBABILITY,
  type ContinuationResult,
  type OutcomeDirection,
  type PatternSample,
} from '@/data/generator/patternInjector';
import { NO_PATTERN_ID, PATTERN_BY_ID, type QuizPatternId } from '@/data/chartPatterns/patterns';
import { HuntChart } from '@/components/hunt/HuntChart';
import { Card, Pill } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const OUTCOME_META: Record<OutcomeDirection, { label: string; icon: typeof TrendingUp; variant: 'bull' | 'bear' | 'subtle' }> = {
  up: { label: 'Breaks up', icon: TrendingUp, variant: 'bull' },
  down: { label: 'Breaks down', icon: TrendingDown, variant: 'bear' },
  range: { label: 'Fizzles into a range', icon: Minus, variant: 'subtle' },
};

const REVEAL_STEP_MS = 90;

/**
 * Stage 3 — WHAT HAPPENED NEXT. The honest one. The learner calls a
 * direction, the same generated series is extended forward, and the reveal
 * sometimes disagrees with the textbook — because real patterns do. Scoring
 * is on the *call* (did it match the textbook read), not the coin flip that
 * decided whether this particular instance actually resolved.
 */
export function OutcomeStage({
  sample,
  continuation,
  targetId,
  onResolved,
}: {
  sample: PatternSample;
  continuation: ContinuationResult;
  targetId: QuizPatternId;
  onResolved: (correctCall: boolean) => void;
}) {
  const [predicted, setPredicted] = useState<OutcomeDirection | null>(null);
  const [revealCount, setRevealCount] = useState(0);

  const historicalLen = sample.candles.length;
  const totalContinuation = continuation.candles.length;
  const revealDone = predicted !== null && revealCount >= totalContinuation;

  useEffect(() => {
    if (predicted === null) return;
    const id = window.setInterval(() => {
      setRevealCount((n) => {
        if (n >= totalContinuation) {
          window.clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, REVEAL_STEP_MS);
    return () => window.clearInterval(id);
    // Runs once per prediction, not once per tick — the interval clears itself
    // once fully revealed, and the cleanup here still covers round changes / unmount.
  }, [predicted, totalContinuation]);

  const visibleCandles =
    predicted === null ? sample.candles : [...sample.candles, ...continuation.candles.slice(0, revealCount)];

  const handlePredict = (dir: OutcomeDirection) => {
    if (predicted !== null) return;
    setPredicted(dir);
    setRevealCount(0);
  };

  const correctCall = predicted !== null && predicted === continuation.expected;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-brand">
          <Compass className="size-4" />
        </span>
        <div>
          <Pill tone="brand" className="mb-1.5">
            What happens next
          </Pill>
          <p className="text-[14px] leading-snug text-ink">
            Call it before the chart tells you: does price break up, break down, or go nowhere?
          </p>
        </div>
      </div>

      <Card padded={false} className="overflow-hidden">
        <HuntChart
          candles={visibleCandles}
          totalSlots={historicalLen + totalContinuation}
          height={360}
          dividerIndex={predicted !== null ? historicalLen : undefined}
          newFrom={predicted !== null ? historicalLen : undefined}
        />
      </Card>

      {predicted === null ? (
        <div className="flex flex-wrap gap-2">
          {(['up', 'down', 'range'] as const).map((dir) => {
            const meta = OUTCOME_META[dir];
            const Icon = meta.icon;
            return (
              <Button key={dir} variant={meta.variant} onClick={() => handlePredict(dir)} icon={<Icon className="size-4" />}>
                {meta.label}
              </Button>
            );
          })}
        </div>
      ) : !revealDone ? (
        <p className="tnum text-[12.5px] text-ink-dim">Playing forward…</p>
      ) : (
        <ResultPanel
          targetId={targetId}
          predicted={predicted}
          continuation={continuation}
          correctCall={correctCall}
          onNext={() => onResolved(correctCall)}
        />
      )}
    </div>
  );
}

function reasoningLine(targetId: QuizPatternId, expected: OutcomeDirection): string {
  if (targetId === NO_PATTERN_ID) {
    return "There was no real pattern here, so the textbook expectation is simply that price keeps chopping without picking a direction — that's the honest default for most charts.";
  }
  const def = PATTERN_BY_ID[targetId];
  if (expected === 'up') return `${def.name} is bullish — the textbook expectation is a breakout up.`;
  if (expected === 'down') return `${def.name} is bearish — the textbook expectation is a breakdown.`;
  return `${def.name} is a level pattern — the textbook expectation is that the range holds, at least for now.`;
}

function outcomeLine(continuation: ContinuationResult): string {
  const actual = OUTCOME_META[continuation.outcome].label.toLowerCase();
  const resolvePct = Math.round(RESOLVE_PROBABILITY * 100);
  if (continuation.resolved) {
    return `This time it did: price ${actual}, matching the textbook read.`;
  }
  return `This time it didn't: price ${actual} instead. A pattern like this resolves as expected roughly ${resolvePct}% of the time in the wild — this instance landed in the other ${100 - resolvePct}%. That gap is exactly why traders size positions and set stops instead of betting everything on being right.`;
}

function ResultPanel({
  targetId,
  predicted,
  continuation,
  correctCall,
  onNext,
}: {
  targetId: QuizPatternId;
  predicted: OutcomeDirection;
  continuation: ContinuationResult;
  correctCall: boolean;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'rounded-[var(--radius-card)] border p-5',
        correctCall ? 'border-bull/40 bg-bull/8' : 'border-gold/40 bg-gold/8',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg',
            correctCall ? 'bg-bull/15 text-bull' : 'bg-gold/15 text-gold',
          )}
        >
          <CircleCheck className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className={cn('text-[14px] font-semibold', correctCall ? 'text-bull' : 'text-gold')}>
            {correctCall ? 'Read it right — ' : 'Different read — '}
            <span className="text-ink">you called {OUTCOME_META[predicted].label.toLowerCase()}</span>
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{reasoningLine(targetId, continuation.expected)}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{outcomeLine(continuation)}</p>
          <Button className="mt-4" onClick={onNext} icon={<ArrowRight className="size-4" />}>
            Next round
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
