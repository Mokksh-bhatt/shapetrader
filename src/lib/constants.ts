/** Storage keys are namespaced AND versioned — bumping the version retires
 *  incompatible saved state instead of crashing on it. */
export const STORAGE_VERSION = 1;
export const PROGRESS_KEY = `shapetrader:progress:v${STORAGE_VERSION}`;
export const PORTFOLIO_KEY = `shapetrader:portfolio:v${STORAGE_VERSION}`;

/** XP awards. Deliberately flat for trading: the game never pays more for a
 *  bigger win, so it can't teach "swing bigger". Discipline is rewarded with
 *  badges instead. */
export const XP = {
  correctAnswer: 10,
  wrongAnswer: 2, // never zero — a wrong answer you learned from still counts
  streakBonus: 5, // every 3 correct in a row
  streakEvery: 3,
  moduleQuizComplete: 25,
  caseStudyComplete: 40,
  tradeClosed: 15,
  lessonRead: 5,
} as const;

/** Fixed curve — predictable and easy to read on screen ("Level 4 of 10"). */
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000] as const;

export const LEVEL_TITLES = [
  'Chart Curious',
  'Candle Reader',
  'Shape Spotter',
  'Pattern Hunter',
  'Trend Follower',
  'Risk Manager',
  'Market Historian',
  'Tape Reader',
  'Position Trader',
  'Market Analyst',
] as const;

export const SIM_STARTING_CASH = 10_000;

export const MODULE_IDS = [
  'candlesticks',
  'patterns',
  'caseStudies',
  'simulator',
] as const;
export type ModuleId = (typeof MODULE_IDS)[number];
