import { useEffect, useState } from 'react';
import { MissionMap } from './MissionMap';
import { MeetTheCandleMission } from './MeetTheCandleMission';
import { ShapeMission } from './ShapeMission';
import { allMissionsComplete, missionOrder, summarizeMission, type MissionId } from './missionProgress';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useProgressStore } from '@/store/useProgressStore';

/**
 * "Candle Lab" — a mission map replacing the old read-then-quiz flow. Mission
 * 0 covers candle anatomy; the other eight each take one shape through
 * forge → spot → call before the shape's psychology is explained, so the
 * explanation lands on something the learner already built or found rather
 * than something they're about to be tested on.
 */
export function CandlestickShapesScreen() {
  const [activeMission, setActiveMission] = useState<MissionId | null>(null);
  const lessonsRead = useProgressStore((s) => s.modules.candlesticks.lessonsRead);
  const completeModuleQuiz = useProgressStore((s) => s.completeModuleQuiz);

  const order = missionOrder();
  const missionsDone = order.filter((id) => summarizeMission(id, lessonsRead).complete).length;

  useEffect(() => {
    if (allMissionsComplete(lessonsRead)) completeModuleQuiz('candlesticks');
  }, [lessonsRead, completeModuleQuiz]);

  if (activeMission) {
    return activeMission === 'anatomy' ? (
      <MeetTheCandleMission onExit={() => setActiveMission(null)} />
    ) : (
      <ShapeMission shapeId={activeMission} onExit={() => setActiveMission(null)} />
    );
  }

  return (
    <div className="animate-rise space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Candle Lab</h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-muted">
            Eight shapes, built by hand before they're explained. Forge one, spot it in the wild, then
            call what it means — doing the shape teaches it faster than reading about it.
          </p>
        </div>
        <ProgressRing value={order.length ? missionsDone / order.length : 0} size={64} stroke={6}>
          <span className="tnum text-[13px] font-semibold text-ink">
            {missionsDone}/{order.length}
          </span>
        </ProgressRing>
      </div>

      <MissionMap lessonsRead={lessonsRead} onOpen={setActiveMission} />
    </div>
  );
}
