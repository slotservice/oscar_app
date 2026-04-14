import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../navigation/AppNavigator';
import { api } from '../api/client';
import { useAppTheme, makeCommonStyles, spacing, fontSize, borderRadius } from '../theme';
import { StatusButton } from '../components/StatusButton';
import { showAlert, showConfirm } from '../utils/alert';

type Props = NativeStackScreenProps<RootStackParamList, 'Checklist'>;

interface ChecklistItemData {
  id: string;
  name: string;
  description: string | null;
  requiresNoteOnAttention: boolean;
  entry: {
    status: 'OK' | 'ATTENTION' | 'NA';
    note: string | null;
    imageUrl: string | null;
  } | null;
}

export function ChecklistScreen({ route }: Props) {
  const { colors } = useAppTheme();
  const commonStyles = makeCommonStyles(colors);
  const { roundId, sectionId } = route.params;
  const [items, setItems] = useState<ChecklistItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    loadChecklist();
  }, []);

  const loadChecklist = async () => {
    try {
      const result = await api.checklist.get(roundId);
      const section = result.data.find((s: any) => s.id === sectionId);
      if (section) {
        setItems(section.items);
        // Initialize notes and images from existing entries
        const initialNotes: Record<string, string> = {};
        const initialImages: Record<string, string> = {};
        section.items.forEach((item: ChecklistItemData) => {
          if (item.entry?.note) {
            initialNotes[item.id] = item.entry.note;
          }
          if (item.entry?.imageUrl) {
            initialImages[item.id] = item.entry.imageUrl;
          }
        });
        setNotes(initialNotes);
        setImages(initialImages);
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
        imageUrl: images[itemId] || undefined,
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, entry: { status, note: notes[itemId] || null, imageUrl: images[itemId] || null } }
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
          imageUrl: images[itemId] || undefined,
        });
      } catch (err) {
        // Silent fail on auto-save, will retry on next change
      }
    }
  };

  const handlePickImage = async (itemId: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission Needed', 'Please allow access to your photo library to attach images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImages((prev) => ({ ...prev, [itemId]: uri }));
      // Auto-save if item already has a status
      const item = items.find((i) => i.id === itemId);
      if (item?.entry) {
        try {
          await api.checklist.save(roundId, itemId, {
            status: item.entry.status,
            note: notes[itemId] || undefined,
            imageUrl: uri,
          });
        } catch (err) {
          // Silent fail
        }
      }
    }
  };

  const handleTakePhoto = async (itemId: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission Needed', 'Please allow camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImages((prev) => ({ ...prev, [itemId]: uri }));
      const item = items.find((i) => i.id === itemId);
      if (item?.entry) {
        try {
          await api.checklist.save(roundId, itemId, {
            status: item.entry.status,
            note: notes[itemId] || undefined,
            imageUrl: uri,
          });
        } catch (err) {
          // Silent fail
        }
      }
    }
  };

  const handleRemoveImage = async (itemId: string) => {
    const confirmed = await showConfirm('Remove Photo', 'Are you sure you want to remove this photo?');
    if (!confirmed) return;

    setImages((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });

    const item = items.find((i) => i.id === itemId);
    if (item?.entry) {
      try {
        await api.checklist.save(roundId, itemId, {
          status: item.entry.status,
          note: notes[itemId] || undefined,
          imageUrl: '',
        });
      } catch (err) {
        // Silent fail
      }
    }
  };

  const styles = StyleSheet.create({
    center: { justifyContent: 'center', alignItems: 'center' },
    list: { padding: spacing.md, gap: spacing.sm },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
    itemName: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
    itemDescription: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
    statusRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    noteInput: { marginTop: spacing.sm, backgroundColor: colors.background, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.md, color: colors.text, minHeight: 48, borderWidth: 1, borderColor: colors.border },
    photoSection: { marginTop: spacing.sm },
    photoButtons: { flexDirection: 'row', gap: spacing.sm },
    photoBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.sm, paddingVertical: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.primary },
    photoBtnText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
    photoPreview: { alignItems: 'center', gap: spacing.xs },
    photoImage: { width: '100%', height: 200, borderRadius: borderRadius.sm },
    removePhotoBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
    removePhotoBtnText: { color: colors.red, fontSize: fontSize.sm, fontWeight: '600' },
  });

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

            {/* Photo attachment — shown when Attention status */}
            {item.entry?.status === 'ATTENTION' && (
              <View style={styles.photoSection}>
                {images[item.id] ? (
                  <View style={styles.photoPreview}>
                    <Image source={{ uri: images[item.id] }} style={styles.photoImage} resizeMode="cover" />
                    <TouchableOpacity
                      style={styles.removePhotoBtn}
                      onPress={() => handleRemoveImage(item.id)}
                    >
                      <Text style={styles.removePhotoBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.photoButtons}>
                    <TouchableOpacity
                      style={styles.photoBtn}
                      onPress={() => handleTakePhoto(item.id)}
                    >
                      <Text style={styles.photoBtnText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoBtn}
                      onPress={() => handlePickImage(item.id)}
                    >
                      <Text style={styles.photoBtnText}>Choose Photo</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

