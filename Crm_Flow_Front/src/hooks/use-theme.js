import { createContext, useContext } from 'react';

export const THEME_STORAGE_KEY = 'flow-crm:theme';
export const THEME_OPTIONS = Object.freeze(['light', 'dark', 'system']);

export const ThemeContext = createContext({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export function isValidTheme(value) {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function resolveTheme(theme, prefersDark) {
  if (theme === 'dark') {
    return 'dark';
  }
  if (theme === 'light') {
    return 'light';
  }
  return prefersDark ? 'dark' : 'light';
}

export function readStoredTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isValidTheme(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function useTheme() {
  return useContext(ThemeContext);
}
