/**
 * OSCAR Scoring — C. Biological Support (25 points max)
 * Rules BIO-01 through BIO-09
 */

import { EvaluationContext, RuleResult } from './types';
import { getVal, getTrend, hasField, isLow, classifyDrift, DEFAULTS } from './helpers';

export function evaluateBiological(ctx: EvaluationContext): RuleResult[] {
  const results: RuleResult[] = [];
  const cat = 'Biological Support' as const;

  const doVal = getVal(ctx, 'DO');
  const temp = getVal(ctx, 'Temperature');
  const ammonia = getVal(ctx, 'Ammonia');
  const doTrend = getTrend(ctx, 'DO', 3);
  const ammoniaTrend = getTrend(ctx, 'Ammonia', 3);
  const mlss = getVal(ctx, 'MLSS');
  const mlssTrend = getTrend(ctx, 'MLSS', 3, DEFAULTS.MLSS_STABLE_BAND);

  const doIsLow = isLow(doVal, DEFAULTS.DO_LOW);
  const doIsBorderline = doVal !== null && doVal >= DEFAULTS.DO_LOW && doVal < DEFAULTS.DO_BORDERLINE;

  // BIO-01: DO adequate
  if (doVal !== null && doVal >= DEFAULTS.DO_BORDERLINE) {
    results.push({
      ruleId: 'BIO-01', category: cat, title: 'Oxygen Adequate',
      severityLevel: 1, deduction: 0,
      message: 'Oxygen conditions appear adequate.',
      confidence: 'neutral', supportingFields: ['DO'],
    });
  }

  // BIO-02: DO slightly below target or declining
  if (doIsBorderline || (doTrend.direction === 'falling' && !doIsLow)) {
    results.push({
      ruleId: 'BIO-02', category: cat, title: 'Oxygen Declining',
      severityLevel: 2, deduction: 5,
      message: 'Oxygen margin is decreasing.',
      confidence: 'neutral', supportingFields: ['DO'],
    });
  }

  // BIO-03: DO clearly low
  if (doIsLow) {
    results.push({
      ruleId: 'BIO-03', category: cat, title: 'Low Oxygen',
      severityLevel: 3, deduction: 10,
      message: 'Low oxygen may be limiting biological performance.',
      confidence: 'neutral', supportingFields: ['DO'],
    });
  }

  // OXY-03: Low DO + MLSS stable → biology present but unsupported (from Logic Matrix Part 1)
  if (doIsLow && hasField(ctx, 'MLSS') && classifyDrift(mlssTrend.changePercent) === 'stable') {
    results.push({
      ruleId: 'OXY-03', category: cat, title: 'Biology Unsupported',
      severityLevel: 3, deduction: 5,
      message: 'Biomass adequate but oxygen may be limiting.',
      confidence: 'medium', supportingFields: ['DO', 'MLSS'],
    });
  }

  // BIO-04: Cold temperature reducing process margin
  if (temp !== null && temp < DEFAULTS.COLD_TEMP && temp >= DEFAULTS.SEVERE_COLD) {
    results.push({
      ruleId: 'BIO-04', category: cat, title: 'Cold Temperature',
      severityLevel: 2, deduction: 2,
      message: 'Lower temperature may be reducing biological resilience.',
      confidence: 'medium', supportingFields: ['Temperature'],
    });
  }

  // BIO-05: Cold temperature + low DO
  if (temp !== null && temp < DEFAULTS.SEVERE_COLD && doIsLow) {
    results.push({
      ruleId: 'BIO-05', category: cat, title: 'Cold + Low Oxygen',
      severityLevel: 3, deduction: 4,
      message: 'Cold weather and low oxygen may both be reducing process stability.',
      confidence: 'medium', supportingFields: ['Temperature', 'DO'],
    });
  }

  // BIO-06: Ammonia slightly rising
  if (ammonia !== null && ammoniaTrend.direction === 'rising' &&
      ammoniaTrend.changePercent <= DEFAULTS.AMMONIA_HIGH_RISE) {
    results.push({
      ruleId: 'BIO-06', category: cat, title: 'Ammonia Mild Rise',
      severityLevel: 2, deduction: 4,
      message: 'Ammonia trend suggests reduced biological performance margin.',
      confidence: 'high', supportingFields: ['Ammonia'],
    });
  }

  // BIO-07: Ammonia clearly rising
  if (ammonia !== null && ammoniaTrend.direction === 'rising' &&
      ammoniaTrend.changePercent > DEFAULTS.AMMONIA_HIGH_RISE) {
    results.push({
      ruleId: 'BIO-07', category: cat, title: 'Ammonia Rising',
      severityLevel: 3, deduction: 8,
      message: 'Rising ammonia indicates biological performance is declining.',
      confidence: 'high', supportingFields: ['Ammonia'],
    });
  }

  // BIO-08: Low DO + rising ammonia
  if (doIsLow && ammonia !== null && ammoniaTrend.direction === 'rising') {
    results.push({
      ruleId: 'BIO-08', category: cat, title: 'Oxygen-driven Failure',
      severityLevel: 4, deduction: 10,
      message: 'Oxygen limitation is likely affecting treatment performance.',
      confidence: 'high', supportingFields: ['DO', 'Ammonia'],
    });
  }

  // BIO-09: Low MLSS + rising ammonia
  if (mlss !== null && classifyDrift(mlssTrend.changePercent) === 'significant' &&
      mlssTrend.direction === 'falling' && ammonia !== null && ammoniaTrend.direction === 'rising') {
    results.push({
      ruleId: 'BIO-09', category: cat, title: 'Biomass Deficiency',
      severityLevel: 4, deduction: 10,
      message: 'Biomass inventory may be insufficient for current treatment demand.',
      confidence: 'high', supportingFields: ['MLSS', 'Ammonia'],
    });
  }

  return results;
}
