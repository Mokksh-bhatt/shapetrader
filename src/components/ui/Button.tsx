import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'ghost' | 'outline' | 'bull' | 'bear' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  full?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand/90 active:bg-brand-dim shadow-[0_8px_24px_-12px_var(--color-brand)]',
  ghost: 'bg-transparent text-ink-muted hover:text-ink hover:bg-surface-2',
  outline: 'border border-line-strong text-ink hover:bg-surface-2 hover:border-brand/60',
  subtle: 'bg-surface-2 text-ink hover:bg-surface-3 border border-line',
  bull: 'bg-bull/15 text-bull border border-bull/40 hover:bg-bull/25',
  bear: 'bg-bear/15 text-bear border border-bear/40 hover:bg-bear/25',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  full,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-inherit',
        'active:scale-[0.98]',
        VARIANTS[variant],
        SIZES[size],
        full && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
