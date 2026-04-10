import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius, animations } from '../../theme';

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  data: BarChartData[];
  /**
   * Maximum value for scaling (auto-calculates if not provided)
   */
  maxValue?: number;
  /**
   * Height of the chart in pixels
   */
  height?: number;
  /**
   * Show values on top of bars
   */
  showValues?: boolean;
  /**
   * Use gradient fills
   */
  gradient?: boolean;
  /**
   * Animate bars on mount
   */
  animated?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const DEFAULT_HEIGHT = 200;

/**
 * Simple bar chart component for hole-by-hole performance visualization
 * Perfect for showing point distributions across holes
 */
export const BarChart: React.FC<BarChartProps> = ({
  data,
  maxValue,
  height = DEFAULT_HEIGHT,
  showValues = true,
  gradient = true,
  animated = true,
}) => {
  const maxVal = maxValue || Math.max(...data.map(d => Math.abs(d.value)), 1);
  const barWidth = (SCREEN_WIDTH - spacing.xl * 2 - spacing.sm * (data.length - 1)) / data.length;

  return (
    <View style={[styles.container, { height: height + 40 }]}>
      {/* Y-axis (optional - could add grid lines) */}
      <View style={styles.chartArea}>
        <View style={styles.barsContainer}>
          {data.map((item, index) => (
            <Bar
              key={index}
              data={item}
              maxValue={maxVal}
              barWidth={barWidth}
              height={height}
              index={index}
              showValue={showValues}
              gradient={gradient}
              animated={animated}
            />
          ))}
        </View>
      </View>

      {/* X-axis labels */}
      <View style={styles.labelsContainer}>
        {data.map((item, index) => (
          <View key={index} style={[styles.label, { width: barWidth }]}>
            <Text style={styles.labelText} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

interface BarProps {
  data: BarChartData;
  maxValue: number;
  barWidth: number;
  height: number;
  index: number;
  showValue: boolean;
  gradient: boolean;
  animated: boolean;
}

const Bar: React.FC<BarProps> = ({
  data,
  maxValue,
  barWidth,
  height,
  index,
  showValue,
  gradient,
  animated,
}) => {
  const animatedHeight = useSharedValue(0);
  const isNegative = data.value < 0;
  const barHeight = (Math.abs(data.value) / maxValue) * height;

  useEffect(() => {
    if (animated) {
      animatedHeight.value = withDelay(
        index * 50,
        withSpring(barHeight, animations.spring.bouncy)
      );
    } else {
      animatedHeight.value = barHeight;
    }
  }, [barHeight, animated, index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: animatedHeight.value,
    };
  });

  const getBarColor = (): string => {
    if (data.color) return data.color;
    if (isNegative) return colors.scoring.negative;
    if (data.value > 0) return colors.scoring.positive;
    return colors.scoring.neutral;
  };

  const getGradientColors = (): [string, string] => {
    if (isNegative) return [colors.scoring.negative, '#D32F2F'];
    if (data.value > 0) return [colors.gradients.victory[0], colors.gradients.victory[1]];
    return [colors.scoring.neutral, colors.text.secondary];
  };

  return (
    <View style={[styles.barContainer, { width: barWidth }]}>
      {showValue && data.value !== 0 && (
        <Text
          style={[
            styles.valueText,
            isNegative ? styles.negativeText : styles.positiveText,
          ]}
        >
          {data.value > 0 ? '+' : ''}
          {data.value.toFixed(1)}
        </Text>
      )}

      <Animated.View style={[styles.bar, animatedStyle]}>
        {gradient ? (
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.barFill}
          />
        ) : (
          <View style={[styles.barFill, { backgroundColor: getBarColor() }]} />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chartArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barContainer: {
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
    minHeight: 2,
  },
  barFill: {
    width: '100%',
    height: '100%',
  },
  valueText: {
    ...typography.bodySmall,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  positiveText: {
    color: colors.scoring.positive,
  },
  negativeText: {
    color: colors.scoring.negative,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  label: {
    alignItems: 'center',
  },
  labelText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontSize: 10,
    fontWeight: '400' as const,
  },
});
