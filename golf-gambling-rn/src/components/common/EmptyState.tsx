import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Icon } from './Icon';
import { Button } from './Button';
import { colors, typography, spacing } from '../../theme';

export interface EmptyStateProps {
  /**
   * Icon name from MaterialCommunityIcons
   */
  icon?: string;
  /**
   * Title text
   */
  title: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Optional action button
   */
  actionLabel?: string;
  /**
   * Action button callback
   */
  onAction?: () => void;
  /**
   * Custom style
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Empty state component for screens with no data
 * Replaces basic "No items" text with helpful visuals and actions
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {icon && (
        <View style={styles.iconContainer}>
          <Icon
            name={icon}
            size={64}
            color={colors.text.disabled}
            accessibilityLabel={`${title} icon`}
          />
        </View>
      )}

      <Text style={styles.title}>{title}</Text>

      {description && (
        <Text style={styles.description}>{description}</Text>
      )}

      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="primary"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 300,
  },
  actionContainer: {
    marginTop: spacing.md,
    minWidth: 200,
  },
});
