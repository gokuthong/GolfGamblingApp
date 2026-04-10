import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius, animations } from '../../theme';

export interface ProgressBarProps {
  /**
   * Progress value (0-100)
   */
  progress: number;
  /**
   * Optional label to display
   */
  label?: string;
  /**
   * Show percentage text
   */
  showPercentage?: boolean;
  /**
   * Use gradient fill
   */
  gradient?: boolean;
  /**
   * Color variant
   */
  variant?: 'primary' | 'positive' | 'negative' | 'accent';
  /**
   * Height of the progress bar
   */
  height?: number;
  /**
   * Custom style
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Animation type
   */
  animated?: boolean;
}

/**
 * Animated progress bar with gradient support
 * Perfect for showing score differentials and stats
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  gradient = true,
  variant = 'primary',
  height = 8,
  style,
  animated = true,
}) => {
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    if (animated) {
      animatedWidth.value = withSpring(clampedProgress, animations.spring.gentle);
    } else {
      animatedWidth.value = withTiming(clampedProgress, {
        duration: animations.timing.fast,
      });
    }
  }, [progress, animated]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedWidth.value}%`,
    };
  });

  const getColors = (): [string, string] => {
    switch (variant) {
      case 'positive':
        return [colors.gradients.victory[0], colors.gradients.victory[1]];
      case 'negative':
        return [colors.multipliers.burn, '#D32F2F'];
      case 'accent':
        return [colors.gradients.accent[0], colors.gradients.accent[1]];
      default:
        return [colors.gradients.primary[0], colors.gradients.primary[1]];
    }
  };

  const getSolidColor = (): string => {
    switch (variant) {
      case 'positive':
        return colors.scoring.positive;
      case 'negative':
        return colors.scoring.negative;
      case 'accent':
        return colors.accent.main;
      default:
        return colors.primary[500];
    }
  };

  return (
    <View style={[styles.container, style]}>
      {(label || showPercentage) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showPercentage && (
            <Text style={styles.percentage}>{Math.round(progress)}%</Text>
          )}
        </View>
      )}

      <View style={[styles.track, { height }]}>
        <Animated.View style={[styles.fillContainer, animatedStyle]}>
          {gradient ? (
            <LinearGradient
              colors={getColors()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.fill}
            />
          ) : (
            <View style={[styles.fill, { backgroundColor: getSolidColor() }]} />
          )}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  percentage: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
  },
  track: {
    width: '100%',
    backgroundColor: colors.surfaces.level2,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fillContainer: {
    height: '100%',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
});
