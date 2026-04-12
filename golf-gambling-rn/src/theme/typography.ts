// Typography — Fraunces (display serif, no italics) + DM Sans (body) + IBM Plex Mono (numbers)
// Readable, editorial, Masters-heritage feel. Tight tracking on headings, mixed case.

export const fontFamilies = {
  display: 'Fraunces_600SemiBold',
  displayLight: 'Fraunces_400Regular',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
  monoBold: 'IBMPlexMono_700Bold',
};

export const typography = {
  // Display — Fraunces serif, readable weights only
  display: {
    fontSize: 48,
    lineHeight: 54,
    fontFamily: fontFamilies.display,
    letterSpacing: -1.4,  // ≈ -0.03em
  },
  displayLarge: {
    fontSize: 40,
    lineHeight: 46,
    fontFamily: fontFamilies.display,
    letterSpacing: -1.2,
  },
  displayMedium: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: fontFamilies.display,
    letterSpacing: -0.9,
  },

  // Standard headings — Fraunces semibold
  h1: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: fontFamilies.display,
    fontWeight: '600' as const,
    letterSpacing: -0.9,
  },
  h2: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fontFamilies.display,
    fontWeight: '600' as const,
    letterSpacing: -0.6,
  },
  h3: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fontFamilies.display,
    fontWeight: '600' as const,
    letterSpacing: -0.4,
  },
  h4: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fontFamilies.bodySemiBold,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },

  // Body — DM Sans
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

  // Labels / micro-caps — DM Sans medium, uppercase, wider tracking
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fontFamilies.bodyMedium,
    fontWeight: '500' as const,
    letterSpacing: 1.2,
  },
  labelLarge: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: fontFamilies.bodyMedium,
    fontWeight: '500' as const,
    letterSpacing: 0.8,
  },

  // Scoring/stats — IBM Plex Mono
  scoreValue: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fontFamilies.monoBold,
    fontWeight: '700' as const,
  },
  scoreLarge: {
    fontSize: 36,
    lineHeight: 42,
    fontFamily: fontFamilies.monoBold,
    fontWeight: '700' as const,
  },
  scoreHuge: {
    fontSize: 56,
    lineHeight: 62,
    fontFamily: fontFamilies.monoBold,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
  },

  // Stat displays — Fraunces for hero numbers (when non-tabular)
  statDisplay: {
    fontSize: 40,
    lineHeight: 46,
    fontFamily: fontFamilies.display,
    fontWeight: '600' as const,
    letterSpacing: -1.0,
  },
  statLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontFamily: fontFamilies.bodySemiBold,
    fontWeight: '600' as const,
    letterSpacing: 1.4,
  },
  tableNumber: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fontFamilies.monoMedium,
    fontWeight: '500' as const,
  },

  // Buttons
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fontFamilies.bodySemiBold,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  buttonSmall: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.bodySemiBold,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
};

export type Typography = typeof typography;
export type FontFamilies = typeof fontFamilies;
