import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme, spacing, fontSize, borderRadius } from '../theme';

interface Props {
  condition: string;
  large?: boolean;
}

export function ConditionBadge({ condition, large }: Props) {
  const { colors } = useAppTheme();

  const conditionConfig: Record<string, { bg: string; color: string; label: string }> = {
    GREEN: { bg: colors.greenLight, color: colors.green, label: 'Stable' },
    YELLOW: { bg: colors.yellowLight, color: colors.yellow, label: 'Slight Drift' },
    ORANGE: { bg: '#FFF7ED', color: '#F97316', label: 'Moderate Concern' },
    RED: { bg: colors.redLight, color: colors.red, label: 'High Risk' },
  };

  const config = conditionConfig[condition] || conditionConfig.GREEN;

  const styles = StyleSheet.create({
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs, borderRadius: borderRadius.full, gap: spacing.xs },
    badgeLarge: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
    dot: { width: 8, height: 8, borderRadius: 4 },
    label: { fontSize: fontSize.sm, fontWeight: '700' },
    labelLarge: { fontSize: fontSize.xl },
  });

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, large && styles.badgeLarge]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }, large && styles.labelLarge]}>{config.label}</Text>
    </View>
  );
}
