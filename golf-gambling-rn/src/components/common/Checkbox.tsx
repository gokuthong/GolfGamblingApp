import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from './Icon';
import { colors, spacing, borderRadius, animations } from '../../theme';

export interface CheckboxProps {
  /**
   * Whether the checkbox is checked
   */
  checked: boolean;
  /**
   * Callback when checkbox is pressed
   */
  onPress: () => void;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Size of the checkbox
   */
  size?: number;
  /**
   * Custom style
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Accessibility label
   */
  accessibilityLabel?: string;
}

/**
 * Animated checkbox component replacing custom checkbox implementation
 * Features smooth spring animations and theme integration
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onPress,
  disabled = false,
  size = 24,
  style,
  accessibilityLabel,
}) => {
  const scale = useSharedValue(checked ? 1 : 0);
  const backgroundColor = useSharedValue(checked ? 1 : 0);

  React.useEffect(() => {
    scale.value = withSpring(checked ? 1 : 0, animations.spring.bouncy);
    backgroundColor.value = withTiming(checked ? 1 : 0, {
      duration: animations.timing.fast,
    });
  }, [checked]);

  const animatedCheckStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor:
        backgroundColor.value === 1 ? colors.primary[500] : 'transparent',
      borderColor:
        backgroundColor.value === 1
          ? colors.primary[500]
          : disabled
          ? colors.border.medium
          : colors.border.dark,
    };
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[{ opacity: disabled ? 0.5 : 1 }, style]}
      accessible
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={accessibilityLabel}
      activeOpacity={animations.opacity.semiVisible}
    >
      <Animated.View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: borderRadius.xs,
          },
          animatedBackgroundStyle,
        ]}
      >
        <Animated.View style={animatedCheckStyle}>
          <Icon
            name="check"
            size={size * 0.7}
            color={colors.text.inverse}
          />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
