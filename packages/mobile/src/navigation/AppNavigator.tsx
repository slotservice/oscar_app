import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppTheme } from '../theme';
import { loadStoredToken, setAuthToken, api } from '../api/client';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { PlantSelectScreen } from '../screens/PlantSelectScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { RoundScreen } from '../screens/RoundScreen';
import { ChecklistScreen } from '../screens/ChecklistScreen';
import { LabEntryScreen } from '../screens/LabEntryScreen';
import { ObservationsScreen } from '../screens/ObservationsScreen';
import { SuggestionsScreen } from '../screens/SuggestionsScreen';
import { IssuesScreen } from '../screens/IssuesScreen';
import { SummaryScreen } from '../screens/SummaryScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { MonthlyReportScreen } from '../screens/MonthlyReportScreen';

export type RootStackParamList = {
  Login: undefined;
  PlantSelect: undefined;
  Dashboard: { plantId: string; plantName: string };
  Round: { roundId: string; plantId: string; plantName: string };
  Checklist: { roundId: string; sectionId: string; sectionName: string };
  LabEntry: { roundId: string };
  Observations: { roundId: string };
  Suggestions: { roundId: string };
  Issues: { roundId: string };
  Summary: { roundId: string };
  History: { plantId: string; plantName: string };
  MonthlyReport: { plantId: string; plantName: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { colors } = useAppTheme();
  const [checking, setChecking] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');

  useEffect(() => {
    (async () => {
      try {
        const token = await loadStoredToken();
        if (token) {
          await api.auth.me();
          setInitialRoute('PlantSelect');
        }
      } catch {
        await setAuthToken(null);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const headerStyle = {
    headerStyle: { backgroundColor: colors.primary },
    headerTintColor: colors.textWhite,
    headerTitleStyle: { fontWeight: '600' as const },
  };

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        ...headerStyle,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PlantSelect"
        component={PlantSelectScreen}
        options={{ title: 'Select Facility' }}
      />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={({ route }) => ({ title: route.params.plantName })}
      />
      <Stack.Screen
        name="Round"
        component={RoundScreen}
        options={{ title: 'Daily Round' }}
      />
      <Stack.Screen
        name="Checklist"
        component={ChecklistScreen}
        options={({ route }) => ({ title: route.params.sectionName })}
      />
      <Stack.Screen
        name="LabEntry"
        component={LabEntryScreen}
        options={{ title: 'Lab & Operating Data' }}
      />
      <Stack.Screen
        name="Observations"
        component={ObservationsScreen}
        options={{ title: 'Process Observations' }}
      />
      <Stack.Screen
        name="Suggestions"
        component={SuggestionsScreen}
        options={{ title: 'Suggestions' }}
      />
      <Stack.Screen
        name="Issues"
        component={IssuesScreen}
        options={{ title: 'Issues & Actions' }}
      />
      <Stack.Screen
        name="Summary"
        component={SummaryScreen}
        options={{ title: 'Daily Summary' }}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'Round History' }}
      />
      <Stack.Screen
        name="MonthlyReport"
        component={MonthlyReportScreen}
        options={{ title: 'Monthly Report' }}
      />
    </Stack.Navigator>
  );
}
