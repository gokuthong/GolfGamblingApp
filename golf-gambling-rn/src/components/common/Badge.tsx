import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from './Icon';
import { colors, typography, spacing, borderRadius, animations } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'up' | 'burn' | 'birdie' | 'eagle' | 'positive' | 'negative' | 'neutral' | 'primary';
  size?: 'small' | 'medium';
  style?: ViewStyle;
  textStyle?: TextStyle;
  /**
   * Icon name from MaterialCommunityIcons
   */
  icon?: string;
  /**
   * Use gradient background
   */
  gradient?: boolean;
  /**
   * Pulse animation for active states
   */
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'small',
  style,
  textStyle,
  icon,
  gradient = false,
  pulse = false,
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (pulse) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: animations.timing.fast }),
          withTiming(1, { duration: animations.timing.fast })
        ),
        -1, // infinite
        false
      );
    }
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'up':
        return colors.multipliers.up;
      case 'burn':
        return colors.multipliers.burn;
      case 'birdie':
        return colors.scoring.birdie;
      case 'eagle':
        return colors.scoring.eagle;
      case 'positive':
        return colors.scoring.positive;
      case 'negative':
        return colors.scoring.negative;
      case 'primary':
        return colors.primary[500];
      default:
        return colors.scoring.neutral;
    }
  };

  const getGradientColors = (): [string, string] => {
    switch (variant) {
      case 'positive':
        return [colors.gradients.victory[0], colors.gradients.victory[1]];
      case 'primary':
        return [colors.gradients.primary[0], colors.gradients.primary[1]];
      case 'up':
        return [colors.multipliers.up, '#F57C00'];
      case 'burn':
        return [colors.multipliers.burn, '#D32F2F'];
      default:
        return [getBackgroundColor(), getBackgroundColor()];
    }
  };

  const baseStyles = [
    styles.base,
    styles[size],
    !gradient && { backgroundColor: getBackgroundColor() },
    style,
  ];

  const content = (
    <>
      {icon && (
        <Icon
          name={icon}
          size={size === 'small' ? 12 : 14}
          color={colors.text.inverse}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, styles[`${size}Text`], textStyle]}>{label}</Text>
    </>
  );

  if (gradient) {
    return (
      <Animated.View style={[animatedStyle, baseStyles]}>
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientContent}
        >
          {content}
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animatedStyle, baseStyles]}>
      {content}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  small: {
    minWidth: 32,
  },
  medium: {
    minWidth: 48,
    paddingVertical: spacing.xs,
  },
  text: {
    ...typography.bodySmall,
    color: colors.text.inverse,
    fontWeight: '700',
  },
  smallText: {
    ...typography.bodySmall,
    fontSize: typography.bodySmall.fontSize - 2,
    fontWeight: '700' as const,
  },
  mediumText: {
    ...typography.bodySmall,
    fontWeight: '700' as const,
  },
  icon: {
    marginRight: spacing.xs,
  },
  gradientContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
});
