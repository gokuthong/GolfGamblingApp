import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type GradientVariant =
  | 'dark'
  | 'header'
  | 'card'
  | 'gold'
  | 'green'
  | 'greenFade'
  | 'radialGold';

interface GradientBackgroundProps {
  variant?: GradientVariant;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  animated?: boolean;
}

const gradientConfigs: Record<GradientVariant, {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];
}> = {
  dark: {
    colors: [colors.background.secondary, colors.background.primary],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  header: {
    colors: colors.gradients.header,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    locations: [0, 0.5, 1],
  },
  card: {
    colors: colors.gradients.card,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  gold: {
    colors: colors.gradients.gold,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  green: {
    colors: colors.gradients.primary,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    locations: [0, 0.5, 1],
  },
  greenFade: {
    colors: colors.gradients.primaryDark,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    locations: [0, 0.4, 1],
  },
  radialGold: {
    colors: [colors.glow.gold, 'transparent'],
    start: { x: 0.5, y: 0.5 },
    end: { x: 1, y: 1 },
  },
};

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  variant = 'dark',
  style,
  children,
  animated = false,
}) => {
  const config = gradientConfigs[variant];
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    if (animated) {
      opacity.value = withRepeat(
        withTiming(0.85, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

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

// Gold glow orb - decorative element
interface GoldGlowProps {
  size?: number;
  intensity?: 'light' | 'medium' | 'strong';
  position?: { top?: number; left?: number; right?: number; bottom?: number };
  animated?: boolean;
}

export const GoldGlow: React.FC<GoldGlowProps> = ({
  size = 200,
  intensity = 'medium',
  position = { top: -50, right: -50 },
  animated = true,
}) => {
  const scale = useSharedValue(1);
  const glowOpacity = intensity === 'light' ? 0.15 : intensity === 'strong' ? 0.4 : 0.25;

  React.useEffect(() => {
    if (animated) {
      scale.value = withRepeat(
        withTiming(1.1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
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
        colors={[`rgba(255, 215, 0, ${glowOpacity})`, 'transparent']}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={[styles.glowGradient, { borderRadius: size / 2 }]}
      />
    </Animated.View>
  );
};

// Screen wrapper with dark background and optional decorative elements
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
  return (
    <View style={[styles.darkScreen, style]}>
      {showGlow && <GoldGlow position={glowPosition} />}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  darkScreen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  glowOrb: {
    position: 'absolute',
    overflow: 'hidden',
  },
  glowGradient: {
    flex: 1,
  },
});

export default GradientBackground;
