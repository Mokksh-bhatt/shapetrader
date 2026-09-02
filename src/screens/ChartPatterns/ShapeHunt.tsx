import { useMemo, useState } from 'react';
import { Flame, RotateCcw, Trophy } from 'lucide-react';
import { NO_PATTERN_ID, PATTERN_BY_ID, PATTERN_IDS, type QuizPatternId } from '@/data/chartPatterns/patterns';
import { hashSeed } from '@/data/generator/seededRng';
import { Card, Pill } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useProgressStore } from '@/store/useProgressStore';
import { HuntStage } from './HuntStage';
import { NameStage } from './NameStage';
import { OutcomeStage } from './OutcomeStage';
import { ROUNDS_PER_RUN, buildRound, buildRunOrder, emptyTally, type RunTally } from './huntEngine';

type Stage = 'hunt' | 'name' | 'outcome';

function patternIdFor(id: QuizPatternId): string | undefined {
  return id === NO_PATTERN_ID ? undefined : id;
}

/**
 * The round loop. Every round runs HUNT → NAME IT → WHAT HAPPENED NEXT in
 * order; scoring and progress are recorded once per stage, so a full round
 * awards up to three answers instead of one multiple-choice guess.
 */
export function ShapeHunt() {
  const recordAnswer = useProgressStore((s) => s.recordAnswer);
  const markLessonRead = useProgressStore((s) => s.markLessonRead);
  const completeModuleQuiz = useProgressStore((s) => s.completeModuleQuiz);

  const [sessionSeed, setSessionSeed] = useState(() => Date.now());
  const [roundIndex, setRoundIndex] = useState(0);
  const [stage, setStage] = useState<Stage>('hunt');
  const [tally, setTally] = useState<RunTally>(emptyTally());
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [roundFlags, setRoundFlags] = useState<{ hunt: boolean | null; name: boolean | null }>({
    hunt: null,
    name: null,
  });
  const [finished, setFinished] = useState(false);

  const order = useMemo(() => buildRunOrder(sessionSeed), [sessionSeed]);
  const targetId = order[roundIndex];
  const round = useMemo(
    () => buildRound(targetId, hashSeed(`shape-hunt-${sessionSeed}-round-${roundIndex}-${targetId}`)),
    [sessionSeed, roundIndex, targetId],
  );

  const goToNextRound = (perfectRound: boolean) => {
    setCombo((c) => {
      const next = perfectRound ? c + 1 : 0;
      setBestCombo((b) => Math.max(b, next));
      return next;
    });
    setRoundFlags({ hunt: null, name: null });
    if (roundIndex + 1 >= order.length) {
      completeModuleQuiz('patterns');
      setFinished(true);
    } else {
      setRoundIndex((i) => i + 1);
      setStage('hunt');
    }
  };

  const handleHuntResolved = ({ correctFirstTry }: { correctFirstTry: boolean }) => {
    setTally((t) => ({
      ...t,
      hunt: { correct: t.hunt.correct + (correctFirstTry ? 1 : 0), total: t.hunt.total + 1 },
    }));
    setRoundFlags((f) => ({ ...f, hunt: correctFirstTry }));
    recordAnswer({
      moduleId: 'patterns',
      correct: correctFirstTry,
      questionLabel: `Shape Hunt — round ${roundIndex + 1} — spot the landmark`,
      answerLabel: correctFirstTry ? 'Found it first try' : 'Needed a nudge',
      patternId: patternIdFor(targetId),
    });
    setStage('name');
  };

  const handleNameResolved = (correct: boolean, answerLabel: string) => {
    setTally((t) => ({ ...t, name: { correct: t.name.correct + (correct ? 1 : 0), total: t.name.total + 1 } }));
    setRoundFlags((f) => ({ ...f, name: correct }));
    recordAnswer({
      moduleId: 'patterns',
      correct,
      questionLabel: `Shape Hunt — round ${roundIndex + 1} — name it`,
      answerLabel,
      patternId: patternIdFor(targetId),
    });
    setStage('outcome');
  };

  const handleOutcomeResolved = (correctCall: boolean) => {
    setTally((t) => ({ ...t, call: { correct: t.call.correct + (correctCall ? 1 : 0), total: t.call.total + 1 } }));
    recordAnswer({
      moduleId: 'patterns',
      correct: correctCall,
      questionLabel: `Shape Hunt — round ${roundIndex + 1} — what happens next`,
      answerLabel: correctCall ? 'Matched the textbook read' : 'Different read',
      patternId: patternIdFor(targetId),
    });
    markLessonRead('patterns', `shape-hunt-seen-${targetId}`);
    const perfect = Boolean(roundFlags.hunt) && Boolean(roundFlags.name) && correctCall;
    goToNextRound(perfect);
  };

  const handleRestart = () => {
    setSessionSeed(Date.now());
    setRoundIndex(0);
    setStage('hunt');
    setTally(emptyTally());
    setCombo(0);
    setBestCombo(0);
    setRoundFlags({ hunt: null, name: null });
    setFinished(false);
  };

  if (finished) {
    return <RunSummary tally={tally} bestCombo={bestCombo} onRestart={handleRestart} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Pill tone="brand">
            Round {roundIndex + 1} / {order.length}
          </Pill>
          <StageBreadcrumb stage={stage} />
        </div>
        <div className="flex items-center gap-3">
          {combo > 0 ? (
            <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-gold">
              <Flame className="size-3.5" />
              <span className="tnum">{combo}</span> streak
            </span>
          ) : null}
          <span className="tnum text-[12px] text-ink-muted">
            Hunt {tally.hunt.correct}/{tally.hunt.total} · Name {tally.name.correct}/{tally.name.total} · Call{' '}
            {tally.call.correct}/{tally.call.total}
          </span>
        </div>
      </div>

      {stage === 'hunt' ? (
        <HuntStage key={`hunt-${sessionSeed}-${roundIndex}`} sample={round.sample} huntSpec={round.huntSpec} onResolved={handleHuntResolved} />
      ) : stage === 'name' ? (
        <NameStage
          key={`name-${sessionSeed}-${roundIndex}`}
          sample={round.sample}
          targetId={round.targetId}
          options={round.options}
          onResolved={handleNameResolved}
        />
      ) : (
        <OutcomeStage
          key={`outcome-${sessionSeed}-${roundIndex}`}
          sample={round.sample}
          continuation={round.continuation}
          targetId={round.targetId}
          onResolved={handleOutcomeResolved}
        />
      )}
    </div>
  );
}

function StageBreadcrumb({ stage }: { stage: Stage }) {
  const steps: { id: Stage; label: string }[] = [
    { id: 'hunt', label: 'Hunt' },
    { id: 'name', label: 'Name it' },
    { id: 'outcome', label: 'What happens next' },
  ];
  return (
    <div className="hidden items-center gap-1.5 sm:flex">
      {steps.map((s, i) => (
        <span key={s.id} className="flex items-center gap-1.5">
          {i > 0 ? <span className="text-ink-dim">›</span> : null}
          <span className={cn('text-[11.5px]', s.id === stage ? 'font-medium text-ink' : 'text-ink-dim')}>{s.label}</span>
        </span>
      ))}
    </div>
  );
}

function RunSummary({ tally, bestCombo, onRestart }: { tally: RunTally; bestCombo: number; onRestart: () => void }) {
  const patternsMastered = useProgressStore((s) => s.patternsMastered);
  const totalCorrect = tally.hunt.correct + tally.name.correct + tally.call.correct;
  const totalAnswered = tally.hunt.total + tally.name.total + tally.call.total;
  const pct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const message =
    pct >= 85
      ? "Sharp eye — you're reading these like someone who has stared at a lot of charts."
      : pct >= 60
        ? 'Solid run. A few more hunts and spotting these becomes automatic.'
        : 'Patterns take reps. Open the field guide, then run it back.';

  return (
    <Card className="mx-auto max-w-xl text-center">
      <Trophy className="mx-auto size-8 text-gold" />
      <h2 className="mt-3 text-[16px] font-semibold text-ink">Run complete</h2>
      <p className="tnum mt-1 text-3xl font-bold text-ink">{pct}%</p>
      <p className="mt-1 text-[13px] text-ink-muted">across every stage of every round</p>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">{message}</p>

      <div className="mt-5 grid grid-cols-3 gap-2 text-left">
        <StatBlock label="Hunt" value={`${tally.hunt.correct}/${tally.hunt.total}`} hint="found first try" />
        <StatBlock label="Name it" value={`${tally.name.correct}/${tally.name.total}`} hint="named correctly" />
        <StatBlock label="Call it" value={`${tally.call.correct}/${tally.call.total}`} hint="matched textbook read" />
      </div>

      {bestCombo > 0 ? (
        <p className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-gold">
          <Flame className="size-4" />
          Best streak this run: {bestCombo} perfect round{bestCombo === 1 ? '' : 's'} in a row
        </p>
      ) : null}

      <div className="mt-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-dim">Field guide progress</h3>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {PATTERN_IDS.map((id) => {
            const count = patternsMastered[id] ?? 0;
            return (
              <Pill key={id} tone={count > 0 ? 'brand' : 'neutral'}>
                {PATTERN_BY_ID[id].name} {count > 0 ? `× ${count}` : ''}
              </Pill>
            );
          })}
        </div>
      </div>

      <Button className="mt-6" onClick={onRestart} icon={<RotateCcw className="size-4" />}>
        Hunt again
      </Button>
    </Card>
  );
}

function StatBlock({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-3">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-dim">{label}</p>
      <p className="tnum mt-1 text-[18px] font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] text-ink-dim">{hint}</p>
    </div>
  );
}
