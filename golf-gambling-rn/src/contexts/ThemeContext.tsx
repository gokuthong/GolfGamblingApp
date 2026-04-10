import React, { createContext, useContext, ReactNode } from 'react';
import { darkColors, lightColors, ColorPalette } from '../theme/colors';
import { useStore } from '../store';

interface ThemeContextValue {
  colors: ColorPalette;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const isDarkMode = useStore((state) => state.settings.darkMode);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemedColors = (): ColorPalette => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemedColors must be used within ThemeProvider');
  }
  return context.colors;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
