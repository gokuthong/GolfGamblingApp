import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useThemedColors } from '../../contexts/ThemeContext';
import { useStore } from '../../store';

export type BackgroundPreset = 'home' | 'auth' | 'minimal' | 'game' | 'luxury';

interface PremiumBackgroundProps {
  preset?: BackgroundPreset;
}

/**
 * Premium Golf Course Inspired Background
 *
 * Design Philosophy:
 * - Organic shapes mimicking water hazards and sand traps
 * - Layered transparencies for depth
 * - Subtle golf-themed geometric patterns
 * - Asymmetric, flowing composition
 */
export const PremiumBackground: React.FC<PremiumBackgroundProps> = ({ preset = 'minimal' }) => {
  const colors = useThemedColors();
  const settings = useStore((state) => state.settings);

  // Animation values
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const rotate = useSharedValue(0);
  const pulse = useSharedValue(0.7);

  React.useEffect(() => {
    // Gentle floating animation
    float1.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(15, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    float2.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-20, { duration: 5000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    rotate.value = withRepeat(
      withTiming(360, { duration: 60000, easing: Easing.linear }),
      -1,
      false
    );

    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.7, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const floatingStyle1 = useAnimatedStyle(() => ({
    transform: [
      { translateY: float1.value },
      { translateX: float1.value * 0.5 },
    ],
  }));

  const floatingStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateY: float2.value },
      { translateX: float2.value * -0.3 },
    ],
  }));

  const rotatingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  const pulsingStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const isDark = settings.darkMode;
  const accentColor = isDark ? colors.accent.gold : colors.primary[300];
  const accentFaded = isDark
    ? 'rgba(255, 215, 0, 0.08)'
    : 'rgba(127, 236, 255, 0.12)';
  const accentSubtle = isDark
    ? 'rgba(255, 215, 0, 0.04)'
    : 'rgba(127, 236, 255, 0.06)';

  if (preset === 'home' || preset === 'luxury') {
    return (
      <View style={styles.container} pointerEvents="none">
        {/* Large Organic Blob - Top Right (like a water hazard) */}
        <Animated.View style={[styles.organicBlob1, floatingStyle1]}>
          <LinearGradient
            colors={[accentFaded, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fill}
          />
        </Animated.View>

        {/* Medium Organic Shape - Bottom Left (sand trap aesthetic) */}
        <Animated.View style={[styles.organicBlob2, floatingStyle2]}>
          <LinearGradient
            colors={['transparent', accentSubtle, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fill}
          />
        </Animated.View>

        {/* Subtle Geometric Pattern (golf ball dimples inspired) */}
        <Animated.View style={[styles.geometricPattern, pulsingStyle]}>
          <View style={[styles.dimple, { backgroundColor: accentSubtle }]} />
          <View style={[styles.dimple, styles.dimple2, { backgroundColor: accentSubtle }]} />
          <View style={[styles.dimple, styles.dimple3, { backgroundColor: accentSubtle }]} />
        </Animated.View>

        {/* Diagonal Flow Line (fairway aesthetic) */}
        <Animated.View style={[styles.diagonalLine, rotatingStyle]}>
          <LinearGradient
            colors={[accentSubtle, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fill}
          />
        </Animated.View>

        {/* Small accent orb (flag pin marker) */}
        <Animated.View style={[styles.accentOrb, pulsingStyle]}>
          <LinearGradient
            colors={[accentColor, 'transparent']}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            style={styles.fill}
          />
        </Animated.View>
      </View>
    );
  }

  if (preset === 'auth') {
    return (
      <View style={styles.container} pointerEvents="none">
        {/* Large elegant glow - centered */}
        <Animated.View style={[styles.authGlow, pulsingStyle]}>
          <LinearGradient
            colors={[accentFaded, 'transparent']}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            style={styles.fill}
          />
        </Animated.View>

        {/* Subtle corner accents */}
        <Animated.View style={[styles.cornerAccent1, floatingStyle1]}>
          <LinearGradient
            colors={[accentSubtle, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fill}
          />
        </Animated.View>
      </View>
    );
  }

  if (preset === 'game') {
    return (
      <View style={styles.container} pointerEvents="none">
        {/* Dynamic flowing shapes for active gameplay */}
        <Animated.View style={[styles.flowShape1, floatingStyle1]}>
          <LinearGradient
            colors={[accentFaded, 'transparent', accentSubtle]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fill}
          />
        </Animated.View>

        <Animated.View style={[styles.flowShape2, floatingStyle2]}>
          <LinearGradient
            colors={['transparent', accentSubtle]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.fill}
          />
        </Animated.View>
      </View>
    );
  }

  // Minimal preset
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Single subtle accent */}
      <Animated.View style={[styles.minimalAccent, pulsingStyle]}>
        <LinearGradient
          colors={[accentFaded, 'transparent']}
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
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },

  // Organic Blobs (Water Hazard/Sand Trap inspired)
  organicBlob1: {
    position: 'absolute',
    top: -150,
    right: -100,
    width: 400,
    height: 450,
    borderRadius: 200,
    transform: [{ scaleX: 1.3 }, { rotate: '25deg' }],
  },
  organicBlob2: {
    position: 'absolute',
    bottom: -80,
    left: -120,
    width: 350,
    height: 300,
    borderRadius: 175,
    transform: [{ scaleY: 1.4 }, { rotate: '-15deg' }],
  },

  // Geometric Pattern (Golf Ball Dimples)
  geometricPattern: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    width: 200,
    height: 200,
  },
  dimple: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    top: 20,
    left: 20,
  },
  dimple2: {
    top: 80,
    left: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  dimple3: {
    top: 130,
    left: 30,
    width: 50,
    height: 50,
    borderRadius: 25,
  },

  // Diagonal Flow (Fairway aesthetic)
  diagonalLine: {
    position: 'absolute',
    top: '40%',
    right: '20%',
    width: 300,
    height: 2,
    transform: [{ rotate: '45deg' }],
  },

  // Accent Orb (Flag Pin)
  accentOrb: {
    position: 'absolute',
    top: '60%',
    right: '15%',
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  // Auth preset
  authGlow: {
    position: 'absolute',
    top: '15%',
    left: '50%',
    marginLeft: -200,
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  cornerAccent1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
  },

  // Game preset
  flowShape1: {
    position: 'absolute',
    top: 100,
    right: -80,
    width: 250,
    height: 350,
    borderRadius: 125,
    transform: [{ scaleX: 1.5 }, { rotate: '30deg' }],
  },
  flowShape2: {
    position: 'absolute',
    bottom: 50,
    left: -60,
    width: 200,
    height: 280,
    borderRadius: 100,
    transform: [{ scaleY: 1.3 }, { rotate: '-20deg' }],
  },

  // Minimal preset
  minimalAccent: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
  },
});

export default PremiumBackground;
