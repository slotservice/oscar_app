/**
 * OSCAR Scoring — Confidence Model
 *
 * Separate from the stability score. Based on data completeness:
 * - Required fields complete = 60 pts
 * - DO present = 15 pts
 * - Ammonia present = 10 pts
 * - Settleability present = 5 pts
 * - RAS Concentration present = 5 pts
 * - WAS Concentration present = 5 pts
 *
 * Mapping:
 * - 85-100 = High
 * - 65-84 = Moderate
 * - below 65 = Limited
 */

import { EvaluationContext } from './types';
import { hasField } from './helpers';

const REQUIRED_FIELDS = ['Influent Flow', 'MLSS', 'RAS Rate', 'WAS Rate', 'Temperature', 'Blanket Depth'];

export function calculateConfidence(ctx: EvaluationContext): {
  level: 'High' | 'Moderate' | 'Limited';
  score: number;
} {
  let score = 0;

  // Required fields (60 pts total, 10 each)
  const requiredPresent = REQUIRED_FIELDS.filter((f) => hasField(ctx, f)).length;
  score += Math.round((requiredPresent / REQUIRED_FIELDS.length) * 60);

  // DO (15 pts)
  if (hasField(ctx, 'DO')) score += 15;

  // Ammonia (10 pts)
  if (hasField(ctx, 'Ammonia')) score += 10;

  // Settleability (5 pts)
  if (hasField(ctx, 'Settleability')) score += 5;

  // RAS Concentration (5 pts)
  if (hasField(ctx, 'RAS Concentration')) score += 5;

  // WAS Concentration (5 pts)
  if (hasField(ctx, 'WAS Concentration')) score += 5;

  let level: 'High' | 'Moderate' | 'Limited';
  if (score >= 85) level = 'High';
  else if (score >= 65) level = 'Moderate';
  else level = 'Limited';

  return { level, score };
}
