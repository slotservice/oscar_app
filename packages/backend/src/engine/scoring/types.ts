/**
 * OSCAR Scoring Engine — Type Definitions
 *
 * Implements the OSCAR Beta Logic Matrix v1 + Stability Index v1
 * as specified in newchat.md.
 */

// ─── Evaluation Context ─────────────────────────────────

export interface EvaluationContext {
  roundId: string;
  plantId: string;
  /** Current round's lab values: fieldName → value */
  currentValues: Map<string, number>;
  /** Current round's observation tag names */
  currentTags: Set<string>;
  /** Historical values: fieldName → array of values (newest first) */
  history: Map<string, number[]>;
  /** How many days of history loaded */
  historyDays: number;
}

// ─── Rule Results ───────────────────────────────────────

export interface RuleResult {
  ruleId: string;
  category: ScoringCategory;
  title: string;
  severityLevel: number;       // 1-4
  deduction: number;           // points to subtract
  message: string;             // human-readable output text
  confidence: 'high' | 'medium' | 'neutral';
  supportingFields: string[];  // field names involved
}

export type ScoringCategory =
  | 'Solids Stability'
  | 'Clarifier Stability'
  | 'Biological Support'
  | 'Hydraulic Stability'
  | 'Operator Concern Flags'
  | 'Composite';

// ─── Category Score ─────────────────────────────────────

export interface CategoryScore {
  category: ScoringCategory;
  maxPoints: number;
  deductions: number;
  score: number;              // maxPoints - deductions (clamped to 0)
  triggeredRules: RuleResult[];
}

// ─── Final Output ───────────────────────────────────────

export type StatusBand = 'Stable' | 'Slight Drift' | 'Moderate Concern' | 'High Risk';

export interface StabilityOutput {
  rawScore: number;           // 0-100
  displayScore: number;       // smoothed 0-100
  statusBand: StatusBand;
  confidenceLevel: 'High' | 'Moderate' | 'Limited';
  primaryConcern: string;
  supportingMessages: string[];
  triggeredRules: RuleResult[];
  operatorGuidance: string[];
  categoryScores: CategoryScore[];
}

// ─── Category Caps (per newchat.md) ─────────────────────

export const CATEGORY_CAPS: Record<ScoringCategory, number> = {
  'Solids Stability': 25,
  'Clarifier Stability': 25,
  'Biological Support': 25,
  'Hydraulic Stability': 15,
  'Operator Concern Flags': 10,
  'Composite': 0,  // composite deductions apply to total, no cap
};

// ─── Status Band Mapping ────────────────────────────────

export function getStatusBand(score: number): StatusBand {
  if (score >= 85) return 'Stable';
  if (score >= 70) return 'Slight Drift';
  if (score >= 50) return 'Moderate Concern';
  return 'High Risk';
}

export function statusBandToSeverity(band: StatusBand): number {
  switch (band) {
    case 'Stable': return 1;
    case 'Slight Drift': return 2;
    case 'Moderate Concern': return 3;
    case 'High Risk': return 4;
  }
}
