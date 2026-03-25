import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { api } from '../api/client';
import { colors, spacing, fontSize, borderRadius, commonStyles } from '../theme';
import { SuggestionCard } from '../components/SuggestionCard';
import { ConditionBadge } from '../components/ConditionBadge';
import { showAlert } from '../utils/alert';

type Props = NativeStackScreenProps<RootStackParamList, 'Suggestions'>;

export function SuggestionsScreen({ route }: Props) {
  const { roundId } = route.params;
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [overallCondition, setOverallCondition] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const result = await api.suggestions.get(roundId);
      setSuggestions(result.data);

      const round = await api.rounds.get(roundId);
      setOverallCondition(round.data.overallCondition);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const runEvaluation = async () => {
    setEvaluating(true);
    try {
      const result = await api.suggestions.evaluate(roundId);
      setSuggestions(result.data.suggestions);
      setOverallCondition(result.data.overallCondition);
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to evaluate round.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await api.suggestions.acknowledge(roundId, id);
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, acknowledged: true } : s))
      );
    } catch (err) {
      showAlert('Error', 'Failed to acknowledge suggestion.');
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={commonStyles.screen}>
      {/* Run Evaluation Button */}
      <View style={styles.evalSection}>
        <TouchableOpacity
          style={[styles.evalButton, evaluating && styles.evalButtonDisabled]}
          onPress={runEvaluation}
          disabled={evaluating}
        >
          <Text style={styles.evalButtonText}>
            {evaluating ? 'Evaluating...' : 'Run Evaluation'}
          </Text>
        </TouchableOpacity>

        {overallCondition && (
          <View style={styles.conditionRow}>
            <Text style={styles.conditionLabel}>Overall Condition:</Text>
            <ConditionBadge condition={overallCondition} />
          </View>
        )}
      </View>

      {/* Suggestions List */}
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
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Suggestions</Text>
            <Text style={styles.emptyText}>
              Tap "Run Evaluation" to analyze your data and observations.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  evalSection: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  evalButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  evalButtonDisabled: {
    opacity: 0.6,
  },
  evalButtonText: {
    color: colors.textWhite,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  conditionLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
});
