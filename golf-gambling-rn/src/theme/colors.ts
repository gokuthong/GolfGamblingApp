// Dark Premium Theme - Golf Gambling App
// ESPN/PGA Tour broadcast quality aesthetic

export const darkColors = {
  // Primary Background Palette - Near black for premium dark feel
  background: {
    primary: '#0A0A0A',      // Near black - main background
    secondary: '#141414',    // Elevated surfaces
    card: '#1A1A1A',         // Cards and containers
    elevated: '#242424',     // Modals and highest elevation
    dark: '#000000',         // Pure black for emphasis
  },

  // Gold Accent System - Premium touches
  accent: {
    gold: '#FFD700',         // Primary gold accent
    goldDark: '#B8860B',     // Pressed states
    goldLight: '#FFE44D',    // Highlights and glows
    goldMuted: '#9A7B00',    // Subtle gold
  },

  // Masters Green - Secondary accent (heritage)
  primary: {
    50: '#E8F5EC',
    100: '#C8E6CF',
    200: '#A5D6B0',
    300: '#81C791',
    400: '#4CAF6A',
    500: '#006747',          // Masters Tournament green
    600: '#005A3D',
    700: '#004D35',
    800: '#003D2A',
    900: '#002D1F',
  },

  // Scoring Colors - High contrast on dark
  scoring: {
    positive: '#00E676',     // Winning - bright green
    negative: '#FF5252',     // Losing - bright red
    neutral: '#78909C',      // Tie - muted gray
    birdie: '#40C4FF',       // Birdie - electric blue
    eagle: '#E040FB',        // Eagle - vibrant purple
  },

  // Multiplier Colors
  multipliers: {
    up: '#FF9100',           // Orange glow for "Up"
    upGlow: 'rgba(255, 145, 0, 0.4)',
    burn: '#FF1744',         // Red for "Burn"
    burnGlow: 'rgba(255, 23, 68, 0.4)',
  },

  // Text Colors - Optimized for dark backgrounds
  text: {
    primary: '#FFFFFF',      // Primary text - white
    secondary: '#9E9E9E',    // Secondary - gray
    tertiary: '#616161',     // Tertiary - darker gray
    disabled: '#424242',     // Disabled state
    gold: '#FFD700',         // Gold accent text
    inverse: '#0A0A0A',      // For light backgrounds
  },

  // Border Colors - Subtle on dark
  border: {
    light: '#2A2A2A',        // Subtle borders
    medium: '#3A3A3A',       // Medium emphasis
    dark: '#4A4A4A',         // High emphasis
    gold: '#FFD700',         // Gold accent borders
    goldSubtle: 'rgba(255, 215, 0, 0.3)',
  },

  // Status Colors - Vibrant on dark
  status: {
    success: '#00E676',
    warning: '#FFAB00',
    error: '#FF5252',
    info: '#40C4FF',
  },

  // Gradients - Dark to darker with accent hints
  gradients: {
    primary: ['#006747', '#004D35', '#002D1F'],     // Masters green fade
    primaryDark: ['#004D35', '#002D1F', '#0A0A0A'], // Green to black
    gold: ['#FFD700', '#B8860B'],                    // Gold gradient
    goldSubtle: ['rgba(255,215,0,0.2)', 'rgba(255,215,0,0)'], // Gold fade
    victory: ['#00E676', '#00C853'],                 // Winning green
    dark: ['#1A1A1A', '#0A0A0A'],                    // Dark elevation
    darkReverse: ['#0A0A0A', '#1A1A1A'],
    header: ['#006747', '#004D35', '#0A0A0A'],       // Header gradient
    card: ['#1E1E1E', '#1A1A1A'],                    // Card subtle gradient
  },

  // Glassmorphism - For dark theme
  glass: {
    light: 'rgba(255, 255, 255, 0.03)',
    medium: 'rgba(255, 255, 255, 0.06)',
    strong: 'rgba(255, 255, 255, 0.10)',
    border: 'rgba(255, 255, 255, 0.08)',
    goldBorder: 'rgba(255, 215, 0, 0.25)',
    darkMedium: 'rgba(0, 0, 0, 0.7)',       // Dark overlay for modals
    darkStrong: 'rgba(0, 0, 0, 0.85)',      // Stronger dark overlay
    blur: 20,
  },

  // Surface Elevation System
  surfaces: {
    level0: '#0A0A0A',       // Base
    level1: '#141414',       // Slight elevation
    level2: '#1A1A1A',       // Medium elevation
    level3: '#242424',       // High elevation
    level4: '#2E2E2E',       // Highest elevation
  },

  // Confirmed hole background
  confirmedHoleBg: 'rgba(0, 103, 71, 0.35)',

  // Glow Effects - For buttons and highlights
  glow: {
    gold: 'rgba(255, 215, 0, 0.35)',
    goldStrong: 'rgba(255, 215, 0, 0.5)',
    green: 'rgba(0, 103, 71, 0.35)',
    positive: 'rgba(0, 230, 118, 0.3)',
    negative: 'rgba(255, 82, 82, 0.3)',
  },

  // Chart Colors - Vibrant series for dark backgrounds
  charts: {
    series: ['#FFD700', '#00E676', '#40C4FF', '#E040FB', '#FF9100', '#00BCD4', '#FF5252'],
    grid: '#2A2A2A',
    axis: '#616161',
  },

  // Shadows with color - for dark theme depth
  shadowColors: {
    default: 'rgba(0, 0, 0, 0.5)',
    gold: 'rgba(255, 215, 0, 0.3)',
    green: 'rgba(0, 103, 71, 0.3)',
  },
};

// Light Premium Theme - Optimized for bright environments
// Maintains premium look with high contrast and readability

export const lightColors = {
  // Primary Background Palette - Clean whites and light grays
  background: {
    primary: '#FAFAFA',      // Soft white - main background
    secondary: '#F5F5F5',    // Subtle gray
    card: '#FFFFFF',         // Pure white for cards
    elevated: '#FEFEFE',     // Elevated surfaces
    dark: '#EEEEEE',         // Darker accent
  },

  // Gold Accent System - Premium touches (same as dark)
  accent: {
    gold: '#D4AF37',         // Slightly darker gold for better contrast
    goldDark: '#B8860B',     // Pressed states
    goldLight: '#FFD700',    // Highlights
    goldMuted: '#9A7B00',    // Subtle gold
  },

  // Light Aqua Blue - Secondary accent (complements gold beautifully)
  primary: {
    50: '#F0FDFF',
    100: '#E0FBFF',
    200: '#BAF5FF',
    300: '#7FECFF',          // Light aqua blue - main accent
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#0C4A5E',          // Darker for dark mode gradients
  },

  // Scoring Colors - Vibrant with good contrast on light
  scoring: {
    positive: '#00C853',     // Winning - vibrant green
    negative: '#D32F2F',     // Losing - strong red
    neutral: '#616161',      // Tie - medium gray
    birdie: '#0288D1',       // Birdie - strong blue
    eagle: '#7B1FA2',        // Eagle - deep purple
  },

  // Multiplier Colors
  multipliers: {
    up: '#F57C00',           // Deep orange for "Up"
    upGlow: 'rgba(245, 124, 0, 0.2)',
    burn: '#C62828',         // Deep red for "Burn"
    burnGlow: 'rgba(198, 40, 40, 0.2)',
  },

  // Text Colors - Optimized for light backgrounds
  text: {
    primary: '#212121',      // Near black for primary text
    secondary: '#616161',    // Medium gray
    tertiary: '#9E9E9E',     // Light gray
    disabled: '#BDBDBD',     // Disabled state
    gold: '#B8860B',         // Darker gold for readability
    inverse: '#FFFFFF',      // White for dark backgrounds
  },

  // Border Colors - Visible on light
  border: {
    light: '#E0E0E0',        // Subtle borders
    medium: '#BDBDBD',       // Medium emphasis
    dark: '#9E9E9E',         // High emphasis
    gold: '#D4AF37',         // Gold accent borders
    goldSubtle: 'rgba(212, 175, 55, 0.3)',
  },

  // Status Colors
  status: {
    success: '#00C853',
    warning: '#FF8F00',
    error: '#D32F2F',
    info: '#0288D1',
  },

  // Gradients - Light aqua blue throughout
  gradients: {
    primary: ['#7FECFF', '#BAF5FF', '#E0FBFF'],     // Light aqua fade
    primaryDark: ['#0C4A5E', '#0E7490', '#7FECFF'], // Deep to light aqua
    gold: ['#FFD700', '#D4AF37'],                   // Gold gradient
    goldSubtle: ['rgba(212,175,55,0.2)', 'rgba(212,175,55,0)'], // Gold fade
    victory: ['#00E676', '#00C853'],                // Winning green
    dark: ['#F5F5F5', '#FAFAFA'],                   // Light elevation
    darkReverse: ['#FAFAFA', '#F5F5F5'],
    header: ['#7FECFF', '#BAF5FF', '#FAFAFA'],      // Lighter header gradient
    card: ['#FFFFFF', '#FEFEFE'],                   // Card subtle gradient
  },

  // Glassmorphism - For light theme
  glass: {
    light: 'rgba(255, 255, 255, 0.7)',
    medium: 'rgba(255, 255, 255, 0.85)',
    strong: 'rgba(255, 255, 255, 0.95)',
    border: 'rgba(0, 0, 0, 0.08)',
    goldBorder: 'rgba(212, 175, 55, 0.3)',
    darkMedium: 'rgba(0, 0, 0, 0.2)',       // Light overlay for modals
    darkStrong: 'rgba(0, 0, 0, 0.4)',       // Stronger overlay
    blur: 20,
  },

  // Surface Elevation System
  surfaces: {
    level0: '#FAFAFA',       // Base
    level1: '#FFFFFF',       // Slight elevation
    level2: '#F5F5F5',       // Medium elevation
    level3: '#EEEEEE',       // High elevation
    level4: '#E8E8E8',       // Highest elevation
  },

  // Confirmed hole background
  confirmedHoleBg: 'rgba(0, 150, 60, 0.25)',

  // Glow Effects - Subtler for light mode
  glow: {
    gold: 'rgba(212, 175, 55, 0.25)',
    goldStrong: 'rgba(212, 175, 55, 0.4)',
    green: 'rgba(0, 103, 71, 0.25)',
    aqua: 'rgba(6, 182, 212, 0.25)',
    aquaStrong: 'rgba(6, 182, 212, 0.4)',
    positive: 'rgba(0, 200, 83, 0.2)',
    negative: 'rgba(211, 47, 47, 0.2)',
  },

  // Chart Colors - Adjusted for light backgrounds
  charts: {
    series: ['#D4AF37', '#00C853', '#0288D1', '#7B1FA2', '#F57C00', '#00ACC1', '#D32F2F'],
    grid: '#E0E0E0',
    axis: '#9E9E9E',
  },

  // Shadows with color - for light theme depth
  shadowColors: {
    default: 'rgba(0, 0, 0, 0.15)',
    gold: 'rgba(212, 175, 55, 0.3)',
    green: 'rgba(0, 103, 71, 0.2)',
    aqua: 'rgba(6, 182, 212, 0.2)',
  },
};

// Default export is dark theme for backward compatibility
export const colors = darkColors;

export type ColorPalette = typeof colors;
