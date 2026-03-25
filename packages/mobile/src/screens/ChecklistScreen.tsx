import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { api } from '../api/client';
import { colors, spacing, fontSize, borderRadius, commonStyles } from '../theme';
import { StatusButton } from '../components/StatusButton';
import { showAlert } from '../utils/alert';

type Props = NativeStackScreenProps<RootStackParamList, 'Checklist'>;

interface ChecklistItemData {
  id: string;
  name: string;
  description: string | null;
  requiresNoteOnAttention: boolean;
  entry: {
    status: 'OK' | 'ATTENTION' | 'NA';
    note: string | null;
  } | null;
}

export function ChecklistScreen({ route }: Props) {
  const { roundId, sectionId } = route.params;
  const [items, setItems] = useState<ChecklistItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadChecklist();
  }, []);

  const loadChecklist = async () => {
    try {
      const result = await api.checklist.get(roundId);
      const section = result.data.find((s: any) => s.id === sectionId);
      if (section) {
        setItems(section.items);
        // Initialize notes from existing entries
        const initialNotes: Record<string, string> = {};
        section.items.forEach((item: ChecklistItemData) => {
          if (item.entry?.note) {
            initialNotes[item.id] = item.entry.note;
          }
        });
        setNotes(initialNotes);
      }
    } catch (err) {
      console.error('Failed to load checklist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (itemId: string, status: 'OK' | 'ATTENTION' | 'NA') => {
    try {
      await api.checklist.save(roundId, itemId, {
        status,
        note: notes[itemId] || undefined,
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, entry: { status, note: notes[itemId] || null } }
            : item
        )
      );
    } catch (err) {
      showAlert('Error', 'Failed to save. Please try again.');
    }
  };

  const handleNoteChange = async (itemId: string, note: string) => {
    setNotes((prev) => ({ ...prev, [itemId]: note }));

    const item = items.find((i) => i.id === itemId);
    if (item?.entry) {
      // Auto-save note if item already has a status
      try {
        await api.checklist.save(roundId, itemId, {
          status: item.entry.status,
          note,
        });
      } catch (err) {
        // Silent fail on auto-save, will retry on next change
      }
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={commonStyles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.itemDescription}>{item.description}</Text>
            )}

            {/* Status Buttons */}
            <View style={styles.statusRow}>
              <StatusButton
                label="OK"
                active={item.entry?.status === 'OK'}
                color={colors.green}
                onPress={() => handleStatusChange(item.id, 'OK')}
              />
              <StatusButton
                label="Attention"
                active={item.entry?.status === 'ATTENTION'}
                color={colors.yellow}
                onPress={() => handleStatusChange(item.id, 'ATTENTION')}
              />
              <StatusButton
                label="N/A"
                active={item.entry?.status === 'NA'}
                color={colors.textLight}
                onPress={() => handleStatusChange(item.id, 'NA')}
              />
            </View>

            {/* Note field — shown when Attention or always available */}
            {(item.entry?.status === 'ATTENTION' || notes[item.id]) && (
              <TextInput
                style={styles.noteInput}
                placeholder={
                  item.requiresNoteOnAttention
                    ? 'Note required for attention items...'
                    : 'Add a note (optional)...'
                }
                placeholderTextColor={colors.textLight}
                value={notes[item.id] || ''}
                onChangeText={(text) => handleNoteChange(item.id, text)}
                multiline
              />
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  itemDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  noteInput: {
    marginTop: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
