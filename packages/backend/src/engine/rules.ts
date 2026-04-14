import { Severity, Condition } from '@prisma/client';
import { prisma } from '../middleware/auth';
import { runScoringEngine, buildContext } from './scoring/index';
import { getStatusBand, statusBandToSeverity } from './scoring/types';

interface EvaluationResult {
  suggestions: Array<{
    id: string;
    ruleType: string;
    ruleName: string;
    message: string;
    severity: Severity;
    ruleId?: string;
    category?: string;
    title?: string;
    severityLevel?: number;
    deduction?: number;
    confidence?: string;
    supportingFields?: string[];
  }>;
  overallCondition: Condition;
  stabilityScore?: number;
  displayScore?: number;
  statusBand?: string;
  confidenceLevel?: string;
  primaryConcern?: string;
  scoreBreakdown?: any;
  operatorGuidance?: string[];
}

/**
 * Evaluates a daily round using the OSCAR Scoring Engine.
 *
 * Flow:
 * 1. Load current round data + 10 days history
 * 2. Run legacy threshold/tag rules (backward compatibility)
 * 3. Run OSCAR scoring engine (35 rules, stability index)
 * 4. Store suggestions + update round with stability data
 */
export async function evaluateRound(roundId: string, plantId: string): Promise<EvaluationResult> {
  // Clear previous suggestions
  await prisma.suggestion.deleteMany({ where: { roundId } });

  // Load all data in parallel
  const [labEntries, observationEntries, thresholdRules, tagRules, recentRounds] = await Promise.all([
    prisma.labEntry.findMany({
      where: { roundId },
      include: { labField: true },
    }),
    prisma.observationEntry.findMany({
      where: { roundId },
      include: { tag: true },
    }),
    prisma.thresholdRule.findMany({
      where: { plantId, active: true },
      include: { labField: true },
    }),
    prisma.tagRule.findMany({
      where: { plantId, active: true },
      include: { tag: true },
    }),
    getRecentRounds(plantId, roundId, 10),
  ]);

  const createdSuggestions: any[] = [];

  // ─── 1. Legacy Threshold Rules (keep for basic alerting) ─

  for (const rule of thresholdRules) {
    const labEntry = labEntries.find((e) => e.labFieldId === rule.labFieldId);
    if (!labEntry) continue;

    const value = labEntry.value;
    let triggered = false;
    let severity: Severity = 'GREEN';

    if (rule.criticalLow !== null && value < rule.criticalLow) {
      triggered = true; severity = 'CRITICAL';
    } else if (rule.criticalHigh !== null && value > rule.criticalHigh) {
      triggered = true; severity = 'CRITICAL';
    } else if (rule.cautionLow !== null && value < rule.cautionLow) {
      triggered = true; severity = 'CAUTION';
    } else if (rule.cautionHigh !== null && value > rule.cautionHigh) {
      triggered = true; severity = 'CAUTION';
    }

    if (triggered) {
      const suggestion = await prisma.suggestion.create({
        data: {
          roundId,
          ruleType: 'THRESHOLD',
          ruleName: `${rule.labField.name}_CHECK`,
          message: `${rule.labField.name}: ${value} ${rule.labField.unit} — ${rule.suggestionText}`,
          severity,
        },
      });
      createdSuggestions.push(suggestion);
    }
  }

  // ─── 2. Legacy Tag Rules ──────────────────────────────

  for (const rule of tagRules) {
    const hasTag = observationEntries.some((e) => e.tagId === rule.tagId);
    if (hasTag) {
      const suggestion = await prisma.suggestion.create({
        data: {
          roundId,
          ruleType: 'TAG',
          ruleName: `TAG_${rule.tag.name.toUpperCase().replace(/\s+/g, '_')}`,
          message: `${rule.tag.name} observed — ${rule.suggestionText}`,
          severity: rule.severity,
        },
      });
      createdSuggestions.push(suggestion);
    }
  }

  // ─── 3. OSCAR Scoring Engine ──────────────────────────

  // Get prior days' display scores for smoothing
  const priorScores = await getPriorDisplayScores(plantId, roundId, 2);

  // Build evaluation context
  const ctx = buildContext(roundId, plantId, labEntries, observationEntries, recentRounds);

  // Run scoring engine
  const output = runScoringEngine(ctx, priorScores[0], priorScores[1]);

  // Store OSCAR scoring rule suggestions
  for (const rule of output.triggeredRules) {
    // Map severity level to legacy Severity enum
    let legacySeverity: Severity = 'GREEN';
    if (rule.severityLevel >= 4) legacySeverity = 'CRITICAL';
    else if (rule.severityLevel >= 3) legacySeverity = 'CAUTION';

    const suggestion = await prisma.suggestion.create({
      data: {
        roundId,
        ruleType: 'SCORING',
        ruleName: rule.ruleId,
        message: rule.message,
        severity: legacySeverity,
        ruleId: rule.ruleId,
        category: rule.category,
        title: rule.title,
        severityLevel: rule.severityLevel,
        deduction: rule.deduction,
        confidence: rule.confidence,
        supportingFields: rule.supportingFields,
      },
    });
    createdSuggestions.push({
      ...suggestion,
      supportingFields: rule.supportingFields,
    });
  }

  // ─── 4. Compute Overall Condition ─────────────────────

  // Map stability score to 4-level condition
  let overallCondition: Condition;
  if (output.displayScore >= 85) overallCondition = 'GREEN';
  else if (output.displayScore >= 70) overallCondition = 'YELLOW';
  else if (output.displayScore >= 50) overallCondition = 'ORANGE';
  else overallCondition = 'RED';

  // Update round with stability data
  await prisma.dailyRound.update({
    where: { id: roundId },
    data: {
      overallCondition,
      stabilityScore: output.rawScore,
      displayScore: output.displayScore,
      statusBand: output.statusBand,
      confidenceLevel: output.confidenceLevel,
      primaryConcern: output.primaryConcern,
      scoreBreakdown: output.categoryScores.map((cs) => ({
        category: cs.category,
        maxPoints: cs.maxPoints,
        deductions: cs.deductions,
        score: cs.score,
      })),
    },
  });

  return {
    suggestions: createdSuggestions,
    overallCondition,
    stabilityScore: output.rawScore,
    displayScore: output.displayScore,
    statusBand: output.statusBand,
    confidenceLevel: output.confidenceLevel,
    primaryConcern: output.primaryConcern,
    scoreBreakdown: output.categoryScores,
    operatorGuidance: output.operatorGuidance,
  };
}

/**
 * Gets recent completed rounds for trend analysis.
 */
async function getRecentRounds(plantId: string, excludeRoundId: string, days: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return prisma.dailyRound.findMany({
    where: {
      plantId,
      id: { not: excludeRoundId },
      date: { gte: cutoffDate },
      status: 'COMPLETED',
    },
    orderBy: { date: 'desc' },
    include: {
      labEntries: { include: { labField: true } },
    },
  });
}

/**
 * Gets prior days' display scores for smoothing.
 * Returns [yesterday, twoDaysAgo] or nulls if not available.
 */
async function getPriorDisplayScores(
  plantId: string,
  excludeRoundId: string,
  days: number,
): Promise<Array<number | null>> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const priorRounds = await prisma.dailyRound.findMany({
    where: {
      plantId,
      id: { not: excludeRoundId },
      date: { gte: cutoffDate },
      displayScore: { not: null },
    },
    orderBy: { date: 'desc' },
    take: days,
    select: { displayScore: true },
  });

  return [
    priorRounds[0]?.displayScore ?? null,
    priorRounds[1]?.displayScore ?? null,
  ];
}
