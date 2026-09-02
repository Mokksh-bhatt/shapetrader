import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, CircleCheck, History, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, Pill } from '@/components/ui/Card';
import { PriceChart } from '@/components/chart/PriceChart';
import { ChoiceGrid } from '@/components/feedback/ChoiceGrid';
import { AnswerFeedback } from '@/components/feedback/AnswerFeedback';
import { getCaseStudy } from '@/data/caseStudies';
import type { Annotation } from '@/engine/annotations/types';
import { useProgressStore } from '@/store/useProgressStore';

type Phase = 'narrative' | 'quiz' | 'done';

/**
 * Guided walkthrough for a single case study: a PriceChart on the left driven
 * by the current narrative step's annotations plus a live "focus span", and a
 * narration panel with Previous/Next on the right. After the last step, a
 * three-question recap quiz reuses the same feedback components as every
 * other quiz in the app.
 */
export function CaseStudyWalkthrough() {
  const { caseId } = useParams<{ caseId: string }>();
  const dataset = useMemo(() => getCaseStudy(caseId), [caseId]);

  const recordCaseStudyStep = useProgressStore((s) => s.recordCaseStudyStep);
  const completeCaseStudy = useProgressStore((s) => s.completeCaseStudy);
  const savedProgress = useProgressStore((s) => (dataset ? s.caseStudies[dataset.id] : undefined));

  const totalSteps = dataset?.narrativeSteps.length ?? 0;

  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('narrative');
  const [quizIndex, setQuizIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  // Starting a different case study resets the whole walkthrough.
  useEffect(() => {
    setStepIndex(0);
    setPhase('narrative');
    setQuizIndex(0);
    setSelected(null);
    setAnswered(false);
  }, [caseId]);

  useEffect(() => {
    if (!dataset || phase !== 'narrative' || totalSteps === 0) return;
    recordCaseStudyStep(dataset.id, stepIndex + 1, totalSteps);
  }, [dataset, phase, stepIndex, totalSteps, recordCaseStudyStep]);

  const goNext = useCallback(() => {
    if (totalSteps === 0) return;
    // Phase changes stay outside the state updater — StrictMode runs updaters
    // twice, and a setState hidden inside one is a trap waiting to happen.
    if (stepIndex >= totalSteps - 1) {
      setPhase('quiz');
      return;
    }
    setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  }, [stepIndex, totalSteps]);

  const goPrev = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  // Arrow keys advance the narrative; quiz phase keeps them out of the way so
  // an accidental keypress can't skip a question.
  useEffect(() => {
    if (phase !== 'narrative') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, goNext, goPrev]);

  if (!dataset) {
    return (
      <div className="animate-rise mx-auto max-w-md py-16 text-center">
        <Card>
          <History className="mx-auto size-8 text-ink-dim" />
          <h2 className="mt-3 text-[15px] font-semibold text-ink">That story is missing</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
            {caseId ? `"${caseId}" is not one of the stories in this module.` : 'No story was specified.'}
          </p>
          <Link to="/case-studies" className="mt-4 inline-block">
            <Button variant="outline" icon={<ArrowLeft className="size-4" />}>
              Back to Story Time
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const step = dataset.narrativeSteps[Math.min(stepIndex, totalSteps - 1)];
  const stepAnnotations = dataset.annotations.filter((a) => step.annotationIds.includes(a.id));
  const focusSpan: Annotation = {
    id: 'focus-span',
    kind: 'span',
    points: [
      { index: step.focusStart, price: 0 },
      { index: step.focusEnd, price: 0 },
    ],
    tone: 'brand',
  };
  const chartAnnotations: Annotation[] = [focusSpan, ...stepAnnotations];

  const question = dataset.recapQuestions[quizIndex];

  const handleSelect = (id: string) => {
    if (answered) return;
    setSelected(id);
    setAnswered(true);
  };

  const handleQuizNext = () => {
    if (quizIndex < dataset.recapQuestions.length - 1) {
      setQuizIndex((i) => i + 1);
      setSelected(null);
      setAnswered(false);
      return;
    }
    completeCaseStudy(dataset.id);
    setPhase('done');
  };

  return (
    <div className="animate-rise space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/case-studies"
            className="inline-flex items-center gap-1 text-[12.5px] text-ink-dim hover:text-ink"
          >
            <ArrowLeft className="size-3.5" /> Story Time
          </Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">{dataset.title}</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">{dataset.dateRangeLabel}</p>
        </div>
        {savedProgress?.quizPassed ? (
          <Pill tone="bull">
            <CircleCheck className="size-3" /> Recap complete
          </Pill>
        ) : null}
      </div>

      <div className="flex items-start gap-2 rounded-[var(--radius-card)] border border-line bg-surface-2 px-3.5 py-2.5 text-[12px] leading-relaxed text-ink-muted">
        <Info className="mt-0.5 size-3.5 shrink-0 text-brand" />
        <span>
          Prices are index-normalised (this series starts at 100) and stylised to show the real shape of this
          event — not tick-accurate historical data.
        </span>
      </div>

      {phase === 'narrative' ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <PriceChart
            candles={dataset.candles}
            height={420}
            annotations={chartAnnotations}
            fitContent
            legendLabel={`${dataset.title} · ${dataset.interval}`}
          />

          <Card className="flex flex-col">
            <div className="tnum text-[11px] font-semibold uppercase tracking-wider text-ink-dim">
              Chapter {stepIndex + 1} of {totalSteps}
            </div>
            <h2 className="mt-1.5 text-[16px] font-semibold tracking-tight text-ink">{step.title}</h2>
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ink-muted">{step.narration}</p>
            {step.lesson ? (
              <div className="mt-3 rounded-lg border border-brand/30 bg-brand/8 px-3 py-2 text-[12px] leading-snug text-brand">
                {step.lesson}
              </div>
            ) : null}

            <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goPrev}
                disabled={stepIndex === 0}
                icon={<ChevronLeft className="size-4" />}
              >
                Previous
              </Button>
              <Button size="sm" full onClick={goNext} icon={<ArrowRight className="size-4" />}>
                {stepIndex === totalSteps - 1 ? 'Finish the story' : 'Next'}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {phase === 'quiz' ? (
        <Card className="mx-auto max-w-2xl">
          <div className="tnum text-[11px] font-semibold uppercase tracking-wider text-ink-dim">
            Recap {quizIndex + 1} of {dataset.recapQuestions.length}
          </div>
          <h2 className="mt-1.5 text-[15px] font-semibold text-ink">{question.question}</h2>
          <div className="mt-3">
            <ChoiceGrid
              options={question.options}
              selected={selected}
              correctId={answered ? question.correctId : null}
              answered={answered}
              onSelect={handleSelect}
              columns={1}
            />
          </div>
          {answered ? (
            <div className="mt-4">
              <AnswerFeedback
                correct={selected === question.correctId}
                title={question.options.find((o) => o.id === question.correctId)?.label ?? ''}
                explanation={question.explanation}
                onNext={handleQuizNext}
                nextLabel={quizIndex === dataset.recapQuestions.length - 1 ? 'Finish' : 'Next question'}
              />
            </div>
          ) : null}
        </Card>
      ) : null}

      {phase === 'done' ? (
        <Card className="mx-auto max-w-xl text-center">
          <CircleCheck className="mx-auto size-8 text-bull" />
          <h2 className="mt-3 text-[16px] font-semibold text-ink">Case study complete</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
            You walked through {dataset.title} and its recap quiz. On to the next event.
          </p>
          <Link to="/case-studies" className="mt-4 inline-block">
            <Button icon={<ArrowRight className="size-4" />}>Back to Story Time</Button>
          </Link>
        </Card>
      ) : null}
    </div>
  );
}
