// Font families - loaded via expo-google-fonts
export const fontFamilies = {
  display: 'BebasNeue_400Regular',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
};

export const typography = {
  // Display headings - Bebas Neue for impact
  display: {
    fontSize: 64,
    lineHeight: 72,
    fontFamily: fontFamilies.display,
    letterSpacing: 1,
  },
  displayLarge: {
    fontSize: 48,
    lineHeight: 56,
    fontFamily: fontFamilies.display,
    letterSpacing: 0.5,
  },
  displayMedium: {
    fontSize: 36,
    lineHeight: 44,
    fontFamily: fontFamilies.display,
    letterSpacing: 0.5,
  },

  // Standard headings - DM Sans Bold
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: fontFamilies.bodyBold,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: fontFamilies.bodySemiBold,
    fontWeight: '600' as const,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: fontFamilies.bodySemiBold,
    fontWeight: '600' as const,
  },
  h4: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fontFamilies.bodySemiBold,
    fontWeight: '600' as const,
  },

  // Body text - DM Sans
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fontFamilies.body,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamilies.body,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamilies.body,
    fontWeight: '400' as const,
  },

  // Labels - DM Sans Medium
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamilies.bodyMedium,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fontFamilies.bodyMedium,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
  },

  // Scores and stats - JetBrains Mono for tabular alignment
  scoreValue: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fontFamilies.monoBold,
    fontWeight: '700' as const,
  },
  scoreLarge: {
    fontSize: 36,
    lineHeight: 44,
    fontFamily: fontFamilies.monoBold,
    fontWeight: '700' as const,
  },
  scoreHuge: {
    fontSize: 64,
    lineHeight: 72,
    fontFamily: fontFamilies.display,
    letterSpacing: 2,
  },

  // Sports-style stat displays
  statDisplay: {
    fontSize: 48,
    lineHeight: 56,
    fontFamily: fontFamilies.display,
    letterSpacing: 1,
  },
  statLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontFamily: fontFamilies.bodySemiBold,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
  },
  tableNumber: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fontFamilies.mono,
    fontWeight: '600' as const,
  },

  // Button text
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fontFamilies.bodySemiBold,
    fontWeight: '600' as const,
  },
  buttonSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamilies.bodySemiBold,
    fontWeight: '600' as const,
  },
};

export type Typography = typeof typography;
export type FontFamilies = typeof fontFamilies;
