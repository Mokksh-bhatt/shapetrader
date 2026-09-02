import { levelForXp } from '@/engine/progress/xp';
import { useProgressStore } from '@/store/useProgressStore';
import { cn } from '@/lib/cn';

export function XPBar({ compact = false, className }: { compact?: boolean; className?: string }) {
  const xp = useProgressStore((s) => s.xp);
  const info = levelForXp(xp);

  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn('font-semibold tracking-tight text-ink', compact ? 'text-[12px]' : 'text-sm')}>
          Lv {info.level}
          <span className="ml-1.5 font-normal text-ink-muted">{info.title}</span>
        </span>
        <span className={cn('tnum shrink-0 text-ink-dim', compact ? 'text-[10px]' : 'text-[11px]')}>
          {info.xpToNext === null ? `${xp} XP` : `${info.xpIntoLevel}/${info.xpForLevel}`}
        </span>
      </div>
      <div
        className={cn(
          'mt-1.5 w-full overflow-hidden rounded-full bg-surface-3',
          compact ? 'h-1.5' : 'h-2',
        )}
        role="progressbar"
        aria-valuenow={Math.round(info.progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Level ${info.level} progress`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-violet transition-[width] duration-700 ease-out"
          style={{ width: `${Math.max(info.progress * 100, 2)}%` }}
        />
      </div>
    </div>
  );
}
