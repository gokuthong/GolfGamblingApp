import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { useThemedColors } from '../../contexts/ThemeContext';

export type ShapeType = 'circle' | 'square' | 'triangle';
export type AnimationType = 'pulse' | 'float' | 'rotate' | 'none';

interface DecorativeShapeProps {
  type?: ShapeType;
  size?: number;
  color?: string;
  opacity?: number;
  animation?: AnimationType;
  animationDuration?: number;
  position?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  style?: ViewStyle;
}

interface DecorativeShapesProps {
  shapes?: DecorativeShapeProps[];
  preset?: 'minimal' | 'balanced' | 'rich';
}

const DecorativeShape: React.FC<DecorativeShapeProps> = ({
  type = 'circle',
  size = 200,
  color,
  opacity = 0.3,
  animation = 'pulse',
  animationDuration = 2000,
  position = {},
  style,
}) => {
  const colors = useThemedColors();
  const defaultColor = color || colors.glow.gold;

  // Animation values
  const animatedOpacity = useSharedValue(opacity);
  const animatedTranslateY = useSharedValue(0);
  const animatedRotate = useSharedValue(0);

  useEffect(() => {
    switch (animation) {
      case 'pulse':
        animatedOpacity.value = withRepeat(
          withTiming(opacity * 2, { duration: animationDuration, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        );
        break;
      case 'float':
        animatedTranslateY.value = withRepeat(
          withSequence(
            withTiming(-20, { duration: animationDuration, easing: Easing.inOut(Easing.ease) }),
            withTiming(20, { duration: animationDuration, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
        break;
      case 'rotate':
        animatedRotate.value = withRepeat(
          withTiming(360, { duration: animationDuration * 3, easing: Easing.linear }),
          -1,
          false
        );
        break;
      case 'none':
      default:
        animatedOpacity.value = opacity;
        break;
    }
  }, [animation, animationDuration, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animatedOpacity.value,
    transform: [
      { translateY: animatedTranslateY.value },
      { rotate: `${animatedRotate.value}deg` },
    ],
  }));

  const getShapeStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      width: size,
      height: size,
      position: 'absolute',
      ...position,
    };

    switch (type) {
      case 'circle':
        return {
          ...baseStyle,
          borderRadius: size / 2,
        };
      case 'square':
        return {
          ...baseStyle,
          borderRadius: size * 0.1,
        };
      case 'triangle':
        return {
          ...baseStyle,
          borderRadius: size * 0.05,
          transform: [{ rotate: '45deg' }],
        };
      default:
        return baseStyle;
    }
  };

  return (
    <Animated.View style={[getShapeStyle(), animatedStyle, style]}>
      <LinearGradient
        colors={[defaultColor, 'transparent']}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
};

export const DecorativeShapes: React.FC<DecorativeShapesProps> = ({ shapes, preset = 'balanced' }) => {
  const colors = useThemedColors();

  // Preset configurations
  const presetShapes: Record<string, DecorativeShapeProps[]> = {
    minimal: [
      {
        type: 'circle',
        size: 250,
        color: colors.glow.gold,
        opacity: 0.2,
        animation: 'pulse',
        position: { top: -100, right: -100 },
      },
    ],
    balanced: [
      {
        type: 'circle',
        size: 280,
        color: colors.glow.gold,
        opacity: 0.25,
        animation: 'pulse',
        position: { top: -120, right: -120 },
      },
      {
        type: 'circle',
        size: 180,
        color: colors.glow.goldStrong || colors.glow.gold,
        opacity: 0.15,
        animation: 'float',
        animationDuration: 3000,
        position: { bottom: 100, left: -60 },
      },
    ],
    rich: [
      {
        type: 'circle',
        size: 300,
        color: colors.glow.gold,
        opacity: 0.3,
        animation: 'pulse',
        position: { top: -140, right: -140 },
      },
      {
        type: 'circle',
        size: 200,
        color: colors.glow.goldStrong || colors.glow.gold,
        opacity: 0.2,
        animation: 'float',
        animationDuration: 3000,
        position: { bottom: 120, left: -80 },
      },
      {
        type: 'square',
        size: 120,
        color: colors.accent.goldMuted,
        opacity: 0.1,
        animation: 'rotate',
        position: { top: 200, left: 30 },
      },
    ],
  };

  const shapesToRender = shapes || presetShapes[preset] || presetShapes.balanced;

  return (
    <View style={styles.container} pointerEvents="none">
      {shapesToRender.map((shapeProps, index) => (
        <DecorativeShape key={`shape-${index}`} {...shapeProps} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});

export default DecorativeShapes;
