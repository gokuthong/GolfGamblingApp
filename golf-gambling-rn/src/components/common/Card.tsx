import React from "react";
import {
  StyleSheet,
  ViewStyle,
  Pressable,
  View,
  StyleProp,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Skeleton } from "./Skeleton";
import { spacing, borderRadius } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";

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
  /** Subtle gold border + soft gold shadow */
  goldBorder?: boolean;
  /** Light translucent card (used on hero backgrounds) */
  glass?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 1,
  padding = spacing.lg,
  onPress,
  gradient,
  loading = false,
  accessibilityLabel,
  goldBorder = false,
  glass = false,
}) => {
  const colors = useThemedColors();
  const translateY = useSharedValue(0);
  const shadowOpacity = useSharedValue(elevation >= 2 ? 0.1 : 0.06);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    shadowOpacity: shadowOpacity.value,
  }));

  const handlePressIn = () => {
    if (!onPress) return;
    translateY.value = withTiming(1, {
      duration: 120,
      easing: Easing.out(Easing.quad),
    });
    shadowOpacity.value = withTiming(0.04, { duration: 120 });
  };

  const handlePressOut = () => {
    if (!onPress) return;
    translateY.value = withTiming(0, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
    shadowOpacity.value = withTiming(elevation >= 2 ? 0.1 : 0.06, {
      duration: 200,
    });
  };

  const baseBg = glass
    ? colors.glass.medium
    : gradient
      ? "transparent"
      : colors.background.card;

  const baseBorder: ViewStyle = goldBorder
    ? { borderWidth: 1, borderColor: colors.border.goldSubtle }
    : glass
      ? { borderWidth: 1, borderColor: colors.glass.border }
      : { borderWidth: 1, borderColor: colors.border.light };

  const shadowColor = goldBorder
    ? colors.accent.gold
    : colors.shadowColors.default;

  const cardStyles: ViewStyle = {
    backgroundColor: baseBg,
    borderRadius: borderRadius.xl,
    padding,
    overflow: "hidden",
    ...baseBorder,
    shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 30,
    elevation: elevation * 2,
  };

  if (loading) {
    return (
      <View style={[cardStyles, style as ViewStyle]}>
        <Skeleton height={100} />
      </View>
    );
  }

  const renderContent = () => {
    if (gradient) {
      return (
        <LinearGradient
          colors={gradient as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: borderRadius.xl },
          ]}
        />
      );
    }
    return null;
  };

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[animatedStyle, cardStyles, style]}
      >
        {renderContent()}
        <View style={{ zIndex: 1 }}>{children}</View>
      </AnimatedPressable>
    );
  }

  return (
    <View style={[cardStyles, style]}>
      {renderContent()}
      <View style={{ zIndex: 1 }}>{children}</View>
    </View>
  );
};

export default Card;
