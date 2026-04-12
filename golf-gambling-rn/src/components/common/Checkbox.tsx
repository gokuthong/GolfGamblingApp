import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Icon } from "./Icon";
import { borderRadius, animations } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";

export interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onPress,
  disabled = false,
  size = 22,
  style,
  accessibilityLabel,
}) => {
  const colors = useThemedColors();
  const scale = useSharedValue(checked ? 1 : 0);
  const progress = useSharedValue(checked ? 1 : 0);

  React.useEffect(() => {
    scale.value = withSpring(checked ? 1 : 0, animations.spring.bouncy);
    progress.value = withTiming(checked ? 1 : 0, {
      duration: animations.timing.fast,
    });
  }, [checked]);

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedBoxStyle = useAnimatedStyle(() => ({
    backgroundColor: progress.value === 1 ? colors.accent.gold : "transparent",
    borderColor:
      progress.value === 1
        ? colors.accent.gold
        : disabled
          ? colors.border.medium
          : colors.border.dark,
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[{ opacity: disabled ? 0.5 : 1 }, style]}
      accessible
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.container,
          { width: size, height: size, borderRadius: borderRadius.sm },
          animatedBoxStyle,
        ]}
      >
        <Animated.View style={animatedCheckStyle}>
          <Icon name="check" size={size * 0.7} color={colors.text.inverse} />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Checkbox;
