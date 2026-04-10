import { TextStyle } from 'react-native';
import { typography } from './typography';

// Helper to safely extract typography styles for React Native
export const getTypographyStyle = (
  style: keyof typeof typography
): TextStyle => {
  const typo = typography[style];
  return {
    fontSize: typo.fontSize,
    lineHeight: typo.lineHeight,
    fontWeight: typo.fontWeight as TextStyle['fontWeight'],
    ...(typo.letterSpacing !== undefined && { letterSpacing: typo.letterSpacing }),
  };
};
