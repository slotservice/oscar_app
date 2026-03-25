import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { borderRadius, fontSize, spacing } from '../theme';

interface Props {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}

export function StatusButton({ label, active, color, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        active
          ? { backgroundColor: color, borderColor: color }
          : { backgroundColor: 'transparent', borderColor: color },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.label,
          { color: active ? '#FFFFFF' : color },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
