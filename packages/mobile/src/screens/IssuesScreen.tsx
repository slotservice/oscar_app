import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, Switch } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { api } from '../api/client';
import { useAppTheme, makeCommonStyles, spacing, fontSize, borderRadius } from '../theme';
import { showAlert } from '../utils/alert';

type Props = NativeStackScreenProps<RootStackParamList, 'Issues'>;

export function IssuesScreen({ route }: Props) {
  const { colors } = useAppTheme();
  const commonStyles = makeCommonStyles(colors);
  const { roundId } = route.params;
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [supervisorFlag, setSupervisorFlag] = useState(false);

  useEffect(() => { loadIssues(); }, []);

  const loadIssues = async () => {
    try { const result = await api.issues.get(roundId); setIssues(result.data); }
    catch (err) { console.error('Failed to load issues:', err); }
    finally { setLoading(false); }
  };

  const addIssue = async () => {
    if (!description.trim()) { showAlert('Required', 'Please describe the issue.'); return; }
    try {
      const result = await api.issues.create(roundId, { description: description.trim(), actionTaken: actionTaken.trim() || undefined, supervisorFlag });
      setIssues((prev) => [result.data, ...prev]);
      setDescription(''); setActionTaken(''); setSupervisorFlag(false);
    } catch (err) { showAlert('Error', 'Failed to save issue.'); }
  };

  const styles = StyleSheet.create({
    center: { justifyContent: 'center', alignItems: 'center' },
    form: { padding: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
    formTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
    input: { backgroundColor: colors.background, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.md, color: colors.text, minHeight: 48, borderWidth: 1, borderColor: colors.border },
    switchLabel: { fontSize: fontSize.md, color: colors.text },
    list: { padding: spacing.md, gap: spacing.sm },
    issueCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
    issueDescription: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, flex: 1 },
    supervisorBadge: { backgroundColor: colors.redLight, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
    supervisorText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.red },
    actionText: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
    timestamp: { fontSize: fontSize.xs, color: colors.textLight, marginTop: spacing.xs },
    empty: { fontSize: fontSize.md, color: colors.textLight, textAlign: 'center', marginTop: spacing.xl },
  });

  if (loading) {
    return (<View style={[commonStyles.screen, styles.center]}><ActivityIndicator size="large" color={colors.primary} /></View>);
  }

  return (
    <View style={commonStyles.screen}>
      <View style={styles.form}>
        <Text style={styles.formTitle}>Report an Issue</Text>
        <TextInput style={styles.input} placeholder="Describe the issue..." placeholderTextColor={colors.textLight} value={description} onChangeText={setDescription} multiline />
        <TextInput style={styles.input} placeholder="Action taken (optional)" placeholderTextColor={colors.textLight} value={actionTaken} onChangeText={setActionTaken} multiline />
        <View style={commonStyles.rowBetween}>
          <Text style={styles.switchLabel}>Flag for Supervisor</Text>
          <Switch value={supervisorFlag} onValueChange={setSupervisorFlag} trackColor={{ false: colors.border, true: colors.primaryLight }} thumbColor={supervisorFlag ? colors.primary : colors.disabled} />
        </View>
        <TouchableOpacity style={commonStyles.button} onPress={addIssue}>
          <Text style={commonStyles.buttonText}>Add Issue</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={issues}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.issueCard}>
            <View style={commonStyles.rowBetween}>
              <Text style={styles.issueDescription}>{item.description}</Text>
              {item.supervisorFlag && (<View style={styles.supervisorBadge}><Text style={styles.supervisorText}>SUP</Text></View>)}
            </View>
            {item.actionTaken && <Text style={styles.actionText}>Action: {item.actionTaken}</Text>}
            <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No issues reported yet.</Text>}
      />
    </View>
  );
}
