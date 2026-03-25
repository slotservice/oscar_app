import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../theme';

interface Props {
  condition: string;
  large?: boolean;
}

const conditionConfig: Record<string, { bg: string; color: string; label: string }> = {
  GREEN: { bg: colors.greenLight, color: colors.green, label: 'All Good' },
  YELLOW: { bg: colors.yellowLight, color: colors.yellow, label: 'Caution' },
  RED: { bg: colors.redLight, color: colors.red, label: 'Critical' },
};

export function ConditionBadge({ condition, large }: Props) {
  const config = conditionConfig[condition] || conditionConfig.GREEN;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, large && styles.badgeLarge]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }, large && styles.labelLarge]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  badgeLarge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  labelLarge: {
    fontSize: fontSize.xl,
  },
});
