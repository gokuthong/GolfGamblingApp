import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useThemedColors } from "../../contexts/ThemeContext";
import {
  typography,
  fontFamilies,
  spacing,
  borderRadius,
  shadows,
  animations,
} from "../../theme";

export interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  rank?: number;
  /** Change in position (positive = moved up, negative = moved down) */
  positionChange?: number;
  /** Additional stats to display */
  stats?: {
    label: string;
    value: string;
  }[];
}

export interface LeaderboardProps {
  entries: LeaderboardEntry[];
  /** Show position change indicators */
  showPositionChange?: boolean;
  /** Show stats for each entry */
  showStats?: boolean;
  /** Highlight top 3 with medals */
  showMedals?: boolean;
  /** Use gradient for top entry */
  gradientTop?: boolean;
}

const getMedalColor = (rank: number): string => {
  if (rank === 1) return "#FFD700"; // Gold
  if (rank === 2) return "#C0C0C0"; // Silver
  if (rank === 3) return "#CD7F32"; // Bronze
  return "inherit";
};

/**
 * ESPN-style leaderboard component with animated position changes.
 * Perfect for displaying game standings in real-time.
 */
export const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  showPositionChange = false,
  showStats = false,
  showMedals = true,
  gradientTop = true,
}) => {
  const colors = useThemedColors();

  // Sort by points descending and assign ranks
  const sortedEntries = [...entries]
    .sort((a, b) => b.points - a.points)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return (
    <Box sx={{ py: `${spacing.sm}px` }}>
      {sortedEntries.map((item, index) => {
        const isTop = index === 0;
        const isTopThree = index < 3 && showMedals;
        const isGradient = isTop && gradientTop;
        const textColor = isGradient
          ? colors.text.inverse
          : colors.text.primary;
        const secondaryColor = isGradient
          ? "rgba(255, 255, 255, 0.8)"
          : colors.text.secondary;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              delay: index * 0.05,
              type: "spring",
              ...animations.spring.bouncy,
            }}
            style={{ marginBottom: spacing.sm }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                p: `${spacing.md}px`,
                backgroundColor: isGradient
                  ? undefined
                  : colors.background.card,
                background: isGradient
                  ? `linear-gradient(to right, ${colors.gradients.victory[0]}, ${colors.gradients.victory[1]})`
                  : undefined,
                borderRadius: `${borderRadius.lg}px`,
                boxShadow: isGradient ? shadows.medium : shadows.small,
              }}
            >
              {/* Rank and Medal */}
              <Box
                sx={{
                  width: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: `${spacing.md}px`,
                }}
              >
                {isTopThree ? (
                  <EmojiEventsIcon
                    sx={{
                      fontSize: 24,
                      color: getMedalColor(item.rank!),
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: colors.surfaces.level2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: typography.bodyMedium.fontSize,
                        lineHeight: `${typography.bodyMedium.lineHeight}px`,
                        fontFamily: fontFamilies.body,
                        fontWeight: 700,
                        color: textColor,
                      }}
                    >
                      {item.rank}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Player Info */}
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    mb: `${spacing.xs}px`,
                  }}
                >
                  <Typography
                    noWrap
                    sx={{
                      fontSize: typography.h4.fontSize,
                      lineHeight: `${typography.h4.lineHeight}px`,
                      fontFamily: typography.h4.fontFamily,
                      fontWeight: typography.h4.fontWeight,
                      letterSpacing: typography.h4.letterSpacing,
                      color: textColor,
                      flex: 1,
                    }}
                  >
                    {item.name}
                  </Typography>

                  {showPositionChange &&
                    item.positionChange !== undefined &&
                    item.positionChange !== 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          ml: `${spacing.sm}px`,
                        }}
                      >
                        {item.positionChange > 0 ? (
                          <ArrowUpwardIcon
                            sx={{
                              fontSize: 14,
                              color: colors.scoring.positive,
                            }}
                          />
                        ) : (
                          <ArrowDownwardIcon
                            sx={{
                              fontSize: 14,
                              color: colors.scoring.negative,
                            }}
                          />
                        )}
                        <Typography
                          sx={{
                            fontSize: typography.bodySmall.fontSize,
                            lineHeight: `${typography.bodySmall.lineHeight}px`,
                            fontFamily: fontFamilies.body,
                            fontWeight: 700,
                            ml: "2px",
                            color:
                              item.positionChange > 0
                                ? colors.scoring.positive
                                : colors.scoring.negative,
                          }}
                        >
                          {Math.abs(item.positionChange)}
                        </Typography>
                      </Box>
                    )}
                </Box>

                {showStats && item.stats && item.stats.length > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      flexWrap: "wrap",
                    }}
                  >
                    {item.stats.map((stat, idx) => (
                      <Typography
                        key={idx}
                        sx={{
                          fontSize: typography.bodySmall.fontSize,
                          lineHeight: `${typography.bodySmall.lineHeight}px`,
                          fontFamily: fontFamilies.body,
                          fontWeight: 400,
                          color: secondaryColor,
                          mr: `${spacing.md}px`,
                        }}
                      >
                        {stat.label}: {stat.value}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>

              {/* Points */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  minWidth: 60,
                }}
              >
                <Typography
                  sx={{
                    fontSize: typography.h3.fontSize,
                    lineHeight: `${typography.h3.lineHeight}px`,
                    fontFamily: typography.h3.fontFamily,
                    fontWeight: 800,
                    letterSpacing: typography.h3.letterSpacing,
                    color: textColor,
                  }}
                >
                  {item.points > 0 ? "+" : ""}
                  {item.points.toFixed(1)}
                </Typography>
              </Box>
            </Box>
          </motion.div>
        );
      })}
    </Box>
  );
};
