import type { CaseStudyDataset } from './types';
import { DOTCOM_2000 } from './dotcom-2000';
import { FINANCIAL_CRISIS_2008 } from './financial-crisis-2008';
import { COVID_CRASH_2020 } from './covid-crash-2020';
import { STEADY_BULL_2017 } from './steady-bull-2017';

/** Chronological order — also the order shown in the case studies grid. */
export const CASE_STUDIES: CaseStudyDataset[] = [
  DOTCOM_2000,
  FINANCIAL_CRISIS_2008,
  COVID_CRASH_2020,
  STEADY_BULL_2017,
];

export const CASE_STUDY_BY_ID: Record<string, CaseStudyDataset> = Object.fromEntries(
  CASE_STUDIES.map((cs) => [cs.id, cs]),
);

/** Safe lookup for the `:caseId` route param — returns undefined rather than
 *  throwing on an unknown or missing id, so the screen can render a friendly
 *  "not found" state instead of crashing. */
export function getCaseStudy(id: string | undefined): CaseStudyDataset | undefined {
  if (!id) return undefined;
  return CASE_STUDY_BY_ID[id];
}

export type { CaseStudyDataset, NarrativeStep, RecapQuestion, RecapQuestionOption } from './types';
