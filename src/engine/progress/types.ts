import type { ModuleId } from '@/lib/constants';
import type { ShapeId } from '@/engine/candles/types';

export interface ModuleProgress {
  attempted: number;
  correct: number;
  quizCompleted: boolean;
  lessonsRead: string[];
}

export interface CaseStudyProgress {
  stepsCompleted: number;
  totalSteps: number;
  quizPassed: boolean;
}

export interface TradingRecord {
  closed: number;
  wins: number;
  withRiskControls: number;
  bestPnl: number;
}

export interface QuizAttempt {
  id: string;
  moduleId: ModuleId;
  questionLabel: string;
  answerLabel: string;
  correct: boolean;
  at: string;
}

export interface DayStreak {
  current: number;
  longest: number;
  lastActiveISO: string | null;
  /** Last 14 active days, newest last — drives the streak calendar. */
  activeDays: string[];
}

export interface ProgressState {
  version: number;
  xp: number;
  answerStreak: number;
  bestAnswerStreak: number;
  dayStreak: DayStreak;
  modules: Record<ModuleId, ModuleProgress>;
  caseStudies: Record<string, CaseStudyProgress>;
  shapesMastered: Partial<Record<ShapeId, number>>;
  patternsMastered: Record<string, number>;
  trading: TradingRecord;
  badges: Record<string, string>; // badgeId -> unlocked ISO timestamp
  history: QuizAttempt[];
}

export type BadgeId =
  | 'first-candle'
  | 'shape-collector'
  | 'pattern-spotter'
  | 'sharp-eye'
  | 'historian'
  | 'time-traveller'
  | 'first-trade'
  | 'risk-manager'
  | 'in-the-green'
  | 'completionist';
