import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Drawer,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CheckCircle as CheckCircleIcon,
  Flag as FlagIcon,
  Whatshot as WhatshotIcon,
  Settings as SettingsIcon,
  DoubleArrow as DoubleArrowIcon,
  Close as CloseIcon,
  DoneAll as DoneAllIcon,
  Restore as RestoreIcon,
} from "@mui/icons-material";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { HandicapModal } from "../components/game/HandicapModal";
import { crossPlatformAlert } from "../utils/alert";
import { dataService } from "../services/DataService";
import { useThemedColors } from "../contexts/ThemeContext";
import { typography, fontFamilies, spacing, borderRadius } from "../theme";
import { Hole, Score, Player, Game } from "../types";
import { ScoreCalculator } from "../utils/scoreCalculator";
import {
  setHandicapForHole,
  getTotalHandicapForMatchup,
  getHandicapForHole,
} from "../utils/handicapUtils";

// Warm-toned, distinct player colors
const PLAYER_COLORS = [
  "#D9715B", // terra cotta
  "#6B8CAE", // slate blue
  "#7A9D6B", // sage green
  "#A67BA0", // dusty plum
  "#D4AF37", // gold fallback
];
const getPlayerColor = (index: number) =>
  PLAYER_COLORS[index % PLAYER_COLORS.length];

export const ScoringPage = () => {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const isEditingFinished = searchParams.get("editing") === "true";
  const colors = useThemedColors();

  const [game, setGame] = useState<Game | null>(null);
  const [holes, setHoles] = useState<Hole[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [handicapModalVisible, setHandicapModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalScores, setOriginalScores] = useState<Score[]>([]);
  const [finishingGame, setFinishingGame] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor: "primary" | "error" | "warning";
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    confirmColor: "primary",
    onConfirm: () => {},
  });

  const pendingUpdatesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loadGameData = async () => {
      if (!gameId) return;
      try {
        const [gameData, holesData, scoresData] = await Promise.all([
          dataService.getGame(gameId),
          dataService.getHolesForGame(gameId),
          dataService.getScoresForGame(gameId),
        ]);

        if (gameData) {
          setGame(gameData);
          setHoles(holesData);
          setScores(scoresData);

          if (isEditingFinished && originalScores.length === 0) {
            setOriginalScores(JSON.parse(JSON.stringify(scoresData)));
          }

          const playersList = await dataService.getPlayersForGame(gameData);
          setPlayers(playersList);
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to load game data:", error);
        setLoading(false);
      }
    };

    loadGameData();
  }, [gameId]);

  const currentHole = holes[currentHoleIndex];

  const updateScore = async (playerId: string, strokes: number) => {
    if (!currentHole || !gameId) return;

    const updateKey = `${currentHole.id}_${playerId}`;
    if (pendingUpdatesRef.current.has(updateKey)) return;

    const existingScore = scores.find(
      (s) => s.holeId === currentHole.id && s.playerId === playerId,
    );

    try {
      pendingUpdatesRef.current.add(updateKey);
      navigator.vibrate?.(10);
      await dataService.upsertScore({
        holeId: currentHole.id,
        playerId,
        gameId,
        strokes,
        handicap: 0,
        isUp: existingScore?.isUp || false,
        isBurn: existingScore?.isBurn || false,
        multiplier: existingScore?.multiplier || 1,
      });

      const updatedScores = await dataService.getScoresForGame(gameId);
      setScores(updatedScores);

      if (isEditingFinished) {
        setHasChanges(true);
      }
    } catch (error) {
      crossPlatformAlert("Error", "Failed to update score");
    } finally {
      pendingUpdatesRef.current.delete(updateKey);
    }
  };

  const setPlayerMultiplier = async (playerId: string, multiplier: number) => {
    if (!currentHole || !gameId) return;

    const updateKey = `${currentHole.id}_${playerId}`;
    if (pendingUpdatesRef.current.has(updateKey)) return;

    const existingScore = scores.find(
      (s) => s.holeId === currentHole.id && s.playerId === playerId,
    );

    const currentMultiplier = existingScore?.multiplier || 1;
    const newMultiplier = currentMultiplier === multiplier ? 1 : multiplier;

    try {
      pendingUpdatesRef.current.add(updateKey);
      navigator.vibrate?.(10);
      await dataService.upsertScore({
        holeId: currentHole.id,
        playerId,
        gameId,
        strokes: existingScore?.strokes ?? currentHole.par,
        handicap: 0,
        isUp: false,
        isBurn: false,
        multiplier: newMultiplier,
      });

      const updatedScores = await dataService.getScoresForGame(gameId);
      setScores(updatedScores);

      if (isEditingFinished) {
        setHasChanges(true);
      }
    } catch (error) {
      crossPlatformAlert("Error", "Failed to set multiplier");
    } finally {
      pendingUpdatesRef.current.delete(updateKey);
    }
  };

  const handleSaveChanges = () => {
    crossPlatformAlert("Save Changes", "Your changes have been saved.", [
      {
        text: "OK",
        onPress: () => navigate("/history"),
      },
    ]);
  };

  const handleDiscardChanges = () => {
    if (!hasChanges) {
      navigate("/history");
      return;
    }

    crossPlatformAlert(
      "Discard Changes",
      "Are you sure you want to discard all changes?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            for (const originalScore of originalScores) {
              await dataService.upsertScore(originalScore);
            }
            navigate("/history");
          },
        },
      ],
    );
  };

  const getPlayerScore = (playerId: string): number => {
    const score = scores.find(
      (s) => s.holeId === currentHole?.id && s.playerId === playerId,
    );
    if (score === undefined) {
      return currentHole?.par || 4;
    }
    return score.strokes;
  };

  const getScoresByHoleId = () => {
    const byHole: Record<string, Score[]> = {};
    const seenPlayerHoles = new Set<string>();

    scores.forEach((score) => {
      const playerHoleKey = `${score.holeId}_${score.playerId}`;
      if (seenPlayerHoles.has(playerHoleKey)) return;
      seenPlayerHoles.add(playerHoleKey);
      if (!byHole[score.holeId]) byHole[score.holeId] = [];
      byHole[score.holeId].push(score);
    });
    return byHole;
  };

  const isCompactLayout = players.length === 4;

  const openHandicapModal = (player: Player) => {
    setSelectedPlayer(player);
    setHandicapModalVisible(true);
  };

  const closeHandicapModal = () => {
    setHandicapModalVisible(false);
    setSelectedPlayer(null);
  };

  const updateHandicap = async (
    holeNumber: number,
    fromPlayerId: string,
    toPlayerId: string,
    strokes: number,
  ) => {
    if (!game || !gameId) return;

    const newHandicaps = setHandicapForHole(
      game.handicaps || {},
      holeNumber,
      fromPlayerId,
      toPlayerId,
      strokes,
    );

    try {
      await dataService.updateGame(gameId, { handicaps: newHandicaps });
      setGame({ ...game, handicaps: newHandicaps });
    } catch (error) {
      crossPlatformAlert("Error", "Failed to update handicap");
    }
  };

  const batchUpdateHandicaps = async (
    updates: Array<{
      holeNumber: number;
      fromPlayerId: string;
      toPlayerId: string;
      strokes: number;
    }>,
  ) => {
    if (!game || !gameId || updates.length === 0) return;

    let newHandicaps = game.handicaps || {};
    for (const u of updates) {
      newHandicaps = setHandicapForHole(
        newHandicaps,
        u.holeNumber,
        u.fromPlayerId,
        u.toPlayerId,
        u.strokes,
      );
    }

    try {
      await dataService.updateGame(gameId, { handicaps: newHandicaps });
      setGame({ ...game, handicaps: newHandicaps });
    } catch (error) {
      crossPlatformAlert("Error", "Failed to update handicaps");
    }
  };

  const getHandicapSummary = (playerId: string): string => {
    if (!game?.handicaps || !currentHole) return "Select handicaps";

    const opponents = players.filter((p) => p.id !== playerId);

    const totalGivenOnHole = opponents.reduce((sum, opp) => {
      const strokes = getHandicapForHole(
        game.handicaps,
        currentHole.holeNumber,
        playerId,
        opp.id,
      );
      return sum + strokes;
    }, 0);

    const totalReceivedOnHole = opponents.reduce((sum, opp) => {
      const strokes = getHandicapForHole(
        game.handicaps,
        currentHole.holeNumber,
        opp.id,
        playerId,
      );
      return sum + strokes;
    }, 0);

    if (totalGivenOnHole > 0) {
      return `Giving ${totalGivenOnHole}`;
    } else if (totalReceivedOnHole > 0) {
      return `Receiving ${totalReceivedOnHole}`;
    }
    return "Even";
  };

  const goToNextHoleOnly = () => {
    setCurrentHoleIndex(Math.min(holes.length - 1, currentHoleIndex + 1));
  };

  const completeCurrentHole = async () => {
    if (!currentHole) return;

    try {
      await dataService.updateHole(currentHole.id, { confirmed: true });
      const updatedHoles = await dataService.getHolesForGame(gameId!);
      setHoles(updatedHoles);

      // Auto-advance to next hole if one exists
      if (currentHoleIndex < updatedHoles.length - 1) {
        setCurrentHoleIndex(currentHoleIndex + 1);
      }
    } catch (error) {
      console.error("Error confirming hole:", error);
    }
  };

  const toggleHoleMultiplier = async () => {
    if (!currentHole) return;
    // Locked when 2nd-9 has been applied to this hole
    if (currentHole.second9Applied) return;

    const next = currentHole.holeMultiplier === 2 ? 1 : 2;
    try {
      await dataService.updateHole(currentHole.id, { holeMultiplier: next });
      const updatedHoles = await dataService.getHolesForGame(gameId!);
      setHoles(updatedHoles);
    } catch (error) {
      crossPlatformAlert("Error", "Failed to toggle hole multiplier");
    }
  };

  const activateSecond9 = () => {
    if (!gameId || !game) return;
    if (game.second9Activated) return;

    setConfirmDialog({
      open: true,
      title: "Activate 2x for remaining holes?",
      message:
        "Every currently-incomplete hole will be doubled (x2) for the rest of the game. This can only be undone from Settings.",
      confirmLabel: "Activate",
      confirmColor: "warning",
      onConfirm: async () => {
        try {
          const incompleteHoles = holes.filter((h) => !h.confirmed);
          const holeUpdates = incompleteHoles.map((h) => ({
            holeId: h.id,
            updates: {
              gameId,
              second9Applied: true,
              holeMultiplier: 1,
            },
          }));

          await dataService.batchUpdateHoles(holeUpdates);
          await dataService.updateGame(gameId, { second9Activated: true });

          const [updatedHoles, updatedGame] = await Promise.all([
            dataService.getHolesForGame(gameId),
            dataService.getGame(gameId),
          ]);
          setHoles(updatedHoles);
          if (updatedGame) setGame(updatedGame);
        } catch (error) {
          crossPlatformAlert("Error", "Failed to activate 2nd-9 multiplier");
        }
      },
    });
  };

  const undoSecond9 = () => {
    if (!gameId || !game?.second9Activated) return;

    setConfirmDialog({
      open: true,
      title: "Undo 2x 2nd-9?",
      message:
        "The x2 applied to affected holes will be cleared. Individual holes can then be 2x-toggled normally.",
      confirmLabel: "Undo",
      confirmColor: "warning",
      onConfirm: async () => {
        try {
          const flaggedHoles = holes.filter((h) => h.second9Applied);
          const holeUpdates = flaggedHoles.map((h) => ({
            holeId: h.id,
            updates: {
              gameId,
              second9Applied: false,
            },
          }));

          await dataService.batchUpdateHoles(holeUpdates);
          await dataService.updateGame(gameId, { second9Activated: false });

          const [updatedHoles, updatedGame] = await Promise.all([
            dataService.getHolesForGame(gameId),
            dataService.getGame(gameId),
          ]);
          setHoles(updatedHoles);
          if (updatedGame) setGame(updatedGame);
        } catch (error) {
          crossPlatformAlert("Error", "Failed to undo 2nd-9");
        }
      },
    });
  };

  const completeAllRemainingHoles = () => {
    if (!gameId) return;
    const incomplete = holes.filter((h) => !h.confirmed);
    if (incomplete.length === 0) {
      crossPlatformAlert("Nothing to do", "All holes are already completed.");
      return;
    }

    setConfirmDialog({
      open: true,
      title: `Complete ${incomplete.length} remaining hole${incomplete.length === 1 ? "" : "s"}?`,
      message:
        "Existing scores are preserved. Holes without entered scores will be recorded at par.",
      confirmLabel: "Complete All",
      confirmColor: "primary",
      onConfirm: async () => {
        try {
          const missingScores: Array<{
            holeId: string;
            playerId: string;
            gameId: string;
            strokes: number;
            handicap: number;
            isUp: boolean;
            isBurn: boolean;
          }> = [];
          incomplete.forEach((hole) => {
            players.forEach((player) => {
              const existing = scores.find(
                (s) => s.holeId === hole.id && s.playerId === player.id,
              );
              if (!existing) {
                missingScores.push({
                  holeId: hole.id,
                  playerId: player.id,
                  gameId,
                  strokes: hole.par,
                  handicap: 0,
                  isUp: false,
                  isBurn: false,
                });
              }
            });
          });

          if (missingScores.length > 0) {
            await dataService.batchUpsertScores(missingScores);
          }

          const holeUpdates = incomplete.map((h) => ({
            holeId: h.id,
            updates: { gameId, confirmed: true },
          }));
          await dataService.batchUpdateHoles(holeUpdates);

          const [updatedHoles, updatedScores] = await Promise.all([
            dataService.getHolesForGame(gameId),
            dataService.getScoresForGame(gameId),
          ]);
          setHoles(updatedHoles);
          setScores(updatedScores);
          setSettingsOpen(false);
        } catch (error) {
          crossPlatformAlert("Error", "Failed to complete remaining holes");
        }
      },
    });
  };

  const finishGame = async () => {
    if (finishingGame || !gameId) return;

    setFinishingGame(true);

    const missingScores: Array<{
      holeId: string;
      playerId: string;
      gameId: string;
      strokes: number;
      handicap: number;
      isUp: boolean;
      isBurn: boolean;
    }> = [];

    holes.forEach((hole) => {
      players.forEach((player) => {
        const existingScore = scores.find(
          (s) => s.holeId === hole.id && s.playerId === player.id,
        );

        if (!existingScore) {
          missingScores.push({
            holeId: hole.id,
            playerId: player.id,
            gameId: gameId,
            strokes: hole.par,
            handicap: 0,
            isUp: false,
            isBurn: false,
          });
        }
      });
    });

    try {
      const updatedHoles = await dataService.getHolesForGame(gameId);

      const confirmedMissingScores = missingScores.filter((ms) => {
        const hole = updatedHoles.find((h) => h.id === ms.holeId);
        return hole?.confirmed === true;
      });

      await Promise.all([
        dataService.batchUpsertScores(confirmedMissingScores),
        dataService.completeGame(gameId),
      ]);

      navigate(`/game/summary/${gameId}`);
    } catch (error) {
      console.error("Error finishing game:", error);
      crossPlatformAlert("Error", "Failed to finish game");
      setFinishingGame(false);
    }
  };

  if (loading || players.length === 0) {
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

  if (!currentHole) {
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
        <Typography
          sx={{ ...typography.bodyLarge, color: colors.text.secondary }}
        >
          No holes found
        </Typography>
      </Box>
    );
  }

  const scoresForCurrentHole = scores.filter(
    (s) => s.holeId === currentHole.id,
  );
  const holePoints = ScoreCalculator.calculateHolePoints(
    currentHole,
    scoresForCurrentHole,
    players,
    game?.handicaps,
  );

  const cumulativePoints = ScoreCalculator.calculateTotalPoints(
    holes,
    getScoresByHoleId(),
    players,
    game?.handicaps,
  );

  // Compact sizing helpers
  const cmpCard = isCompactLayout;
  const multiplierPy = cmpCard ? "3px" : `${spacing.sm}px`;
  const multiplierFontSize = cmpCard ? 12 : 15;
  const counterSize = cmpCard ? 34 : 46;
  const strokesFontSize = cmpCard ? 26 : 40;
  const strokesLineHeight = cmpCard ? "30px" : "46px";
  const playerNameFontSize = cmpCard ? 16 : 20;
  const pointsFontSize = cmpCard ? 14 : 20;
  const cardPadding = cmpCard ? "6px" : `${spacing.sm}px`;

  // Hole-wide 2x derived state
  const holeWideActive =
    currentHole.holeMultiplier === 2 || currentHole.second9Applied === true;
  const holeWideLocked = currentHole.second9Applied === true;
  const confirmedHolesCount = holes.filter((h) => h.confirmed).length;
  const showSecond9Button =
    !currentHole.confirmed &&
    confirmedHolesCount >= 9 &&
    !game?.second9Activated;

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: currentHole.confirmed
          ? colors.confirmedHoleBg
          : colors.background.primary,
        transition: "background-color 0.3s ease",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          px: `${spacing.md}px`,
          py: `${spacing.sm}px`,
          bgcolor: currentHole.confirmed
            ? colors.confirmedHoleHeaderBg
            : colors.background.primary,
          borderBottom: currentHole.confirmed
            ? `2px solid ${colors.confirmedHoleBorder}`
            : `1px solid ${colors.border.light}`,
          transition: "background-color 0.3s ease, border-color 0.3s ease",
          gap: `${spacing.xs}px`,
        }}
      >
        {/* Settings button (replaces podium) */}
        <Box
          onClick={() => setSettingsOpen(true)}
          sx={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            bgcolor: colors.background.card,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${colors.border.goldSubtle}`,
            cursor: "pointer",
            transition: "all 0.15s ease",
            flexShrink: 0,
            "&:hover": { borderColor: colors.accent.gold },
          }}
        >
          <SettingsIcon sx={{ fontSize: 18, color: colors.accent.gold }} />
        </Box>

        {/* Center cluster: Hole N + Par + #index (+ COMPLETED pill if confirmed) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: `${spacing.sm}px`,
            flex: 1,
            justifyContent: "center",
            minWidth: 0,
            flexWrap: "wrap",
          }}
        >
          <Typography
            sx={{
              fontFamily: fontFamilies.bodySemiBold,
              fontWeight: 600,
              fontSize: 20,
              color: colors.text.primary,
              letterSpacing: "-0.2px",
              textShadow: holeWideActive
                ? `0 0 8px ${colors.holeWideAccentGlow}`
                : "none",
              transition: "text-shadow 0.2s ease",
            }}
          >
            Hole {currentHole.holeNumber}
            {currentHole.second9Applied && (
              <Typography
                component="sup"
                sx={{
                  fontFamily: fontFamilies.mono,
                  fontSize: 9,
                  color: colors.holeWideAccent,
                  ml: "2px",
                  verticalAlign: "super",
                  letterSpacing: 0,
                }}
              >
                9
              </Typography>
            )}
          </Typography>
          <Box
            sx={{
              px: `${spacing.sm}px`,
              py: "3px",
              borderRadius: `${borderRadius.full}px`,
              border: `1px solid ${colors.border.goldSubtle}`,
              bgcolor: "transparent",
            }}
          >
            <Typography
              sx={{
                fontFamily: fontFamilies.bodySemiBold,
                fontWeight: 600,
                fontSize: 11,
                color: colors.accent.gold,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
              }}
            >
              Par {currentHole.par}
            </Typography>
          </Box>
          {currentHole.index && (
            <Box
              sx={{
                px: `${spacing.sm}px`,
                py: "3px",
                borderRadius: `${borderRadius.full}px`,
                border: `1px solid ${colors.border.light}`,
                bgcolor: "transparent",
              }}
            >
              <Typography
                sx={{
                  fontFamily: fontFamilies.mono,
                  fontSize: 10,
                  color: colors.text.tertiary,
                  letterSpacing: "0.5px",
                }}
              >
                #{currentHole.index}
              </Typography>
            </Box>
          )}
          {currentHole.confirmed && (
            <Box
              sx={{
                px: `${spacing.sm}px`,
                py: "3px",
                borderRadius: `${borderRadius.full}px`,
                bgcolor: colors.confirmedHolePillBg,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 12, color: "#FFFFFF" }} />
              <Typography
                sx={{
                  fontFamily: fontFamilies.bodySemiBold,
                  fontWeight: 700,
                  fontSize: 10,
                  color: "#FFFFFF",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                }}
              >
                Completed
              </Typography>
            </Box>
          )}
        </Box>

        {/* Right cluster: hole-wide 2x toggle, 2nd-9 button, N/total counter */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: `${spacing.xs}px`,
            flexShrink: 0,
          }}
        >
          {/* Hole-wide 2x toggle */}
          <Box
            onClick={holeWideLocked ? undefined : toggleHoleMultiplier}
            sx={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              bgcolor: holeWideActive
                ? colors.holeWideAccent
                : colors.background.card,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${
                holeWideActive
                  ? colors.holeWideAccent
                  : colors.border.goldSubtle
              }`,
              cursor: holeWideLocked ? "not-allowed" : "pointer",
              opacity: holeWideLocked ? 0.85 : 1,
              position: "relative",
              transition: "all 0.15s ease",
              boxShadow: holeWideActive
                ? `0 0 10px ${colors.holeWideAccentGlow}`
                : "none",
              "&:hover": holeWideLocked
                ? undefined
                : {
                    borderColor: colors.holeWideAccent,
                  },
            }}
            title={
              holeWideLocked
                ? "Locked by 2nd-9 multiplier"
                : holeWideActive
                  ? "Hole-wide x2 active. Tap to turn off."
                  : "Apply x2 to every outcome on this hole"
            }
          >
            <Typography
              sx={{
                fontFamily: fontFamilies.monoBold,
                fontWeight: 700,
                fontSize: 15,
                color: holeWideActive ? "#FFFFFF" : colors.holeWideAccent,
                letterSpacing: "-0.5px",
                lineHeight: 1,
              }}
            >
              2x
            </Typography>
            <Box
              sx={{
                position: "absolute",
                bottom: -3,
                right: -3,
                width: 16,
                height: 16,
                borderRadius: "50%",
                bgcolor: holeWideActive ? "#FFFFFF" : colors.background.card,
                border: `1px solid ${colors.holeWideAccent}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <WhatshotIcon
                sx={{
                  fontSize: 11,
                  color: holeWideActive
                    ? colors.holeWideAccent
                    : colors.holeWideAccent,
                }}
              />
            </Box>
          </Box>

          {/* 2nd-9 button (conditional) */}
          {showSecond9Button && (
            <Box
              onClick={activateSecond9}
              sx={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                bgcolor: colors.background.card,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${colors.status.error}`,
                cursor: "pointer",
                position: "relative",
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: colors.status.error,
                  "& .second9-icon": { color: "#FFFFFF" },
                  "& .second9-badge": {
                    bgcolor: "#FFFFFF",
                    color: colors.status.error,
                  },
                },
              }}
              title="Activate x2 for all remaining holes (2nd 9)"
            >
              <DoubleArrowIcon
                className="second9-icon"
                sx={{ fontSize: 18, color: colors.status.error }}
              />
              <Typography
                className="second9-badge"
                sx={{
                  position: "absolute",
                  bottom: -2,
                  right: -4,
                  fontFamily: fontFamilies.monoBold,
                  fontWeight: 700,
                  fontSize: 9,
                  bgcolor: colors.background.card,
                  color: colors.status.error,
                  borderRadius: "8px",
                  px: "3px",
                  lineHeight: 1.2,
                  border: `1px solid ${colors.status.error}`,
                  whiteSpace: "nowrap",
                }}
              >
                9x2
              </Typography>
            </Box>
          )}

          {/* N/total counter */}
          <Box sx={{ minWidth: 36, textAlign: "center" }}>
            <Typography
              sx={{
                fontFamily: fontFamilies.monoMedium,
                fontWeight: 500,
                fontSize: 12,
                color: colors.text.secondary,
                letterSpacing: "0.5px",
              }}
            >
              {currentHoleIndex + 1}/{holes.length}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Fire accent bar for hole-wide 2x */}
      {holeWideActive && (
        <Box
          sx={{
            height: 3,
            width: "100%",
            background: `linear-gradient(90deg, ${colors.holeWideAccent} 0%, ${colors.holeWideAccentGlow} 50%, ${colors.holeWideAccent} 100%)`,
            boxShadow: `0 0 8px ${colors.holeWideAccentGlow}`,
            flexShrink: 0,
          }}
        />
      )}

      {/* Player Cards */}
      <Box
        sx={{
          flex: 1,
          overflow: isCompactLayout && !isEditingFinished ? "hidden" : "auto",
          p: `${spacing.sm}px`,
          ...(isCompactLayout
            ? {
                display: "flex",
                flexDirection: "column",
                pb: `${spacing.xs}px`,
              }
            : {}),
        }}
      >
        {players.map((player, playerIndex) => {
          const strokes = getPlayerScore(player.id);
          const playerScore = scores.find(
            (s) => s.holeId === currentHole?.id && s.playerId === player.id,
          );
          const playerMultiplier = playerScore?.multiplier || 1;
          const playerPts = holePoints[player.id] || 0;
          const playerColor = getPlayerColor(playerIndex);

          // Determine handicap info for this player on this hole
          let givesStrokes = false;
          let receivesStrokes = false;
          if (game?.handicaps && currentHole) {
            players.forEach((opponent) => {
              if (opponent.id !== player.id) {
                const strokesGiven = getHandicapForHole(
                  game.handicaps,
                  currentHole.holeNumber,
                  player.id,
                  opponent.id,
                );
                const strokesReceived = getHandicapForHole(
                  game.handicaps,
                  currentHole.holeNumber,
                  opponent.id,
                  player.id,
                );
                if (strokesGiven > 0) givesStrokes = true;
                if (strokesReceived > 0) receivesStrokes = true;
              }
            });
          }

          return (
            <Box
              key={player.id}
              sx={{
                mb: cmpCard ? "6px" : `${spacing.lg}px`,
                ...(cmpCard ? { flex: 1, minHeight: 0 } : { flexShrink: 0 }),
              }}
            >
              <Card
                goldBorder={playerPts > 0}
                sx={{
                  p: cardPadding,
                  bgcolor: "rgba(212, 175, 55, 0.05)",
                  border: `2px solid ${playerPts > 0 ? colors.border.goldSubtle : playerPts < 0 ? colors.border.light : colors.border.medium}`,
                  borderLeft: `8px solid ${playerColor}`,
                  boxShadow:
                    playerPts > 0
                      ? `0 8px 18px ${colors.shadowColors.gold}`
                      : `0 8px 18px ${colors.shadowColors.default}`,
                  ...(cmpCard
                    ? { flex: 1, justifyContent: "space-between" }
                    : {}),
                }}
              >
                {/* Multiplier Buttons - full-width top row */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    gap: `${spacing.xs}px`,
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: cmpCard ? "4px" : `${spacing.sm}px`,
                  }}
                >
                  {[2, 3, 4].map((mult) => (
                    <Box
                      key={mult}
                      onClick={() => setPlayerMultiplier(player.id, mult)}
                      sx={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        py: multiplierPy,
                        borderRadius: `${borderRadius.full}px`,
                        border: `1px solid ${playerMultiplier === mult ? colors.accent.gold : colors.border.light}`,
                        bgcolor:
                          playerMultiplier === mult
                            ? colors.accent.gold
                            : colors.background.card,
                        cursor: "pointer",
                        transition: "all 0.12s ease",
                        "&:hover": {
                          borderColor: colors.accent.gold,
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: fontFamilies.bodySemiBold,
                          fontWeight: 600,
                          fontSize: multiplierFontSize,
                          color:
                            playerMultiplier === mult
                              ? colors.text.inverse
                              : colors.text.secondary,
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                        }}
                      >
                        x{mult}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Score row: name (left) + counter (center) + points (right) */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: cmpCard ? `${spacing.xs}px` : `${spacing.sm}px`,
                  }}
                >
                  {/* Name cell */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      gap: "4px",
                      flex: 1,
                      minWidth: 110,
                      maxWidth: 200,
                    }}
                  >
                    <Typography
                      noWrap
                      sx={{
                        fontFamily: fontFamilies.bodySemiBold,
                        fontWeight: 600,
                        fontSize: playerNameFontSize,
                        color: playerColor,
                        letterSpacing: "-0.2px",
                      }}
                    >
                      {player.name}
                    </Typography>
                    <Box
                      onClick={() => openHandicapModal(player)}
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: cmpCard
                          ? `${spacing.xs - 2}px`
                          : `${spacing.xs}px`,
                        py: cmpCard ? "2px" : "3px",
                        px: cmpCard ? `${spacing.xs}px` : `${spacing.sm}px`,
                        bgcolor: "transparent",
                        borderRadius: `${borderRadius.full}px`,
                        border: `1px solid ${colors.border.light}`,
                        cursor: "pointer",
                        alignSelf: "flex-start",
                        transition: "border-color 0.15s ease",
                        "&:hover": {
                          borderColor: colors.accent.gold,
                        },
                      }}
                    >
                      {(givesStrokes || receivesStrokes) && (
                        <Box
                          sx={{
                            width: cmpCard ? 6 : 8,
                            height: cmpCard ? 6 : 8,
                            borderRadius: "50%",
                            mr: `${spacing.xs}px`,
                            bgcolor: receivesStrokes
                              ? colors.scoring.positive
                              : givesStrokes
                                ? colors.scoring.negative
                                : "transparent",
                          }}
                        />
                      )}
                      <Typography
                        sx={{
                          fontFamily: fontFamilies.mono,
                          fontSize: cmpCard ? 9 : 11,
                          color: colors.accent.gold,
                        }}
                      >
                        {getHandicapSummary(player.id)}
                      </Typography>
                      <ChevronRightIcon
                        sx={{
                          fontSize: cmpCard ? 10 : 14,
                          color: colors.text.secondary,
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Score counter tray */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: cmpCard ? `${spacing.sm}px` : `${spacing.sm}px`,
                      bgcolor: "rgba(0, 0, 0, 0.03)",
                      borderRadius: `${borderRadius.full}px`,
                      border: `1px solid ${colors.border.light}`,
                      py: cmpCard ? "3px" : `${spacing.xs}px`,
                      px: cmpCard ? `${spacing.xs}px` : `${spacing.sm}px`,
                    }}
                  >
                    <Box
                      onClick={() =>
                        updateScore(player.id, Math.max(0, strokes - 1))
                      }
                      sx={{
                        width: counterSize,
                        height: counterSize,
                        borderRadius: "50%",
                        bgcolor: colors.background.card,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${colors.border.goldSubtle}`,
                        boxShadow: `0 2px 4px ${colors.shadowColors.default}`,
                        cursor: "pointer",
                        transition: "all 0.1s ease",
                        "&:active": { transform: "scale(0.95)" },
                      }}
                    >
                      <RemoveIcon
                        sx={{
                          fontSize: cmpCard ? 16 : 24,
                          color: colors.text.primary,
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: cmpCard ? 45 : 60,
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: fontFamilies.monoBold,
                          fontWeight: 700,
                          fontSize: strokesFontSize,
                          lineHeight: strokesLineHeight,
                          letterSpacing: "-0.5px",
                          color:
                            strokes > currentHole.par
                              ? "#D32F2F"
                              : strokes < currentHole.par
                                ? "#2E7D32"
                                : colors.text.primary,
                        }}
                      >
                        {strokes}
                      </Typography>
                    </Box>

                    <Box
                      onClick={() =>
                        updateScore(player.id, Math.min(15, strokes + 1))
                      }
                      sx={{
                        width: counterSize,
                        height: counterSize,
                        borderRadius: "50%",
                        bgcolor: colors.background.card,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${colors.border.goldSubtle}`,
                        boxShadow: `0 2px 4px ${colors.shadowColors.default}`,
                        cursor: "pointer",
                        transition: "all 0.1s ease",
                        "&:active": { transform: "scale(0.95)" },
                      }}
                    >
                      <AddIcon
                        sx={{
                          fontSize: cmpCard ? 16 : 24,
                          color: colors.text.primary,
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Points Display */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      minWidth: cmpCard ? 50 : 60,
                      px: cmpCard ? `${spacing.xs - 2}px` : `${spacing.xs}px`,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: fontFamilies.monoBold,
                        fontWeight: 700,
                        fontSize: pointsFontSize,
                        color:
                          playerPts > 0
                            ? colors.scoring.positive
                            : playerPts < 0
                              ? colors.scoring.negative
                              : colors.text.primary,
                      }}
                    >
                      {playerPts > 0 ? "+" : ""}
                      {playerPts.toFixed(1)}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: fontFamilies.bodySemiBold,
                        fontWeight: 600,
                        fontSize: cmpCard ? 8 : 9,
                        color: colors.text.tertiary,
                        letterSpacing: "1.2px",
                        textTransform: "uppercase",
                      }}
                    >
                      PTS
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Box>
          );
        })}

        {/* Hole Summary */}
        <Card
          glassMorphism
          sx={{
            p: cmpCard ? `${spacing.xs - 2}px` : `${spacing.sm}px`,
            mt: cmpCard ? `${spacing.xs - 2}px` : `${spacing.xs}px`,
            border: `1px solid ${colors.border.light}`,
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontFamily: fontFamilies.bodySemiBold,
              fontWeight: 600,
              fontSize: 10,
              color: colors.text.tertiary,
              textAlign: "center",
              mb: cmpCard ? `${spacing.xs}px` : `${spacing.sm}px`,
              letterSpacing: "1.4px",
              textTransform: "uppercase",
            }}
          >
            Hole {currentHole.holeNumber} Summary
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-around",
            }}
          >
            {players.map((player) => {
              const pts = holePoints[player.id] || 0;
              return (
                <Box
                  key={player.id}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <Typography
                    noWrap
                    sx={{
                      fontFamily: fontFamilies.body,
                      fontSize: cmpCard ? 9 : 11,
                      color: colors.text.secondary,
                      mb: cmpCard ? "1px" : `${spacing.xs}px`,
                      maxWidth: 60,
                    }}
                  >
                    {player.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: fontFamilies.monoBold,
                      fontWeight: 700,
                      fontSize: cmpCard ? 12 : 16,
                      color:
                        pts > 0
                          ? colors.scoring.positive
                          : pts < 0
                            ? colors.scoring.negative
                            : colors.text.primary,
                    }}
                  >
                    {pts > 0 ? "+" : ""}
                    {pts.toFixed(1)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Card>

        {/* Current Standings */}
        <Card
          glassMorphism
          sx={{
            p: cmpCard ? `${spacing.xs - 2}px` : `${spacing.sm}px`,
            mt: cmpCard ? `${spacing.xs - 2}px` : `${spacing.xs}px`,
            border: `1px solid ${colors.border.light}`,
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontFamily: fontFamilies.bodySemiBold,
              fontWeight: 600,
              fontSize: 10,
              color: colors.text.tertiary,
              textAlign: "center",
              mb: cmpCard ? `${spacing.xs}px` : `${spacing.sm}px`,
              letterSpacing: "1.4px",
              textTransform: "uppercase",
            }}
          >
            Current Standings
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-around",
            }}
          >
            {players.map((player) => {
              const cumPts = cumulativePoints[player.id] || 0;
              return (
                <Box
                  key={player.id}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <Typography
                    noWrap
                    sx={{
                      fontFamily: fontFamilies.body,
                      fontSize: cmpCard ? 9 : 11,
                      color: colors.text.secondary,
                      mb: cmpCard ? "1px" : `${spacing.xs}px`,
                      maxWidth: 60,
                    }}
                  >
                    {player.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: fontFamilies.monoBold,
                      fontWeight: 700,
                      fontSize: cmpCard ? 12 : 16,
                      color:
                        cumPts > 0
                          ? colors.scoring.positive
                          : cumPts < 0
                            ? colors.scoring.negative
                            : colors.text.primary,
                    }}
                  >
                    {cumPts > 0 ? "+" : ""}
                    {cumPts.toFixed(1)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Card>
      </Box>

      {/* Navigation Footer */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: `${spacing.xs}px`,
          pt: `${spacing.sm}px`,
          px: `${spacing.sm}px`,
          pb: `${spacing.sm}px`,
          bgcolor: colors.background.secondary,
          borderTop: `1px solid ${colors.border.light}`,
          flexShrink: 0,
        }}
      >
        <Box sx={{ flex: 0.8, minWidth: 0 }}>
          <Button
            title="Prev"
            icon={<ChevronLeftIcon />}
            onPress={() =>
              setCurrentHoleIndex(Math.max(0, currentHoleIndex - 1))
            }
            disabled={currentHoleIndex === 0}
            variant="outline"
            size="small"
            style={{ width: "100%" }}
          />
        </Box>

        {/* Middle button */}
        {currentHoleIndex < holes.length - 1 ? (
          <Box sx={{ flex: 0.8, minWidth: 0 }}>
            <Button
              title="Next"
              icon={<ChevronRightIcon />}
              iconPosition="right"
              onPress={goToNextHoleOnly}
              variant="outline"
              size="small"
              style={{ width: "100%" }}
            />
          </Box>
        ) : isEditingFinished ? (
          <Box sx={{ flex: 0.8, minWidth: 0 }}>
            <Button
              title="Next"
              icon={<ChevronRightIcon />}
              iconPosition="right"
              onPress={() => setCurrentHoleIndex(0)}
              variant="primary"
              size="small"
              style={{ width: "100%" }}
            />
          </Box>
        ) : (
          <Box sx={{ flex: 1.3, minWidth: 0 }}>
            <Button
              title="Complete"
              icon={<CheckCircleIcon />}
              onPress={completeCurrentHole}
              variant="primary"
              size="small"
              style={{ width: "100%" }}
            />
          </Box>
        )}

        {/* Right button */}
        {currentHoleIndex === holes.length - 1 && !isEditingFinished ? (
          <Box sx={{ flex: 1.1, minWidth: 0 }}>
            <Button
              title="Finish"
              icon={<FlagIcon />}
              onPress={finishGame}
              loading={finishingGame}
              disabled={finishingGame}
              variant="gold"
              size="small"
              style={{ width: "100%" }}
            />
          </Box>
        ) : (
          <Box sx={{ flex: 1.3, minWidth: 0 }}>
            <Button
              title="Complete"
              icon={<CheckCircleIcon />}
              onPress={completeCurrentHole}
              variant="primary"
              size="small"
              style={{ width: "100%" }}
            />
          </Box>
        )}
      </Box>

      {/* Save/Discard buttons when editing finished game */}
      {isEditingFinished && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: `${spacing.sm}px`,
            p: `${spacing.sm}px`,
            bgcolor: colors.background.secondary,
            borderTop: `1px solid ${colors.border.light}`,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Button
              title="Discard"
              variant="outline"
              onPress={handleDiscardChanges}
              style={{ width: "100%" }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Button
              title={hasChanges ? "Save" : "Back"}
              variant={hasChanges ? "gold" : "primary"}
              onPress={handleSaveChanges}
              style={{ width: "100%" }}
            />
          </Box>
        </Box>
      )}

      {/* Settings Drawer */}
      <Drawer
        anchor="left"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "85vw", sm: 380 },
              maxWidth: 420,
              bgcolor: colors.background.primary,
              backgroundImage: "none",
            },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {/* Drawer header */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              px: `${spacing.md}px`,
              py: `${spacing.md}px`,
              bgcolor: colors.background.secondary,
              borderBottom: `1px solid ${colors.border.light}`,
            }}
          >
            <Typography
              sx={{
                fontFamily: fontFamilies.bodySemiBold,
                fontWeight: 600,
                fontSize: 18,
                color: colors.text.primary,
                letterSpacing: "-0.2px",
              }}
            >
              Game Settings
            </Typography>
            <Box
              onClick={() => setSettingsOpen(false)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                "&:hover": { bgcolor: colors.background.card },
              }}
            >
              <CloseIcon sx={{ fontSize: 20, color: colors.text.secondary }} />
            </Box>
          </Box>

          {/* Scrollable content */}
          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              px: `${spacing.md}px`,
              py: `${spacing.md}px`,
            }}
          >
            {/* Current Standings */}
            <Typography
              sx={{
                fontFamily: fontFamilies.bodySemiBold,
                fontWeight: 600,
                fontSize: 11,
                color: colors.accent.gold,
                letterSpacing: "1px",
                textTransform: "uppercase",
                mb: `${spacing.sm}px`,
              }}
            >
              Current Standings
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: `${spacing.xs}px`,
                mb: `${spacing.lg}px`,
              }}
            >
              {[...players]
                .map((p, idx) => ({
                  player: p,
                  color: getPlayerColor(idx),
                  points: cumulativePoints[p.id] || 0,
                }))
                .sort((a, b) => b.points - a.points)
                .map((row, rank) => (
                  <Box
                    key={row.player.id}
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      py: `${spacing.sm}px`,
                      px: `${spacing.md}px`,
                      bgcolor: colors.background.card,
                      borderRadius: `${borderRadius.md}px`,
                      border: `1px solid ${colors.border.light}`,
                      borderLeft: `6px solid ${row.color}`,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: `${spacing.sm}px`,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: fontFamilies.monoBold,
                          fontWeight: 700,
                          fontSize: 13,
                          color: colors.text.tertiary,
                          width: 20,
                        }}
                      >
                        {rank + 1}.
                      </Typography>
                      <Typography
                        noWrap
                        sx={{
                          fontFamily: fontFamilies.bodySemiBold,
                          fontWeight: 600,
                          fontSize: 15,
                          color: colors.text.primary,
                        }}
                      >
                        {row.player.name}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: fontFamilies.monoBold,
                        fontWeight: 700,
                        fontSize: 16,
                        color:
                          row.points > 0
                            ? colors.scoring.positive
                            : row.points < 0
                              ? colors.scoring.negative
                              : colors.text.secondary,
                      }}
                    >
                      {row.points > 0 ? "+" : ""}
                      {row.points}
                    </Typography>
                  </Box>
                ))}
            </Box>

            <Divider sx={{ my: `${spacing.md}px` }} />

            {/* Actions */}
            <Typography
              sx={{
                fontFamily: fontFamilies.bodySemiBold,
                fontWeight: 600,
                fontSize: 11,
                color: colors.accent.gold,
                letterSpacing: "1px",
                textTransform: "uppercase",
                mb: `${spacing.sm}px`,
              }}
            >
              Actions
            </Typography>

            {/* Complete all remaining */}
            <Box
              onClick={completeAllRemainingHoles}
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: `${spacing.sm}px`,
                p: `${spacing.md}px`,
                bgcolor: colors.background.card,
                borderRadius: `${borderRadius.md}px`,
                border: `1px solid ${colors.border.light}`,
                cursor: "pointer",
                transition: "all 0.15s ease",
                mb: `${spacing.sm}px`,
                "&:hover": {
                  borderColor: colors.accent.gold,
                  bgcolor: colors.background.elevated,
                },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor: colors.glow.positive,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <DoneAllIcon
                  sx={{ fontSize: 18, color: colors.scoring.positive }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontFamily: fontFamilies.bodySemiBold,
                    fontWeight: 600,
                    fontSize: 14,
                    color: colors.text.primary,
                  }}
                >
                  Complete all remaining holes
                </Typography>
                <Typography
                  sx={{
                    fontFamily: fontFamilies.body,
                    fontSize: 11,
                    color: colors.text.secondary,
                    mt: "2px",
                  }}
                >
                  Mark every remaining hole confirmed. Missing scores recorded
                  at par.
                </Typography>
              </Box>
            </Box>

            {/* Undo 2nd-9 (conditional) */}
            {game?.second9Activated && (
              <Box
                onClick={undoSecond9}
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: `${spacing.sm}px`,
                  p: `${spacing.md}px`,
                  bgcolor: colors.background.card,
                  borderRadius: `${borderRadius.md}px`,
                  border: `1px solid ${colors.holeWideAccent}`,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: colors.background.elevated,
                    boxShadow: `0 0 10px ${colors.holeWideAccentGlow}`,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    bgcolor: colors.holeWideAccentGlow,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <RestoreIcon
                    sx={{ fontSize: 18, color: colors.holeWideAccent }}
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontFamily: fontFamilies.bodySemiBold,
                      fontWeight: 600,
                      fontSize: 14,
                      color: colors.text.primary,
                    }}
                  >
                    Undo 2x 2nd-9
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: fontFamilies.body,
                      fontSize: 11,
                      color: colors.text.secondary,
                      mt: "2px",
                    }}
                  >
                    Clear the x2 stamp from affected holes. They become
                    individually toggleable again.
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        slotProps={{
          paper: {
            sx: {
              bgcolor: colors.background.primary,
              borderRadius: `${borderRadius.lg}px`,
              border: `1px solid ${colors.border.light}`,
              minWidth: { xs: "90vw", sm: 360 },
              maxWidth: 440,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: fontFamilies.bodySemiBold,
            fontWeight: 700,
            fontSize: 18,
            color: colors.text.primary,
            letterSpacing: "-0.2px",
            pb: `${spacing.xs}px`,
          }}
        >
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              fontFamily: fontFamilies.body,
              fontSize: 14,
              color: colors.text.secondary,
              lineHeight: 1.5,
            }}
          >
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: `${spacing.md}px`, pb: `${spacing.md}px` }}>
          <Box sx={{ flex: 1 }}>
            <Button
              title="Cancel"
              variant="outline"
              size="small"
              onPress={() =>
                setConfirmDialog((prev) => ({ ...prev, open: false }))
              }
              style={{ width: "100%" }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Button
              title={confirmDialog.confirmLabel}
              variant={
                confirmDialog.confirmColor === "warning" ? "gold" : "primary"
              }
              size="small"
              onPress={async () => {
                const fn = confirmDialog.onConfirm;
                setConfirmDialog((prev) => ({ ...prev, open: false }));
                await fn();
              }}
              style={{ width: "100%" }}
            />
          </Box>
        </DialogActions>
      </Dialog>

      {/* Handicap Modal */}
      {selectedPlayer && (
        <HandicapModal
          visible={handicapModalVisible}
          player={selectedPlayer}
          opponents={players.filter((p) => p.id !== selectedPlayer.id)}
          handicaps={game?.handicaps || {}}
          totalHoles={holes.length}
          holes={holes}
          onUpdateHandicap={updateHandicap}
          onBatchUpdateHandicaps={batchUpdateHandicaps}
          onClose={closeHandicapModal}
        />
      )}
    </Box>
  );
};

export default ScoringPage;
