import React, { createContext, useContext, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useStore } from '../store';
import { getThemedColors, ColorPalette } from '../theme';
import { getMuiTheme } from '../theme/muiTheme';

interface ThemeContextValue {
  colors: ColorPalette;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useThemedColors = (): ColorPalette => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemedColors must be used within ThemeProvider');
  return ctx.colors;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDarkMode = useStore((state) => state.settings.darkMode);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);
  const colors = useMemo(() => getThemedColors(isDarkMode), [isDarkMode]);
  const muiTheme = useMemo(() => getMuiTheme(isDarkMode), [isDarkMode]);

  const value = useMemo(() => ({ colors, isDarkMode, toggleDarkMode }), [colors, isDarkMode, toggleDarkMode]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
