import { Link } from 'react-router-dom';
import { ArrowRight, CircleCheck, History, Info } from 'lucide-react';
import { Card, Pill } from '@/components/ui/Card';
import { MiniCandles } from '@/components/chart/MiniCandles';
import { CASE_STUDIES } from '@/data/caseStudies';
import { useProgressStore } from '@/store/useProgressStore';
import { cn } from '@/lib/cn';

/**
 * Landing grid for the Market History module — one card per real event, each
 * showing a thumbnail of its actual (stylised) series and how far the learner
 * has gotten through it.
 */
export function CaseStudiesScreen() {
  const caseStudies = useProgressStore((s) => s.caseStudies);

  return (
    <div className="animate-rise space-y-5">
      <div>
        <div className="flex items-center gap-2 text-ink-dim">
          <History className="size-4" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">Chapter 3 · Story Time</span>
        </div>
        <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-ink">Four true stories from the market</h1>
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-ink-muted">
          Four things that really happened, told candle by candle — so the shapes you built in the Lab and
          hunted down in the wild stop being exercises and start being history.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-[var(--radius-card)] border border-line bg-surface-2 px-3.5 py-2.5 text-[12px] leading-relaxed text-ink-muted">
        <Info className="mt-0.5 size-3.5 shrink-0 text-brand" />
        <span>
          Every chart here is a stylised reconstruction — index-normalised to start at 100 and hand-shaped to
          match each event&apos;s approximate magnitude and timing, not tick-accurate historical prices.
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {CASE_STUDIES.map((cs) => {
          const progress = caseStudies[cs.id];
          const stepsDone = Math.min(progress?.stepsCompleted ?? 0, cs.narrativeSteps.length);
          const totalSteps = cs.narrativeSteps.length;
          const pct = totalSteps > 0 ? Math.round((stepsDone / totalSteps) * 100) : 0;

          return (
            <Link key={cs.id} to={`/case-studies/${cs.id}`} className="group block focus:outline-none">
              <Card
                padded={false}
                className="h-full overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-line-strong"
              >
                <div className="border-b border-line bg-surface-2">
                  <MiniCandles candles={cs.candles} width={640} height={84} className="w-full" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-ink-dim">
                      {cs.dateRangeLabel}
                    </span>
                    {progress?.quizPassed ? (
                      <Pill tone="bull">
                        <CircleCheck className="size-3" /> Complete
                      </Pill>
                    ) : stepsDone > 0 ? (
                      <Pill tone="brand">In progress</Pill>
                    ) : null}
                  </div>

                  <h3 className="mt-1 text-[15px] font-semibold tracking-tight text-ink">{cs.title}</h3>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{cs.blurb}</p>

                  <div className="mt-3.5 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className={cn(
                          'h-full rounded-full transition-[width] duration-700',
                          progress?.quizPassed ? 'bg-bull' : 'bg-brand',
                        )}
                        style={{ width: `${Math.max(pct, stepsDone > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <span className="tnum shrink-0 text-[11px] text-ink-dim">
                      {stepsDone}/{totalSteps} chapters
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-ink-dim transition group-hover:translate-x-0.5 group-hover:text-brand" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
