import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Crosshair, Lightbulb, ScanSearch } from 'lucide-react';
import { evaluateHuntClick, type HuntSpec, type PatternSample } from '@/data/generator/patternInjector';
import { HuntChart, type HuntMarker } from '@/components/hunt/HuntChart';
import { Card, Pill } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const MAX_ATTEMPTS = 4;

/**
 * Stage 1 — HUNT. Before anything is named, the learner has to point at it.
 * Real-pattern rounds ask for a specific landmark on the chart; "no pattern"
 * rounds ask the more honest question underneath the whole module — does a
 * shape actually stand out here, or is this apophenia?
 */
export function HuntStage({
  sample,
  huntSpec,
  onResolved,
}: {
  sample: PatternSample;
  huntSpec: HuntSpec | null;
  onResolved: (result: { correctFirstTry: boolean }) => void;
}) {
  const [focusedIndex, setFocusedIndex] = useState(Math.floor(sample.candles.length / 2));
  const [misses, setMisses] = useState<HuntMarker[]>([]);
  const [nudge, setNudge] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [revealedTarget, setRevealedTarget] = useState<HuntMarker | null>(null);
  const [attempts, setAttempts] = useState(0);

  // "No pattern" rounds: a binary call instead of a candle click.
  const [noPatternChoice, setNoPatternChoice] = useState<'noise' | 'something' | null>(null);

  if (!huntSpec) {
    const correct = noPatternChoice === 'noise';
    return (
      <div className="space-y-4">
        <StagePrompt
          icon={<ScanSearch className="size-4" />}
          text="Does a real, repeating shape stand out here — or is this just ordinary noise?"
        />
        <Card padded={false} className="overflow-hidden">
          <HuntChart candles={sample.candles} height={340} interactive={false} />
        </Card>
        {noPatternChoice === null ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setNoPatternChoice('something')}>
              Something&apos;s forming
            </Button>
            <Button variant="outline" onClick={() => setNoPatternChoice('noise')}>
              Just noise — nothing here
            </Button>
          </div>
        ) : (
          <NudgeOrConfirm
            correct={correct}
            message={
              correct
                ? "Right instinct — no repeated touches, no clean peaks or troughs. Most windows of most charts look exactly like this."
                : "Take another look — there's no repeated touch of one level and no clean set of peaks or troughs here. That pull to see a shape anyway is apophenia, and it's worth noticing in yourself."
            }
            onContinue={() => onResolved({ correctFirstTry: correct })}
          />
        )}
      </div>
    );
  }

  const markers: HuntMarker[] = [...misses];
  if (revealedTarget) markers.push(revealedTarget);

  const handleSelect = (index: number) => {
    if (solved) return;
    setFocusedIndex(index);
    const result = evaluateHuntClick(huntSpec, index);
    if (result.correct && result.matched) {
      setSolved(true);
      setRevealedTarget({ index: result.matched.index, price: result.matched.price, tone: 'gold', label: result.matched.label, kind: 'ring' });
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    const candle = sample.candles[index];
    setMisses((prev) => [...prev, { index, price: candle ? (candle.high + candle.low) / 2 : 0, tone: 'bear', kind: 'x' }]);

    if (nextAttempts >= MAX_ATTEMPTS) {
      const first = huntSpec.targets[0];
      setSolved(true);
      setNudge(`${result.nudge} Here's the landmark, so we can move on.`);
      if (first) setRevealedTarget({ index: first.index, price: first.price, tone: 'gold', label: first.label, kind: 'ring' });
    } else {
      setNudge(result.nudge);
    }
  };

  return (
    <div className="space-y-4">
      <StagePrompt icon={<Crosshair className="size-4" />} text={huntSpec.prompt} />

      <Card padded={false} className="overflow-hidden">
        <HuntChart
          candles={sample.candles}
          height={360}
          interactive={!solved}
          focusedIndex={focusedIndex}
          onFocusChange={setFocusedIndex}
          onSelect={handleSelect}
          markers={markers}
        />
      </Card>

      {!solved ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11.5px] text-ink-dim">
            Click the chart, or use the arrow keys and Enter. Attempt {attempts + 1} of {MAX_ATTEMPTS}.
          </p>
          {nudge ? (
            <motion.p
              key={nudge}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-md text-right text-[12.5px] text-gold"
            >
              {nudge}
            </motion.p>
          ) : null}
        </div>
      ) : (
        <NudgeOrConfirm
          correct={attempts === 0}
          message={
            attempts === 0
              ? 'Found it on the first try.'
              : nudge ?? 'Found it — take another look at exactly where it sits before moving on.'
          }
          onContinue={() => onResolved({ correctFirstTry: attempts === 0 })}
        />
      )}
    </div>
  );
}

function StagePrompt({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-brand">
        {icon}
      </span>
      <div>
        <Pill tone="brand" className="mb-1.5">
          Hunt
        </Pill>
        <p className="text-[14px] leading-snug text-ink">{text}</p>
      </div>
    </div>
  );
}

function NudgeOrConfirm({
  correct,
  message,
  onContinue,
}: {
  correct: boolean;
  message: string;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-[var(--radius-card)] border p-4', correct ? 'border-bull/40 bg-bull/8' : 'border-gold/40 bg-gold/8')}
    >
      <div className="flex items-center gap-3">
        <span className={cn('grid size-7 shrink-0 place-items-center rounded-lg', correct ? 'bg-bull/15 text-bull' : 'bg-gold/15 text-gold')}>
          <Lightbulb className="size-3.5" />
        </span>
        <p className="flex-1 text-[13px] leading-relaxed text-ink-muted">{message}</p>
      </div>
      <Button className="mt-3" size="sm" onClick={onContinue} icon={<ArrowRight className="size-3.5" />}>
        Name it
      </Button>
    </motion.div>
  );
}
