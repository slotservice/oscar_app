import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { api } from '../api/client';
import { useAppTheme, makeCommonStyles, spacing, fontSize, borderRadius } from '../theme';
import { LabField } from '../components/LabField';
import { showAlert } from '../utils/alert';

type Props = NativeStackScreenProps<RootStackParamList, 'LabEntry'>;

interface LabFieldData {
  id: string;
  name: string;
  unit: string;
  isRequired?: boolean;
  recommendedFrequency?: string;
  entry: { value: number } | null;
}

export function LabEntryScreen({ route }: Props) {
  const { colors } = useAppTheme();
  const commonStyles = makeCommonStyles(colors);
  const { roundId } = route.params;
  const [fields, setFields] = useState<LabFieldData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLabs(); }, []);

  const loadLabs = async () => {
    try { const result = await api.labs.get(roundId); setFields(result.data); }
    catch (err) { console.error('Failed to load labs:', err); }
    finally { setLoading(false); }
  };

  const handleSave = async (fieldId: string, value: number) => {
    try {
      await api.labs.save(roundId, fieldId, value);
      setFields((prev) => prev.map((f) => f.id === fieldId ? { ...f, entry: { value } } : f));
    } catch (err) { showAlert('Error', 'Failed to save lab value.'); }
  };

  // Separate required and optional fields
  const requiredFields = fields.filter((f) => f.isRequired !== false);
  const optionalFields = fields.filter((f) => f.isRequired === false);

  const styles = StyleSheet.create({
    center: { justifyContent: 'center', alignItems: 'center' },
    list: { padding: spacing.md, gap: spacing.sm },
    header: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.md },
    sectionLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.md, marginBottom: spacing.sm },
    requiredDot: { fontSize: fontSize.xs, color: colors.red, fontWeight: '700' },
  });

  if (loading) {
    return (<View style={[commonStyles.screen, styles.center]}><ActivityIndicator size="large" color={colors.primary} /></View>);
  }

  return (
    <View style={commonStyles.screen}>
      <FlatList
        data={[...requiredFields, ...optionalFields]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Text style={styles.header}>Enter today's lab and operating data. Values auto-save.</Text>
            <Text style={styles.sectionLabel}>Required Daily <Text style={styles.requiredDot}>*</Text></Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View>
            {/* Show "Optional" separator between required and optional */}
            {index === requiredFields.length && optionalFields.length > 0 && (
              <Text style={styles.sectionLabel}>Optional / Recommended</Text>
            )}
            <LabField
              name={item.name}
              unit={item.unit}
              value={item.entry?.value ?? null}
              onSave={(value) => handleSave(item.id, value)}
              isRequired={item.isRequired}
            />
          </View>
        )}
      />
    </View>
  );
}
