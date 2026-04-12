// Golf Gambling App — Editorial Masters palette
// Light mode is primary; dark mode provides parity
// Gold is used with restraint: primary CTAs, section rules, active states only.

export const lightColors = {
  background: {
    primary: '#FAFAF7',      // warm cream-white (page)
    secondary: '#F4F1EA',    // subtle elevated surface
    card: '#FFFFFF',         // cards on cream
    elevated: '#FAF8F3',     // modals / highest elevation
    dark: '#EDE9DF',         // inverse / pressed
  },

  accent: {
    gold: '#D4AF37',         // primary gold (solid)
    goldDark: '#B8860B',     // gradient end / pressed
    goldLight: '#E7C65F',    // highlights
    goldMuted: '#9A7B00',    // subtle gold (meta)
  },

  primary: {
    50: '#E8F5EC',
    100: '#C8E6CF',
    200: '#A5D6B0',
    300: '#81C791',
    400: '#4CAF6A',
    500: '#006747',          // Masters green (secondary accent)
    600: '#005A3D',
    700: '#004D35',
    800: '#003D2A',
    900: '#002D1F',
  },

  scoring: {
    positive: '#2E7D3E',
    negative: '#C62828',
    neutral: '#8A8A8A',
    birdie: '#0277BD',
    eagle: '#6A1B9A',
  },

  multipliers: {
    up: '#D97706',
    upGlow: 'rgba(217, 119, 6, 0.18)',
    burn: '#B91C1C',
    burnGlow: 'rgba(185, 28, 28, 0.18)',
  },

  text: {
    primary: '#1A1A1A',      // near-black, warmer than #000
    secondary: '#5A5A5A',    // secondary gray
    tertiary: '#8A8A8A',     // meta gray
    disabled: '#BDB6A8',
    gold: '#B8860B',         // readable gold on cream
    inverse: '#FAFAF7',      // text on dark/gold surfaces
  },

  border: {
    light: '#EAE5DA',        // hairline on cream
    medium: '#D6CFC0',       // standard border
    dark: '#A8A090',         // high emphasis
    gold: '#D4AF37',
    goldSubtle: 'rgba(212, 175, 55, 0.35)',
  },

  status: {
    success: '#2E7D3E',
    warning: '#C77700',
    error: '#C62828',
    info: '#0277BD',
  },

  gradients: {
    primary: ['#006747', '#004D35', '#002D1F'],
    primaryDark: ['#004D35', '#002D1F', '#1A1A1A'],
    gold: ['#D4AF37', '#B8860B'],              // CTA gradient
    goldShine: ['#E7C65F', '#D4AF37', '#B8860B'],
    goldSubtle: ['rgba(212,175,55,0.16)', 'rgba(212,175,55,0)'],
    victory: ['#D4AF37', '#B8860B'],
    cream: ['#FAFAF7', '#F4F1EA'],             // page bg gradient
    creamReverse: ['#F4F1EA', '#FAFAF7'],
    header: ['#FAFAF7', '#F4F1EA', '#FAFAF7'],
    card: ['#FFFFFF', '#FAF8F3'],
  },

  glass: {
    light: 'rgba(255, 255, 255, 0.55)',
    medium: 'rgba(255, 255, 255, 0.75)',
    strong: 'rgba(255, 255, 255, 0.92)',
    border: 'rgba(26, 26, 26, 0.08)',
    goldBorder: 'rgba(212, 175, 55, 0.32)',
    darkMedium: 'rgba(26, 26, 26, 0.30)',
    darkStrong: 'rgba(26, 26, 26, 0.55)',
    blur: 20,
  },

  surfaces: {
    level0: '#FAFAF7',
    level1: '#FFFFFF',
    level2: '#FAF8F3',
    level3: '#F4F1EA',
    level4: '#EDE9DF',
  },

  confirmedHoleBg: 'rgba(0, 103, 71, 0.12)',

  glow: {
    gold: 'rgba(212, 175, 55, 0.25)',
    goldStrong: 'rgba(212, 175, 55, 0.40)',
    green: 'rgba(0, 103, 71, 0.22)',
    positive: 'rgba(46, 125, 62, 0.18)',
    negative: 'rgba(198, 40, 40, 0.18)',
  },

  charts: {
    series: ['#D4AF37', '#006747', '#0277BD', '#6A1B9A', '#D97706', '#2E7D3E', '#C62828'],
    grid: '#EAE5DA',
    axis: '#A8A090',
  },

  shadowColors: {
    default: 'rgba(26, 26, 26, 0.12)',
    soft: 'rgba(26, 26, 26, 0.08)',
    gold: 'rgba(212, 175, 55, 0.30)',
    green: 'rgba(0, 103, 71, 0.20)',
  },
};

// Dark mode — parity with light, tuned for OLED-friendly backgrounds
export const darkColors = {
  background: {
    primary: '#0A0A0A',
    secondary: '#141414',
    card: '#1A1A1A',
    elevated: '#242424',
    dark: '#000000',
  },

  accent: {
    gold: '#E8C866',         // brighter gold for dark (readable)
    goldDark: '#B8860B',
    goldLight: '#F3D983',
    goldMuted: '#9A7B00',
  },

  primary: {
    50: '#E8F5EC',
    100: '#C8E6CF',
    200: '#A5D6B0',
    300: '#81C791',
    400: '#4CAF6A',
    500: '#1A8960',          // brighter green for dark contrast
    600: '#006747',
    700: '#004D35',
    800: '#003D2A',
    900: '#002D1F',
  },

  scoring: {
    positive: '#4ADE80',
    negative: '#F87171',
    neutral: '#9CA3AF',
    birdie: '#60A5FA',
    eagle: '#C084FC',
  },

  multipliers: {
    up: '#FB923C',
    upGlow: 'rgba(251, 146, 60, 0.35)',
    burn: '#F87171',
    burnGlow: 'rgba(248, 113, 113, 0.35)',
  },

  text: {
    primary: '#F5F2EA',       // warm white
    secondary: '#B3ADA0',     // warm gray
    tertiary: '#7A7468',
    disabled: '#3A3630',
    gold: '#E8C866',
    inverse: '#0A0A0A',
  },

  border: {
    light: '#2A2620',
    medium: '#3A362E',
    dark: '#4A4640',
    gold: '#E8C866',
    goldSubtle: 'rgba(232, 200, 102, 0.30)',
  },

  status: {
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',
  },

  gradients: {
    primary: ['#1A8960', '#006747', '#002D1F'],
    primaryDark: ['#006747', '#002D1F', '#0A0A0A'],
    gold: ['#E8C866', '#B8860B'],
    goldShine: ['#F3D983', '#E8C866', '#B8860B'],
    goldSubtle: ['rgba(232,200,102,0.22)', 'rgba(232,200,102,0)'],
    victory: ['#E8C866', '#B8860B'],
    cream: ['#141414', '#0A0A0A'],
    creamReverse: ['#0A0A0A', '#141414'],
    header: ['#141414', '#0A0A0A', '#141414'],
    card: ['#1E1E1E', '#1A1A1A'],
  },

  glass: {
    light: 'rgba(255, 255, 255, 0.03)',
    medium: 'rgba(255, 255, 255, 0.06)',
    strong: 'rgba(255, 255, 255, 0.10)',
    border: 'rgba(255, 255, 255, 0.08)',
    goldBorder: 'rgba(232, 200, 102, 0.28)',
    darkMedium: 'rgba(0, 0, 0, 0.70)',
    darkStrong: 'rgba(0, 0, 0, 0.85)',
    blur: 20,
  },

  surfaces: {
    level0: '#0A0A0A',
    level1: '#141414',
    level2: '#1A1A1A',
    level3: '#242424',
    level4: '#2E2E2E',
  },

  confirmedHoleBg: 'rgba(26, 137, 96, 0.28)',

  glow: {
    gold: 'rgba(232, 200, 102, 0.32)',
    goldStrong: 'rgba(232, 200, 102, 0.50)',
    green: 'rgba(26, 137, 96, 0.32)',
    positive: 'rgba(74, 222, 128, 0.28)',
    negative: 'rgba(248, 113, 113, 0.28)',
  },

  charts: {
    series: ['#E8C866', '#4ADE80', '#60A5FA', '#C084FC', '#FB923C', '#34D399', '#F87171'],
    grid: '#2A2A2A',
    axis: '#7A7468',
  },

  shadowColors: {
    default: 'rgba(0, 0, 0, 0.50)',
    soft: 'rgba(0, 0, 0, 0.35)',
    gold: 'rgba(232, 200, 102, 0.30)',
    green: 'rgba(26, 137, 96, 0.30)',
  },
};

// Light is primary in this app — default export reflects that
export const colors = lightColors;

export type ColorPalette = typeof lightColors;
