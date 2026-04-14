import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceHover: string;
  surfaceAlt: string;
  inputBg: string;
  editBg: string;
  editBorder: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Borders
  border: string;
  borderLight: string;

  // Sidebar
  sidebarBg: string;
  sidebarBorder: string;
  sidebarText: string;
  sidebarActiveText: string;
  sidebarActiveBg: string;

  // Login
  loginBg: string;
  loginFormBg: string;
  loginTitle: string;
}

const lightTheme: ThemeColors = {
  background: '#f8fafc',
  surface: '#fff',
  surfaceHover: '#f8fafc',
  surfaceAlt: '#f1f5f9',
  inputBg: '#fff',
  editBg: '#eff6ff',
  editBorder: '#bfdbfe',

  text: '#1e293b',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',

  border: '#e2e8f0',
  borderLight: '#f1f5f9',

  sidebarBg: '#1e293b',
  sidebarBorder: '#334155',
  sidebarText: '#94a3b8',
  sidebarActiveText: '#fff',
  sidebarActiveBg: '#334155',

  loginBg: '#1e40af',
  loginFormBg: '#fff',
  loginTitle: '#1e40af',
};

const darkTheme: ThemeColors = {
  background: '#0f172a',
  surface: '#1e293b',
  surfaceHover: '#1e293b',
  surfaceAlt: '#334155',
  inputBg: '#0f172a',
  editBg: '#172554',
  editBorder: '#1d4ed8',

  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',

  border: '#334155',
  borderLight: '#1e293b',

  sidebarBg: '#020617',
  sidebarBorder: '#1e293b',
  sidebarText: '#64748b',
  sidebarActiveText: '#f1f5f9',
  sidebarActiveBg: '#1e293b',

  loginBg: '#020617',
  loginFormBg: '#1e293b',
  loginTitle: '#60a5fa',
};

type Mode = 'light' | 'dark';

interface ThemeContextValue {
  mode: Mode;
  theme: ThemeColors;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  theme: lightTheme,
  toggle: () => {},
});

const STORAGE_KEY = 'oscar_admin_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'dark' || stored === 'light') ? stored : 'light';
  });

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    document.body.style.background = theme.background;
    document.body.style.color = theme.text;
  }, [mode, theme]);

  const toggle = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ mode, theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
