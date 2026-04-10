import React from 'react';
import {
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Icon } from './Icon';
import { colors, typography, spacing, borderRadius, animations } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'gold';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
  iconPosition?: 'left' | 'right';
  gradient?: boolean;
  hapticFeedback?: boolean;
  accessibilityLabel?: string;
  /** Gold glow effect for primary CTAs */
  glow?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  gradient = false,
  hapticFeedback = true,
  accessibilityLabel,
  glow = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, animations.spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, animations.spring.snappy);
  };

  const handlePress = () => {
    if (hapticFeedback && !disabled && !loading && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  // Determine if this is a gold/gradient filled button
  const isGold = (variant === 'gold' || gradient) && variant !== 'outline' && variant !== 'text';

  // Background color
  const bgColor = (() => {
    if (isGold) return colors.accent.gold;
    switch (variant) {
      case 'primary': return colors.primary[500];
      case 'secondary': return colors.primary[700];
      case 'outline':
      case 'text': return 'transparent';
      default: return colors.primary[500];
    }
  })();

  // Text & icon color
  const textColor = (() => {
    if (isGold) return colors.text.inverse;
    switch (variant) {
      case 'primary':
      case 'secondary': return colors.text.primary;
      case 'outline':
      case 'text': return colors.accent.gold;
      default: return colors.text.primary;
    }
  })();

  // Size config
  const sizeConfig = (() => {
    switch (size) {
      case 'small': return { height: 36, px: spacing.sm, iconSize: 16 };
      case 'large': return { height: 56, px: spacing.xl, iconSize: 24 };
      default: return { height: 48, px: spacing.lg, iconSize: 20 };
    }
  })();

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      android_ripple={{
        color: 'rgba(255,255,255,0.2)',
        borderless: false,
      }}
      style={[
        animatedStyle,
        styles.baseButton,
        {
          minHeight: sizeConfig.height,
          paddingHorizontal: sizeConfig.px,
          backgroundColor: bgColor,
        },
        fullWidth && styles.fullWidth,
        variant === 'outline' && styles.outlineButton,
        glow && isGold && styles.goldGlow,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      <View style={[
        styles.content,
        iconPosition === 'right' && styles.contentReverse,
      ]}>
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <>
            {icon && (
              <Icon
                name={icon}
                size={sizeConfig.iconSize}
                color={textColor}
              />
            )}
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                { color: textColor },
                size === 'small' && styles.smallLabel,
                size === 'large' && styles.largeLabel,
                textStyle,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contentReverse: {
    flexDirection: 'row-reverse',
  },
  label: {
    fontFamily: typography.button.fontFamily,
    fontSize: typography.button.fontSize,
    fontWeight: '600',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  smallLabel: {
    fontSize: typography.buttonSmall.fontSize,
  },
  largeLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  fullWidth: {
    width: '100%',
  },
  outlineButton: {
    borderColor: colors.accent.gold,
    borderWidth: 1.5,
  },
  goldGlow: {
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
