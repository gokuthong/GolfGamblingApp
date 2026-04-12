import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { spacing, borderRadius } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";

export interface GlassCardProps {
  children: React.ReactNode;
  intensity?: "light" | "medium" | "strong";
  gradientBorder?: boolean;
  style?: StyleProp<ViewStyle>;
  padding?: keyof typeof spacing;
  radius?: keyof typeof borderRadius;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity = "medium",
  gradientBorder = false,
  style,
  padding = "lg",
  radius = "xl",
}) => {
  const colors = useThemedColors();

  const getBackgroundColor = (): string => {
    switch (intensity) {
      case "light":
        return colors.glass.light;
      case "strong":
        return colors.glass.strong;
      default:
        return colors.glass.medium;
    }
  };

  const shadow: ViewStyle = {
    shadowColor: colors.shadowColors.soft,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 3,
  };

  if (gradientBorder) {
    return (
      <LinearGradient
        colors={[colors.accent.gold, colors.accent.goldDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradientContainer,
          { borderRadius: borderRadius[radius] },
          shadow,
          style,
        ]}
      >
        <View
          style={[
            {
              backgroundColor: colors.background.card,
              padding: spacing[padding],
              borderRadius: borderRadius[radius] - 1.5,
              overflow: "hidden",
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
        {
          backgroundColor: getBackgroundColor(),
          padding: spacing[padding],
          borderRadius: borderRadius[radius],
          borderWidth: 1,
          borderColor: colors.border.light,
          overflow: "hidden",
        },
        shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    padding: 1.5,
    overflow: "hidden",
  },
});

export default GlassCard;
