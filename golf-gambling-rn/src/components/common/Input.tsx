import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { TextInput as PaperTextInput, HelperText } from 'react-native-paper';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface InputProps {
  label?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  containerStyle?: ViewStyle;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'off' | 'name';
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  accessibilityLabel?: string;
  /** Left icon name from MaterialCommunityIcons */
  leftIcon?: string;
  /** Right icon name from MaterialCommunityIcons */
  rightIcon?: string;
  onRightIconPress?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  error,
  containerStyle,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete = 'off',
  editable = true,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  accessibilityLabel,
  leftIcon,
  rightIcon,
  onRightIconPress,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <PaperTextInput
        mode="outlined"
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        error={!!error}
        accessibilityLabel={accessibilityLabel || label}
        left={leftIcon ? <PaperTextInput.Icon icon={leftIcon} color={colors.text.secondary} /> : undefined}
        right={rightIcon ? (
          <PaperTextInput.Icon
            icon={rightIcon}
            color={colors.text.secondary}
            onPress={onRightIconPress}
          />
        ) : undefined}
        style={styles.input}
        contentStyle={styles.inputContent}
        outlineStyle={styles.outline}
        outlineColor={colors.border.light}
        activeOutlineColor={colors.accent.gold}
        textColor={colors.text.primary}
        placeholderTextColor={colors.text.tertiary}
        theme={{
          colors: {
            onSurfaceVariant: colors.text.secondary,
            surfaceVariant: colors.background.card,
            error: colors.status.error,
          },
          fonts: {
            bodyLarge: {
              fontFamily: typography.bodyMedium.fontFamily,
            },
          },
        }}
      />
      {error && (
        <HelperText type="error" visible={!!error} style={styles.errorText}>
          {error}
        </HelperText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.background.card,
    fontFamily: typography.bodyMedium.fontFamily,
  },
  inputContent: {
    fontFamily: typography.bodyMedium.fontFamily,
  },
  outline: {
    borderRadius: borderRadius.md,
  },
  errorText: {
    fontFamily: typography.bodySmall.fontFamily,
    color: colors.status.error,
    marginTop: -spacing.xs,
  },
});

export default Input;
