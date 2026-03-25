import { Severity, Condition } from '@prisma/client';
import { prisma } from '../middleware/auth';

interface EvaluationResult {
  suggestions: Array<{
    id: string;
    ruleType: string;
    ruleName: string;
    message: string;
    severity: Severity;
  }>;
  overallCondition: Condition;
}

/**
 * Evaluates a daily round by running all configured rules against
 * current lab values, observation tags, and recent trends.
 *
 * This is NOT AI — it is simple, deterministic threshold + tag logic.
 */
export async function evaluateRound(roundId: string, plantId: string): Promise<EvaluationResult> {
  // Clear any previous suggestions for this round (re-evaluation)
  await prisma.suggestion.deleteMany({ where: { roundId } });

  // Load data in parallel
  const [labEntries, observationEntries, thresholdRules, tagRules, recentRounds] = await Promise.all([
    // Current round's lab entries
    prisma.labEntry.findMany({
      where: { roundId },
      include: { labField: true },
    }),
    // Current round's observation entries
    prisma.observationEntry.findMany({
      where: { roundId },
      include: { tag: true },
    }),
    // Plant's threshold rules
    prisma.thresholdRule.findMany({
      where: { plantId, active: true },
      include: { labField: true },
    }),
    // Plant's tag rules
    prisma.tagRule.findMany({
      where: { plantId, active: true },
      include: { tag: true },
    }),
    // Last 10 days of rounds for trend analysis
    getRecentRounds(plantId, roundId, 10),
  ]);

  const createdSuggestions: Array<{
    id: string;
    ruleType: string;
    ruleName: string;
    message: string;
    severity: Severity;
  }> = [];

  // ─── 1. Evaluate Threshold Rules ───────────────────────

  for (const rule of thresholdRules) {
    const labEntry = labEntries.find((e) => e.labFieldId === rule.labFieldId);
    if (!labEntry) continue;

    const value = labEntry.value;
    let triggered = false;
    let severity: Severity = 'GREEN';

    // Check critical thresholds first (higher priority)
    if (rule.criticalLow !== null && value < rule.criticalLow) {
      triggered = true;
      severity = 'CRITICAL';
    } else if (rule.criticalHigh !== null && value > rule.criticalHigh) {
      triggered = true;
      severity = 'CRITICAL';
    } else if (rule.cautionLow !== null && value < rule.cautionLow) {
      triggered = true;
      severity = 'CAUTION';
    } else if (rule.cautionHigh !== null && value > rule.cautionHigh) {
      triggered = true;
      severity = 'CAUTION';
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

  // ─── 2. Evaluate Tag Rules ─────────────────────────────

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

  // ─── 3. Evaluate Trends (last 5-10 days) ──────────────

  const trendSuggestions = await evaluateTrends(roundId, labEntries, recentRounds, thresholdRules);
  createdSuggestions.push(...trendSuggestions);

  // ─── 4. Compute Overall Condition ─────────────────────

  let overallCondition: Condition = 'GREEN';
  if (createdSuggestions.some((s) => s.severity === 'CRITICAL')) {
    overallCondition = 'RED';
  } else if (createdSuggestions.some((s) => s.severity === 'CAUTION')) {
    overallCondition = 'YELLOW';
  }

  // Update the round's overall condition
  await prisma.dailyRound.update({
    where: { id: roundId },
    data: { overallCondition },
  });

  return { suggestions: createdSuggestions, overallCondition };
}

/**
 * Gets the most recent completed rounds for a plant (excluding current round).
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
 * Evaluates trends by comparing current lab values to the rolling
 * average of recent rounds. Flags significant deviations.
 */
async function evaluateTrends(
  roundId: string,
  currentLabEntries: Array<{ labFieldId: string; value: number; labField: { name: string; unit: string } }>,
  recentRounds: Array<{ labEntries: Array<{ labFieldId: string; value: number }> }>,
  _thresholdRules: Array<{ labFieldId: string }>
): Promise<Array<{ id: string; ruleType: string; ruleName: string; message: string; severity: Severity }>> {
  const suggestions: Array<{ id: string; ruleType: string; ruleName: string; message: string; severity: Severity }> = [];

  if (recentRounds.length < 3) return suggestions; // Need at least 3 days of history

  for (const currentEntry of currentLabEntries) {
    // Gather historical values for this field
    const historicalValues: number[] = [];
    for (const round of recentRounds) {
      const entry = round.labEntries.find((e) => e.labFieldId === currentEntry.labFieldId);
      if (entry) historicalValues.push(entry.value);
    }

    if (historicalValues.length < 3) continue;

    const avg = historicalValues.reduce((sum, v) => sum + v, 0) / historicalValues.length;
    const stdDev = Math.sqrt(
      historicalValues.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / historicalValues.length
    );

    // Flag if current value deviates more than 2 standard deviations from average
    if (stdDev > 0) {
      const deviation = Math.abs(currentEntry.value - avg) / stdDev;

      if (deviation > 3) {
        const suggestion = await prisma.suggestion.create({
          data: {
            roundId,
            ruleType: 'TREND',
            ruleName: `TREND_${currentEntry.labField.name.toUpperCase().replace(/\s+/g, '_')}`,
            message: `${currentEntry.labField.name}: ${currentEntry.value} ${currentEntry.labField.unit} is significantly different from the ${historicalValues.length}-day average of ${avg.toFixed(2)}. Investigate.`,
            severity: 'CRITICAL',
          },
        });
        suggestions.push(suggestion);
      } else if (deviation > 2) {
        const suggestion = await prisma.suggestion.create({
          data: {
            roundId,
            ruleType: 'TREND',
            ruleName: `TREND_${currentEntry.labField.name.toUpperCase().replace(/\s+/g, '_')}`,
            message: `${currentEntry.labField.name}: ${currentEntry.value} ${currentEntry.labField.unit} deviates from the ${historicalValues.length}-day average of ${avg.toFixed(2)}. Monitor closely.`,
            severity: 'CAUTION',
          },
        });
        suggestions.push(suggestion);
      }
    }

    // Check for consecutive declining/rising trend (5+ days in same direction)
    if (historicalValues.length >= 4) {
      const allValues = [currentEntry.value, ...historicalValues].slice(0, 5);
      let isRising = true;
      let isFalling = true;

      for (let i = 0; i < allValues.length - 1; i++) {
        if (allValues[i] <= allValues[i + 1]) isRising = false;
        if (allValues[i] >= allValues[i + 1]) isFalling = false;
      }

      if (isRising || isFalling) {
        const direction = isRising ? 'rising' : 'falling';
        const suggestion = await prisma.suggestion.create({
          data: {
            roundId,
            ruleType: 'TREND',
            ruleName: `TREND_DIRECTION_${currentEntry.labField.name.toUpperCase().replace(/\s+/g, '_')}`,
            message: `${currentEntry.labField.name} has been consistently ${direction} over the last ${allValues.length} days. Review trend.`,
            severity: 'CAUTION',
          },
        });
        suggestions.push(suggestion);
      }
    }
  }

  return suggestions;
}
