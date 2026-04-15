import { createTheme, ThemeOptions } from '@mui/material/styles';
import { lightColors, darkColors, ColorPalette } from './colors';
import { fontFamilies, typography } from './typography';
import { borderRadius } from './spacing';

const getThemeOptions = (colors: ColorPalette): ThemeOptions => ({
  palette: {
    mode: colors === lightColors ? 'light' : 'dark',
    primary: {
      main: colors.accent.gold,
      dark: colors.accent.goldDark,
      light: colors.accent.goldLight,
    },
    secondary: {
      main: colors.primary[500],
      dark: colors.primary[700],
      light: colors.primary[300],
    },
    background: {
      default: colors.background.primary,
      paper: colors.background.card,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      disabled: colors.text.disabled,
    },
    error: {
      main: colors.status.error,
    },
    warning: {
      main: colors.status.warning,
    },
    success: {
      main: colors.status.success,
    },
    info: {
      main: colors.status.info,
    },
    divider: colors.border.light,
  },
  typography: {
    fontFamily: fontFamilies.body,
    h1: {
      fontFamily: fontFamilies.display,
      fontSize: typography.h1.fontSize,
      lineHeight: `${typography.h1.lineHeight}px`,
      fontWeight: typography.h1.fontWeight,
      letterSpacing: `${typography.h1.letterSpacing}px`,
    },
    h2: {
      fontFamily: fontFamilies.display,
      fontSize: typography.h2.fontSize,
      lineHeight: `${typography.h2.lineHeight}px`,
      fontWeight: typography.h2.fontWeight,
      letterSpacing: `${typography.h2.letterSpacing}px`,
    },
    h3: {
      fontFamily: fontFamilies.display,
      fontSize: typography.h3.fontSize,
      lineHeight: `${typography.h3.lineHeight}px`,
      fontWeight: typography.h3.fontWeight,
      letterSpacing: `${typography.h3.letterSpacing}px`,
    },
    h4: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: typography.h4.fontSize,
      lineHeight: `${typography.h4.lineHeight}px`,
      fontWeight: typography.h4.fontWeight,
      letterSpacing: `${typography.h4.letterSpacing}px`,
    },
    body1: {
      fontFamily: fontFamilies.body,
      fontSize: typography.body.fontSize,
      lineHeight: `${typography.body.lineHeight}px`,
    },
    body2: {
      fontFamily: fontFamilies.body,
      fontSize: typography.bodySmall.fontSize,
      lineHeight: `${typography.bodySmall.lineHeight}px`,
    },
    button: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: typography.button.fontSize,
      fontWeight: typography.button.fontWeight,
      letterSpacing: `${typography.button.letterSpacing}px`,
      textTransform: 'none',
    },
    caption: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      lineHeight: '16px',
    },
    overline: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: typography.label.fontSize,
      lineHeight: `${typography.label.lineHeight}px`,
      fontWeight: typography.label.fontWeight,
      letterSpacing: `${typography.label.letterSpacing}px`,
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: borderRadius.lg,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.full,
          textTransform: 'none',
          fontFamily: fontFamilies.bodySemiBold,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.xl,
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: borderRadius.lg,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: borderRadius.xl,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.full,
        },
      },
    },
  },
});

export const lightTheme = createTheme(getThemeOptions(lightColors));
export const darkTheme = createTheme(getThemeOptions(darkColors));

export const getMuiTheme = (isDarkMode: boolean) => isDarkMode ? darkTheme : lightTheme;
