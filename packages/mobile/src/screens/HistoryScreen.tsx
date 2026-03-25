import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { api } from '../api/client';
import { colors, spacing, fontSize, borderRadius, commonStyles } from '../theme';
import { ConditionBadge } from '../components/ConditionBadge';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

export function HistoryScreen({ route }: Props) {
  const { plantId } = route.params;
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async (pageNum = 1) => {
    try {
      const result = await api.history.list(plantId, pageNum);
      if (pageNum === 1) {
        setRounds(result.data.rounds);
      } else {
        setRounds((prev) => [...prev, ...result.data.rounds]);
      }
      setHasMore(result.data.pagination.page < result.data.pagination.totalPages);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore) {
      loadHistory(page + 1);
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
        data={rounds}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={commonStyles.rowBetween}>
              <View>
                <Text style={styles.date}>
                  {new Date(item.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={styles.operator}>
                  {item.operator?.name || 'Unknown'}
                </Text>
              </View>
              <View style={styles.rightCol}>
                {item.overallCondition && (
                  <ConditionBadge condition={item.overallCondition} />
                )}
                <Text style={styles.status}>
                  {item.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                </Text>
              </View>
            </View>

            {/* Quick stats */}
            <View style={styles.statsRow}>
              <Text style={styles.stat}>
                {item._count?.checklistEntries || 0} items
              </Text>
              <Text style={styles.statDivider}>·</Text>
              <Text style={styles.stat}>
                {item._count?.suggestions || 0} suggestions
              </Text>
              <Text style={styles.statDivider}>·</Text>
              <Text style={styles.stat}>
                {item._count?.issues || 0} issues
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No rounds recorded yet.</Text>
        }
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
  date: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  operator: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  status: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  stat: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  statDivider: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginHorizontal: spacing.sm,
  },
  empty: {
    fontSize: fontSize.md,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
