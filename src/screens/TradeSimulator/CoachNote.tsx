import type { ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/cn';

/** A short, plain-English aside. Used throughout the simulator so it teaches
 *  the habit behind an action, not just the mechanics of clicking it. */
export function CoachNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border border-brand/25 bg-brand/[0.06] px-3 py-2 text-[12px] leading-relaxed text-ink-muted',
        className,
      )}
    >
      <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-brand" />
      <span>{children}</span>
    </div>
  );
}
