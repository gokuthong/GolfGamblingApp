import React from "react";
import { View, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { Icon } from "./Icon";
import { Button } from "./Button";
import { typography, spacing } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "inbox-outline",
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  const colors = useThemedColors();
  return (
    <View style={[styles.container, style]}>
      {icon && (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.surfaces.level2 },
          ]}
        >
          <Icon name={icon} size={32} color={colors.text.tertiary} />
        </View>
      )}
      <Text style={[styles.title, { color: colors.text.primary }]}>
        {title}
      </Text>
      {description && (
        <Text style={[styles.description, { color: colors.text.secondary }]}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button title={actionLabel} onPress={onAction} variant="primary" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  description: {
    ...typography.bodyMedium,
    textAlign: "center",
    marginBottom: spacing.lg,
    maxWidth: 320,
  },
  actionContainer: {
    marginTop: spacing.sm,
    minWidth: 200,
  },
});

export default EmptyState;
