/**
 * OSCAR Scoring — E. Operator Concern Flags (10 points max)
 * Rules OPS-01 through OPS-05
 */

import { EvaluationContext, RuleResult } from './types';

// Tags that count as "serious" vs "mild" concerns
const SERIOUS_TAGS = new Set([
  'Equipment issue',
  'Solids carryover',
  'Floating sludge',
]);

const MILD_TAGS = new Set([
  'Foam increase',
  'Pin floc observed',
  'Cloudy effluent',
  'Septic odor',
  'Dark sludge',
  'Poor visible settling',
  'Unusual flow condition',
  'Other concern',
]);

export function evaluateOperatorFlags(ctx: EvaluationContext): RuleResult[] {
  const results: RuleResult[] = [];
  const cat = 'Operator Concern Flags' as const;

  const tags = ctx.currentTags;
  const mildCount = [...tags].filter((t) => MILD_TAGS.has(t)).length;
  const seriousCount = [...tags].filter((t) => SERIOUS_TAGS.has(t)).length;
  const totalConcerns = mildCount + seriousCount;

  // OPS-01: No concern flags
  if (totalConcerns === 0) {
    results.push({
      ruleId: 'OPS-01', category: cat, title: 'No Concerns',
      severityLevel: 1, deduction: 0,
      message: 'No unusual operator concerns were reported.',
      confidence: 'neutral', supportingFields: [],
    });
    return results;
  }

  // OPS-05: Equipment issue or serious concern
  if (seriousCount > 0) {
    results.push({
      ruleId: 'OPS-05', category: cat, title: 'Serious Operator Concern',
      severityLevel: 4, deduction: Math.min(6 + (seriousCount - 1) * 2, 10),
      message: 'Equipment conditions may be affecting plant stability.',
      confidence: 'medium', supportingFields: [...tags].filter((t) => SERIOUS_TAGS.has(t)),
    });
  }

  // OPS-04: Serious visual/process concern (multiple mild)
  if (mildCount >= 3 && seriousCount === 0) {
    results.push({
      ruleId: 'OPS-04', category: cat, title: 'Elevated Process Concern',
      severityLevel: 3, deduction: 6,
      message: 'Operator observations indicate elevated process concern.',
      confidence: 'medium', supportingFields: [...tags].filter((t) => MILD_TAGS.has(t)),
    });
  }
  // OPS-03: Multiple mild concerns
  else if (mildCount >= 2 && seriousCount === 0) {
    results.push({
      ruleId: 'OPS-03', category: cat, title: 'Multiple Concerns',
      severityLevel: 2, deduction: 4,
      message: 'Operator observations indicate multiple developing concerns.',
      confidence: 'medium', supportingFields: [...tags].filter((t) => MILD_TAGS.has(t)),
    });
  }
  // OPS-02: One mild concern
  else if (mildCount === 1 && seriousCount === 0) {
    results.push({
      ruleId: 'OPS-02', category: cat, title: 'Mild Concern',
      severityLevel: 2, deduction: 2,
      message: 'Operator observations suggest a mild process concern.',
      confidence: 'medium', supportingFields: [...tags].filter((t) => MILD_TAGS.has(t)),
    });
  }

  return results;
}
