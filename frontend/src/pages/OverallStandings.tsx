import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useParams, useNavigate } from "react-router-dom";
import { dataService } from "../services/DataService";
import { Hole, Score, Player, Game } from "../types";
import { typography, fontFamilies, spacing, borderRadius } from "../theme";
import { useThemedColors } from "../contexts/ThemeContext";
import { ScoreCalculator } from "../utils/scoreCalculator";

export const OverallStandingsPage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const colors = useThemedColors();

  const [game, setGame] = useState<Game | null>(null);
  const [holes, setHoles] = useState<Hole[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!gameId) return;
    try {
      setLoading(true);

      const [gameData, holesData, scoresData] = await Promise.all([
        dataService.getGame(gameId),
        dataService.getHolesForGame(gameId),
        dataService.getScoresForGame(gameId),
      ]);

      if (gameData) {
        setGame(gameData);
        setHoles(holesData);
        setScores(scoresData);
        const playersList = await dataService.getPlayersForGame(gameData);
        setPlayers(playersList);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading standings data:", error);
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getScoresByHoleId = () => {
    const byHole: Record<string, Score[]> = {};
    const seen = new Set<string>();

    scores.forEach((score) => {
      const key = `${score.holeId}_${score.playerId}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (!byHole[score.holeId]) byHole[score.holeId] = [];
      byHole[score.holeId].push(score);
    });
    return byHole;
  };

  const getTotalPoints = () => {
    return ScoreCalculator.calculateTotalPoints(
      holes,
      getScoresByHoleId(),
      players,
      game?.handicaps,
    );
  };

  if (loading || players.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: colors.background.primary,
        }}
      >
        <CircularProgress sx={{ color: colors.accent.gold }} />
        <Typography
          sx={{
            ...typography.bodyMedium,
            color: colors.text.secondary,
            ml: `${spacing.md}px`,
          }}
        >
          Loading...
        </Typography>
      </Box>
    );
  }

  const totalPoints = getTotalPoints();
  const sortedPlayers = [...players].sort(
    (a, b) => (totalPoints[b.id] || 0) - (totalPoints[a.id] || 0),
  );
  const leader = sortedPlayers[0];
  const leaderPoints = totalPoints[leader.id] || 0;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: colors.background.primary,
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          px: `${spacing.xl}px`,
          pt: `${spacing.xxxl}px`,
          pb: `${spacing.xxl}px`,
        }}
      >
        {/* Hero */}
        <Box sx={{ mb: `${spacing.xl}px` }}>
          <Typography
            sx={{
              ...typography.label,
              color: colors.text.tertiary,
              textTransform: "uppercase",
              mb: `${spacing.sm}px`,
            }}
          >
            Leaderboard
          </Typography>
          <Typography
            sx={{
              ...typography.displayMedium,
              color: colors.text.primary,
              mb: `${spacing.md}px`,
            }}
          >
            Overall standings
          </Typography>
          <Box
            sx={{
              height: 1.5,
              width: 48,
              bgcolor: colors.accent.gold,
              borderRadius: "1px",
              mb: `${spacing.md}px`,
            }}
          />
          <Typography
            sx={{
              ...typography.bodyLarge,
              color: colors.text.secondary,
              maxWidth: 340,
            }}
          >
            Cumulative points across every hole played.
          </Typography>
        </Box>

        {/* Leader Card */}
        <Box
          sx={{
            bgcolor: colors.background.card,
            borderRadius: `${borderRadius.xl}px`,
            p: `${spacing.xl}px`,
            border: `1px solid ${colors.border.goldSubtle}`,
            mb: `${spacing.xl}px`,
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              ...typography.label,
              color: colors.accent.gold,
              textTransform: "uppercase",
              mb: `${spacing.sm}px`,
              letterSpacing: 1.2,
            }}
          >
            Current leader
          </Typography>
          <Typography
            sx={{
              fontFamily: fontFamilies.display,
              fontSize: 28,
              color: colors.text.primary,
              letterSpacing: -0.5,
              mb: `${spacing.sm}px`,
            }}
          >
            {leader.name}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: `${spacing.xs}px`,
            }}
          >
            <Typography
              sx={{
                fontFamily: fontFamilies.monoBold,
                fontSize: 44,
                color:
                  leaderPoints > 0
                    ? colors.scoring.positive
                    : leaderPoints < 0
                      ? colors.scoring.negative
                      : colors.text.primary,
                letterSpacing: -0.5,
              }}
            >
              {leaderPoints > 0 ? "+" : ""}
              {leaderPoints.toFixed(1)}
            </Typography>
            <Typography
              sx={{
                fontFamily: fontFamilies.mono,
                fontSize: typography.bodyMedium.fontSize,
                color: colors.text.tertiary,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              pts
            </Typography>
          </Box>
        </Box>

        {/* Full Standings */}
        <Typography
          sx={{
            ...typography.label,
            color: colors.text.tertiary,
            textTransform: "uppercase",
            mb: `${spacing.sm}px`,
          }}
        >
          Full standings
        </Typography>
        <Box
          sx={{
            bgcolor: colors.background.card,
            borderRadius: `${borderRadius.xl}px`,
            border: `1px solid ${colors.border.light}`,
            overflow: "hidden",
          }}
        >
          {sortedPlayers.map((player, index) => {
            const points = totalPoints[player.id] || 0;
            const isLeader = index === 0;
            const isLast = index === sortedPlayers.length - 1;

            return (
              <Box
                key={player.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: `${spacing.md}px`,
                  px: `${spacing.lg}px`,
                  gap: `${spacing.md}px`,
                  borderBottom: !isLast
                    ? `1px solid ${colors.border.light}`
                    : "none",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: fontFamilies.display,
                    fontSize: 20,
                    color: isLeader
                      ? colors.accent.gold
                      : colors.text.tertiary,
                    width: 24,
                    letterSpacing: -0.3,
                  }}
                >
                  {index + 1}
                </Typography>
                <Typography
                  sx={{
                    ...typography.bodyLarge,
                    fontFamily: fontFamilies.bodySemiBold,
                    color: isLeader
                      ? colors.accent.gold
                      : colors.text.primary,
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {player.name}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: fontFamilies.monoBold,
                    fontSize: typography.h4.fontSize,
                    color:
                      points > 0
                        ? colors.scoring.positive
                        : points < 0
                          ? colors.scoring.negative
                          : colors.text.primary,
                    letterSpacing: 0.3,
                    minWidth: 64,
                    textAlign: "right",
                  }}
                >
                  {points > 0 ? "+" : ""}
                  {points.toFixed(1)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Bottom Button */}
      <Box
        sx={{
          p: `${spacing.lg}px`,
          pb: `${spacing.xl}px`,
          bgcolor: colors.background.primary,
          borderTop: `1px solid ${colors.border.light}`,
        }}
      >
        <Button
          fullWidth
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{
            py: 1.5,
            bgcolor: colors.accent.gold,
            color: colors.text.inverse,
            fontFamily: fontFamilies.bodySemiBold,
            fontWeight: 600,
            fontSize: typography.button.fontSize,
            borderRadius: "9999px",
            textTransform: "none",
            "&:hover": {
              bgcolor: colors.accent.goldDark,
            },
          }}
        >
          Back to scoring
        </Button>
      </Box>
    </Box>
  );
};

export default OverallStandingsPage;
