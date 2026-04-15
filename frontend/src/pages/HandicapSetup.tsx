import React, { useState, useEffect } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import {
  Add as AddIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { crossPlatformAlert } from "../utils/alert";
import { dataService } from "../services/DataService";
import { useThemedColors } from "../contexts/ThemeContext";
import { typography, fontFamilies, spacing, borderRadius } from "../theme";
import { Player, Game } from "../types";
import {
  setHandicapForPair,
  getHandicapForMatchup,
} from "../utils/handicapUtils";

export const HandicapSetupPage = () => {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  const colors = useThemedColors();

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [handicaps, setHandicaps] = useState<{
    [pairKey: string]: { [holeNumber: string]: number };
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (gameId) loadData();
  }, [gameId]);

  const loadData = async () => {
    try {
      const gameData = await dataService.getGame(gameId!);
      if (gameData) {
        setGame(gameData);
        setHandicaps(gameData.handicaps || {});
        const playerData = await dataService.getPlayersForGame(gameData);
        setPlayers(playerData);
      }
      setLoading(false);
    } catch (error) {
      crossPlatformAlert("Error", "Failed to load game data");
      setLoading(false);
    }
  };

  const updateHandicap = (
    fromPlayerId: string,
    toPlayerId: string,
    strokes: number,
  ) => {
    const newHandicaps = setHandicapForPair(
      handicaps,
      fromPlayerId,
      toPlayerId,
      strokes,
    );
    setHandicaps(newHandicaps);
  };

  const saveHandicaps = async () => {
    try {
      await dataService.updateGame(gameId!, { handicaps });
      crossPlatformAlert("Success", "Handicaps saved successfully", [
        { text: "OK", onPress: () => navigate(-1) },
      ]);
    } catch (error) {
      crossPlatformAlert("Error", "Failed to save handicaps");
    }
  };

  const getPlayerPairs = (): Array<{ player1: Player; player2: Player }> => {
    const pairs: Array<{ player1: Player; player2: Player }> = [];
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        pairs.push({ player1: players[i], player2: players[j] });
      }
    }
    return pairs;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          bgcolor: colors.background.primary,
        }}
      >
        <CircularProgress sx={{ color: colors.accent.gold }} />
      </Box>
    );
  }

  const pairs = getPlayerPairs();

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
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
            Pre-match
          </Typography>
          <Typography
            sx={{
              ...typography.displayMedium,
              color: colors.text.primary,
              mb: `${spacing.md}px`,
            }}
          >
            Handicap setup
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
            Set strokes each player receives from their opponents.
          </Typography>
        </Box>

        {/* Pair cards */}
        {pairs.map(({ player1, player2 }) => {
          const currentHandicap = getHandicapForMatchup(
            handicaps,
            player1.id,
            player2.id,
          );
          const player1Receives = currentHandicap > 0;
          const player2Receives = currentHandicap < 0;
          const strokeCount = Math.abs(currentHandicap);

          return (
            <Card
              key={`${player1.id}_${player2.id}`}
              sx={{ mb: `${spacing.md}px`, p: `${spacing.lg}px` }}
            >
              {/* Pair header */}
              <Box
                sx={{
                  mb: `${spacing.md}px`,
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    ...typography.h3,
                    color: colors.text.primary,
                    textAlign: "center",
                  }}
                >
                  {player1.name}
                  <Typography
                    component="span"
                    sx={{
                      ...typography.label,
                      color: colors.accent.gold,
                      textTransform: "uppercase",
                      mx: `${spacing.xs}px`,
                    }}
                  >
                    {" "}
                    vs{" "}
                  </Typography>
                  {player2.name}
                </Typography>
              </Box>

              {/* Handicap controls */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-around",
                  alignItems: "center",
                  mt: `${spacing.sm}px`,
                }}
              >
                {/* Player 1 column */}
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    sx={{
                      ...typography.bodyMedium,
                      fontFamily: fontFamilies.bodySemiBold,
                      fontWeight: 600,
                      color: colors.text.primary,
                      textAlign: "center",
                    }}
                  >
                    {player1.name}
                  </Typography>
                  <Typography
                    sx={{
                      ...typography.label,
                      color: colors.text.tertiary,
                      textTransform: "uppercase",
                      mb: `${spacing.sm}px`,
                    }}
                  >
                    receives
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: `${spacing.md}px`,
                    }}
                  >
                    <Box
                      onClick={() => {
                        const current = player1Receives ? strokeCount : 0;
                        if (current > 0) {
                          updateHandicap(
                            player2.id,
                            player1.id,
                            current - 1,
                          );
                        }
                      }}
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: `1px solid ${colors.border.goldSubtle}`,
                        bgcolor: colors.background.card,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor:
                          !player1Receives || strokeCount === 0
                            ? "default"
                            : "pointer",
                        opacity:
                          !player1Receives || strokeCount === 0 ? 0.4 : 1,
                        transition: "all 0.12s ease",
                      }}
                    >
                      <RemoveIcon
                        sx={{ fontSize: 16, color: colors.text.primary }}
                      />
                    </Box>

                    <Typography
                      sx={{
                        fontFamily: fontFamilies.display,
                        fontSize: 32,
                        color:
                          player1Receives && strokeCount > 0
                            ? colors.accent.gold
                            : colors.text.tertiary,
                        minWidth: 32,
                        textAlign: "center",
                        letterSpacing: "-0.5px",
                      }}
                    >
                      {player1Receives ? strokeCount : 0}
                    </Typography>

                    <Box
                      onClick={() => {
                        const current = player1Receives ? strokeCount : 0;
                        if (current < 2) {
                          updateHandicap(
                            player2.id,
                            player1.id,
                            current + 1,
                          );
                        }
                      }}
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: `1px solid ${colors.border.goldSubtle}`,
                        bgcolor: colors.background.card,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor:
                          player1Receives && strokeCount >= 2
                            ? "default"
                            : "pointer",
                        opacity:
                          player1Receives && strokeCount >= 2 ? 0.4 : 1,
                        transition: "all 0.12s ease",
                      }}
                    >
                      <AddIcon
                        sx={{ fontSize: 16, color: colors.text.primary }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Vertical rule */}
                <Box
                  sx={{
                    width: 1,
                    alignSelf: "stretch",
                    bgcolor: colors.border.light,
                    mx: `${spacing.sm}px`,
                  }}
                />

                {/* Player 2 column */}
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    sx={{
                      ...typography.bodyMedium,
                      fontFamily: fontFamilies.bodySemiBold,
                      fontWeight: 600,
                      color: colors.text.primary,
                      textAlign: "center",
                    }}
                  >
                    {player2.name}
                  </Typography>
                  <Typography
                    sx={{
                      ...typography.label,
                      color: colors.text.tertiary,
                      textTransform: "uppercase",
                      mb: `${spacing.sm}px`,
                    }}
                  >
                    receives
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: `${spacing.md}px`,
                    }}
                  >
                    <Box
                      onClick={() => {
                        const current = player2Receives ? strokeCount : 0;
                        if (current > 0) {
                          updateHandicap(
                            player1.id,
                            player2.id,
                            current - 1,
                          );
                        }
                      }}
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: `1px solid ${colors.border.goldSubtle}`,
                        bgcolor: colors.background.card,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor:
                          !player2Receives || strokeCount === 0
                            ? "default"
                            : "pointer",
                        opacity:
                          !player2Receives || strokeCount === 0 ? 0.4 : 1,
                        transition: "all 0.12s ease",
                      }}
                    >
                      <RemoveIcon
                        sx={{ fontSize: 16, color: colors.text.primary }}
                      />
                    </Box>

                    <Typography
                      sx={{
                        fontFamily: fontFamilies.display,
                        fontSize: 32,
                        color:
                          player2Receives && strokeCount > 0
                            ? colors.accent.gold
                            : colors.text.tertiary,
                        minWidth: 32,
                        textAlign: "center",
                        letterSpacing: "-0.5px",
                      }}
                    >
                      {player2Receives ? strokeCount : 0}
                    </Typography>

                    <Box
                      onClick={() => {
                        const current = player2Receives ? strokeCount : 0;
                        if (current < 2) {
                          updateHandicap(
                            player1.id,
                            player2.id,
                            current + 1,
                          );
                        }
                      }}
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: `1px solid ${colors.border.goldSubtle}`,
                        bgcolor: colors.background.card,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor:
                          player2Receives && strokeCount >= 2
                            ? "default"
                            : "pointer",
                        opacity:
                          player2Receives && strokeCount >= 2 ? 0.4 : 1,
                        transition: "all 0.12s ease",
                      }}
                    >
                      <AddIcon
                        sx={{ fontSize: 16, color: colors.text.primary }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Even text */}
              {strokeCount === 0 && (
                <Typography
                  sx={{
                    ...typography.bodySmall,
                    color: colors.text.tertiary,
                    textAlign: "center",
                    mt: `${spacing.md}px`,
                    fontStyle: "italic",
                  }}
                >
                  Players are even
                </Typography>
              )}
            </Card>
          );
        })}

        {/* Footer spacer */}
        <Box sx={{ height: 80 }} />
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: `${spacing.lg}px`,
          pb: `${spacing.xl}px`,
          bgcolor: colors.background.primary,
          borderTop: `1px solid ${colors.border.light}`,
        }}
      >
        <Button
          title="Save handicaps"
          onPress={saveHandicaps}
          variant="gold"
          fullWidth
          size="large"
        />
      </Box>
    </Box>
  );
};

export default HandicapSetupPage;
