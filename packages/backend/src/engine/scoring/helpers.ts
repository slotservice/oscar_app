/**
 * OSCAR Scoring Engine — Shared Helpers
 *
 * Trend analysis with 1-day, 3-day, and 5-day windows.
 * All threshold comparisons are plant-configurable defaults.
 */

import { EvaluationContext } from './types';

// ─── Field Value Access ─────────────────────────────────

export function getVal(ctx: EvaluationContext, field: string): number | null {
  return ctx.currentValues.get(field) ?? null;
}

export function hasField(ctx: EvaluationContext, field: string): boolean {
  return ctx.currentValues.has(field);
}

export function hasAllFields(ctx: EvaluationContext, fields: string[]): boolean {
  return fields.every((f) => ctx.currentValues.has(f));
}

// ─── History Access ─────────────────────────────────────

/** Get last N days of values for a field (newest first) */
export function getHistory(ctx: EvaluationContext, field: string, days?: number): number[] {
  const hist = ctx.history.get(field) || [];
  return days ? hist.slice(0, days) : hist;
}

export function hasHistory(ctx: EvaluationContext, field: string, minDays: number): boolean {
  return (ctx.history.get(field)?.length ?? 0) >= minDays;
}

// ─── Statistical Helpers ────────────────────────────────

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = average(values);
  return Math.sqrt(values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length);
}

// ─── Trend Analysis ─────────────────────────────────────

export type TrendDirection = 'rising' | 'falling' | 'stable';

/**
 * Compute % change of current value vs historical average.
 * Positive = rising, Negative = falling.
 */
export function percentChange(current: number, historical: number[]): number {
  const avg = average(historical);
  if (avg === 0) return 0;
  return ((current - avg) / Math.abs(avg)) * 100;
}

/**
 * Determine if a field is trending up, down, or stable
 * over the given window (3-day or 5-day).
 *
 * Uses % change from historical average:
 * - Within ±stableThreshold% = stable
 * - Above = rising
 * - Below = falling
 */
export function getTrend(
  ctx: EvaluationContext,
  field: string,
  windowDays: number = 3,
  stableThreshold: number = 5,
): { direction: TrendDirection; changePercent: number } {
  const current = getVal(ctx, field);
  const hist = getHistory(ctx, field, windowDays);

  if (current === null || hist.length < 2) {
    return { direction: 'stable', changePercent: 0 };
  }

  const change = percentChange(current, hist);

  if (Math.abs(change) <= stableThreshold) {
    return { direction: 'stable', changePercent: change };
  }

  return {
    direction: change > 0 ? 'rising' : 'falling',
    changePercent: change,
  };
}

/**
 * Classify MLSS stability per OSCAR spec:
 * - Stable: within ±5%
 * - Mild drift: ±5-10%
 * - Significant drift: >10%
 */
export function classifyDrift(changePercent: number): 'stable' | 'mild' | 'significant' {
  const abs = Math.abs(changePercent);
  if (abs <= 5) return 'stable';
  if (abs <= 10) return 'mild';
  return 'significant';
}

/**
 * Check if a flow spike occurred (% increase from baseline).
 * Returns: 'normal' | 'mild' | 'significant' | 'major'
 */
export function classifyFlowSpike(changePercent: number): 'normal' | 'mild' | 'significant' | 'major' {
  if (changePercent <= 15) return 'normal';
  if (changePercent <= 20) return 'mild';
  if (changePercent <= 30) return 'significant';
  return 'major';
}

/**
 * Check if a value is below a threshold.
 * Default thresholds are configurable per plant (hardcoded defaults for beta).
 */
export function isLow(value: number | null, threshold: number): boolean {
  return value !== null && value < threshold;
}

export function isHigh(value: number | null, threshold: number): boolean {
  return value !== null && value > threshold;
}

// ─── Default Thresholds (beta, plant-configurable later) ─

export const DEFAULTS = {
  DO_LOW: 1.5,
  DO_BORDERLINE: 2.0,
  MLSS_STABLE_BAND: 5,       // ±5%
  MLSS_MILD_BAND: 10,        // ±10%
  BLANKET_CONCERN: 2.5,      // ft
  BLANKET_HIGH: 4.0,         // ft
  FLOW_MILD_SPIKE: 15,       // %
  FLOW_SIGNIFICANT_SPIKE: 20,// %
  FLOW_MAJOR_SPIKE: 30,      // %
  AMMONIA_MILD_RISE: 5,      // % increase
  AMMONIA_HIGH_RISE: 15,     // % increase
  SETTLE_GOOD: 300,          // mL/L
  SETTLE_POOR: 600,          // mL/L
  RAS_CONC_LOW: 3000,        // mg/L
  RAS_CONC_STRONG: 6000,     // mg/L
  WAS_CONC_LOW: 3000,        // mg/L
  WAS_CONC_HIGH: 8000,       // mg/L
  COLD_TEMP: 55,             // °F
  SEVERE_COLD: 45,           // °F
};
