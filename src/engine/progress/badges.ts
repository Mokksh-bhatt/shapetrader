import { SHAPES } from '@/data/candlestickShapes/shapes';
import type { BadgeId, ProgressState } from './types';

export interface BadgeDefinition {
  id: BadgeId;
  name: string;
  /** Shown while locked, so the badge doubles as a to-do list. */
  requirement: string;
  icon: string; // lucide-react icon name
  check: (s: ProgressState) => boolean;
}

export const BADGES: BadgeDefinition[] = [
  {
    id: 'first-candle',
    name: 'First Candle',
    requirement: 'Identify your first candlestick correctly',
    icon: 'Flame',
    check: (s) => s.modules.candlesticks.correct >= 1,
  },
  {
    id: 'shape-collector',
    name: 'Shape Collector',
    requirement: 'Correctly identify all 8 candlestick shapes at least once',
    icon: 'Shapes',
    check: (s) => SHAPES.every((shape) => (s.shapesMastered[shape.id] ?? 0) >= 1),
  },
  {
    id: 'pattern-spotter',
    name: 'Pattern Spotter',
    requirement: 'Get 5 chart patterns right',
    icon: 'Triangle',
    check: (s) => s.modules.patterns.correct >= 5,
  },
  {
    id: 'sharp-eye',
    name: 'Sharp Eye',
    requirement: 'Answer 5 questions correctly in a row',
    icon: 'Eye',
    check: (s) => s.bestAnswerStreak >= 5,
  },
  {
    id: 'historian',
    name: 'Historian',
    requirement: 'Finish a market case study',
    icon: 'BookOpen',
    check: (s) => Object.values(s.caseStudies).some((c) => c.quizPassed),
  },
  {
    id: 'time-traveller',
    name: 'Time Traveller',
    requirement: 'Finish every market case study',
    icon: 'History',
    check: (s) => {
      const done = Object.values(s.caseStudies).filter((c) => c.quizPassed).length;
      return done >= 4;
    },
  },
  {
    id: 'first-trade',
    name: 'First Trade',
    requirement: 'Open and close a trade in the simulator',
    icon: 'ArrowLeftRight',
    check: (s) => s.trading.closed >= 1,
  },
  {
    id: 'risk-manager',
    name: 'Risk Manager',
    requirement: 'Close 3 trades that had a stop loss set',
    icon: 'ShieldCheck',
    check: (s) => s.trading.withRiskControls >= 3,
  },
  {
    id: 'in-the-green',
    name: 'In The Green',
    requirement: 'Close 3 profitable trades',
    icon: 'TrendingUp',
    check: (s) => s.trading.wins >= 3,
  },
  {
    id: 'completionist',
    name: 'Completionist',
    requirement: 'Complete every module quiz',
    icon: 'Trophy',
    check: (s) => Object.values(s.modules).every((m) => m.quizCompleted),
  },
];

export const BADGE_BY_ID = Object.fromEntries(BADGES.map((b) => [b.id, b])) as Record<
  BadgeId,
  BadgeDefinition
>;

/** Returns the ids that have just become true and were not already unlocked. */
export function newlyUnlocked(state: ProgressState): BadgeId[] {
  return BADGES.filter((b) => !state.badges[b.id] && b.check(state)).map((b) => b.id);
}
