import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAppTheme, spacing, fontSize, borderRadius } from '../theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function TagSelector({ label, selected, onPress }: Props) {
  const { colors } = useAppTheme();

  const styles = StyleSheet.create({
    tag: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
    tagSelected: { backgroundColor: colors.yellow, borderColor: colors.yellow },
    label: { fontSize: fontSize.md, color: colors.text, fontWeight: '500' },
    labelSelected: { color: '#000', fontWeight: '700' },
  });

  return (
    <TouchableOpacity style={[styles.tag, selected && styles.tagSelected]} onPress={onPress}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}
