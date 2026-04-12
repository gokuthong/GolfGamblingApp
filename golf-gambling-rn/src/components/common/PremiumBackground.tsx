import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useThemedColors } from "../../contexts/ThemeContext";

export type BackgroundPreset = "home" | "auth" | "minimal" | "game" | "luxury";

interface PremiumBackgroundProps {
  preset?: BackgroundPreset;
}

export const PremiumBackground: React.FC<PremiumBackgroundProps> = ({
  preset = "minimal",
}) => {
  const colors = useThemedColors();
  const pulse = useSharedValue(0.6);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const pulsingStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const accentSubtle = "rgba(212, 175, 55, 0.05)";
  const accentFaint = "rgba(212, 175, 55, 0.03)";

  if (preset === "home" || preset === "luxury") {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
        pointerEvents="none"
      >
        <Animated.View style={[styles.topRight, pulsingStyle]}>
          <LinearGradient
            colors={[accentSubtle, "transparent"]}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            style={styles.fill}
          />
        </Animated.View>
        <Animated.View style={[styles.bottomLeft, pulsingStyle]}>
          <LinearGradient
            colors={[accentFaint, "transparent"]}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 0, y: 0 }}
            style={styles.fill}
          />
        </Animated.View>
      </View>
    );
  }

  if (preset === "auth") {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
        pointerEvents="none"
      >
        <Animated.View style={[styles.authGlow, pulsingStyle]}>
          <LinearGradient
            colors={[accentSubtle, "transparent"]}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            style={styles.fill}
          />
        </Animated.View>
      </View>
    );
  }

  if (preset === "game") {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
        pointerEvents="none"
      >
        <Animated.View style={[styles.topRight, pulsingStyle]}>
          <LinearGradient
            colors={[accentFaint, "transparent"]}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            style={styles.fill}
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      pointerEvents="none"
    >
      <Animated.View style={[styles.minimalAccent, pulsingStyle]}>
        <LinearGradient
          colors={[accentFaint, "transparent"]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.fill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  fill: {
    flex: 1,
  },
  topRight: {
    position: "absolute",
    top: -120,
    right: -120,
    width: 380,
    height: 380,
    borderRadius: 190,
  },
  bottomLeft: {
    position: "absolute",
    bottom: -100,
    left: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
  },
  authGlow: {
    position: "absolute",
    top: "10%",
    left: "50%",
    marginLeft: -200,
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  minimalAccent: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
});

export default PremiumBackground;
