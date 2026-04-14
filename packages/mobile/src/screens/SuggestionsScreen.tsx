import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { api } from '../api/client';
import { useAppTheme, makeCommonStyles, spacing, fontSize, borderRadius } from '../theme';
import { SuggestionCard } from '../components/SuggestionCard';
import { ConditionBadge } from '../components/ConditionBadge';
import { showAlert } from '../utils/alert';

type Props = NativeStackScreenProps<RootStackParamList, 'Suggestions'>;

export function SuggestionsScreen({ route }: Props) {
  const { colors } = useAppTheme();
  const commonStyles = makeCommonStyles(colors);
  const { roundId } = route.params;
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [overallCondition, setOverallCondition] = useState<string | null>(null);
  const [stabilityData, setStabilityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => { loadSuggestions(); }, []);

  const loadSuggestions = async () => {
    try {
      const result = await api.suggestions.get(roundId);
      setSuggestions(result.data);
      const round = await api.rounds.get(roundId);
      setOverallCondition(round.data.overallCondition);
      if (round.data.displayScore != null) {
        setStabilityData({
          displayScore: round.data.displayScore,
          statusBand: round.data.statusBand,
          confidenceLevel: round.data.confidenceLevel,
          primaryConcern: round.data.primaryConcern,
        });
      }
    } catch (err) { console.error('Failed to load suggestions:', err); }
    finally { setLoading(false); }
  };

  const runEvaluation = async () => {
    setEvaluating(true);
    try {
      const result = await api.suggestions.evaluate(roundId);
      setSuggestions(result.data.suggestions);
      setOverallCondition(result.data.overallCondition);
      if (result.data.displayScore != null) {
        setStabilityData({
          displayScore: result.data.displayScore,
          statusBand: result.data.statusBand,
          confidenceLevel: result.data.confidenceLevel,
          primaryConcern: result.data.primaryConcern,
        });
      }
    } catch (err: any) { showAlert('Error', err.message || 'Failed to evaluate round.'); }
    finally { setEvaluating(false); }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await api.suggestions.acknowledge(roundId, id);
      setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, acknowledged: true } : s)));
    } catch (err) { showAlert('Error', 'Failed to acknowledge suggestion.'); }
  };

  // Score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 85) return colors.green;
    if (score >= 70) return colors.yellow;
    if (score >= 50) return '#F97316';
    return colors.red;
  };

  const styles = StyleSheet.create({
    center: { justifyContent: 'center', alignItems: 'center' },
    evalSection: { padding: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    evalButton: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center' },
    evalButtonDisabled: { opacity: 0.6 },
    evalButtonText: { color: colors.textWhite, fontSize: fontSize.lg, fontWeight: '700' },
    scoreSection: { alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    scoreValue: { fontSize: 48, fontWeight: '800' },
    scoreBand: { fontSize: fontSize.md, fontWeight: '600', marginTop: spacing.xs },
    scoreConfidence: { fontSize: fontSize.xs, color: colors.textLight, marginTop: 2 },
    scoreConcern: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.md },
    conditionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, gap: spacing.sm },
    conditionLabel: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: '600' },
    list: { padding: spacing.md, gap: spacing.sm },
    emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
    emptyTitle: { fontSize: fontSize.xl, fontWeight: '600', color: colors.textSecondary },
    emptyText: { fontSize: fontSize.md, color: colors.textLight, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.xl },
  });

  if (loading) {
    return (<View style={[commonStyles.screen, styles.center]}><ActivityIndicator size="large" color={colors.primary} /></View>);
  }

  return (
    <View style={commonStyles.screen}>
      <View style={styles.evalSection}>
        <TouchableOpacity style={[styles.evalButton, evaluating && styles.evalButtonDisabled]} onPress={runEvaluation} disabled={evaluating}>
          <Text style={styles.evalButtonText}>{evaluating ? 'Evaluating...' : 'Run Evaluation'}</Text>
        </TouchableOpacity>

        {/* Stability Index Score */}
        {stabilityData && (
          <View style={styles.scoreSection}>
            <Text style={[styles.scoreValue, { color: getScoreColor(stabilityData.displayScore) }]}>
              {stabilityData.displayScore}
            </Text>
            <Text style={[styles.scoreBand, { color: getScoreColor(stabilityData.displayScore) }]}>
              {stabilityData.statusBand}
            </Text>
            <Text style={styles.scoreConfidence}>
              Confidence: {stabilityData.confidenceLevel}
            </Text>
            {stabilityData.primaryConcern && stabilityData.primaryConcern !== 'Plant operating normally.' && (
              <Text style={styles.scoreConcern}>{stabilityData.primaryConcern}</Text>
            )}
          </View>
        )}

        {/* Legacy condition badge (fallback) */}
        {!stabilityData && overallCondition && (
          <View style={styles.conditionRow}>
            <Text style={styles.conditionLabel}>Overall Condition:</Text>
            <ConditionBadge condition={overallCondition} />
          </View>
        )}
      </View>

      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <SuggestionCard
            ruleType={item.ruleType}
            ruleName={item.ruleName}
            message={item.message}
            severity={item.severity}
            acknowledged={item.acknowledged}
            onAcknowledge={() => handleAcknowledge(item.id)}
            severityLevel={item.severityLevel}
            category={item.category}
            title={item.title}
            deduction={item.deduction}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Suggestions</Text>
            <Text style={styles.emptyText}>Tap "Run Evaluation" to analyze your data and observations.</Text>
          </View>
        }
      />
    </View>
  );
}
