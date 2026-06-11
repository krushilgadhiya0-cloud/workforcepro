import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getLocalData, loadData, saveData } from '../utils/storage';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => getLocalData().settings.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    void loadData().then((data) => {
      data.settings.theme = theme;
      return saveData(data);
    });
  }, [theme]);

  const toggleTheme = () => setThemeState((t) => (t === 'light' ? 'dark' : 'light'));
  const setTheme = (t: 'light' | 'dark') => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
