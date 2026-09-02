import type { ComponentType } from 'react';
import { cn } from '@/lib/cn';

export interface TabSpec<T extends string> {
  id: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
}

/** One segmented control, shared by every module, so Learn/Practice looks and
 *  behaves identically wherever it appears. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: TabSpec<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex shrink-0 rounded-lg border border-line bg-surface p-1', className)}>
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          aria-pressed={value === id}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-medium transition',
            value === id
              ? 'bg-surface-3 text-ink shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]'
              : 'text-ink-muted hover:text-ink',
          )}
        >
          {Icon ? <Icon className="size-4" /> : null}
          {label}
        </button>
      ))}
    </div>
  );
}
