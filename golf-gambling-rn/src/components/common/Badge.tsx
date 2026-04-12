import React, { useEffect } from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Icon } from "./Icon";
import { typography, spacing, borderRadius, animations } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";

interface BadgeProps {
  label: string;
  variant?:
    | "up"
    | "burn"
    | "birdie"
    | "eagle"
    | "positive"
    | "negative"
    | "neutral"
    | "primary"
    | "gold";
  size?: "small" | "medium";
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
  gradient?: boolean;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "neutral",
  size = "small",
  style,
  textStyle,
  icon,
  gradient = false,
  pulse = false,
}) => {
  const colors = useThemedColors();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (pulse) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: animations.timing.fast }),
          withTiming(1, { duration: animations.timing.fast }),
        ),
        -1,
        false,
      );
    }
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getBackgroundColor = (): string => {
    switch (variant) {
      case "up":
        return colors.multipliers.up;
      case "burn":
        return colors.multipliers.burn;
      case "birdie":
        return colors.scoring.birdie;
      case "eagle":
        return colors.scoring.eagle;
      case "positive":
        return colors.scoring.positive;
      case "negative":
        return colors.scoring.negative;
      case "primary":
        return colors.primary[500];
      case "gold":
        return colors.accent.gold;
      default:
        return colors.surfaces.level3;
    }
  };

  const getTextColor = (): string => {
    if (variant === "neutral") return colors.text.secondary;
    return colors.text.inverse;
  };

  const getGradientColors = (): [string, string] => {
    switch (variant) {
      case "positive":
        return [colors.scoring.positive, colors.scoring.positive];
      case "primary":
        return [colors.primary[500], colors.primary[700]];
      case "gold":
        return [colors.accent.gold, colors.accent.goldDark];
      case "up":
        return [colors.multipliers.up, colors.multipliers.up];
      case "burn":
        return [colors.multipliers.burn, colors.multipliers.burn];
      default:
        return [getBackgroundColor(), getBackgroundColor()];
    }
  };

  const bg = getBackgroundColor();
  const txtColor = getTextColor();

  const baseStyles = [
    styles.base,
    size === "small" ? styles.small : styles.medium,
    !gradient && { backgroundColor: bg },
    variant === "neutral" && {
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    style,
  ];

  const content = (
    <>
      {icon && (
        <Icon
          name={icon}
          size={size === "small" ? 11 : 13}
          color={txtColor}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          size === "small" ? styles.smallText : styles.mediumText,
          { color: txtColor },
          textStyle,
        ]}
      >
        {label}
      </Text>
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
    <Animated.View style={[animatedStyle, baseStyles]}>{content}</Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    overflow: "hidden",
  },
  small: {
    minWidth: 32,
    paddingVertical: 3,
  },
  medium: {
    minWidth: 48,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
  },
  text: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontWeight: "600",
  },
  smallText: {
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  mediumText: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  icon: {
    marginRight: 4,
  },
  gradientContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
});

export default Badge;
