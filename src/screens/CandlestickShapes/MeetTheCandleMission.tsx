import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CandleAnatomyDiagram } from './CandleAnatomyDiagram';
import { ANATOMY_LESSON_ID } from './missionProgress';
import { useProgressStore } from '@/store/useProgressStore';

/** Mission 0 — the diagram every other mission assumes the learner has seen. */
export function MeetTheCandleMission({ onExit }: { onExit: () => void }) {
  const markLessonRead = useProgressStore((s) => s.markLessonRead);
  const lessonsRead = useProgressStore((s) => s.modules.candlesticks.lessonsRead);
  const done = lessonsRead.includes(ANATOMY_LESSON_ID);

  return (
    <div className="animate-rise space-y-4">
      <button
        onClick={onExit}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-muted transition hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Mission map
      </button>

      <CandleAnatomyDiagram />

      <div className="flex justify-end">
        <Button
          onClick={() => {
            markLessonRead('candlesticks', ANATOMY_LESSON_ID);
            onExit();
          }}
          icon={done ? <Check className="size-4" /> : undefined}
        >
          {done ? 'Back to the map' : "Got it — start Candle Lab"}
        </Button>
      </div>
    </div>
  );
}
