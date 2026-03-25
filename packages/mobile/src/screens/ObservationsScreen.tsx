import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { api } from '../api/client';
import { colors, spacing, fontSize, borderRadius, commonStyles } from '../theme';
import { TagSelector } from '../components/TagSelector';
import { showAlert } from '../utils/alert';

type Props = NativeStackScreenProps<RootStackParamList, 'Observations'>;

export function ObservationsScreen({ route }: Props) {
  const { roundId } = route.params;
  const [tags, setTags] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadObservations();
  }, []);

  const loadObservations = async () => {
    try {
      const result = await api.observations.get(roundId);
      setTags(result.data.tags);
      setEntries(result.data.entries);
    } catch (err) {
      console.error('Failed to load observations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = async (tagId: string) => {
    const existingEntry = entries.find((e) => e.tagId === tagId);

    if (existingEntry) {
      // Remove
      try {
        await api.observations.remove(roundId, existingEntry.id);
        setEntries((prev) => prev.filter((e) => e.id !== existingEntry.id));
      } catch (err) {
        showAlert('Error', 'Failed to remove observation.');
      }
    } else {
      // Add
      try {
        const result = await api.observations.add(roundId, tagId);
        setEntries((prev) => [...prev, result.data]);
      } catch (err) {
        showAlert('Error', 'Failed to add observation.');
      }
    }
  };

  const isSelected = (tagId: string) => entries.some((e) => e.tagId === tagId);

  if (loading) {
    return (
      <View style={[commonStyles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Group tags by category
  const categories = tags.reduce((acc: Record<string, any[]>, tag) => {
    const cat = tag.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tag);
    return acc;
  }, {});

  return (
    <View style={commonStyles.screenPadded}>
      <Text style={styles.header}>
        Select any observations noted during your round.
      </Text>

      {Object.entries(categories).map(([category, categoryTags]) => (
        <View key={category} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>{category}</Text>
          <View style={styles.tagGrid}>
            {categoryTags.map((tag: any) => (
              <TagSelector
                key={tag.id}
                label={tag.name}
                selected={isSelected(tag.id)}
                onPress={() => handleTagToggle(tag.id)}
              />
            ))}
          </View>
        </View>
      ))}

      {entries.length > 0 && (
        <View style={styles.selectedSection}>
          <Text style={styles.selectedTitle}>Selected ({entries.length})</Text>
          {entries.map((entry) => (
            <View key={entry.id} style={styles.selectedEntry}>
              <Text style={styles.selectedTag}>{entry.tag?.name || 'Tag'}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  categorySection: {
    marginBottom: spacing.lg,
  },
  categoryTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  selectedSection: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.yellowLight,
    borderRadius: borderRadius.md,
  },
  selectedTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  selectedEntry: {
    paddingVertical: spacing.xs,
  },
  selectedTag: {
    fontSize: fontSize.md,
    color: colors.text,
  },
});
