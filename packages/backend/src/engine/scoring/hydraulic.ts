/**
 * OSCAR Scoring — D. Hydraulic Stability (15 points max)
 * Rules HYD-01 through HYD-05
 */

import { EvaluationContext, RuleResult } from './types';
import { getVal, getTrend, hasField, classifyFlowSpike, classifyDrift, DEFAULTS } from './helpers';

export function evaluateHydraulic(ctx: EvaluationContext): RuleResult[] {
  const results: RuleResult[] = [];
  const cat = 'Hydraulic Stability' as const;

  const flowTrend = getTrend(ctx, 'Influent Flow', 1);
  const flowTrend3 = getTrend(ctx, 'Influent Flow', 3);
  const spike = classifyFlowSpike(flowTrend.changePercent);
  const mlssTrend = getTrend(ctx, 'MLSS', 3, DEFAULTS.MLSS_STABLE_BAND);
  const blanketTrend = getTrend(ctx, 'Blanket Depth', 3);

  // HYD-01: Flow normal
  if (hasField(ctx, 'Influent Flow') && spike === 'normal') {
    results.push({
      ruleId: 'HYD-01', category: cat, title: 'Hydraulic Stable',
      severityLevel: 1, deduction: 0,
      message: 'Hydraulic conditions appear normal.',
      confidence: 'neutral', supportingFields: ['Influent Flow'],
    });
  }

  // HYD-02: Mild flow increase
  if (spike === 'mild') {
    results.push({
      ruleId: 'HYD-02', category: cat, title: 'Mild Flow Increase',
      severityLevel: 2, deduction: 3,
      message: 'Flow has increased above recent baseline.',
      confidence: 'neutral', supportingFields: ['Influent Flow'],
    });
  }

  // HYD-03: Significant flow increase
  if (spike === 'significant') {
    results.push({
      ruleId: 'HYD-03', category: cat, title: 'Significant Flow Increase',
      severityLevel: 3, deduction: 6,
      message: 'Hydraulic load may be stressing the process.',
      confidence: 'neutral', supportingFields: ['Influent Flow'],
    });
  }

  // HYD-04: Major flow surge + MLSS drop → washout risk
  if (spike === 'major' && mlssTrend.direction === 'falling' &&
      classifyDrift(mlssTrend.changePercent) !== 'stable') {
    results.push({
      ruleId: 'HYD-04', category: cat, title: 'Washout Risk',
      severityLevel: 4, deduction: 10,
      message: 'Recent flow conditions may be contributing to solids loss.',
      confidence: 'medium', supportingFields: ['Influent Flow', 'MLSS'],
    });
  }

  // HYD-05: Major flow surge + rising blanket
  if ((spike === 'major' || spike === 'significant') && blanketTrend.direction === 'rising') {
    results.push({
      ruleId: 'HYD-05', category: cat, title: 'Clarifier Overload',
      severityLevel: 3, deduction: 8,
      message: 'Recent flow conditions may be overloading clarification.',
      confidence: 'medium', supportingFields: ['Influent Flow', 'Blanket Depth'],
    });
  }

  return results;
}
