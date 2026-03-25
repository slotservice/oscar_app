import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { useAutoSave } from '../hooks/useAutoSave';

interface Props {
  name: string;
  unit: string;
  value: number | null;
  onSave: (value: number) => Promise<void>;
}

export function LabField({ name, unit, value, onSave }: Props) {
  const [text, setText] = useState(value !== null ? String(value) : '');

  const saveFn = useCallback(async () => {
    const num = parseFloat(text);
    if (!isNaN(num)) {
      await onSave(num);
    }
  }, [text, onSave]);

  const { trigger } = useAutoSave(saveFn, 800);

  const handleChange = (newText: string) => {
    // Only allow numeric input (with decimal)
    const cleaned = newText.replace(/[^0-9.]/g, '');
    setText(cleaned);
    trigger();
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={handleChange}
        keyboardType="decimal-pad"
        placeholder="Enter value"
        placeholderTextColor={colors.textLight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  unit: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
  },
});
