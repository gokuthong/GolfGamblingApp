import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export interface GlassCardProps {
  children: React.ReactNode;
  /**
   * Intensity of the glassmorphism effect
   * - light: rgba(255, 255, 255, 0.1)
   * - medium: rgba(255, 255, 255, 0.2)
   * - strong: rgba(255, 255, 255, 0.3)
   */
  intensity?: 'light' | 'medium' | 'strong';
  /**
   * Add gradient border to the card
   */
  gradientBorder?: boolean;
  /**
   * Custom style for the card container
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Padding inside the card (defaults to md)
   */
  padding?: keyof typeof spacing;
  /**
   * Border radius (defaults to lg)
   */
  radius?: keyof typeof borderRadius;
}

/**
 * Glassmorphic card component with semi-transparent background and blur effect
 * Perfect for modern sports design layered UI
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity = 'medium',
  gradientBorder = false,
  style,
  padding = 'md',
  radius = 'lg',
}) => {
  const getBackgroundColor = (): string => {
    switch (intensity) {
      case 'light':
        return colors.glass.light;
      case 'strong':
        return colors.glass.strong;
      default:
        return colors.glass.medium;
    }
  };

  if (gradientBorder) {
    return (
      <LinearGradient
        colors={colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradientContainer,
          {
            borderRadius: borderRadius[radius],
          },
          style,
        ]}
      >
        <View
          style={[
            styles.innerContent,
            {
              backgroundColor: getBackgroundColor(),
              padding: spacing[padding],
              borderRadius: borderRadius[radius] - 2, // Slightly smaller to show gradient border
            },
          ]}
        >
          {children}
        </View>
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          padding: spacing[padding],
          borderRadius: borderRadius[radius],
        },
        shadows.medium,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    // Note: blur effect requires expo-blur or react-native-blur
    // For now, using semi-transparent backgrounds
    borderWidth: 1,
    borderColor: colors.glass.light,
  },
  gradientContainer: {
    padding: 2, // Gradient border width
    overflow: 'hidden',
  },
  innerContent: {
    borderWidth: 1,
    borderColor: colors.glass.light,
    overflow: 'hidden',
  },
});
