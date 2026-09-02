import type { ShapeId } from '@/engine/candles/types';
import { SHAPES } from '@/data/candlestickShapes/shapes';

/** lessonId used for the mission-0 anatomy walkthrough. */
export const ANATOMY_LESSON_ID = 'meet-the-candle';

export type MissionId = 'anatomy' | ShapeId;

export interface StageKeys {
  forge: string;
  spot: string;
  call: string;
}

/** The three per-shape lesson ids markLessonRead is called with — the module
 *  store has no dedicated mission fields, so mission state is derived from
 *  whether these strings show up in lessonsRead. */
export function stageLessonIds(shapeId: ShapeId): StageKeys {
  return { forge: `${shapeId}-forge`, spot: `${shapeId}-spot`, call: `${shapeId}-call` };
}

export interface MissionSummary {
  id: MissionId;
  stagesDone: number;
  stagesTotal: number;
  complete: boolean;
}

/** Mission 0 first, then one mission per shape in the same order the lessons
 *  introduce them. */
export function missionOrder(): MissionId[] {
  return ['anatomy', ...SHAPES.map((s) => s.id)];
}

export function summarizeMission(id: MissionId, lessonsRead: string[]): MissionSummary {
  if (id === 'anatomy') {
    const done = lessonsRead.includes(ANATOMY_LESSON_ID);
    return { id, stagesDone: done ? 1 : 0, stagesTotal: 1, complete: done };
  }
  const keys = stageLessonIds(id);
  const stagesDone = [keys.forge, keys.spot, keys.call].filter((k) => lessonsRead.includes(k)).length;
  return { id, stagesDone, stagesTotal: 3, complete: stagesDone === 3 };
}

export function nextRecommendedMission(lessonsRead: string[]): MissionId {
  const order = missionOrder();
  const found = order.find((id) => !summarizeMission(id, lessonsRead).complete);
  return found ?? order[order.length - 1];
}

export function allMissionsComplete(lessonsRead: string[]): boolean {
  return missionOrder().every((id) => summarizeMission(id, lessonsRead).complete);
}
