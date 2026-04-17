// Web font families — loaded via Google Fonts CSS import in index.html
export const fontFamilies = {
  display: "'Fraunces', serif",
  displayLight: "'Fraunces', serif",
  heading: "'Fraunces', serif",
  body: "'DM Sans', sans-serif",
  bodyMedium: "'DM Sans', sans-serif",
  bodySemiBold: "'DM Sans', sans-serif",
  bodyBold: "'DM Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
  monoMedium: "'IBM Plex Mono', monospace",
  monoBold: "'IBM Plex Mono', monospace",
};

// NOTE: lineHeight uses "Npx" strings (not numbers) because MUI's sx prop
// treats unitless numbers as CSS ratio multipliers (line-height: 38 = 38×fontSize).
// letterSpacing likewise uses "Npx" strings for the same reason.
export const typography = {
  display: {
    fontSize: 48,
    lineHeight: "54px",
    fontFamily: fontFamilies.display,
    fontWeight: 600,
    letterSpacing: "-1.4px",
  },
  displayLarge: {
    fontSize: 40,
    lineHeight: "46px",
    fontFamily: fontFamilies.display,
    fontWeight: 600,
    letterSpacing: "-1.2px",
  },
  displayMedium: {
    fontSize: 32,
    lineHeight: "38px",
    fontFamily: fontFamilies.display,
    fontWeight: 600,
    letterSpacing: "-0.9px",
  },
  h1: {
    fontSize: 32,
    lineHeight: "38px",
    fontFamily: fontFamilies.display,
    fontWeight: 600,
    letterSpacing: "-0.9px",
  },
  h2: {
    fontSize: 24,
    lineHeight: "30px",
    fontFamily: fontFamilies.display,
    fontWeight: 600,
    letterSpacing: "-0.6px",
  },
  h3: {
    fontSize: 20,
    lineHeight: "26px",
    fontFamily: fontFamilies.display,
    fontWeight: 600,
    letterSpacing: "-0.4px",
  },
  h4: {
    fontSize: 18,
    lineHeight: "24px",
    fontFamily: fontFamilies.bodySemiBold,
    fontWeight: 600,
    letterSpacing: "-0.2px",
  },
  body: {
    fontSize: 14,
    lineHeight: "20px",
    fontFamily: fontFamilies.body,
    fontWeight: 400,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: "24px",
    fontFamily: fontFamilies.body,
    fontWeight: 400,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: "20px",
    fontFamily: fontFamilies.body,
    fontWeight: 400,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: "16px",
    fontFamily: fontFamilies.body,
    fontWeight: 400,
  },
  label: {
    fontSize: 11,
    lineHeight: "14px",
    fontFamily: fontFamilies.bodyMedium,
    fontWeight: 500,
    letterSpacing: "1.2px",
    textTransform: "uppercase" as const,
  },
  labelLarge: {
    fontSize: 13,
    lineHeight: "16px",
    fontFamily: fontFamilies.bodyMedium,
    fontWeight: 500,
    letterSpacing: "0.8px",
  },
  scoreValue: {
    fontSize: 18,
    lineHeight: "24px",
    fontFamily: fontFamilies.monoBold,
    fontWeight: 700,
  },
  scoreLarge: {
    fontSize: 36,
    lineHeight: "42px",
    fontFamily: fontFamilies.monoBold,
    fontWeight: 700,
  },
  scoreHuge: {
    fontSize: 56,
    lineHeight: "62px",
    fontFamily: fontFamilies.monoBold,
    fontWeight: 700,
    letterSpacing: "-0.8px",
  },
  statDisplay: {
    fontSize: 40,
    lineHeight: "46px",
    fontFamily: fontFamilies.display,
    fontWeight: 600,
    letterSpacing: "-1.0px",
  },
  statLabel: {
    fontSize: 10,
    lineHeight: "12px",
    fontFamily: fontFamilies.bodySemiBold,
    fontWeight: 600,
    letterSpacing: "1.4px",
    textTransform: "uppercase" as const,
  },
  tableNumber: {
    fontSize: 14,
    lineHeight: "18px",
    fontFamily: fontFamilies.monoMedium,
    fontWeight: 500,
  },
  button: {
    fontSize: 15,
    lineHeight: "20px",
    fontFamily: fontFamilies.bodySemiBold,
    fontWeight: 600,
    letterSpacing: "0.2px",
  },
  buttonSmall: {
    fontSize: 13,
    lineHeight: "18px",
    fontFamily: fontFamilies.bodySemiBold,
    fontWeight: 600,
    letterSpacing: "0.2px",
  },
};

export type Typography = typeof typography;
export type FontFamilies = typeof fontFamilies;
