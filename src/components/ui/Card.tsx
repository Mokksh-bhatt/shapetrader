import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export function Card({ padded = true, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border border-line bg-surface card-glow',
        padded && 'p-5',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-brand">
            {icon}
          </span>
        ) : null}
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-[13px] leading-snug text-ink-muted">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Pill({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'bull' | 'bear' | 'brand' | 'gold' | 'violet';
  className?: string;
}) {
  const tones = {
    neutral: 'border-line-strong bg-surface-2 text-ink-muted',
    bull: 'border-bull/40 bg-bull/12 text-bull',
    bear: 'border-bear/40 bg-bear/12 text-bear',
    brand: 'border-brand/40 bg-brand/12 text-brand',
    gold: 'border-gold/40 bg-gold/12 text-gold',
    violet: 'border-violet/40 bg-violet/12 text-violet',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
