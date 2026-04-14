/**
 * OSCAR Scoring — A. Solids Stability (25 points max)
 * Rules SOL-01 through SOL-07
 */

import { EvaluationContext, RuleResult } from './types';
import { getVal, getTrend, classifyDrift, hasField, hasHistory, DEFAULTS } from './helpers';

export function evaluateSolids(ctx: EvaluationContext): RuleResult[] {
  const results: RuleResult[] = [];
  const cat = 'Solids Stability' as const;

  const mlss = getVal(ctx, 'MLSS');
  const mlssTrend = getTrend(ctx, 'MLSS', 3, DEFAULTS.MLSS_STABLE_BAND);
  const mlssDrift = classifyDrift(mlssTrend.changePercent);
  const wasTrend = getTrend(ctx, 'WAS Rate', 3);
  const wasConc = getVal(ctx, 'WAS Concentration');

  // SOL-01: MLSS within stable band
  if (hasField(ctx, 'MLSS') && mlssDrift === 'stable') {
    results.push({
      ruleId: 'SOL-01', category: cat, title: 'Solids Stable',
      severityLevel: 1, deduction: 0,
      message: 'Biomass inventory appears stable.',
      confidence: 'neutral', supportingFields: ['MLSS'],
    });
  }

  // SOL-02: MLSS mild drift
  if (hasField(ctx, 'MLSS') && mlssDrift === 'mild') {
    results.push({
      ruleId: 'SOL-02', category: cat, title: 'Biomass Drift',
      severityLevel: 2, deduction: 4,
      message: 'Biomass inventory is beginning to drift.',
      confidence: 'neutral', supportingFields: ['MLSS'],
    });
  }

  // SOL-03: MLSS significant drift
  if (hasField(ctx, 'MLSS') && mlssDrift === 'significant') {
    results.push({
      ruleId: 'SOL-03', category: cat, title: 'Biomass Significant Drift',
      severityLevel: 3, deduction: 8,
      message: 'Biomass inventory is moving outside a comfortable range.',
      confidence: 'neutral', supportingFields: ['MLSS'],
    });
  }

  // SOL-04: MLSS declining + WAS unchanged/high → over-wasting
  if (hasField(ctx, 'MLSS') && hasField(ctx, 'WAS Rate') &&
      mlssTrend.direction === 'falling' && wasTrend.direction !== 'falling') {
    results.push({
      ruleId: 'SOL-04', category: cat, title: 'Possible Over-wasting',
      severityLevel: 3, deduction: 6,
      message: 'Current wasting may be reducing biomass inventory.',
      confidence: 'medium', supportingFields: ['MLSS', 'WAS Rate'],
    });
  }

  // SOL-05: MLSS rising + WAS low → under-wasting
  if (hasField(ctx, 'MLSS') && hasField(ctx, 'WAS Rate') &&
      mlssTrend.direction === 'rising' && wasTrend.direction !== 'rising') {
    results.push({
      ruleId: 'SOL-05', category: cat, title: 'Possible Under-wasting',
      severityLevel: 3, deduction: 6,
      message: 'Current wasting may be too light for current solids conditions.',
      confidence: 'medium', supportingFields: ['MLSS', 'WAS Rate'],
    });
  }

  // SOL-06: WAS concentration high during MLSS decline
  if (wasConc !== null && mlssTrend.direction === 'falling' && wasConc > DEFAULTS.WAS_CONC_HIGH) {
    results.push({
      ruleId: 'SOL-06', category: cat, title: 'Strong Solids Removal',
      severityLevel: 2, deduction: 4,
      message: 'Actual solids removal may be stronger than the waste rate suggests.',
      confidence: 'high', supportingFields: ['MLSS', 'WAS Concentration'],
    });
  }

  // SOL-07: WAS concentration low during MLSS rise
  if (wasConc !== null && mlssTrend.direction === 'rising' && wasConc < DEFAULTS.WAS_CONC_LOW) {
    results.push({
      ruleId: 'SOL-07', category: cat, title: 'Weak Solids Removal',
      severityLevel: 2, deduction: 4,
      message: 'Waste sludge may be removing fewer solids than expected.',
      confidence: 'high', supportingFields: ['MLSS', 'WAS Concentration'],
    });
  }

  return results;
}
