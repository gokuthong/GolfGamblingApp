import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, animations } from '../../theme';

export interface SkeletonProps {
  /**
   * Shape of the skeleton
   */
  variant?: 'text' | 'rect' | 'circle';
  /**
   * Width of the skeleton (number or percentage string)
   */
  width?: number | string;
  /**
   * Height of the skeleton
   */
  height?: number;
  /**
   * Border radius (only for 'rect' variant)
   */
  radius?: keyof typeof borderRadius;
  /**
   * Custom style
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Animation speed (duration in ms)
   */
  duration?: number;
}

/**
 * Skeleton loading placeholder with shimmer animation
 * Replaces "Loading..." text throughout the app
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  radius = 'md',
  style,
  duration = 1500,
}) => {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withRepeat(
      withTiming(1, { duration }),
      -1, // infinite
      false // don't reverse
    );
  }, [duration]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      animatedValue.value,
      [0, 1],
      [-200, 200]
    );

    return {
      transform: [{ translateX }],
    };
  });

  const getSkeletonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {};

    if (variant === 'circle') {
      const size = height || 40;
      return {
        width: size,
        height: size,
        borderRadius: size / 2,
      };
    }

    if (variant === 'text') {
      return {
        width: width || '100%',
        height: height || 16,
        borderRadius: borderRadius.sm,
      };
    }

    // rect variant
    return {
      width: width || '100%',
      height: height || 40,
      borderRadius: borderRadius[radius],
    };
  };

  return (
    <View style={[styles.container, getSkeletonStyle(), style]}>
      <Animated.View style={[styles.shimmerContainer, animatedStyle]}>
        <LinearGradient
          colors={[
            colors.surfaces.level2,
            colors.surfaces.level1,
            colors.surfaces.level2,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmer}
        />
      </Animated.View>
    </View>
  );
};

/**
 * Skeleton group for multiple loading items
 */
export const SkeletonGroup: React.FC<{
  count: number;
  variant?: SkeletonProps['variant'];
  spacing?: number;
}> = ({ count, variant = 'text', spacing = 8 }) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={{ marginBottom: index < count - 1 ? spacing : 0 }}>
          <Skeleton variant={variant} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaces.level2,
    overflow: 'hidden',
  },
  shimmerContainer: {
    width: 200,
    height: '100%',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
});
