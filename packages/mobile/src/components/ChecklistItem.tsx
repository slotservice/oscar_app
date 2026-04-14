import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme, spacing, fontSize, borderRadius } from '../theme';
import { StatusButton } from './StatusButton';

interface Props {
  name: string;
  description?: string | null;
  status?: 'OK' | 'ATTENTION' | 'NA' | null;
  onStatusChange: (status: 'OK' | 'ATTENTION' | 'NA') => void;
}

export function ChecklistItem({ name, description, status, onStatusChange }: Props) {
  const { colors } = useAppTheme();
  const styles = StyleSheet.create({
    container: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
    name: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
    description: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
    buttons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{name}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      <View style={styles.buttons}>
        <StatusButton label="OK" active={status === 'OK'} color={colors.green} onPress={() => onStatusChange('OK')} />
        <StatusButton label="Attention" active={status === 'ATTENTION'} color={colors.yellow} onPress={() => onStatusChange('ATTENTION')} />
        <StatusButton label="N/A" active={status === 'NA'} color={colors.textLight} onPress={() => onStatusChange('NA')} />
      </View>
    </View>
  );
}
