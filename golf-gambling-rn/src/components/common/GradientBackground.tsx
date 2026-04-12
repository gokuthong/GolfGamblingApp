import React from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useThemedColors } from "../../contexts/ThemeContext";

type GradientVariant =
  | "dark"
  | "header"
  | "card"
  | "gold"
  | "green"
  | "greenFade"
  | "radialGold";

interface GradientBackgroundProps {
  variant?: GradientVariant;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  animated?: boolean;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  variant = "dark",
  style,
  children,
  animated = false,
}) => {
  const colors = useThemedColors();
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    if (animated) {
      opacity.value = withRepeat(
        withTiming(0.9, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const getConfig = (): {
    colors: [string, string, ...string[]];
    start: { x: number; y: number };
    end: { x: number; y: number };
    locations?: number[];
  } => {
    switch (variant) {
      case "header":
        return {
          colors: colors.gradients.header as [string, string, ...string[]],
          start: { x: 0, y: 0 },
          end: { x: 0, y: 1 },
        };
      case "card":
        return {
          colors: colors.gradients.card as [string, string, ...string[]],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
        };
      case "gold":
        return {
          colors: colors.gradients.gold as [string, string, ...string[]],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
        };
      case "green":
        return {
          colors: colors.gradients.primary as [string, string, ...string[]],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
        };
      case "greenFade":
        return {
          colors: colors.gradients.primaryDark as [string, string, ...string[]],
          start: { x: 0, y: 0 },
          end: { x: 0, y: 1 },
        };
      case "radialGold":
        return {
          colors: [colors.glow.gold, "transparent"],
          start: { x: 0.5, y: 0.5 },
          end: { x: 1, y: 1 },
        };
      default:
        return {
          colors: [
            colors.background.secondary,
            colors.background.primary,
          ],
          start: { x: 0, y: 0 },
          end: { x: 0, y: 1 },
        };
    }
  };

  const config = getConfig();

  const GradientComponent = animated ? (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
      <LinearGradient
        colors={config.colors}
        start={config.start}
        end={config.end}
        locations={config.locations}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  ) : (
    <LinearGradient
      colors={config.colors}
      start={config.start}
      end={config.end}
      locations={config.locations}
      style={StyleSheet.absoluteFill}
    />
  );

  return (
    <View style={[styles.container, style]}>
      {GradientComponent}
      {children}
    </View>
  );
};

interface GoldGlowProps {
  size?: number;
  intensity?: "light" | "medium" | "strong";
  position?: { top?: number; left?: number; right?: number; bottom?: number };
  animated?: boolean;
}

export const GoldGlow: React.FC<GoldGlowProps> = ({
  size = 220,
  intensity = "light",
  position = { top: -60, right: -60 },
  animated = true,
}) => {
  const scale = useSharedValue(1);
  const glowOpacity =
    intensity === "light" ? 0.08 : intensity === "strong" ? 0.2 : 0.12;

  React.useEffect(() => {
    if (animated) {
      scale.value = withRepeat(
        withTiming(1.08, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.glowOrb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          ...position,
        },
        animated && animatedStyle,
      ]}
    >
      <LinearGradient
        colors={[`rgba(212, 175, 55, ${glowOpacity})`, "transparent"]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={[styles.glowGradient, { borderRadius: size / 2 }]}
      />
    </Animated.View>
  );
};

interface DarkScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  showGlow?: boolean;
  glowPosition?: { top?: number; left?: number; right?: number; bottom?: number };
}

export const DarkScreen: React.FC<DarkScreenProps> = ({
  children,
  style,
  showGlow = false,
  glowPosition,
}) => {
  const colors = useThemedColors();
  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background.primary },
        style,
      ]}
    >
      {showGlow && <GoldGlow position={glowPosition} />}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  screen: {
    flex: 1,
  },
  glowOrb: {
    position: "absolute",
    overflow: "hidden",
  },
  glowGradient: {
    flex: 1,
  },
});

export default GradientBackground;
