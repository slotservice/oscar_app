import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { api } from '../api/client';
import { useAppTheme, makeCommonStyles, spacing, fontSize, borderRadius } from '../theme';
import { ConditionBadge } from '../components/ConditionBadge';
import { showAlert } from '../utils/alert';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ route, navigation }: Props) {
  const { colors, mode, toggle } = useAppTheme();
  const commonStyles = makeCommonStyles(colors);
  const { plantId, plantName } = route.params;
  const [todayRound, setTodayRound] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadTodayRound(); }, []));

  const loadTodayRound = async () => {
    try {
      const result = await api.history.list(plantId, 1);
      const rounds = result.data.rounds;
      const today = new Date().toISOString().split('T')[0];
      const todaysRound = rounds.find((r: any) => r.date.split('T')[0] === today);
      setTodayRound(todaysRound || null);
    } catch (err) {
      console.error('Failed to load round:', err);
    } finally {
      setLoading(false);
    }
  };

  const startRound = async () => {
    try {
      const result = await api.rounds.create(plantId);
      navigation.navigate('Round', { roundId: result.data.id, plantId, plantName });
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to start round');
    }
  };

  const continueRound = () => {
    if (todayRound) {
      navigation.navigate('Round', { roundId: todayRound.id, plantId, plantName });
    }
  };

  const styles = StyleSheet.create({
    statusCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
    statusLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
    roundStatus: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
    noRound: { fontSize: fontSize.lg, color: colors.textLight },
    actions: { gap: spacing.md },
    primaryButton: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.lg, alignItems: 'center' },
    primaryButtonText: { color: colors.textWhite, fontSize: fontSize.xl, fontWeight: '700' },
    secondaryButton: { backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    secondaryButtonText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '600' },
    themeButton: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.sm + 4, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginTop: spacing.lg },
    themeButtonText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },
  });

  return (
    <View style={commonStyles.screenPadded}>
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Today's Status</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : todayRound ? (
          <View>
            <View style={commonStyles.rowBetween}>
              <Text style={styles.roundStatus}>
                {todayRound.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
              </Text>
              {todayRound.overallCondition && (
                <ConditionBadge condition={todayRound.overallCondition} />
              )}
            </View>
            {todayRound.operator && (
              <Text style={commonStyles.caption}>By {todayRound.operator.name}</Text>
            )}
            {todayRound.displayScore != null && (
              <View style={{ alignItems: 'center', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Text style={{ fontSize: 36, fontWeight: '800', color: todayRound.displayScore >= 85 ? colors.green : todayRound.displayScore >= 70 ? colors.yellow : todayRound.displayScore >= 50 ? '#F97316' : colors.red }}>
                  {todayRound.displayScore}
                </Text>
                <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' }}>
                  {todayRound.statusBand || 'Stability Index'}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.noRound}>No round started today</Text>
        )}
      </View>

      <View style={styles.actions}>
        {todayRound && todayRound.status !== 'COMPLETED' ? (
          <TouchableOpacity style={styles.primaryButton} onPress={continueRound}>
            <Text style={styles.primaryButtonText}>Continue Round</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={startRound}>
            <Text style={styles.primaryButtonText}>Start Daily Round</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('History', { plantId, plantName })}
        >
          <Text style={styles.secondaryButtonText}>View History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('MonthlyReport', { plantId, plantName })}
        >
          <Text style={styles.secondaryButtonText}>Monthly Report</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.themeButton} onPress={toggle}>
        <Text style={styles.themeButtonText}>
          {mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
