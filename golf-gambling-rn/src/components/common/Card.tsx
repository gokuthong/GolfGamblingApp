import React from 'react';
import { StyleSheet, ViewStyle, TouchableOpacity, View } from 'react-native';
import { Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Skeleton } from './Skeleton';
import { colors, spacing, borderRadius, animations } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  elevation?: 0 | 1 | 2 | 3 | 4;
  padding?: number;
  onPress?: () => void;
  /** Gradient background colors */
  gradient?: string[];
  loading?: boolean;
  accessibilityLabel?: string;
  /** Gold border glow effect */
  goldBorder?: boolean;
  /** Glass effect card */
  glass?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 1,
  padding = spacing.md,
  onPress,
  gradient,
  loading = false,
  accessibilityLabel,
  goldBorder = false,
  glass = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, animations.spring.snappy);
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, animations.spring.snappy);
    }
  };

  // Build styles without false values
  const buildCardStyles = (): ViewStyle[] => {
    const result: ViewStyle[] = [styles.card, { padding }];

    if (glass) {
      result.push(styles.glassCard);
    }

    if (goldBorder) {
      result.push(styles.goldBorder);
    }

    // Handle style prop (can be single object or array)
    if (style) {
      if (Array.isArray(style)) {
        // Filter out falsy values from style array
        style.forEach(s => {
          if (s && typeof s === 'object') {
            result.push(s);
          }
        });
      } else {
        result.push(style);
      }
    }

    return result;
  };

  const cardStyles = buildCardStyles();

  // Build container styles (for shadow/glow)
  const buildContainerStyles = (): ViewStyle[] => {
    const result: ViewStyle[] = [styles.cardContainer];
    if (goldBorder) {
      result.push(styles.goldGlow);
    }
    return result;
  };

  if (loading) {
    return (
      <Surface style={[styles.card, { padding }, style as ViewStyle]} elevation={elevation}>
        <Skeleton height={100} />
      </Surface>
    );
  }

  // Gradient card
  if (gradient) {
    if (onPress) {
      return (
        <AnimatedTouchable
          style={[animatedStyle, ...buildContainerStyles()]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          accessible
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, ...cardStyles]}
          >
            {children}
          </LinearGradient>
        </AnimatedTouchable>
      );
    }

    return (
      <View style={buildContainerStyles()}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, ...cardStyles]}
        >
          {children}
        </LinearGradient>
      </View>
    );
  }

  // Glass effect card (most common in ScoringScreen)
  if (glass) {
    const containerStyles = buildContainerStyles();

    if (onPress) {
      return (
        <AnimatedTouchable
          style={[animatedStyle, ...containerStyles]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          accessible
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          <View style={cardStyles}>
            {children}
          </View>
        </AnimatedTouchable>
      );
    }

    // Non-pressable glass card - use nested structure to avoid shadow/overflow conflicts
    // Outer View handles shadow/glow, inner View handles card styles with overflow
    return (
      <View style={containerStyles}>
        <View style={cardStyles}>
          {children}
        </View>
      </View>
    );
  }

  // Standard card with Paper Surface
  if (onPress) {
    return (
      <AnimatedTouchable
        style={[animatedStyle, styles.cardContainer]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Surface
          style={[...cardStyles, goldBorder ? styles.goldGlow : undefined].filter(Boolean) as ViewStyle[]}
          elevation={elevation}
        >
          {children}
        </Surface>
      </AnimatedTouchable>
    );
  }

  return (
    <Surface
      style={[...cardStyles, goldBorder ? styles.goldGlow : undefined].filter(Boolean) as ViewStyle[]}
      elevation={elevation}
    >
      {children}
    </Surface>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    // Base container styles - always present to ensure stable rendering
    flexShrink: 0,
    // Minimal base shadow to prevent rendering bugs when goldGlow is removed
    // These values are nearly invisible but keep the shadow layer active
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.01,
    shadowRadius: 1,
    elevation: 0.5,
    // Ensure the view is always rendered on its own layer
    opacity: 1,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  glassCard: {
    backgroundColor: colors.glass.medium,
    borderWidth: 1,
    borderColor: colors.glass.border,
    // Ensure opacity is always 1 to prevent visibility issues
    opacity: 1,
  },
  goldBorder: {
    borderWidth: 1,
    borderColor: colors.border.goldSubtle,
  },
  goldGlow: {
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    overflow: 'hidden',
  },
});

export default Card;
