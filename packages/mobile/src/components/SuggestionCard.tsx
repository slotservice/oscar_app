import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../theme';

interface Props {
  ruleType: string;
  ruleName: string;
  message: string;
  severity: 'GREEN' | 'CAUTION' | 'CRITICAL';
  acknowledged: boolean;
  onAcknowledge: () => void;
}

const severityConfig = {
  GREEN: { bg: colors.greenLight, color: colors.green, label: 'OK' },
  CAUTION: { bg: colors.yellowLight, color: colors.yellow, label: 'Caution' },
  CRITICAL: { bg: colors.redLight, color: colors.red, label: 'Critical' },
};

export function SuggestionCard({
  ruleType,
  message,
  severity,
  acknowledged,
  onAcknowledge,
}: Props) {
  const config = severityConfig[severity];

  return (
    <View style={[styles.card, { borderLeftColor: config.color }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: config.bg }]}>
          <Text style={[styles.badgeText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
        <Text style={styles.ruleType}>{ruleType}</Text>
      </View>

      <Text style={styles.message}>{message}</Text>

      {!acknowledged && (
        <TouchableOpacity style={styles.ackButton} onPress={onAcknowledge}>
          <Text style={styles.ackText}>Acknowledge</Text>
        </TouchableOpacity>
      )}
      {acknowledged && (
        <Text style={styles.acked}>Acknowledged</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  ruleType: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    fontWeight: '500',
  },
  message: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  ackButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ackText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  acked: {
    fontSize: fontSize.sm,
    color: colors.green,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
});
