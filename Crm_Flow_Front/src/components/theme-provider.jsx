/**
 * @file Renderiza theme provider, na área de aplicação, expondo os estados e eventos
 * necessários à interface.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  isValidTheme,
  readStoredTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  ThemeContext,
} from '@/hooks/use-theme';

function getSystemPrefersDark() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);
  const [systemDark, setSystemDark] = useState(getSystemPrefersDark);

  const resolvedTheme = resolveTheme(theme, systemDark);

  const setTheme = useCallback((nextTheme) => {
    if (!isValidTheme(nextTheme)) {
      return;
    }

    setThemeState(nextTheme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Ignora falhas de armazenamento (ex.: navegação privada restrita).
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');

    if (!media) {
      return undefined;
    }

    const handleChange = (event) => setSystemDark(event.matches);

    media.addEventListener('change', handleChange);

    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
