import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import { useThemedColors } from '../../contexts/ThemeContext';
import { typography, fontFamilies, spacing, borderRadius, animations } from '../../theme';

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  data: BarChartData[];
  /** Maximum value for scaling (auto-calculates if not provided) */
  maxValue?: number;
  /** Height of the chart in pixels */
  height?: number;
  /** Show values on top of bars */
  showValues?: boolean;
  /** Use gradient fills */
  gradient?: boolean;
  /** Animate bars on mount */
  animated?: boolean;
}

const DEFAULT_HEIGHT = 200;

/**
 * Simple bar chart component for hole-by-hole performance visualization.
 * Perfect for showing point distributions across holes.
 */
export const BarChart: React.FC<BarChartProps> = ({
  data,
  maxValue,
  height = DEFAULT_HEIGHT,
  showValues = true,
  gradient = true,
  animated = true,
}) => {
  const colors = useThemedColors();
  const maxVal = maxValue || Math.max(...data.map((d) => Math.abs(d.value)), 1);

  const getBarColor = (item: BarChartData): string => {
    if (item.color) return item.color;
    if (item.value < 0) return colors.scoring.negative;
    if (item.value > 0) return colors.scoring.positive;
    return colors.scoring.neutral;
  };

  const getGradientColors = (item: BarChartData): [string, string] => {
    if (item.value < 0) return [colors.scoring.negative, '#D32F2F'];
    if (item.value > 0) return [colors.gradients.victory[0], colors.gradients.victory[1]];
    return [colors.scoring.neutral, colors.text.secondary];
  };

  return (
    <Box
      sx={{
        px: `${spacing.md}px`,
        py: `${spacing.sm}px`,
        height: height + 40,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Chart Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'flex-end',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: `${spacing.sm}px`,
          }}
        >
          {data.map((item, index) => {
            const barHeight = (Math.abs(item.value) / maxVal) * height;
            const isNegative = item.value < 0;
            const [gradStart, gradEnd] = getGradientColors(item);
            const solidColor = getBarColor(item);

            return (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* Value label above bar */}
                {showValues && item.value !== 0 && (
                  <Typography
                    sx={{
                      fontSize: typography.bodySmall.fontSize,
                      lineHeight: `${typography.bodySmall.lineHeight}px`,
                      fontFamily: fontFamilies.body,
                      fontWeight: 700,
                      mb: `${spacing.xs}px`,
                      color: isNegative
                        ? colors.scoring.negative
                        : colors.scoring.positive,
                    }}
                  >
                    {item.value > 0 ? '+' : ''}
                    {item.value.toFixed(1)}
                  </Typography>
                )}

                {/* Bar */}
                <motion.div
                  initial={animated ? { height: 0 } : { height: barHeight }}
                  animate={{ height: barHeight }}
                  transition={
                    animated
                      ? {
                          delay: index * 0.05,
                          type: 'spring',
                          ...animations.spring.bouncy,
                        }
                      : { duration: 0 }
                  }
                  style={{
                    width: '100%',
                    borderRadius: borderRadius.xs,
                    overflow: 'hidden',
                    minHeight: 2,
                    background: gradient
                      ? `linear-gradient(to bottom, ${gradStart}, ${gradEnd})`
                      : solidColor,
                  }}
                />
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* X-axis labels */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          mt: `${spacing.sm}px`,
          gap: `${spacing.sm}px`,
        }}
      >
        {data.map((item, index) => (
          <Box
            key={index}
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              noWrap
              sx={{
                fontSize: 10,
                lineHeight: `${typography.bodySmall.lineHeight}px`,
                fontFamily: fontFamilies.body,
                fontWeight: 400,
                color: colors.text.secondary,
              }}
            >
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
