import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MODULE_IDS, PROGRESS_KEY, STORAGE_VERSION, XP, type ModuleId } from '@/lib/constants';
import { daysBetween, todayISO } from '@/lib/formatters';
import { safeStorage } from '@/lib/storage';
import { levelForXp } from '@/engine/progress/xp';
import { BADGE_BY_ID, newlyUnlocked } from '@/engine/progress/badges';
import type { ProgressState, QuizAttempt } from '@/engine/progress/types';
import type { ShapeId } from '@/engine/candles/types';
import { useUiStore } from './useUiStore';

function emptyModules(): ProgressState['modules'] {
  const modules = {} as ProgressState['modules'];
  MODULE_IDS.forEach((id) => {
    modules[id] = { attempted: 0, correct: 0, quizCompleted: false, lessonsRead: [] };
  });
  return modules;
}

export function createInitialProgress(): ProgressState {
  return {
    version: STORAGE_VERSION,
    xp: 0,
    answerStreak: 0,
    bestAnswerStreak: 0,
    dayStreak: { current: 0, longest: 0, lastActiveISO: null, activeDays: [] },
    modules: emptyModules(),
    caseStudies: {},
    shapesMastered: {},
    patternsMastered: {},
    trading: { closed: 0, wins: 0, withRiskControls: 0, bestPnl: 0 },
    badges: {},
    history: [],
  };
}

interface ProgressActions {
  recordAnswer: (input: {
    moduleId: ModuleId;
    correct: boolean;
    questionLabel: string;
    answerLabel: string;
    shapeId?: ShapeId;
    patternId?: string;
  }) => void;
  markLessonRead: (moduleId: ModuleId, lessonId: string) => void;
  completeModuleQuiz: (moduleId: ModuleId) => void;
  recordCaseStudyStep: (caseId: string, stepsCompleted: number, totalSteps: number) => void;
  completeCaseStudy: (caseId: string) => void;
  recordTradeClose: (input: { pnl: number; hadRiskControls: boolean }) => void;
  resetProgress: () => void;
}

type Store = ProgressState & ProgressActions;

/**
 * Awarding XP is the one place where levels, day streaks and badges are all
 * kept in sync — every action funnels through it so none of them can drift.
 */
function applyXp(state: ProgressState, amount: number, reason: string): ProgressState {
  const before = levelForXp(state.xp);
  const today = todayISO();

  const last = state.dayStreak.lastActiveISO;
  const gap = last ? daysBetween(last, today) : Number.POSITIVE_INFINITY;
  const current = gap === 0 ? Math.max(state.dayStreak.current, 1) : gap === 1 ? state.dayStreak.current + 1 : 1;
  const activeDays =
    last === today ? state.dayStreak.activeDays : [...state.dayStreak.activeDays, today].slice(-14);

  const next: ProgressState = {
    ...state,
    xp: state.xp + amount,
    dayStreak: {
      current,
      longest: Math.max(state.dayStreak.longest, current),
      lastActiveISO: today,
      activeDays,
    },
  };

  const ui = useUiStore.getState();
  if (amount > 0) {
    ui.pushToast({ kind: 'xp', title: `+${amount} XP`, detail: reason });
  }

  const unlocked = newlyUnlocked(next);
  if (unlocked.length > 0) {
    const stamped = { ...next.badges };
    unlocked.forEach((id) => {
      stamped[id] = new Date().toISOString();
      ui.pushToast({
        kind: 'badge',
        title: `Badge unlocked — ${BADGE_BY_ID[id].name}`,
        detail: BADGE_BY_ID[id].requirement,
      });
    });
    next.badges = stamped;
  }

  const after = levelForXp(next.xp);
  if (after.level > before.level) ui.showLevelUp(after);

  return next;
}

export const useProgressStore = create<Store>()(
  persist(
    (set, get) => ({
      ...createInitialProgress(),

      recordAnswer: ({ moduleId, correct, questionLabel, answerLabel, shapeId, patternId }) => {
        const s = get();
        const streak = correct ? s.answerStreak + 1 : 0;
        const streakBonus = correct && streak > 0 && streak % XP.streakEvery === 0 ? XP.streakBonus : 0;
        const gained = (correct ? XP.correctAnswer : XP.wrongAnswer) + streakBonus;

        const attempt: QuizAttempt = {
          id: `${moduleId}-${Date.now()}`,
          moduleId,
          questionLabel,
          answerLabel,
          correct,
          at: new Date().toISOString(),
        };

        const mod = s.modules[moduleId];
        const base: ProgressState = {
          ...s,
          answerStreak: streak,
          bestAnswerStreak: Math.max(s.bestAnswerStreak, streak),
          modules: {
            ...s.modules,
            [moduleId]: {
              ...mod,
              attempted: mod.attempted + 1,
              correct: mod.correct + (correct ? 1 : 0),
            },
          },
          shapesMastered:
            correct && shapeId
              ? { ...s.shapesMastered, [shapeId]: (s.shapesMastered[shapeId] ?? 0) + 1 }
              : s.shapesMastered,
          patternsMastered:
            correct && patternId
              ? { ...s.patternsMastered, [patternId]: (s.patternsMastered[patternId] ?? 0) + 1 }
              : s.patternsMastered,
          history: [...s.history, attempt].slice(-200),
        };

        set(applyXp(base, gained, streakBonus > 0 ? `${streak} in a row!` : correct ? 'Correct' : 'Nice try'));
      },

      markLessonRead: (moduleId, lessonId) => {
        const s = get();
        const mod = s.modules[moduleId];
        if (mod.lessonsRead.includes(lessonId)) return;
        const base: ProgressState = {
          ...s,
          modules: {
            ...s.modules,
            [moduleId]: { ...mod, lessonsRead: [...mod.lessonsRead, lessonId] },
          },
        };
        set(applyXp(base, XP.lessonRead, 'Lesson read'));
      },

      completeModuleQuiz: (moduleId) => {
        const s = get();
        if (s.modules[moduleId].quizCompleted) return;
        const base: ProgressState = {
          ...s,
          modules: { ...s.modules, [moduleId]: { ...s.modules[moduleId], quizCompleted: true } },
        };
        set(applyXp(base, XP.moduleQuizComplete, 'Module quiz complete'));
      },

      recordCaseStudyStep: (caseId, stepsCompleted, totalSteps) => {
        const s = get();
        const existing = s.caseStudies[caseId] ?? { stepsCompleted: 0, totalSteps, quizPassed: false };
        if (existing.stepsCompleted >= stepsCompleted && existing.totalSteps === totalSteps) return;
        set({
          caseStudies: {
            ...s.caseStudies,
            [caseId]: {
              ...existing,
              totalSteps,
              stepsCompleted: Math.max(existing.stepsCompleted, stepsCompleted),
            },
          },
        });
      },

      completeCaseStudy: (caseId) => {
        const s = get();
        const existing = s.caseStudies[caseId];
        if (existing?.quizPassed) return;
        const base: ProgressState = {
          ...s,
          caseStudies: {
            ...s.caseStudies,
            [caseId]: {
              stepsCompleted: existing?.stepsCompleted ?? 0,
              totalSteps: existing?.totalSteps ?? 0,
              quizPassed: true,
            },
          },
        };
        set(applyXp(base, XP.caseStudyComplete, 'Case study complete'));
      },

      recordTradeClose: ({ pnl, hadRiskControls }) => {
        const s = get();
        const base: ProgressState = {
          ...s,
          trading: {
            closed: s.trading.closed + 1,
            wins: s.trading.wins + (pnl > 0 ? 1 : 0),
            withRiskControls: s.trading.withRiskControls + (hadRiskControls ? 1 : 0),
            bestPnl: Math.max(s.trading.bestPnl, pnl),
          },
        };
        // Flat XP regardless of profit — the game must not pay you to gamble.
        set(applyXp(base, XP.tradeClosed, 'Trade closed'));
      },

      resetProgress: () => set({ ...createInitialProgress() }),
    }),
    {
      name: PROGRESS_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => safeStorage),
      // Anything saved by an older, incompatible build is discarded rather than
      // half-loaded into a shape the UI no longer understands.
      migrate: () => createInitialProgress(),
      partialize: (state) => {
        const { recordAnswer, markLessonRead, completeModuleQuiz, recordCaseStudyStep, completeCaseStudy, recordTradeClose, resetProgress, ...data } = state;
        return data;
      },
    },
  ),
);
