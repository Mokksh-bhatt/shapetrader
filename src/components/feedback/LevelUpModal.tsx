import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useUiStore } from '@/store/useUiStore';

export function LevelUpModal() {
  const levelUp = useUiStore((s) => s.levelUp);
  const clear = useUiStore((s) => s.clearLevelUp);

  return (
    <Modal open={Boolean(levelUp)} onClose={clear} width="max-w-sm">
      {levelUp ? (
        <div className="flex flex-col items-center text-center">
          <ProgressRing value={1} size={120} stroke={9} color="var(--color-gold)">
            <div>
              <Sparkles className="mx-auto mb-1 size-5 text-gold" />
              <div className="tnum text-2xl font-bold leading-none text-ink">{levelUp.level}</div>
            </div>
          </ProgressRing>
          <h2 className="mt-5 text-xl font-semibold tracking-tight">Level {levelUp.level} reached</h2>
          <p className="mt-1 text-sm text-gold">{levelUp.title}</p>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
            {levelUp.xpToNext === null
              ? "You've topped the curve — every shape in the book is yours now."
              : `${levelUp.xpToNext} XP to the next rank. Keep reading the tape.`}
          </p>
          <Button className="mt-6" full onClick={clear}>
            Keep going
          </Button>
        </div>
      ) : null}
    </Modal>
  );
}
