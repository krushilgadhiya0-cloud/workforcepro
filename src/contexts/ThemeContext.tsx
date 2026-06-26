import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getLocalData, loadData, saveData } from '../utils/storage';

interface ThemeContextType {
  theme: 'light' | 'dark';
  accentColor: string;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => getLocalData().settings.theme);
  const [accentColor, setAccentColorState] = useState<string>(() => getLocalData().settings.accentColor || 'indigo');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-accent', accentColor);
    
    void loadData().then((data) => {
      data.settings.theme = theme;
      data.settings.accentColor = accentColor as any;
      return saveData(data);
    });
  }, [theme, accentColor]);

  const toggleTheme = () => setThemeState((t) => (t === 'light' ? 'dark' : 'light'));
  const setTheme = (t: 'light' | 'dark') => setThemeState(t);
  const setAccentColor = (c: string) => setAccentColorState(c);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
