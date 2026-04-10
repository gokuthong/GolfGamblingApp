import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme';

export interface IconProps {
  /**
   * Name of the icon from MaterialCommunityIcons
   * See: https://materialdesignicons.com/
   */
  name: string;
  /**
   * Size of the icon in pixels
   */
  size?: number;
  /**
   * Color of the icon (hex string or theme color)
   */
  color?: string;
  /**
   * Custom style for the icon container
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;
}

/**
 * Centralized Icon component using MaterialCommunityIcons
 * Replaces emoji icons throughout the app with professional vector icons
 *
 * Common icon mappings:
 * - 📊 → "chart-bar"
 * - 🏆 → "trophy"
 * - ⬆ → "arrow-up-bold"
 * - 🔥 → "fire"
 * - 🐦 → "bird"
 * - 🦅 → "bird" (use different color)
 * - ▶ → "chevron-right"
 * - ⚙️ → "cog"
 * - 👤 → "account"
 * - 🔒 → "lock"
 * - ✉️ → "email"
 * - 👁️ → "eye"
 * - ➕ → "plus"
 * - ➖ → "minus"
 * - ✓ → "check"
 * - ✗ → "close"
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = colors.text.primary,
  style,
  accessibilityLabel,
}) => {
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color}
      style={style as any}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
    />
  );
};

/**
 * Predefined icon sizes for consistency
 */
export const IconSizes = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
} as const;

/**
 * Helper function to get icon color from theme
 */
export const getIconColor = (variant?: 'primary' | 'secondary' | 'positive' | 'negative' | 'disabled'): string => {
  switch (variant) {
    case 'primary':
      return colors.primary[500];
    case 'secondary':
      return colors.text.secondary;
    case 'positive':
      return colors.scoring.positive;
    case 'negative':
      return colors.scoring.negative;
    case 'disabled':
      return colors.text.disabled;
    default:
      return colors.text.primary;
  }
};
