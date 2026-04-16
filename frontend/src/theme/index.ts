import { colors, darkColors, lightColors, ColorPalette } from "./colors";
import { typography, fontFamilies } from "./typography";
import { spacing, borderRadius, shadows } from "./spacing";
import { animations } from "./animations";

export const theme = {
  colors,
  typography,
  fontFamilies,
  spacing,
  borderRadius,
  shadows,
  animations,
};

export type Theme = typeof theme;

export const getThemedColors = (isDarkMode: boolean): ColorPalette => {
  return isDarkMode ? darkColors : lightColors;
};

export {
  colors,
  darkColors,
  lightColors,
  typography,
  fontFamilies,
  spacing,
  borderRadius,
  shadows,
  animations,
};
export type { ColorPalette };
