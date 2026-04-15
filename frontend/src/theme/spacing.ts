export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  section: 80,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
};

// CSS box-shadow equivalents of React Native shadow objects
export const shadows = {
  small: '0px 2px 6px rgba(0, 0, 0, 0.05)',
  medium: '0px 8px 30px rgba(0, 0, 0, 0.08)',
  large: '0px 12px 40px rgba(0, 0, 0, 0.12)',
};

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
