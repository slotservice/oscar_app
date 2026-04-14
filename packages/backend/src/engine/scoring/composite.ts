/**
 * OSCAR Scoring — Composite Escalation Rules (CMP-01 to CMP-05)
 * These run AFTER all category rules and add additional deductions.
 */

import { EvaluationContext, RuleResult, CategoryScore } from './types';
import { getVal, getTrend, isLow, DEFAULTS } from './helpers';

export function evaluateComposite(
  ctx: EvaluationContext,
  categoryScores: CategoryScore[],
): RuleResult[] {
  const results: RuleResult[] = [];
  const cat = 'Composite' as const;

  // Count categories at moderate concern (score < 70% of max) or worse
  const moderateCategories = categoryScores.filter(
    (cs) => cs.maxPoints > 0 && cs.score < cs.maxPoints * 0.7
  );
  const highRiskCategories = categoryScores.filter(
    (cs) => cs.maxPoints > 0 && cs.score < cs.maxPoints * 0.5
  );

  // Collect all triggered rules across categories
  const allTriggered = categoryScores.flatMap((cs) => cs.triggeredRules);
  const maxSeverity = Math.max(0, ...allTriggered.map((r) => r.severityLevel));

  // CMP-01: Two categories at moderate concern or worse
  if (moderateCategories.length >= 2 && maxSeverity < 4) {
    results.push({
      ruleId: 'CMP-01', category: cat, title: 'System Drifting',
      severityLevel: 3, deduction: 4,
      message: 'Multiple plant stability indicators are showing concern.',
      confidence: 'medium',
      supportingFields: moderateCategories.map((cs) => cs.category),
    });
  }

  // CMP-02: One high-risk rule + additional moderate
  if (highRiskCategories.length >= 1 && moderateCategories.length >= 2) {
    results.push({
      ruleId: 'CMP-02', category: cat, title: 'Elevated Instability',
      severityLevel: 4, deduction: 6,
      message: 'Plant conditions indicate elevated instability risk.',
      confidence: 'medium',
      supportingFields: highRiskCategories.map((cs) => cs.category),
    });
  }

  // CMP-03: Low DO + rising blanket + operator concern
  const doVal = getVal(ctx, 'DO');
  const blanketTrend = getTrend(ctx, 'Blanket Depth', 3);
  const hasConcernTag = ctx.currentTags.size > 0;

  if (isLow(doVal, DEFAULTS.DO_LOW) && blanketTrend.direction === 'rising' && hasConcernTag) {
    results.push({
      ruleId: 'CMP-03', category: cat, title: 'Bio + Clarifier Stress',
      severityLevel: 3, deduction: 6,
      message: 'Biological and clarifier signals both suggest emerging instability.',
      confidence: 'medium',
      supportingFields: ['DO', 'Blanket Depth', 'Operator Observations'],
    });
  }

  // CMP-04: Flow surge + MLSS decline + blanket rise
  const flowTrend = getTrend(ctx, 'Influent Flow', 1);
  const mlssTrend = getTrend(ctx, 'MLSS', 3);

  if (flowTrend.changePercent > DEFAULTS.FLOW_SIGNIFICANT_SPIKE &&
      mlssTrend.direction === 'falling' && blanketTrend.direction === 'rising') {
    results.push({
      ruleId: 'CMP-04', category: cat, title: 'Hydraulic + Solids + Clarifier',
      severityLevel: 4, deduction: 8,
      message: 'Hydraulic change may be affecting both biomass retention and clarification.',
      confidence: 'medium',
      supportingFields: ['Influent Flow', 'MLSS', 'Blanket Depth'],
    });
  }

  // STAB-07: MLSS drop + blanket rise + low DO (from Logic Matrix Part 1)
  if (mlssTrend.direction === 'falling' && blanketTrend.direction === 'rising' &&
      isLow(doVal, DEFAULTS.DO_LOW)) {
    results.push({
      ruleId: 'STAB-07', category: cat, title: 'System Instability',
      severityLevel: 4, deduction: 8,
      message: 'Multiple indicators show instability — declining biomass, rising blanket, and low oxygen.',
      confidence: 'high',
      supportingFields: ['MLSS', 'Blanket Depth', 'DO'],
    });
  }

  // CMP-05: Ammonia rise + low DO + cold temperature
  const ammoniaTrend = getTrend(ctx, 'Ammonia', 3);
  const temp = getVal(ctx, 'Temperature');

  if (ammoniaTrend.direction === 'rising' && isLow(doVal, DEFAULTS.DO_LOW) &&
      temp !== null && temp < DEFAULTS.COLD_TEMP) {
    results.push({
      ruleId: 'CMP-05', category: cat, title: 'Nitrification Risk',
      severityLevel: 4, deduction: 8,
      message: 'Conditions are consistent with reduced nitrification margin.',
      confidence: 'high',
      supportingFields: ['Ammonia', 'DO', 'Temperature'],
    });
  }

  return results;
}
