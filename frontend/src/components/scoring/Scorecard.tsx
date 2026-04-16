import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useThemedColors } from "../../contexts/ThemeContext";
import { typography, fontFamilies, spacing } from "../../theme";
import { Hole, Score, Player } from "../../types";

interface ScorecardProps {
  holes: Hole[];
  scores: Score[];
  players: Player[];
  courseName?: string;
}

export const Scorecard: React.FC<ScorecardProps> = ({
  holes,
  scores,
  players,
  courseName,
}) => {
  const colors = useThemedColors();

  // Sort holes by hole number
  const sortedHoles = [...holes].sort((a, b) => a.holeNumber - b.holeNumber);

  // Get strokes for a specific player and hole (returns null for non-confirmed holes)
  const getStrokesForHole = (
    playerId: string,
    holeId: string,
  ): number | null => {
    const hole = holes.find((h) => h.id === holeId);
    // If hole is not confirmed, return null (show blank)
    if (hole && hole.confirmed === false) {
      return null;
    }
    const score = scores.find(
      (s) => s.playerId === playerId && s.holeId === holeId,
    );
    // If no score exists, default to par (player hasn't modified their score)
    if (!score) {
      return hole?.par || 0;
    }
    return score.strokes;
  };

  // Calculate total strokes for confirmed holes only
  const getTotalStrokes = (playerId: string, holeSet: Hole[]): number => {
    return holeSet.reduce((sum, hole) => {
      if (hole.confirmed === false) return sum;
      const strokes = getStrokesForHole(playerId, hole.id);
      return sum + (strokes ?? 0);
    }, 0);
  };

  // Calculate total par for confirmed holes only
  const getTotalPar = (holeSet: Hole[]): number => {
    return holeSet.reduce((sum, hole) => {
      if (hole.confirmed === false) return sum;
      return sum + hole.par;
    }, 0);
  };

  // Shared cell base styles
  const cellBase = {
    py: `${spacing.sm}px`,
    px: `${spacing.xs}px`,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 40,
    borderRight: "2px solid #000000",
    boxSizing: "border-box" as const,
  };

  const playerNameCellSx = {
    ...cellBase,
    width: 100,
    minWidth: 100,
    justifyContent: "flex-start",
    pl: `${spacing.sm}px`,
  };

  const holeCellSx = {
    ...cellBase,
    width: 45,
    minWidth: 45,
  };

  const totalCellSx = {
    ...cellBase,
    width: 80,
    minWidth: 80,
    backgroundColor: colors.surfaces.level2,
  };

  const headerCellSx = {
    backgroundColor: colors.surfaces.level3,
  };

  const parRowSx = {
    backgroundColor: colors.surfaces.level2,
  };

  return (
    <Box sx={{ gap: `${spacing.lg}px` }}>
      {/* Combined Scorecard - All holes in one view */}
      <Box
        sx={{
          mb: `${spacing.md}px`,
          border: "3px solid #000000",
          borderRadius: "4px",
          overflow: "hidden",
          overflowX: "auto",
        }}
      >
        <Typography
          sx={{
            fontFamily: fontFamilies.bodySemiBold,
            fontSize: typography.h4.fontSize,
            fontWeight: 600,
            color: colors.accent.gold,
            mb: `${spacing.sm}px`,
            textAlign: "center",
          }}
        >
          {courseName || "Scorecard"}
        </Typography>

        {/* Header Row - Hole Numbers */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            borderBottom: "3px solid #000000",
          }}
        >
          <Box sx={{ ...playerNameCellSx, ...headerCellSx }}>
            <Typography
              sx={{
                fontFamily: fontFamilies.bodySemiBold,
                fontSize: 12,
                fontWeight: 600,
                color: colors.accent.gold,
                textTransform: "uppercase",
              }}
            >
              Player
            </Typography>
          </Box>
          {sortedHoles.map((hole) => (
            <Box
              key={hole.id}
              sx={{ ...holeCellSx, ...headerCellSx, flexDirection: "column" }}
            >
              <Typography
                sx={{
                  fontFamily: fontFamilies.bodySemiBold,
                  fontSize: 12,
                  fontWeight: 600,
                  color: colors.accent.gold,
                  textTransform: "uppercase",
                }}
              >
                {hole.holeNumber}
              </Typography>
              {hole.index && (
                <Typography
                  sx={{
                    fontFamily: fontFamilies.mono,
                    fontSize: 9,
                    color: colors.text.secondary,
                    mt: "2px",
                  }}
                >
                  #{hole.index}
                </Typography>
              )}
            </Box>
          ))}
          <Box sx={{ ...totalCellSx, ...headerCellSx }}>
            <Typography
              sx={{
                fontFamily: fontFamilies.bodySemiBold,
                fontSize: 12,
                fontWeight: 600,
                color: colors.accent.gold,
                textTransform: "uppercase",
              }}
            >
              Total
            </Typography>
          </Box>
        </Box>

        {/* Par Row */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            borderBottom: "2px solid #000000",
          }}
        >
          <Box sx={{ ...playerNameCellSx, ...parRowSx }}>
            <Typography
              sx={{
                fontFamily: fontFamilies.mono,
                fontSize: 12,
                color: colors.text.secondary,
              }}
            >
              Par
            </Typography>
          </Box>
          {sortedHoles.map((hole) => (
            <Box key={hole.id} sx={{ ...holeCellSx, ...parRowSx }}>
              <Typography
                sx={{
                  fontFamily: fontFamilies.mono,
                  fontSize: 12,
                  color: colors.text.secondary,
                }}
              >
                {hole.par}
              </Typography>
            </Box>
          ))}
          <Box sx={{ ...totalCellSx, ...parRowSx }}>
            <Typography
              sx={{
                fontFamily: fontFamilies.mono,
                fontSize: 12,
                color: colors.text.secondary,
              }}
            >
              {getTotalPar(sortedHoles)}
            </Typography>
          </Box>
        </Box>

        {/* Player Rows */}
        {players.map((player, playerIndex) => {
          const totalStrokes = getTotalStrokes(player.id, sortedHoles);
          const totalPar = getTotalPar(sortedHoles);
          const scoreToPar = totalStrokes - totalPar;

          return (
            <Box
              key={player.id}
              sx={{
                display: "flex",
                flexDirection: "row",
                borderBottom: "2px solid #000000",
                ...(playerIndex % 2 === 0 && {
                  backgroundColor: colors.glass.light,
                }),
              }}
            >
              <Box sx={playerNameCellSx}>
                <Typography
                  noWrap
                  sx={{
                    fontFamily: fontFamilies.bodySemiBold,
                    fontSize: 13,
                    fontWeight: 600,
                    color: colors.text.primary,
                  }}
                >
                  {player.name}
                </Typography>
              </Box>

              {sortedHoles.map((hole) => {
                const strokes = getStrokesForHole(player.id, hole.id);
                const isBlank = strokes === null;
                const holePar = hole.par;
                const strokesToPar = isBlank ? 0 : strokes - holePar;

                let badgeBg = colors.surfaces.level1;
                let badgeBorder = colors.border.light;
                let textColor = colors.text.primary;

                if (!isBlank && strokesToPar < 0) {
                  badgeBg = colors.scoring.birdie + "20";
                  badgeBorder = colors.scoring.birdie;
                  textColor = colors.scoring.birdie;
                } else if (!isBlank && strokesToPar > 0) {
                  badgeBg = colors.scoring.negative + "20";
                  badgeBorder = colors.scoring.negative;
                  textColor = colors.scoring.negative;
                }

                return (
                  <Box key={hole.id} sx={holeCellSx}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        backgroundColor: badgeBg,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        border: `1px solid ${badgeBorder}`,
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: fontFamilies.monoBold,
                          fontSize: 14,
                          fontWeight: 700,
                          color: textColor,
                        }}
                      >
                        {isBlank ? "-" : strokes}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}

              <Box sx={totalCellSx}>
                <Typography
                  component="span"
                  sx={{
                    fontFamily: fontFamilies.monoBold,
                    fontSize: 16,
                    fontWeight: 700,
                    color: colors.text.primary,
                  }}
                >
                  {totalStrokes}
                  {scoreToPar !== 0 && (
                    <Typography
                      component="span"
                      sx={{
                        fontSize: 12,
                        fontFamily: fontFamilies.mono,
                        color:
                          scoreToPar < 0
                            ? colors.scoring.positive
                            : scoreToPar > 0
                              ? colors.scoring.negative
                              : colors.text.primary,
                      }}
                    >
                      {" "}
                      ({scoreToPar > 0 ? "+" : ""}
                      {scoreToPar})
                    </Typography>
                  )}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
