import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { spacing } from '../../theme';
import { useThemedColors } from '../../contexts/ThemeContext';

interface DividerProps {
  gold?: boolean;
  thin?: boolean;
  style?: ViewStyle;
  vertical?: boolean;
}

export const Divider: React.FC<DividerProps> = ({ gold = false, thin = false, style, vertical = false }) => {
  const colors = useThemedColors();
  const color = gold ? colors.accent.gold : colors.border.light;
  const thickness = thin ? StyleSheet.hairlineWidth : gold ? 1.5 : 1;

  return (
    <View
      style={[
        vertical
          ? { width: thickness, alignSelf: 'stretch' }
          : { height: thickness, alignSelf: 'stretch', marginVertical: spacing.md },
        { backgroundColor: color },
        style,
      ]}
    />
  );
};

export default Divider;
