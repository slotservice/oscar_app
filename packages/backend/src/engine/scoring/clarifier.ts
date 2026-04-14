/**
 * OSCAR Scoring — B. Clarifier Stability (25 points max)
 * Rules CLR-01 through CLR-08
 */

import { EvaluationContext, RuleResult } from './types';
import { getVal, getTrend, hasField, classifyFlowSpike, isLow, DEFAULTS } from './helpers';

export function evaluateClarifier(ctx: EvaluationContext): RuleResult[] {
  const results: RuleResult[] = [];
  const cat = 'Clarifier Stability' as const;

  const blanketTrend = getTrend(ctx, 'Blanket Depth', 3);
  const blanket = getVal(ctx, 'Blanket Depth');
  const rasRate = getVal(ctx, 'RAS Rate');
  const rasConc = getVal(ctx, 'RAS Concentration');
  const settle = getVal(ctx, 'Settleability');
  const flowTrend = getTrend(ctx, 'Influent Flow', 1);
  const flowSpike = classifyFlowSpike(flowTrend.changePercent);

  // CLR-01: Blanket stable
  if (hasField(ctx, 'Blanket Depth') && blanketTrend.direction === 'stable') {
    results.push({
      ruleId: 'CLR-01', category: cat, title: 'Clarifier Stable',
      severityLevel: 1, deduction: 0,
      message: 'Clarifier solids inventory appears stable.',
      confidence: 'neutral', supportingFields: ['Blanket Depth'],
    });
  }

  // CLR-02: Blanket slowly rising
  if (hasField(ctx, 'Blanket Depth') && blanketTrend.direction === 'rising' &&
      (blanket === null || blanket < DEFAULTS.BLANKET_HIGH)) {
    results.push({
      ruleId: 'CLR-02', category: cat, title: 'Blanket Rising',
      severityLevel: 2, deduction: 5,
      message: 'Blanket depth is increasing and should be watched.',
      confidence: 'neutral', supportingFields: ['Blanket Depth'],
    });
  }

  // CLR-03: Blanket rising significantly
  if (blanket !== null && blanket >= DEFAULTS.BLANKET_HIGH) {
    results.push({
      ruleId: 'CLR-03', category: cat, title: 'Blanket High',
      severityLevel: 3, deduction: 10,
      message: 'Clarifier stress is increasing.',
      confidence: 'neutral', supportingFields: ['Blanket Depth'],
    });
  }

  // CLR-04: Blanket rising + RAS rate low
  if (blanketTrend.direction === 'rising' && rasRate !== null &&
      hasField(ctx, 'RAS Rate') && getTrend(ctx, 'RAS Rate', 3).direction !== 'rising') {
    results.push({
      ruleId: 'CLR-04', category: cat, title: 'Return Rate Concern',
      severityLevel: 3, deduction: 6,
      message: 'Return sludge rate may be insufficient for current clarifier conditions.',
      confidence: 'medium', supportingFields: ['Blanket Depth', 'RAS Rate'],
    });
  }

  // CLR-05: Blanket rising + RAS concentration weak
  if (blanketTrend.direction === 'rising' && rasConc !== null && rasConc < DEFAULTS.RAS_CONC_LOW) {
    results.push({
      ruleId: 'CLR-05', category: cat, title: 'Weak Return Sludge',
      severityLevel: 3, deduction: 6,
      message: 'Return sludge appears weak relative to clarifier demand.',
      confidence: 'high', supportingFields: ['Blanket Depth', 'RAS Concentration'],
    });
  }

  // CLR-06: Settleability worsening
  if (settle !== null && settle > DEFAULTS.SETTLE_POOR) {
    results.push({
      ruleId: 'CLR-06', category: cat, title: 'Poor Settling',
      severityLevel: 3, deduction: 4,
      message: 'Settling performance appears to be weakening.',
      confidence: 'high', supportingFields: ['Settleability'],
    });
  }

  // CLR-07: Poor settleability + rising blanket
  if (settle !== null && settle > DEFAULTS.SETTLE_POOR && blanketTrend.direction === 'rising') {
    results.push({
      ruleId: 'CLR-07', category: cat, title: 'Settling-driven Clarifier Stress',
      severityLevel: 4, deduction: 8,
      message: 'Clarifier stress may be driven by reduced settling quality.',
      confidence: 'high', supportingFields: ['Settleability', 'Blanket Depth'],
    });
  }

  // CLR-08: Flow spike + rising blanket
  if (flowSpike !== 'normal' && blanketTrend.direction === 'rising') {
    results.push({
      ruleId: 'CLR-08', category: cat, title: 'Hydraulic Clarifier Load',
      severityLevel: 3, deduction: 6,
      message: 'Increased hydraulic load may be affecting clarification.',
      confidence: 'medium', supportingFields: ['Influent Flow', 'Blanket Depth'],
    });
  }

  return results;
}
