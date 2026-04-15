import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SummarizeOutlinedIcon from "@mui/icons-material/SummarizeOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import HistoryIcon from "@mui/icons-material/History";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate } from "react-router-dom";
import { crossPlatformAlert } from "../utils/alert";
import { dataService } from "../services/DataService";
import { useStore } from "../store";
import { typography, fontFamilies, spacing, borderRadius } from "../theme";
import { useThemedColors } from "../contexts/ThemeContext";
import { Game, Player } from "../types";
import { ScoreCalculator } from "../utils/scoreCalculator";

interface GameWithDetails {
  game: Game;
  players: Player[];
  winner: Player | null;
  finalPoints: Record<string, number>;
  totalStrokes: Record<string, number>;
}

export const GameHistoryPage = () => {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const colors = useThemedColors();
  const [games, setGames] = useState<Game[]>([]);
  const [gamesWithDetails, setGamesWithDetails] = useState<GameWithDetails[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuGameId, setMenuGameId] = useState<string | null>(null);

  const loadGames = useCallback(async () => {
    if (!user || !(user as any).uid) {
      setLoading(false);
      return;
    }

    try {
      await dataService.deleteGamesOlderThan((user as any).uid, 14);
      await dataService.enforceGameLimit((user as any).uid, 5);

      const allGames = await dataService.getGamesForUser((user as any).uid);
      const completedGames = allGames
        .filter((game) => game.status === "completed")
        .sort((a, b) => {
          const aTime = a.completedAt?.getTime() || 0;
          const bTime = b.completedAt?.getTime() || 0;
          return bTime - aTime;
        })
        .slice(0, 5);

      setGames(completedGames);
    } catch (error) {
      console.error("Failed to load games:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  useEffect(() => {
    const loadGameDetails = async () => {
      const detailsPromises = games.map(async (game) => {
        const details = await dataService.getGameWithDetails(game.id);
        if (!details) return null;

        const { players, holes, scores } = details;

        const finalPoints: Record<string, number> = {};
        const totalStrokes: Record<string, number> = {};
        game.playerIds.forEach((playerId) => {
          finalPoints[playerId] = 0;
          totalStrokes[playerId] = 0;
        });

        holes.forEach((hole) => {
          const holeScores = scores.filter((s) => s.holeId === hole.id);
          const holePoints = ScoreCalculator.calculateHolePoints(
            hole,
            holeScores,
            players,
            game.handicaps,
          );

          Object.keys(holePoints).forEach((playerId) => {
            finalPoints[playerId] =
              (finalPoints[playerId] || 0) + holePoints[playerId];
          });

          game.playerIds.forEach((playerId) => {
            const score = holeScores.find((s) => s.playerId === playerId);
            totalStrokes[playerId] += score?.strokes ?? hole.par;
          });
        });

        let winner: Player | null = null;
        let maxPoints = -Infinity;

        players.forEach((player) => {
          const points = finalPoints[player.id];
          if (points > maxPoints) {
            maxPoints = points;
            winner = player;
          }
        });

        const result: GameWithDetails = {
          game,
          players,
          winner,
          finalPoints,
          totalStrokes,
        };
        return result;
      });

      const results = await Promise.all(detailsPromises);
      setGamesWithDetails(
        results.filter((r): r is GameWithDetails => r !== null),
      );
    };

    if (games.length > 0) {
      loadGameDetails();
    } else {
      setGamesWithDetails([]);
    }
  }, [games]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGames();
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    gameId: string,
  ) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuGameId(gameId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuGameId(null);
  };

  const handleViewSummary = (gameId: string) => {
    handleMenuClose();
    navigate(`/game/summary/${gameId}`);
  };

  const handleEditScores = (gameId: string) => {
    handleMenuClose();
    navigate(`/game/scoring/${gameId}?edit=true`);
  };

  const handleDeleteGame = async (gameId: string, gameDateText: string) => {
    handleMenuClose();
    crossPlatformAlert(
      "Delete game",
      `Are you sure you want to delete the game from ${gameDateText}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await dataService.deleteGame(gameId);
              if (user) {
                const allGames = await dataService.getGamesForUser(
                  (user as any).uid,
                );
                const completedGames = allGames
                  .filter((game) => game.status === "completed")
                  .sort((a, b) => {
                    const aTime = a.completedAt?.getTime() || 0;
                    const bTime = b.completedAt?.getTime() || 0;
                    return bTime - aTime;
                  })
                  .slice(0, 5);
                setGames(completedGames);
              }
            } catch (error) {
              console.error("Failed to delete game:", error);
              crossPlatformAlert("Error", "Failed to delete game");
            }
          },
        },
      ],
    );
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
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
            mt: `${spacing.md}px`,
          }}
        >
          Loading games...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100%",
        bgcolor: colors.background.primary,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: `${spacing.xl}px`,
          pt: `${spacing.xxxl}px`,
          pb: `${spacing.lg}px`,
        }}
      >
        <Typography
          sx={{
            ...typography.label,
            color: colors.text.tertiary,
            textTransform: "uppercase",
            mb: `${spacing.sm}px`,
          }}
        >
          Archive
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Typography
            sx={{
              ...typography.displayMedium,
              color: colors.text.primary,
              mb: `${spacing.md}px`,
            }}
          >
            Game history
          </Typography>
          <IconButton
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ color: colors.text.tertiary, mt: -0.5 }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
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
          }}
        >
          Your last five completed rounds
        </Typography>
      </Box>

      {/* Content */}
      <Box
        sx={{
          px: `${spacing.xl}px`,
          pb: `${spacing.xxl}px`,
        }}
      >
        {gamesWithDetails.length === 0 ? (
          /* Empty state */
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: `${spacing.xl}px`,
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                bgcolor: colors.surfaces.level2,
                border: `1px solid ${colors.border.goldSubtle}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: `${spacing.lg}px`,
              }}
            >
              <HistoryIcon sx={{ fontSize: 32, color: colors.accent.gold }} />
            </Box>
            <Typography
              sx={{
                ...typography.h2,
                fontFamily: fontFamilies.display,
                color: colors.text.primary,
                mb: `${spacing.sm}px`,
                textAlign: "center",
                letterSpacing: -0.5,
              }}
            >
              No games yet
            </Typography>
            <Typography
              sx={{
                ...typography.bodyLarge,
                color: colors.text.secondary,
                textAlign: "center",
              }}
            >
              Complete a game to see your history here
            </Typography>
          </Box>
        ) : (
          /* Game cards */
          gamesWithDetails.map((item) => {
            const { game, players, winner, finalPoints, totalStrokes } = item;
            const gameDateText = game.completedAt
              ? formatDate(game.completedAt)
              : formatDate(game.date);
            const sortedPlayers = [...players].sort(
              (a, b) => (finalPoints[b.id] || 0) - (finalPoints[a.id] || 0),
            );

            return (
              <Box
                key={game.id}
                onClick={() => handleViewSummary(game.id)}
                sx={{
                  bgcolor: colors.background.card,
                  borderRadius: `${borderRadius.xl}px`,
                  p: `${spacing.lg}px`,
                  mb: `${spacing.md}px`,
                  border: `1px solid ${colors.border.light}`,
                  cursor: "pointer",
                  transition: "border-color 200ms ease",
                  "&:hover": {
                    borderColor: colors.border.medium,
                  },
                }}
              >
                {/* Card header */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: `${spacing.md}px`,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        ...typography.label,
                        color: colors.text.tertiary,
                        textTransform: "uppercase",
                        mb: `${spacing.xs}px`,
                      }}
                    >
                      Completed
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: fontFamilies.display,
                        fontSize: 22,
                        color: colors.text.primary,
                        letterSpacing: -0.4,
                        mb: `${spacing.sm}px`,
                      }}
                    >
                      {gameDateText}
                    </Typography>
                    {winner && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: `${spacing.xs}px`,
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            bgcolor: colors.accent.gold,
                          }}
                        />
                        <Typography
                          sx={{
                            ...typography.label,
                            color: colors.text.tertiary,
                            textTransform: "uppercase",
                          }}
                        >
                          Champion
                        </Typography>
                        <Typography
                          sx={{
                            ...typography.bodySmall,
                            fontFamily: fontFamilies.bodySemiBold,
                            color: colors.accent.gold,
                            ml: `${spacing.xs}px`,
                          }}
                        >
                          {winner.name}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, game.id)}
                    sx={{
                      color: colors.text.secondary,
                      p: `${spacing.xs}px`,
                    }}
                  >
                    <MoreVertIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Box>

                {/* Divider */}
                <Box
                  sx={{
                    height: 1,
                    bgcolor: colors.border.light,
                    mb: `${spacing.md}px`,
                  }}
                />

                {/* Final scores */}
                <Typography
                  sx={{
                    ...typography.label,
                    color: colors.text.tertiary,
                    textTransform: "uppercase",
                    mb: `${spacing.sm}px`,
                  }}
                >
                  Final scores
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: `${spacing.xs}px`,
                    mb: `${spacing.md}px`,
                  }}
                >
                  {sortedPlayers.map((player, idx) => {
                    const points = finalPoints[player.id] || 0;
                    const strokes = totalStrokes[player.id] || 0;
                    const isWinner = player.id === winner?.id;

                    return (
                      <Box
                        key={player.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          py: `${spacing.xs}px`,
                          gap: `${spacing.sm}px`,
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: fontFamilies.display,
                            fontSize: 16,
                            color: colors.text.tertiary,
                            width: 20,
                            letterSpacing: -0.2,
                          }}
                        >
                          {idx + 1}
                        </Typography>
                        <Typography
                          sx={{
                            ...typography.bodyMedium,
                            fontFamily: fontFamilies.bodySemiBold,
                            color: isWinner
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
                            fontFamily: fontFamilies.mono,
                            fontSize: typography.bodySmall.fontSize,
                            color: colors.text.tertiary,
                            letterSpacing: 0.3,
                            minWidth: 32,
                            textAlign: "right",
                          }}
                        >
                          {strokes}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: fontFamilies.monoBold,
                            fontSize: typography.bodyMedium.fontSize,
                            color:
                              points > 0
                                ? colors.scoring.positive
                                : points < 0
                                  ? colors.scoring.negative
                                  : colors.text.primary,
                            minWidth: 44,
                            textAlign: "right",
                            letterSpacing: 0.3,
                          }}
                        >
                          {points > 0 ? "+" : ""}
                          {points}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

                {/* View summary link */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: `${spacing.xs}px`,
                    pt: `${spacing.sm}px`,
                    borderTop: `1px solid ${colors.border.light}`,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: fontFamilies.bodySemiBold,
                      fontSize: typography.bodySmall.fontSize,
                      color: colors.accent.gold,
                      letterSpacing: 0.3,
                    }}
                  >
                    View full summary
                  </Typography>
                  <ArrowForwardIcon
                    sx={{ fontSize: 14, color: colors.accent.gold }}
                  />
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      {/* Context menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl) && Boolean(menuGameId)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              bgcolor: colors.background.card,
              borderRadius: `${borderRadius.md}px`,
              minWidth: 180,
              border: `1px solid ${colors.border.light}`,
            },
          },
        }}
      >
        <MenuItem onClick={() => menuGameId && handleViewSummary(menuGameId)}>
          <ListItemIcon>
            <SummarizeOutlinedIcon
              sx={{ color: colors.text.secondary, fontSize: 20 }}
            />
          </ListItemIcon>
          <ListItemText
            primary="View summary"
            slotProps={{
              primary: {
                sx: {
                  fontFamily: fontFamilies.body,
                  fontSize: typography.bodyMedium.fontSize,
                  color: colors.text.primary,
                },
              },
            }}
          />
        </MenuItem>
        <MenuItem onClick={() => menuGameId && handleEditScores(menuGameId)}>
          <ListItemIcon>
            <EditOutlinedIcon
              sx={{ color: colors.text.secondary, fontSize: 20 }}
            />
          </ListItemIcon>
          <ListItemText
            primary="Edit scores"
            slotProps={{
              primary: {
                sx: {
                  fontFamily: fontFamilies.body,
                  fontSize: typography.bodyMedium.fontSize,
                  color: colors.text.primary,
                },
              },
            }}
          />
        </MenuItem>
        <Divider sx={{ borderColor: colors.border.light }} />
        <MenuItem
          onClick={() => {
            if (!menuGameId) return;
            const item = gamesWithDetails.find((g) => g.game.id === menuGameId);
            const dateText = item?.game.completedAt
              ? formatDate(item.game.completedAt)
              : item?.game.date
                ? formatDate(item.game.date)
                : "this date";
            handleDeleteGame(menuGameId, dateText);
          }}
        >
          <ListItemIcon>
            <DeleteOutlineIcon
              sx={{ color: colors.scoring.negative, fontSize: 20 }}
            />
          </ListItemIcon>
          <ListItemText
            primary="Delete"
            primaryTypographyProps={{
              sx: {
                fontFamily: fontFamilies.body,
                fontSize: typography.bodyMedium.fontSize,
                color: colors.scoring.negative,
              },
            }}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default GameHistoryPage;
