import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { api } from '../api/client';
import { useAppTheme, makeCommonStyles, spacing, fontSize, borderRadius } from '../theme';
import { ConditionBadge } from '../components/ConditionBadge';
import { showAlert, showConfirm } from '../utils/alert';

type Props = NativeStackScreenProps<RootStackParamList, 'Summary'>;

export function SummaryScreen({ route, navigation }: Props) {
  const { colors } = useAppTheme();
  const commonStyles = makeCommonStyles(colors);
  const { roundId } = route.params;
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [signing, setSigning] = useState(false);

  useEffect(() => { loadSummary(); }, []);

  const loadSummary = async () => {
    try {
      const result = await api.rounds.summary(roundId);
      setSummary(result.data); setNotes(result.data.notes || '');
    } catch (err) { console.error('Failed to load summary:', err); }
    finally { setLoading(false); }
  };

  const handleSignOff = async () => {
    const confirmed = await showConfirm('Sign Off', 'Are you sure you want to sign off this daily round? This cannot be undone.');
    if (!confirmed) return;
    setSigning(true);
    try {
      await api.rounds.update(roundId, { notes, signedOff: true });
      showAlert('Success', 'Daily round signed off successfully.');
      navigation.popToTop();
    } catch (err) { showAlert('Error', 'Failed to sign off.'); }
    finally { setSigning(false); }
  };

  const statStyles = StyleSheet.create({
    box: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border, minWidth: '30%' },
    label: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
    value: { fontSize: fontSize.xxl, fontWeight: '800', marginVertical: 2 },
    subtitle: { fontSize: fontSize.xs, color: colors.textLight },
  });

  const styles = StyleSheet.create({
    center: { justifyContent: 'center', alignItems: 'center' },
    content: { padding: spacing.md },
    conditionCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
    conditionLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
    noCondition: { fontSize: fontSize.lg, color: colors.textLight },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg, justifyContent: 'space-between' },
    notesSection: { marginBottom: spacing.lg },
    sectionTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
    notesInput: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.md, color: colors.text, minHeight: 100, borderWidth: 1, borderColor: colors.border, textAlignVertical: 'top' },
    signOffButton: { backgroundColor: colors.green, borderRadius: borderRadius.md, paddingVertical: spacing.lg, alignItems: 'center', marginBottom: spacing.xl },
    buttonDisabled: { opacity: 0.6 },
    signOffText: { color: colors.textWhite, fontSize: fontSize.xl, fontWeight: '700' },
    signedOff: { backgroundColor: colors.greenLight, borderRadius: borderRadius.md, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.xl },
    signedOffText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.green },
    signedOffDate: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  });

  if (loading || !summary) {
    return (<View style={[commonStyles.screen, styles.center]}><ActivityIndicator size="large" color={colors.primary} /></View>);
  }

  const stats = summary.stats;

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={styles.content}>
      <View style={styles.conditionCard}>
        <Text style={styles.conditionLabel}>Overall Condition</Text>
        {summary.overallCondition ? <ConditionBadge condition={summary.overallCondition} large /> : <Text style={styles.noCondition}>Not evaluated yet</Text>}
      </View>
      <View style={styles.statsGrid}>
        <StatBox label="Checklist" value={`${stats.okCount}/${stats.totalItems}`} subtitle="OK" color={colors.green} s={statStyles} />
        <StatBox label="Attention" value={`${stats.attentionCount}`} subtitle="items" color={colors.yellow} s={statStyles} />
        <StatBox label="Lab Values" value={`${stats.labEntriesCount}`} subtitle="entered" color={colors.primary} s={statStyles} />
        <StatBox label="Observations" value={`${stats.observationsCount}`} subtitle="noted" color={colors.primaryLight} s={statStyles} />
        <StatBox label="Suggestions" value={`${stats.suggestionsCount}`} subtitle="generated" color={colors.yellow} s={statStyles} />
        <StatBox label="Issues" value={`${stats.issuesCount}`} subtitle="reported" color={colors.red} s={statStyles} />
      </View>
      <View style={styles.notesSection}>
        <Text style={styles.sectionTitle}>Round Notes</Text>
        <TextInput style={styles.notesInput} placeholder="Add any overall notes for this round..." placeholderTextColor={colors.textLight} value={notes} onChangeText={setNotes} multiline />
      </View>
      {!summary.signedOff ? (
        <TouchableOpacity style={[styles.signOffButton, signing && styles.buttonDisabled]} onPress={handleSignOff} disabled={signing}>
          <Text style={styles.signOffText}>{signing ? 'Signing Off...' : 'Sign Off Daily Round'}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.signedOff}>
          <Text style={styles.signedOffText}>Signed Off</Text>
          <Text style={styles.signedOffDate}>{new Date(summary.completedAt).toLocaleString()}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function StatBox({ label, value, subtitle, color, s }: { label: string; value: string; subtitle: string; color: string; s: any }) {
  return (
    <View style={s.box}>
      <Text style={s.label}>{label}</Text>
      <Text style={[s.value, { color }]}>{value}</Text>
      <Text style={s.subtitle}>{subtitle}</Text>
    </View>
  );
}
