import React from "react";
import {
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Icon } from "./Icon";
import { typography, spacing, borderRadius } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";

type ButtonVariant = "primary" | "secondary" | "outline" | "text" | "gold";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
  iconPosition?: "left" | "right";
  gradient?: boolean;
  hapticFeedback?: boolean;
  accessibilityLabel?: string;
  /** Deprecated — primary CTAs now carry their own subtle glow */
  glow?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  iconPosition = "left",
  gradient = false,
  hapticFeedback = true,
  accessibilityLabel,
}) => {
  const colors = useThemedColors();
  const translateY = useSharedValue(0);
  const shadowOpacity = useSharedValue(0.08);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    shadowOpacity: shadowOpacity.value,
  }));

  const handlePressIn = () => {
    translateY.value = withTiming(2, {
      duration: 120,
      easing: Easing.out(Easing.quad),
    });
    shadowOpacity.value = withTiming(0.04, { duration: 120 });
  };

  const handlePressOut = () => {
    translateY.value = withTiming(0, {
      duration: 180,
      easing: Easing.out(Easing.quad),
    });
    shadowOpacity.value = withTiming(0.08, { duration: 180 });
  };

  const handlePress = () => {
    if (hapticFeedback && !disabled && !loading && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const isPrimary = variant === "primary" || variant === "gold" || gradient;
  const isSecondary = variant === "secondary";
  const isOutline = variant === "outline";
  const isText = variant === "text";

  const sizeConfig = (() => {
    switch (size) {
      case "small":
        return {
          height: 40,
          px: spacing.md,
          iconSize: 16,
          radius: borderRadius.full,
        };
      case "large":
        return {
          height: 56,
          px: spacing.xl,
          iconSize: 22,
          radius: borderRadius.full,
        };
      default:
        return {
          height: 48,
          px: spacing.lg,
          iconSize: 20,
          radius: borderRadius.full,
        };
    }
  })();

  // Secondary + outline use rounded-xl (less dominant); primary/gold are pill
  const radius = isSecondary || isOutline ? borderRadius.lg : sizeConfig.radius;

  const textColor = (() => {
    if (isPrimary) return colors.text.inverse;
    if (isSecondary) return colors.text.primary;
    return colors.text.primary;
  })();

  const backgroundColor = (() => {
    if (isPrimary) return "transparent"; // gradient handles it
    if (isSecondary) return colors.background.card;
    return "transparent";
  })();

  const borderStyle: ViewStyle = isOutline
    ? { borderWidth: 1.5, borderColor: colors.accent.gold }
    : isSecondary
      ? { borderWidth: 1, borderColor: colors.border.light }
      : {};

  const content = (
    <View
      style={[
        styles.content,
        iconPosition === "right" && styles.contentReverse,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon && (
            <Icon name={icon} size={sizeConfig.iconSize} color={textColor} />
          )}
          <Text
            numberOfLines={1}
            style={[
              styles.label,
              { color: textColor },
              size === "small" && styles.smallLabel,
              size === "large" && styles.largeLabel,
              isText && {
                color: colors.accent.gold,
                textDecorationLine: "underline",
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </View>
  );

  const baseStyle: ViewStyle = {
    minHeight: sizeConfig.height,
    paddingHorizontal: isText ? 0 : sizeConfig.px,
    backgroundColor,
    borderRadius: radius,
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      android_ripple={{ color: "rgba(255,255,255,0.18)", borderless: false }}
      style={[
        animatedStyle,
        styles.baseButton,
        baseStyle,
        fullWidth && styles.fullWidth,
        borderStyle,
        !isPrimary && { shadowOpacity: 0 },
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={[colors.accent.gold, colors.accent.goldDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
        />
      ) : null}
      {content}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    elevation: 3,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  contentReverse: {
    flexDirection: "row-reverse",
  },
  label: {
    fontFamily: typography.button.fontFamily,
    fontSize: typography.button.fontSize,
    fontWeight: "600",
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  smallLabel: {
    fontSize: typography.buttonSmall.fontSize,
  },
  largeLabel: {
    fontSize: 17,
    fontWeight: "600",
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.45,
  },
});

export default Button;
