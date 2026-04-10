import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from './Icon';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

export interface StatCardProps {
  /**
   * Large stat value to display (e.g., "42", "+15.5")
   */
  value: string | number;
  /**
   * Label describing the stat (e.g., "TOTAL POINTS", "AVG PER HOLE")
   */
  label: string;
  /**
   * Optional icon name from MaterialCommunityIcons
   */
  icon?: string;
  /**
   * Trend indicator: 'up', 'down', or 'neutral'
   */
  trend?: 'up' | 'down' | 'neutral';
  /**
   * Comparison value (e.g., "vs 12.0")
   */
  comparison?: string;
  /**
   * Use gradient background
   */
  gradient?: boolean;
  /**
   * Color variant for the card
   */
  variant?: 'default' | 'positive' | 'negative' | 'primary';
  /**
   * Custom style
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * ESPN-style stat card for displaying key metrics
 * Perfect for player stats, game summaries, and leaderboards
 */
export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon,
  trend,
  comparison,
  gradient = false,
  variant = 'default',
  style,
}) => {
  const getColors = (): [string, string] => {
    switch (variant) {
      case 'positive':
        return [colors.gradients.victory[0], colors.gradients.victory[1]];
      case 'negative':
        return [colors.multipliers.burn, '#D32F2F'];
      case 'primary':
        return [colors.gradients.primary[0], colors.gradients.primary[1]];
      default:
        return [colors.surfaces.level1, colors.surfaces.level2];
    }
  };

  const getValueColor = (): string => {
    switch (variant) {
      case 'positive':
        return colors.scoring.positive;
      case 'negative':
        return colors.scoring.negative;
      case 'primary':
        return colors.primary[500];
      default:
        return colors.text.primary;
    }
  };

  const getTrendIcon = (): string | undefined => {
    if (!trend) return undefined;
    return trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'minus';
  };

  const getTrendColor = (): string => {
    if (trend === 'up') return colors.scoring.positive;
    if (trend === 'down') return colors.scoring.negative;
    return colors.text.secondary;
  };

  const content = (
    <View style={styles.content}>
      {/* Icon and Label Row */}
      <View style={styles.labelRow}>
        {icon && (
          <Icon
            name={icon}
            size={16}
            color={variant === 'default' ? colors.text.secondary : colors.text.inverse}
            style={styles.labelIcon}
          />
        )}
        <Text
          style={[
            styles.label,
            variant !== 'default' && styles.labelInverse,
          ]}
        >
          {label.toUpperCase()}
        </Text>
      </View>

      {/* Stat Value */}
      <View style={styles.valueRow}>
        <Text
          style={[
            styles.value,
            variant !== 'default' && styles.valueInverse,
            { color: gradient ? colors.text.inverse : getValueColor() },
          ]}
        >
          {value}
        </Text>
        {getTrendIcon() && (
          <Icon
            name={getTrendIcon()!}
            size={24}
            color={gradient ? colors.text.inverse : getTrendColor()}
            style={styles.trendIcon}
          />
        )}
      </View>

      {/* Comparison */}
      {comparison && (
        <Text
          style={[
            styles.comparison,
            variant !== 'default' && styles.comparisonInverse,
          ]}
        >
          {comparison}
        </Text>
      )}
    </View>
  );

  if (gradient) {
    return (
      <LinearGradient
        colors={getColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, shadows.medium, style]}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, styles.solidBackground, shadows.medium, style]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    minWidth: 120,
  },
  solidBackground: {
    backgroundColor: colors.background.card,
  },
  content: {
    padding: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  labelIcon: {
    marginRight: spacing.xs,
  },
  label: {
    ...typography.statLabel,
    color: colors.text.secondary,
  },
  labelInverse: {
    color: colors.text.inverse,
    opacity: 0.8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.statDisplay,
    color: colors.text.primary,
  },
  valueInverse: {
    color: colors.text.inverse,
  },
  trendIcon: {
    marginLeft: spacing.sm,
  },
  comparison: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  comparisonInverse: {
    color: colors.text.inverse,
    opacity: 0.7,
  },
});
