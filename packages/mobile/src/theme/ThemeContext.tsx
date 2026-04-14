import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { StyleSheet, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'oscar_theme_mode';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;

  green: string;
  greenLight: string;
  yellow: string;
  yellowLight: string;
  red: string;
  redLight: string;

  white: string;
  background: string;
  surface: string;
  border: string;
  borderLight: string;

  text: string;
  textSecondary: string;
  textLight: string;
  textWhite: string;

  disabled: string;
}

const lightColors: ThemeColors = {
  primary: '#1E40AF',
  primaryLight: '#3B82F6',
  primaryDark: '#1E3A8A',

  green: '#22C55E',
  greenLight: '#DCFCE7',
  yellow: '#EAB308',
  yellowLight: '#FEF9C3',
  red: '#EF4444',
  redLight: '#FEE2E2',

  white: '#FFFFFF',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  text: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  textWhite: '#FFFFFF',

  disabled: '#CBD5E1',
};

const darkColors: ThemeColors = {
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#1E40AF',

  green: '#22C55E',
  greenLight: '#14532D',
  yellow: '#EAB308',
  yellowLight: '#422006',
  red: '#EF4444',
  redLight: '#450A0A',

  white: '#1E293B',
  background: '#0F172A',
  surface: '#1E293B',
  border: '#334155',
  borderLight: '#1E293B',

  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textLight: '#64748B',
  textWhite: '#FFFFFF',

  disabled: '#475569',
};

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  colors: lightColors,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    (async () => {
      try {
        let stored: string | null = null;
        if (Platform.OS === 'web') {
          stored = localStorage.getItem(STORAGE_KEY);
        } else {
          stored = await SecureStore.getItemAsync(STORAGE_KEY);
        }
        if (stored === 'dark' || stored === 'light') {
          setMode(stored);
        }
      } catch {}
    })();
  }, []);

  const toggle = async () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(STORAGE_KEY, next);
      } else {
        await SecureStore.setItemAsync(STORAGE_KEY, next);
      }
    } catch {}
  };

  const colors = mode === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
