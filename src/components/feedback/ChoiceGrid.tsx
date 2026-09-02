import { Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface Choice {
  id: string;
  label: string;
  hint?: string;
}

/**
 * The answer buttons used by every quiz in the app. Right/wrong is signalled
 * with an icon as well as a colour, so it still reads correctly for someone
 * who can't separate the green from the red.
 */
export function ChoiceGrid({
  options,
  selected,
  correctId,
  answered,
  onSelect,
  columns = 2,
}: {
  options: Choice[];
  selected: string | null;
  correctId: string | null;
  answered: boolean;
  onSelect: (id: string) => void;
  columns?: 1 | 2 | 3;
}) {
  return (
    <div
      className={cn(
        'grid gap-2',
        columns === 1 ? 'grid-cols-1' : columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
      )}
    >
      {options.map((option) => {
        const isCorrect = answered && option.id === correctId;
        const isWrongPick = answered && option.id === selected && option.id !== correctId;

        return (
          <button
            key={option.id}
            disabled={answered}
            onClick={() => onSelect(option.id)}
            className={cn(
              'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition',
              'disabled:cursor-default',
              isCorrect
                ? 'border-bull/60 bg-bull/12'
                : isWrongPick
                  ? 'border-bear/60 bg-bear/12'
                  : answered
                    ? 'border-line bg-surface opacity-45'
                    : 'border-line bg-surface hover:-translate-y-0.5 hover:border-brand/50 hover:bg-surface-2',
            )}
          >
            <span className="min-w-0">
              <span
                className={cn(
                  'block text-[13.5px] font-medium',
                  isCorrect ? 'text-bull' : isWrongPick ? 'text-bear' : 'text-ink',
                )}
              >
                {option.label}
              </span>
              {option.hint ? (
                <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-dim">{option.hint}</span>
              ) : null}
            </span>
            {isCorrect ? <Check className="size-4 shrink-0 text-bull" /> : null}
            {isWrongPick ? <X className="size-4 shrink-0 text-bear" /> : null}
          </button>
        );
      })}
    </div>
  );
}
