import { Router, Request, Response } from 'express';
import { authenticate, prisma } from '../middleware/auth';

export const reportsRouter = Router();

reportsRouter.use(authenticate);

/**
 * GET /api/reports/monthly?plantId=X&year=2026&month=4
 *
 * Generates a monthly summary report based on all completed rounds
 * for the given plant and month. Returns:
 * - Overview stats (rounds completed, avg score, trend)
 * - Stability score trend (daily scores for the month)
 * - Category averages (Solids, Clarifier, Biological, Hydraulic, Operator)
 * - Top issues and suggestions
 * - Lab value averages and trends
 * - Recommendation summary
 */
reportsRouter.get('/monthly', async (req: Request, res: Response) => {
  try {
    const { plantId, year, month } = req.query;

    if (!plantId || !year || !month) {
      res.status(400).json({ success: false, error: 'plantId, year, and month are required' });
      return;
    }

    const y = parseInt(year as string);
    const m = parseInt(month as string);
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 1);

    // Get all completed rounds for the month
    const rounds = await prisma.dailyRound.findMany({
      where: {
        plantId: plantId as string,
        date: { gte: startDate, lt: endDate },
        status: 'COMPLETED',
      },
      orderBy: { date: 'asc' },
      include: {
        operator: { select: { name: true } },
        labEntries: { include: { labField: true } },
        suggestions: true,
        issues: true,
        observationEntries: { include: { tag: true } },
      },
    });

    if (rounds.length === 0) {
      res.json({
        success: true,
        data: {
          period: `${y}-${String(m).padStart(2, '0')}`,
          totalRounds: 0,
          message: 'No completed rounds for this period.',
        },
      });
      return;
    }

    // ─── Stability Score Trend ──────────────────────────
    const scoreTrend = rounds
      .filter((r) => r.displayScore != null)
      .map((r) => ({
        date: r.date.toISOString().split('T')[0],
        score: r.displayScore!,
        statusBand: r.statusBand,
        condition: r.overallCondition,
      }));

    const scores = scoreTrend.map((s) => s.score);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
    const minScore = scores.length > 0 ? Math.min(...scores) : null;
    const maxScore = scores.length > 0 ? Math.max(...scores) : null;

    // Score trend direction (compare first week avg vs last week avg)
    let scoreTrendDirection = 'stable';
    if (scores.length >= 10) {
      const firstWeek = scores.slice(0, 7);
      const lastWeek = scores.slice(-7);
      const firstAvg = firstWeek.reduce((a, b) => a + b, 0) / firstWeek.length;
      const lastAvg = lastWeek.reduce((a, b) => a + b, 0) / lastWeek.length;
      if (lastAvg > firstAvg + 5) scoreTrendDirection = 'improving';
      else if (lastAvg < firstAvg - 5) scoreTrendDirection = 'declining';
    }

    // ─── Category Averages ──────────────────────────────
    const categoryTotals: Record<string, { total: number; count: number }> = {};
    for (const round of rounds) {
      if (round.scoreBreakdown && Array.isArray(round.scoreBreakdown)) {
        for (const cat of round.scoreBreakdown as any[]) {
          if (!categoryTotals[cat.category]) categoryTotals[cat.category] = { total: 0, count: 0 };
          categoryTotals[cat.category].total += cat.score;
          categoryTotals[cat.category].count += 1;
        }
      }
    }
    const categoryAverages = Object.entries(categoryTotals).map(([category, data]) => ({
      category,
      avgScore: Math.round(data.total / data.count * 10) / 10,
      maxPoints: category === 'Hydraulic Stability' ? 15 : category === 'Operator Concern Flags' ? 10 : 25,
    }));

    // ─── Lab Value Averages ─────────────────────────────
    const labTotals: Record<string, { total: number; count: number; unit: string; values: number[] }> = {};
    for (const round of rounds) {
      for (const entry of round.labEntries) {
        const name = entry.labField.name;
        if (!labTotals[name]) labTotals[name] = { total: 0, count: 0, unit: entry.labField.unit, values: [] };
        labTotals[name].total += entry.value;
        labTotals[name].count += 1;
        labTotals[name].values.push(entry.value);
      }
    }
    const labAverages = Object.entries(labTotals).map(([name, data]) => ({
      name,
      unit: data.unit,
      avg: Math.round(data.total / data.count * 100) / 100,
      min: Math.round(Math.min(...data.values) * 100) / 100,
      max: Math.round(Math.max(...data.values) * 100) / 100,
      entries: data.count,
    }));

    // ─── Top Suggestions (most frequent rule IDs) ───────
    const ruleCounts: Record<string, { count: number; message: string; category: string; avgSeverity: number }> = {};
    for (const round of rounds) {
      for (const sug of round.suggestions) {
        const key = sug.ruleId || sug.ruleName;
        if (!ruleCounts[key]) ruleCounts[key] = { count: 0, message: sug.message, category: sug.category || sug.ruleType, avgSeverity: 0 };
        ruleCounts[key].count += 1;
        ruleCounts[key].avgSeverity += sug.severityLevel || 0;
      }
    }
    const topSuggestions = Object.entries(ruleCounts)
      .map(([ruleId, data]) => ({
        ruleId,
        message: data.message,
        category: data.category,
        occurrences: data.count,
        avgSeverity: data.count > 0 ? Math.round(data.avgSeverity / data.count * 10) / 10 : 0,
      }))
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 5);

    // ─── Issues Summary ─────────────────────────────────
    const allIssues = rounds.flatMap((r) => r.issues);
    const totalIssues = allIssues.length;
    const resolvedIssues = allIssues.filter((i) => i.resolved).length;
    const supervisorFlagged = allIssues.filter((i) => i.supervisorFlag).length;

    // ─── Observation Frequency ──────────────────────────
    const tagCounts: Record<string, number> = {};
    for (const round of rounds) {
      for (const obs of round.observationEntries) {
        const name = obs.tag.name;
        tagCounts[name] = (tagCounts[name] || 0) + 1;
      }
    }
    const topObservations = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ─── Recommendations ────────────────────────────────
    const recommendations: string[] = [];
    if (avgScore !== null && avgScore < 70) {
      recommendations.push('Monthly average stability score is below 70. Review recurring concerns.');
    }
    if (scoreTrendDirection === 'declining') {
      recommendations.push('Stability trend is declining over the month. Investigate root causes.');
    }
    const weakestCategory = categoryAverages
      .filter((c) => c.maxPoints > 0)
      .sort((a, b) => (a.avgScore / a.maxPoints) - (b.avgScore / b.maxPoints))[0];
    if (weakestCategory && weakestCategory.avgScore < weakestCategory.maxPoints * 0.7) {
      recommendations.push(`${weakestCategory.category} is the weakest area this month. Focus improvement efforts here.`);
    }
    if (topSuggestions.length > 0 && topSuggestions[0].occurrences > rounds.length * 0.5) {
      recommendations.push(`"${topSuggestions[0].ruleId}" triggered on ${topSuggestions[0].occurrences} of ${rounds.length} days. Address underlying cause.`);
    }
    if (recommendations.length === 0) {
      recommendations.push('Plant operations appear stable this month. Continue current practices.');
    }

    // ─── Final Report ───────────────────────────────────
    const report = {
      period: `${y}-${String(m).padStart(2, '0')}`,
      plantId,
      totalRounds: rounds.length,
      daysInMonth: new Date(y, m, 0).getDate(),
      completionRate: Math.round((rounds.length / new Date(y, m, 0).getDate()) * 100),

      stabilityOverview: {
        avgScore,
        minScore,
        maxScore,
        trend: scoreTrendDirection,
        scoreTrend,
      },

      categoryAverages,
      labAverages,
      topSuggestions,
      topObservations,

      issuesSummary: {
        total: totalIssues,
        resolved: resolvedIssues,
        supervisorFlagged,
      },

      recommendations,
    };

    res.json({ success: true, data: report });
  } catch (err) {
    console.error('Monthly report error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});
