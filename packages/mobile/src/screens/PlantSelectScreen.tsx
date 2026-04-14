import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { api } from '../api/client';
import { useAppTheme, makeCommonStyles, spacing, fontSize, borderRadius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PlantSelect'>;

export function PlantSelectScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  const commonStyles = makeCommonStyles(colors);
  const [plants, setPlants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPlants(); }, []);

  const loadPlants = async () => {
    try {
      const result = await api.plants.list();
      setPlants(result.data);
    } catch (err) {
      console.error('Failed to load plants:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectPlant = (plant: any) => {
    navigation.navigate('Dashboard', { plantId: plant.id, plantName: plant.name });
  };

  const styles = StyleSheet.create({
    center: { justifyContent: 'center', alignItems: 'center' },
    heading: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
    list: { gap: spacing.sm },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
    plantName: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text },
    location: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
    type: { fontSize: fontSize.sm, color: colors.textLight, marginTop: spacing.xs },
    empty: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
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
      <Text style={styles.heading}>Your Facilities</Text>
      <FlatList
        data={plants}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => selectPlant(item)}>
            <Text style={styles.plantName}>{item.name}</Text>
            {item.location && <Text style={styles.location}>{item.location}</Text>}
            {item.plantType && <Text style={styles.type}>{item.plantType}</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No facilities assigned. Contact your administrator.</Text>
        }
      />
    </View>
  );
}
