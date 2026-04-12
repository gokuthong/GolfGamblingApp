import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from './Icon';
import { typography, spacing, borderRadius } from '../../theme';
import { useThemedColors } from '../../contexts/ThemeContext';

export interface StatCardProps {
  value: string | number;
  label: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  comparison?: string;
  gradient?: boolean;
  variant?: 'default' | 'positive' | 'negative' | 'primary' | 'gold';
  style?: StyleProp<ViewStyle>;
}

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
  const colors = useThemedColors();

  const getGradientColors = (): [string, string] => {
    switch (variant) {
      case 'positive': return [colors.scoring.positive, colors.scoring.positive];
      case 'negative': return [colors.scoring.negative, colors.scoring.negative];
      case 'primary': return [colors.primary[500], colors.primary[700]];
      case 'gold': return [colors.accent.gold, colors.accent.goldDark];
      default: return [colors.background.card, colors.background.card];
    }
  };

  const getValueColor = (): string => {
    if (gradient || variant === 'gold' || variant === 'primary') return colors.text.inverse;
    if (variant === 'positive') return colors.scoring.positive;
    if (variant === 'negative') return colors.scoring.negative;
    return colors.text.primary;
  };

  const getLabelColor = (): string => {
    if (gradient || variant === 'gold' || variant === 'primary') return colors.text.inverse;
    return colors.text.tertiary;
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
      <View style={styles.labelRow}>
        {icon && (
          <Icon
            name={icon}
            size={13}
            color={getLabelColor()}
            style={styles.labelIcon}
          />
        )}
        <Text style={[styles.label, { color: getLabelColor() }]}>{label.toUpperCase()}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: getValueColor() }]}>{value}</Text>
        {getTrendIcon() && (
          <Icon
            name={getTrendIcon()!}
            size={20}
            color={gradient ? colors.text.inverse : getTrendColor()}
            style={styles.trendIcon}
          />
        )}
      </View>
      {comparison && (
        <Text
          style={[
            styles.comparison,
            { color: gradient ? colors.text.inverse : colors.text.tertiary },
          ]}
        >
          {comparison}
        </Text>
      )}
    </View>
  );

  const shadow: ViewStyle = {
    shadowColor: colors.shadowColors.soft,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 2,
  };

  if (gradient || variant === 'gold' || variant === 'primary') {
    return (
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, shadow, style]}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.card,
          borderWidth: 1,
          borderColor: colors.border.light,
        },
        shadow,
        style,
      ]}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    minWidth: 100,
  },
  content: {
    padding: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  labelIcon: {
    marginRight: 6,
  },
  label: {
    ...typography.statLabel,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    ...typography.statDisplay,
  },
  trendIcon: {
    marginLeft: spacing.sm,
  },
  comparison: {
    ...typography.bodySmall,
    marginTop: 4,
  },
});

export default StatCard;
