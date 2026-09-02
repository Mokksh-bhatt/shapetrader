import { Check } from 'lucide-react';
import { MiniCandles } from '@/components/chart/MiniCandles';
import { cn } from '@/lib/cn';
import { SIM_DATASETS } from './datasets';

export function DatasetPicker({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {SIM_DATASETS.map((dataset) => {
        const active = dataset.id === selectedId;
        return (
          <button
            key={dataset.id}
            onClick={() => onSelect(dataset.id)}
            className={cn(
              'group relative overflow-hidden rounded-[var(--radius-card)] border p-3.5 text-left transition-all duration-150',
              active
                ? 'border-brand/50 bg-brand/[0.07] ring-1 ring-brand/25'
                : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2',
            )}
          >
            <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-20">
              <MiniCandles candles={dataset.candles} width={280} height={54} className="w-full" />
            </div>
            <div className="relative">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-ink">{dataset.label}</span>
                {active ? <Check className="size-4 shrink-0 text-brand" /> : null}
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-muted">{dataset.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
