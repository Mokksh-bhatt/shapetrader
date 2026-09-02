import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CircleCheck, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

/**
 * Shown after every answer — including correct ones. Being told "correct"
 * teaches nothing; being told *why* it was correct is the whole product.
 */
export function AnswerFeedback({
  correct,
  title,
  explanation,
  extra,
  onNext,
  nextLabel = 'Next question',
}: {
  correct: boolean;
  title: string;
  explanation: ReactNode;
  extra?: ReactNode;
  onNext?: () => void;
  nextLabel?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'rounded-[var(--radius-card)] border p-5',
        correct ? 'border-bull/40 bg-bull/8' : 'border-gold/40 bg-gold/8',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg',
            correct ? 'bg-bull/15 text-bull' : 'bg-gold/15 text-gold',
          )}
        >
          {correct ? <CircleCheck className="size-4" /> : <Lightbulb className="size-4" />}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className={cn('text-[14px] font-semibold', correct ? 'text-bull' : 'text-gold')}>
            {correct ? 'Correct — ' : 'Not quite — '}
            <span className="text-ink">{title}</span>
          </h3>
          <div className="mt-2 text-[13px] leading-relaxed text-ink-muted">{explanation}</div>
          {extra ? <div className="mt-3">{extra}</div> : null}

          {onNext ? (
            <Button className="mt-4" onClick={onNext} icon={<ArrowRight className="size-4" />}>
              {nextLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
