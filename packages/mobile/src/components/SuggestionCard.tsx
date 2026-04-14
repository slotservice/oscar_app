import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme, spacing, fontSize, borderRadius } from '../theme';

interface Props {
  ruleType: string;
  ruleName: string;
  message: string;
  severity: 'GREEN' | 'CAUTION' | 'CRITICAL';
  acknowledged: boolean;
  onAcknowledge: () => void;
  // OSCAR scoring fields (optional for backward compat)
  severityLevel?: number;
  category?: string;
  title?: string;
  deduction?: number;
}

const SEVERITY_COLORS: Record<number, { bg: string; color: string; label: string }> = {
  1: { bg: '#DCFCE7', color: '#22C55E', label: 'Stable' },
  2: { bg: '#FEF9C3', color: '#EAB308', label: 'Drift' },
  3: { bg: '#FFF7ED', color: '#F97316', label: 'Concern' },
  4: { bg: '#FEE2E2', color: '#EF4444', label: 'High Risk' },
};

export function SuggestionCard({ ruleType, message, severity, acknowledged, onAcknowledge, severityLevel, category, title, deduction }: Props) {
  const { colors } = useAppTheme();

  // Use 4-level if available, fallback to legacy 3-level
  let config: { bg: string; color: string; label: string };
  if (severityLevel && SEVERITY_COLORS[severityLevel]) {
    config = SEVERITY_COLORS[severityLevel];
  } else {
    const legacyConfig: Record<string, { bg: string; color: string; label: string }> = {
      GREEN: { bg: colors.greenLight, color: colors.green, label: 'OK' },
      CAUTION: { bg: colors.yellowLight, color: colors.yellow, label: 'Caution' },
      CRITICAL: { bg: colors.redLight, color: colors.red, label: 'Critical' },
    };
    config = legacyConfig[severity] || legacyConfig.GREEN;
  }

  const displayCategory = category || ruleType;
  const displayTitle = title;

  const styles = StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4 },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
    badgeText: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase' },
    categoryText: { fontSize: fontSize.xs, color: colors.textLight, fontWeight: '500' },
    titleText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
    message: { fontSize: fontSize.md, color: colors.text, lineHeight: 22 },
    deductionText: { fontSize: fontSize.xs, color: colors.textLight, marginTop: spacing.xs },
    ackButton: { marginTop: spacing.sm, alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
    ackText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },
    acked: { fontSize: fontSize.sm, color: colors.green, fontWeight: '600', marginTop: spacing.sm },
  });

  return (
    <View style={[styles.card, { borderLeftColor: config.color }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: config.bg }]}>
          <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
        </View>
        <Text style={styles.categoryText}>{displayCategory}</Text>
      </View>
      {displayTitle && <Text style={styles.titleText}>{displayTitle}</Text>}
      <Text style={styles.message}>{message}</Text>
      {deduction != null && deduction > 0 && (
        <Text style={styles.deductionText}>-{deduction} pts</Text>
      )}
      {!acknowledged && (
        <TouchableOpacity style={styles.ackButton} onPress={onAcknowledge}>
          <Text style={styles.ackText}>Acknowledge</Text>
        </TouchableOpacity>
      )}
      {acknowledged && <Text style={styles.acked}>Acknowledged</Text>}
    </View>
  );
}
