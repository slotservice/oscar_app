import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { api } from '../api/client';
import { useAppTheme, makeCommonStyles, spacing, fontSize, borderRadius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MonthlyReport'>;

export function MonthlyReportScreen({ route }: Props) {
  const { colors } = useAppTheme();
  const commonStyles = makeCommonStyles(colors);
  const { plantId } = route.params;
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => { loadReport(); }, [year, month]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const result = await api.reports.monthly(plantId, year, month);
      setReport(result.data);
    } catch (err) { console.error('Failed to load report:', err); }
    finally { setLoading(false); }
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const getScoreColor = (score: number) => {
    if (score >= 85) return colors.green;
    if (score >= 70) return colors.yellow;
    if (score >= 50) return '#F97316';
    return colors.red;
  };

  const styles = StyleSheet.create({
    center: { justifyContent: 'center', alignItems: 'center' },
    content: { padding: spacing.md },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
    navBtn: { padding: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border },
    navBtnText: { color: colors.primary, fontWeight: '600', fontSize: fontSize.md },
    monthLabel: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
    cardTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
    scoreBox: { alignItems: 'center', paddingVertical: spacing.md },
    scoreValue: { fontSize: 56, fontWeight: '800' },
    scoreBand: { fontSize: fontSize.md, fontWeight: '600', marginTop: spacing.xs },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
    statLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
    statValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
    catRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs + 2, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    catName: { fontSize: fontSize.sm, color: colors.text, flex: 1 },
    catScore: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
    sugItem: { paddingVertical: spacing.xs + 2, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    sugText: { fontSize: fontSize.sm, color: colors.text },
    sugMeta: { fontSize: fontSize.xs, color: colors.textLight, marginTop: 2 },
    recItem: { paddingVertical: spacing.xs + 2 },
    recText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
    emptyMsg: { fontSize: fontSize.md, color: colors.textLight, textAlign: 'center', padding: spacing.xl },
  });

  if (loading) {
    return (<View style={[commonStyles.screen, styles.center]}><ActivityIndicator size="large" color={colors.primary} /></View>);
  }

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={styles.content}>
      <View style={styles.monthNav}>
        <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
          <Text style={styles.navBtnText}>Previous</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthName}</Text>
        <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
          <Text style={styles.navBtnText}>Next</Text>
        </TouchableOpacity>
      </View>

      {!report || report.totalRounds === 0 ? (
        <Text style={styles.emptyMsg}>No completed rounds for {monthName}.</Text>
      ) : (
        <>
          {/* Stability Overview */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Stability Overview</Text>
            {report.stabilityOverview.avgScore != null && (
              <View style={styles.scoreBox}>
                <Text style={[styles.scoreValue, { color: getScoreColor(report.stabilityOverview.avgScore) }]}>
                  {report.stabilityOverview.avgScore}
                </Text>
                <Text style={[styles.scoreBand, { color: getScoreColor(report.stabilityOverview.avgScore) }]}>
                  Monthly Average
                </Text>
              </View>
            )}
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Rounds Completed</Text>
              <Text style={styles.statValue}>{report.totalRounds} / {report.daysInMonth} days ({report.completionRate}%)</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Score Range</Text>
              <Text style={styles.statValue}>{report.stabilityOverview.minScore} — {report.stabilityOverview.maxScore}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Monthly Trend</Text>
              <Text style={[styles.statValue, { color: report.stabilityOverview.trend === 'improving' ? colors.green : report.stabilityOverview.trend === 'declining' ? colors.red : colors.textSecondary }]}>
                {report.stabilityOverview.trend === 'improving' ? 'Improving' : report.stabilityOverview.trend === 'declining' ? 'Declining' : 'Stable'}
              </Text>
            </View>
          </View>

          {/* Category Breakdown */}
          {report.categoryAverages.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Category Breakdown</Text>
              {report.categoryAverages.map((cat: any, i: number) => (
                <View key={i} style={styles.catRow}>
                  <Text style={styles.catName}>{cat.category}</Text>
                  <Text style={styles.catScore}>{cat.avgScore} / {cat.maxPoints}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Lab Value Averages */}
          {report.labAverages.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Lab Value Averages</Text>
              {report.labAverages.map((lab: any, i: number) => (
                <View key={i} style={styles.statRow}>
                  <Text style={styles.statLabel}>{lab.name} ({lab.unit})</Text>
                  <Text style={styles.statValue}>{lab.avg} (range: {lab.min}–{lab.max})</Text>
                </View>
              ))}
            </View>
          )}

          {/* Top Suggestions */}
          {report.topSuggestions.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Most Frequent Suggestions</Text>
              {report.topSuggestions.map((sug: any, i: number) => (
                <View key={i} style={styles.sugItem}>
                  <Text style={styles.sugText}>{sug.ruleId}</Text>
                  <Text style={styles.sugMeta}>{sug.occurrences} occurrences · {sug.category}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Issues Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Issues Summary</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Issues</Text>
              <Text style={styles.statValue}>{report.issuesSummary.total}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Resolved</Text>
              <Text style={styles.statValue}>{report.issuesSummary.resolved}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Supervisor Flagged</Text>
              <Text style={styles.statValue}>{report.issuesSummary.supervisorFlagged}</Text>
            </View>
          </View>

          {/* Recommendations */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recommendations</Text>
            {report.recommendations.map((rec: string, i: number) => (
              <View key={i} style={styles.recItem}>
                <Text style={styles.recText}>• {rec}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
