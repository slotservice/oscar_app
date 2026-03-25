import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { getAuthToken } from '../api/client';

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
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const headerStyle = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.textWhite,
  headerTitleStyle: { fontWeight: '600' as const },
};

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
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
    </Stack.Navigator>
  );
}
