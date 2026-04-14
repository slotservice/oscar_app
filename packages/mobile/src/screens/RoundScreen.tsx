import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { api } from '../api/client';
import { useAppTheme, makeCommonStyles, spacing, fontSize, borderRadius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Round'>;

interface SectionItem {
  id: string; name: string; completed: number; total: number;
  type: 'checklist' | 'labs' | 'observations' | 'suggestions' | 'issues' | 'summary';
}

export function RoundScreen({ route, navigation }: Props) {
  const { colors } = useAppTheme();
  const commonStyles = makeCommonStyles(colors);
  const { roundId, plantId } = route.params;
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadSections(); }, []));

  const loadSections = async () => {
    try {
      const result = await api.checklist.get(roundId);
      const checklistSections: SectionItem[] = result.data.map((s: any) => ({
        id: s.id, name: s.name, completed: s.completed, total: s.total, type: 'checklist' as const,
      }));
      setSections([
        ...checklistSections,
        { id: 'labs', name: 'Labs & Operating Data', completed: 0, total: 0, type: 'labs' },
        { id: 'observations', name: 'Process Observations', completed: 0, total: 0, type: 'observations' },
        { id: 'suggestions', name: 'Review Suggestions', completed: 0, total: 0, type: 'suggestions' },
        { id: 'issues', name: 'Issues & Actions', completed: 0, total: 0, type: 'issues' },
        { id: 'summary', name: 'Summary & Sign Off', completed: 0, total: 0, type: 'summary' },
      ]);
    } catch (err) { console.error('Failed to load sections:', err); }
    finally { setLoading(false); }
  };

  const navigateToSection = (section: SectionItem) => {
    switch (section.type) {
      case 'checklist': navigation.navigate('Checklist', { roundId, sectionId: section.id, sectionName: section.name }); break;
      case 'labs': navigation.navigate('LabEntry', { roundId }); break;
      case 'observations': navigation.navigate('Observations', { roundId }); break;
      case 'suggestions': navigation.navigate('Suggestions', { roundId }); break;
      case 'issues': navigation.navigate('Issues', { roundId }); break;
      case 'summary': navigation.navigate('Summary', { roundId }); break;
    }
  };

  const styles = StyleSheet.create({
    center: { justifyContent: 'center', alignItems: 'center' },
    heading: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
    list: { gap: spacing.sm },
    sectionCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    sectionNumber: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
    sectionNumberText: { color: colors.textWhite, fontWeight: '700', fontSize: fontSize.md },
    sectionInfo: { flex: 1 },
    sectionName: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
    sectionProgress: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
    checkmark: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.green, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
    checkmarkText: { color: colors.textWhite, fontWeight: '700', fontSize: fontSize.md },
    chevron: { fontSize: fontSize.xxl, color: colors.textLight, fontWeight: '300' },
  });

  if (loading) {
    return (
      <View style={[commonStyles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={commonStyles.screenPadded}>
      <Text style={styles.heading}>Daily Round Sections</Text>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.sectionCard} onPress={() => navigateToSection(item)}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionName}>{item.name}</Text>
              {item.type === 'checklist' && (
                <Text style={styles.sectionProgress}>{item.completed} / {item.total} items</Text>
              )}
            </View>
            {item.type === 'checklist' && item.completed === item.total && item.total > 0 && (
              <View style={styles.checkmark}><Text style={styles.checkmarkText}>✓</Text></View>
            )}
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
