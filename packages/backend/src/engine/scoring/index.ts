/**
 * OSCAR Scoring Engine — Orchestrator
 *
 * Runs all 5 category evaluations + composite escalation.
 * Produces the Stability Index output.
 *
 * Flow:
 * 1. Build EvaluationContext from DB data
 * 2. Run categories 1-5 (Solids, Clarifier, Biological, Hydraulic, Operator)
 * 3. Compute category scores (start from max, subtract deductions, cap at 0)
 * 4. Run composite escalation rules
 * 5. Calculate raw score (sum of category scores - composite deductions)
 * 6. Smooth displayed score with prior 2 days
 * 7. Calculate confidence from data completeness
 * 8. Determine primary concern + supporting messages + guidance
 */

import { EvaluationContext, RuleResult, CategoryScore, StabilityOutput, CATEGORY_CAPS, getStatusBand, ScoringCategory } from './types';
import { evaluateSolids } from './solids';
import { evaluateClarifier } from './clarifier';
import { evaluateBiological } from './biological';
import { evaluateHydraulic } from './hydraulic';
import { evaluateOperatorFlags } from './operator-flags';
import { evaluateComposite } from './composite';
import { calculateConfidence } from './confidence';
import { smoothScore } from './smoothing';

/**
 * Run the full OSCAR scoring engine.
 */
export function runScoringEngine(
  ctx: EvaluationContext,
  yesterdayDisplayScore: number | null,
  twoDaysAgoDisplayScore: number | null,
): StabilityOutput {

  // ─── Step 1: Run category rules ──────────────────────
  const categoryRules: Array<{ category: ScoringCategory; rules: RuleResult[] }> = [
    { category: 'Solids Stability', rules: evaluateSolids(ctx) },
    { category: 'Clarifier Stability', rules: evaluateClarifier(ctx) },
    { category: 'Biological Support', rules: evaluateBiological(ctx) },
    { category: 'Hydraulic Stability', rules: evaluateHydraulic(ctx) },
    { category: 'Operator Concern Flags', rules: evaluateOperatorFlags(ctx) },
  ];

  // ─── Step 2: Compute category scores ─────────────────
  const categoryScores: CategoryScore[] = categoryRules.map(({ category, rules }) => {
    const maxPts = CATEGORY_CAPS[category];
    const totalDeductions = rules.reduce((sum, r) => sum + r.deduction, 0);
    const capped = Math.min(totalDeductions, maxPts);
    return {
      category,
      maxPoints: maxPts,
      deductions: capped,
      score: maxPts - capped,
      triggeredRules: rules.filter((r) => r.deduction > 0),
    };
  });

  // ─── Step 3: Run composite escalation ────────────────
  const compositeRules = evaluateComposite(ctx, categoryScores);

  // ─── Step 4: Calculate raw score ─────────────────────
  const categoryTotal = categoryScores.reduce((sum, cs) => sum + cs.score, 0);
  const compositeDeductions = compositeRules.reduce((sum, r) => sum + r.deduction, 0);
  const rawScore = Math.max(0, Math.min(100, categoryTotal - compositeDeductions));

  // ─── Step 5: Smooth display score ────────────────────
  const displayScore = smoothScore(rawScore, yesterdayDisplayScore, twoDaysAgoDisplayScore);

  // ─── Step 6: Confidence ──────────────────────────────
  const confidence = calculateConfidence(ctx);

  // ─── Step 7: Determine status band ───────────────────
  const statusBand = getStatusBand(displayScore);

  // ─── Step 8: All triggered rules ─────────────────────
  const allTriggered = [
    ...categoryScores.flatMap((cs) => cs.triggeredRules),
    ...compositeRules.filter((r) => r.deduction > 0),
  ];

  // Sort by severity (highest first), then deduction (highest first)
  allTriggered.sort((a, b) => b.severityLevel - a.severityLevel || b.deduction - a.deduction);

  // ─── Step 9: Primary concern + messages ──────────────
  const primaryConcern = allTriggered.length > 0
    ? allTriggered[0].message
    : 'Plant operating normally.';

  const supportingMessages = allTriggered
    .slice(0, 3)
    .map((r) => r.message);

  // Generate operator guidance from top concerns
  const guidanceMap: Record<string, string> = {
    'Solids Stability': 'Evaluate wasting relative to MLSS trend.',
    'Clarifier Stability': 'Watch clarifier trend over the next 48 hours.',
    'Biological Support': 'Review aeration conditions.',
    'Hydraulic Stability': 'Monitor flow conditions and downstream impacts.',
    'Operator Concern Flags': 'Address reported concerns promptly.',
    'Composite': 'Multiple areas need attention — prioritize highest risk.',
  };

  const guidanceCategories = new Set(allTriggered.slice(0, 3).map((r) => r.category));
  const operatorGuidance = [...guidanceCategories]
    .map((c) => guidanceMap[c])
    .filter(Boolean);

  if (operatorGuidance.length === 0) {
    operatorGuidance.push('No specific actions needed at this time.');
  }

  return {
    rawScore,
    displayScore,
    statusBand,
    confidenceLevel: confidence.level,
    primaryConcern,
    supportingMessages,
    triggeredRules: allTriggered,
    operatorGuidance,
    categoryScores,
  };
}

/**
 * Build EvaluationContext from database data.
 */
export function buildContext(
  roundId: string,
  plantId: string,
  currentLabEntries: Array<{ value: number; labField: { name: string } }>,
  currentObservations: Array<{ tag: { name: string } }>,
  recentRounds: Array<{ labEntries: Array<{ value: number; labField: { name: string } }> }>,
): EvaluationContext {
  // Current values
  const currentValues = new Map<string, number>();
  for (const entry of currentLabEntries) {
    currentValues.set(entry.labField.name, entry.value);
  }

  // Current tags
  const currentTags = new Set<string>();
  for (const obs of currentObservations) {
    currentTags.add(obs.tag.name);
  }

  // Historical values (newest first — recentRounds already sorted by date desc)
  const history = new Map<string, number[]>();
  for (const round of recentRounds) {
    for (const entry of round.labEntries) {
      const fieldName = entry.labField.name;
      if (!history.has(fieldName)) history.set(fieldName, []);
      history.get(fieldName)!.push(entry.value);
    }
  }

  return {
    roundId,
    plantId,
    currentValues,
    currentTags,
    history,
    historyDays: recentRounds.length,
  };
}
