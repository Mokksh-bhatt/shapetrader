import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import type { ModuleSummary } from '@/engine/progress/summary';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

export function ModuleCard({
  module,
  icon: Icon,
  recommended,
}: {
  module: ModuleSummary;
  icon: React.ComponentType<{ className?: string }>;
  recommended: boolean;
}) {
  const pct = Math.round(Math.min(Math.max(module.progress, 0), 1) * 100);

  return (
    <Link to={module.route} className="group block focus:outline-none">
      <Card
        className={cn(
          'h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-line-strong',
          recommended && 'border-brand/45 ring-1 ring-brand/20',
        )}
      >
        <div className="flex items-start gap-3.5">
          <span
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-xl border transition',
              module.done
                ? 'border-bull/40 bg-bull/12 text-bull'
                : recommended
                  ? 'border-brand/40 bg-brand/12 text-brand'
                  : 'border-line bg-surface-2 text-ink-muted',
            )}
          >
            {module.done ? <Check className="size-5" /> : <Icon className="size-5" />}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="tnum text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
                Step {module.step}
              </span>
              {recommended ? (
                <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand">
                  Start here
                </span>
              ) : null}
              {module.done ? (
                <span className="rounded-full bg-bull/12 px-2 py-0.5 text-[10px] font-semibold text-bull">
                  Complete
                </span>
              ) : null}
            </div>

            <h3 className="mt-1 text-[15px] font-semibold tracking-tight text-ink">{module.title}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{module.blurb}</p>

            <div className="mt-3.5 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-700',
                    module.done ? 'bg-bull' : 'bg-brand',
                  )}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <span className="tnum shrink-0 text-[11px] text-ink-dim">{module.detail}</span>
              <ArrowRight className="size-4 shrink-0 text-ink-dim transition group-hover:translate-x-0.5 group-hover:text-brand" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
