import React, { useEffect } from "react";
import { View, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { typography, spacing, borderRadius, animations } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";

export interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  gradient?: boolean;
  variant?: "primary" | "positive" | "negative" | "accent" | "gold";
  height?: number;
  style?: StyleProp<ViewStyle>;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  gradient = true,
  variant = "gold",
  height = 6,
  style,
  animated = true,
}) => {
  const colors = useThemedColors();
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(100, progress));
    if (animated) {
      animatedWidth.value = withSpring(clamped, animations.spring.gentle);
    } else {
      animatedWidth.value = withTiming(clamped, {
        duration: animations.timing.fast,
      });
    }
  }, [progress, animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  const getGradientColors = (): [string, string] => {
    switch (variant) {
      case "positive":
        return [colors.scoring.positive, colors.scoring.positive];
      case "negative":
        return [colors.scoring.negative, colors.scoring.negative];
      case "accent":
        return [colors.accent.gold, colors.accent.goldDark];
      case "primary":
        return [colors.primary[500], colors.primary[700]];
      default:
        return [colors.accent.gold, colors.accent.goldDark];
    }
  };

  const getSolidColor = (): string => {
    switch (variant) {
      case "positive":
        return colors.scoring.positive;
      case "negative":
        return colors.scoring.negative;
      case "primary":
        return colors.primary[500];
      default:
        return colors.accent.gold;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {(label || showPercentage) && (
        <View style={styles.labelRow}>
          {label && (
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text style={[styles.percentage, { color: colors.text.primary }]}>
              {Math.round(progress)}%
            </Text>
          )}
        </View>
      )}

      <View
        style={[
          styles.track,
          { height, backgroundColor: colors.surfaces.level2 },
        ]}
      >
        <Animated.View style={[styles.fillContainer, animatedStyle]}>
          {gradient ? (
            <LinearGradient
              colors={getGradientColors()}
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
    width: "100%",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.bodySmall,
  },
  percentage: {
    ...typography.bodySmall,
    fontWeight: "600",
  },
  track: {
    width: "100%",
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  fillContainer: {
    height: "100%",
  },
  fill: {
    width: "100%",
    height: "100%",
  },
});

export default ProgressBar;
