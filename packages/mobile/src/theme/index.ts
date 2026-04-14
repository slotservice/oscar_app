import { StyleSheet } from 'react-native';
import { ThemeColors } from './ThemeContext';

// Re-export theme context
export { ThemeProvider, useAppTheme } from './ThemeContext';
export type { ThemeColors, ThemeMode } from './ThemeContext';

// Static light colors for backwards compatibility (used in static StyleSheets)
export const colors = {
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

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  title: 34,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 999,
};

// Dynamic common styles factory
export function makeCommonStyles(c: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    screenPadded: {
      flex: 1,
      backgroundColor: c.background,
      padding: spacing.md,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: fontSize.xxl,
      fontWeight: '700',
      color: c.text,
    },
    subtitle: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: c.text,
    },
    body: {
      fontSize: fontSize.md,
      color: c.text,
    },
    caption: {
      fontSize: fontSize.sm,
      color: c.textSecondary,
    },
    button: {
      backgroundColor: c.primary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    buttonText: {
      color: c.textWhite,
      fontSize: fontSize.md,
      fontWeight: '600',
    },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      fontSize: fontSize.md,
      color: c.text,
    },
  });
}

// Static commonStyles kept for any file that hasn't migrated yet
export const commonStyles = makeCommonStyles(colors as ThemeColors);
