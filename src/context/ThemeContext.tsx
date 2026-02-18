'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'brutalist' | 'minimal' | 'terminal';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'minimal',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('minimal');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('prompt-library-theme') as Theme;
    if (saved && ['brutalist', 'minimal', 'terminal'].includes(saved)) {
      setThemeState(saved);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('prompt-library-theme', newTheme);
    }
  };

  // During SSR, render with default theme
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: 'minimal', setTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
