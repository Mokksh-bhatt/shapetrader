import { SHAPES } from '@/data/candlestickShapes/shapes';
import type { ModuleId } from '@/lib/constants';
import type { ProgressState } from './types';

export const PATTERN_TARGET = 8;
export const CASE_STUDY_TARGET = 4;
export const TRADE_TARGET = 5;

export interface ModuleSummary {
  id: ModuleId;
  step: number;
  title: string;
  blurb: string;
  route: string;
  /** 0..1 */
  progress: number;
  detail: string;
  done: boolean;
}

export function summarizeModules(s: ProgressState): ModuleSummary[] {
  const shapesSeen = SHAPES.filter((shape) => (s.shapesMastered[shape.id] ?? 0) > 0).length;
  const patternsSeen = Object.values(s.patternsMastered).filter((n) => n > 0).length;
  const casesDone = Object.values(s.caseStudies).filter((c) => c.quizPassed).length;
  const tradesClosed = s.trading.closed;

  return [
    {
      id: 'candlesticks',
      step: 1,
      title: 'Candle Lab',
      blurb: 'Build a hammer with your own hands, then hunt one down in a live chart.',
      route: '/candlesticks',
      progress: shapesSeen / SHAPES.length,
      detail: `${shapesSeen}/${SHAPES.length} shapes mastered`,
      done: s.modules.candlesticks.quizCompleted,
    },
    {
      id: 'patterns',
      step: 2,
      title: 'Shape Hunt',
      blurb: 'Find the shape hiding in the chart — then watch whether it actually pays off.',
      route: '/patterns',
      progress: patternsSeen / PATTERN_TARGET,
      detail: `${patternsSeen}/${PATTERN_TARGET} shapes hunted`,
      done: s.modules.patterns.quizCompleted,
    },
    {
      id: 'caseStudies',
      step: 3,
      title: 'Story Time',
      blurb: 'Four true market stories — the dot-com bust, 2008, COVID — told candle by candle.',
      route: '/case-studies',
      progress: casesDone / CASE_STUDY_TARGET,
      detail: `${casesDone}/${CASE_STUDY_TARGET} stories finished`,
      done: casesDone >= CASE_STUDY_TARGET,
    },
    {
      id: 'simulator',
      step: 4,
      title: 'Trading Floor',
      blurb: 'Take the desk for real: order types, position size, stops, and your own P&L.',
      route: '/simulator',
      progress: Math.min(tradesClosed / TRADE_TARGET, 1),
      detail: tradesClosed === 0 ? 'No trades yet' : `${tradesClosed} trades closed`,
      done: s.modules.simulator.quizCompleted || tradesClosed >= TRADE_TARGET,
    },
  ];
}

/** What the Home screen should point at next. */
export function nextModule(s: ProgressState): ModuleSummary {
  const modules = summarizeModules(s);
  return modules.find((m) => !m.done && m.progress < 1) ?? modules[modules.length - 1];
}
