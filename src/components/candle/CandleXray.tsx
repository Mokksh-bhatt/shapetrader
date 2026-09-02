import type { CandleMetrics } from '@/engine/candles/types';
import { cn } from '@/lib/cn';

/**
 * The same three numbers the classifier actually uses, shown to the learner
 * directly — so a shape stops being a vibe and becomes a measurement they can
 * watch move as they drag. Shared by the forge and spot stages.
 */
export function CandleXray({ metrics, className }: { metrics: CandleMetrics; className?: string }) {
  return (
    <div className={cn('grid grid-cols-3 gap-2 rounded-lg border border-line bg-base/50 p-3 text-center', className)}>
      <Metric label="body" value={metrics.bodyRatio} />
      <Metric label="upper wick" value={metrics.upperWickRatio} />
      <Metric label="lower wick" value={metrics.lowerWickRatio} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  const safe = Number.isFinite(value) ? value : 0;
  return (
    <div>
      <div className="tnum text-[15px] font-semibold text-ink">{Math.round(safe * 100)}%</div>
      <div className="text-[10px] uppercase tracking-wider text-ink-dim">{label}</div>
    </div>
  );
}
