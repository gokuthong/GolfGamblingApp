import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { crossPlatformAlert } from "../../utils/crossPlatformAlert";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Button, Card, Badge, Icon } from "../../components/common";
import { HandicapModal } from "../../components/game/HandicapModal";
import { dataService } from "../../services/DataService";
import { Hole, Score, Player, Game } from "../../types";
import { typography, spacing, fontFamilies, borderRadius } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ScoreCalculator } from "../../utils/scoreCalculator";
import {
  setHandicapForHole,
  getTotalHandicapForMatchup,
  getHandicapForHole,
} from "../../utils/handicapUtils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Warm-toned, distinct player colors — visible in light mode, brand-adjacent
const PLAYER_COLORS = [
  "#D9715B", // terra cotta (warm red)
  "#6B8CAE", // slate (soft blue)
  "#7A9D6B", // sage (warm green)
  "#A67BA0", // dusty plum
  "#D4AF37", // gold (fallback)
];
const getPlayerColor = (index: number) =>
  PLAYER_COLORS[index % PLAYER_COLORS.length];

export const ScoringScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { gameId, isEditingFinished } = route.params || {};
  const colors = useThemedColors();
  const insets = useSafeAreaInsets();

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

  const pendingUpdatesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loadGameData = async () => {
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

          // Save original scores if editing a finished game
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
    if (!currentHole) return;

    const updateKey = `${currentHole.id}_${playerId}`;
    if (pendingUpdatesRef.current.has(updateKey)) return;

    const existingScore = scores.find(
      (s) => s.holeId === currentHole.id && s.playerId === playerId,
    );

    try {
      pendingUpdatesRef.current.add(updateKey);
      if (Platform.OS !== "web")
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

      // Refresh scores from storage
      const updatedScores = await dataService.getScoresForGame(gameId);
      setScores(updatedScores);

      // Mark that changes were made when editing a finished game
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
    if (!currentHole) return;

    const updateKey = `${currentHole.id}_${playerId}`;
    if (pendingUpdatesRef.current.has(updateKey)) return;

    const existingScore = scores.find(
      (s) => s.holeId === currentHole.id && s.playerId === playerId,
    );

    const currentMultiplier = existingScore?.multiplier || 1;

    // Toggle: if clicking the same multiplier, turn it off (set to 1)
    const newMultiplier = currentMultiplier === multiplier ? 1 : multiplier;

    try {
      pendingUpdatesRef.current.add(updateKey);
      if (Platform.OS !== "web")
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

      // Refresh scores from storage
      const updatedScores = await dataService.getScoresForGame(gameId);
      setScores(updatedScores);

      // Mark that changes were made when editing a finished game
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
        onPress: () =>
          navigation.navigate("HistoryTab", { screen: "GameHistory" }),
      },
    ]);
  };

  const handleDiscardChanges = () => {
    if (!hasChanges) {
      navigation.navigate("HistoryTab", { screen: "GameHistory" });
      return;
    }

    crossPlatformAlert(
      "Discard Changes",
      "Are you sure you want to discard all changes?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            // Restore original scores
            for (const originalScore of originalScores) {
              await dataService.upsertScore(originalScore);
            }
            navigation.navigate("HistoryTab", { screen: "GameHistory" });
          },
        },
      ],
    );
  };

  const getPlayerScore = (playerId: string): number => {
    const score = scores.find(
      (s) => s.holeId === currentHole?.id && s.playerId === playerId,
    );
    // Default to par if no score exists yet
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

  // Check if we have exactly 4 players for compact layout
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
    if (!game) return;

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
    if (!game || updates.length === 0) return;

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

    // Calculate strokes this player GIVES on THIS HOLE (from playerId to opponents)
    const totalGivenOnHole = opponents.reduce((sum, opp) => {
      const strokes = getHandicapForHole(
        game.handicaps,
        currentHole.holeNumber,
        playerId,
        opp.id,
      );
      return sum + strokes;
    }, 0);

    // Calculate strokes this player RECEIVES on THIS HOLE (from opponents to playerId)
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
    // Plain navigation - just advance without confirming
    setCurrentHoleIndex(Math.min(holes.length - 1, currentHoleIndex + 1));
  };

  const completeCurrentHole = async () => {
    if (!currentHole) return;

    try {
      // Mark the current hole as confirmed (stay on same hole)
      await dataService.updateHole(currentHole.id, { confirmed: true });

      // Refresh holes from storage
      const updatedHoles = await dataService.getHolesForGame(gameId);
      setHoles(updatedHoles);
    } catch (error) {
      console.error("Error confirming hole:", error);
    }
  };

  const finishGame = async () => {
    if (finishingGame) return;

    setFinishingGame(true);

    // Before completing the game, ensure all players have scores for all holes
    // If a player hasn't modified their score (left it at par), create a score record
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
        // Check if a score exists for this player on this hole
        const existingScore = scores.find(
          (s) => s.holeId === hole.id && s.playerId === player.id,
        );

        if (!existingScore) {
          // No score exists, create one at par
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

    // Complete the game. Unconfirmed holes are intentionally left unconfirmed so the scorecard
    // shows blanks. Use the separate "Complete" button to confirm individual holes before finishing.
    try {
      const updatedHoles = await dataService.getHolesForGame(gameId);

      // Only create missing scores for confirmed holes
      const confirmedMissingScores = missingScores.filter((ms) => {
        const hole = updatedHoles.find((h) => h.id === ms.holeId);
        return hole?.confirmed === true;
      });

      // Execute remaining operations in parallel
      await Promise.all([
        dataService.batchUpsertScores(confirmedMissingScores),
        dataService.completeGame(gameId),
      ]);

      navigation.navigate("GameSummary", { gameId });
    } catch (error) {
      console.error("Error finishing game:", error);
      crossPlatformAlert("Error", "Failed to finish game");
      setFinishingGame(false);
    }
  };

  // Create styles before early returns
  const styles = createStyles(colors);

  if (loading || players.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!currentHole) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No holes found</Text>
      </View>
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

  // Compute cumulative standings from confirmed holes only
  const cumulativePoints = ScoreCalculator.calculateTotalPoints(
    holes,
    getScoresByHoleId(),
    players,
    game?.handicaps,
  );

  return (
    <View
      style={[
        styles.container,
        currentHole.confirmed && { backgroundColor: colors.confirmedHoleBg },
      ]}
    >
      {/* Editorial header with hole info */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          style={styles.standingsButton}
          onPress={() => navigation.navigate("OverallStandings", { gameId })}
        >
          <Icon name="podium" size={18} color={colors.accent.gold} />
        </TouchableOpacity>

        <View style={styles.holeInfoCenter}>
          <Text style={styles.holeNumber}>Hole {currentHole.holeNumber}</Text>
          <View style={styles.parBadge}>
            <Text style={styles.parText}>Par {currentHole.par}</Text>
          </View>
          {currentHole.index && (
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>#{currentHole.index}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerProgress}>
          <Text style={styles.headerProgressText}>
            {currentHoleIndex + 1}/{holes.length}
          </Text>
        </View>
      </View>

      {/* Player Cards */}
      <ScrollView
        style={styles.playersScroll}
        contentContainerStyle={[
          styles.playersContent,
          isCompactLayout && styles.playersContentCompact,
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isCompactLayout || isEditingFinished}
      >
        {players.map((player, playerIndex) => {
          const strokes = getPlayerScore(player.id);
          const playerScore = scores.find(
            (s) => s.holeId === currentHole?.id && s.playerId === player.id,
          );
          const playerMultiplier = playerScore?.multiplier || 1;
          const playerPoints = holePoints[player.id] || 0;
          const playerColor = getPlayerColor(playerIndex);

          // Build card style without falsy values
          const cardStyle: any[] = [
            styles.playerCard,
            { borderLeftColor: playerColor },
          ];
          if (isCompactLayout) cardStyle.push(styles.playerCardCompact);
          if (playerPoints > 0) cardStyle.push(styles.playerCardWinning);
          if (playerPoints < 0) cardStyle.push(styles.playerCardLosing);

          return (
            <View
              key={player.id}
              style={[
                styles.playerCardWrapper,
                isCompactLayout && styles.playerCardWrapperCompact,
              ]}
            >
              <Card goldBorder={playerPoints > 0} style={cardStyle}>
                {/* Player Header — name centered, handicap pill top-right */}
                <View
                  style={[
                    styles.playerHeader,
                    isCompactLayout && styles.playerHeaderCompact,
                  ]}
                >
                  <View style={styles.playerInfo}>
                    <Text
                      style={[
                        styles.playerName,
                        isCompactLayout && styles.playerNameCompact,
                        { color: playerColor },
                      ]}
                      numberOfLines={1}
                    >
                      {player.name}
                    </Text>
                    {player.userNumber && (
                      <Text
                        style={[
                          styles.playerNumber,
                          isCompactLayout && styles.playerNumberCompact,
                        ]}
                      >
                        #{player.userNumber}
                      </Text>
                    )}
                    {player.isGuest && !isCompactLayout && (
                      <Badge label="Guest" variant="neutral" size="small" />
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.handicapButton,
                      styles.handicapButtonAbs,
                      isCompactLayout && styles.handicapButtonCompact,
                    ]}
                    onPress={() => openHandicapModal(player)}
                  >
                    {(() => {
                      // Check if player gives or receives strokes on this hole
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
                        <>
                          {(givesStrokes || receivesStrokes) && (
                            <View
                              style={[
                                styles.handicapDot,
                                isCompactLayout && styles.handicapDotCompact,
                                receivesStrokes && styles.handicapDotReceives,
                                givesStrokes && styles.handicapDotGives,
                              ]}
                            />
                          )}
                          <Text
                            style={[
                              styles.handicapText,
                              isCompactLayout && styles.handicapTextCompact,
                            ]}
                          >
                            {getHandicapSummary(player.id)}
                          </Text>
                          <Icon
                            name="chevron-right"
                            size={isCompactLayout ? 10 : 14}
                            color={colors.text.secondary}
                          />
                        </>
                      );
                    })()}
                  </TouchableOpacity>
                </View>

                {/* Multiplier Buttons - Compact (moved to top) */}
                <View
                  style={[
                    styles.multiplierRow,
                    isCompactLayout && styles.multiplierRowCompact,
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.multiplierButton,
                      isCompactLayout && styles.multiplierButtonCompact,
                      playerMultiplier === 2 && styles.multiplierButtonActive,
                    ].filter(Boolean)}
                    onPress={() => setPlayerMultiplier(player.id, 2)}
                  >
                    <Text
                      style={[
                        styles.multiplierText,
                        isCompactLayout && styles.multiplierTextCompact,
                        playerMultiplier === 2 && styles.multiplierTextActive,
                      ].filter(Boolean)}
                    >
                      x2
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.multiplierButton,
                      isCompactLayout && styles.multiplierButtonCompact,
                      playerMultiplier === 3 && styles.multiplierButtonActive,
                    ].filter(Boolean)}
                    onPress={() => setPlayerMultiplier(player.id, 3)}
                  >
                    <Text
                      style={[
                        styles.multiplierText,
                        isCompactLayout && styles.multiplierTextCompact,
                        playerMultiplier === 3 && styles.multiplierTextActive,
                      ].filter(Boolean)}
                    >
                      x3
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.multiplierButton,
                      isCompactLayout && styles.multiplierButtonCompact,
                      playerMultiplier === 4 && styles.multiplierButtonActive,
                    ].filter(Boolean)}
                    onPress={() => setPlayerMultiplier(player.id, 4)}
                  >
                    <Text
                      style={[
                        styles.multiplierText,
                        isCompactLayout && styles.multiplierTextCompact,
                        playerMultiplier === 4 && styles.multiplierTextActive,
                      ].filter(Boolean)}
                    >
                      x4
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.multiplierButton,
                      isCompactLayout && styles.multiplierButtonCompact,
                      playerMultiplier === 6 && styles.multiplierButtonActive,
                    ].filter(Boolean)}
                    onPress={() => setPlayerMultiplier(player.id, 6)}
                  >
                    <Text
                      style={[
                        styles.multiplierText,
                        isCompactLayout && styles.multiplierTextCompact,
                        playerMultiplier === 6 && styles.multiplierTextActive,
                      ].filter(Boolean)}
                    >
                      x6
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Score Counter and Points - Moved below multipliers */}
                <View
                  style={[
                    styles.scoreAndPointsRow,
                    isCompactLayout && styles.scoreAndPointsRowCompact,
                  ]}
                >
                  <View
                    style={[
                      styles.scoreSection,
                      styles.scoreTray,
                      isCompactLayout && styles.scoreSectionCompact,
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.5}
                      style={[
                        styles.counterButton,
                        isCompactLayout && styles.counterButtonCompact,
                      ]}
                      onPress={() =>
                        updateScore(player.id, Math.max(0, strokes - 1))
                      }
                    >
                      <Icon
                        name="minus"
                        size={isCompactLayout ? 16 : 24}
                        color={colors.text.primary}
                      />
                    </TouchableOpacity>

                    <View
                      style={[
                        styles.strokesDisplay,
                        isCompactLayout && styles.strokesDisplayCompact,
                      ]}
                    >
                      <Text
                        style={[
                          styles.strokesValue,
                          isCompactLayout && styles.strokesValueCompact,
                          strokes > currentHole.par && styles.strokesOverPar,
                          strokes < currentHole.par && styles.strokesUnderPar,
                        ]}
                      >
                        {strokes}
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.5}
                      style={[
                        styles.counterButton,
                        isCompactLayout && styles.counterButtonCompact,
                      ]}
                      onPress={() =>
                        updateScore(player.id, Math.min(15, strokes + 1))
                      }
                    >
                      <Icon
                        name="plus"
                        size={isCompactLayout ? 16 : 24}
                        color={colors.text.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Points Display */}
                  <View
                    style={[
                      styles.pointsContainer,
                      isCompactLayout && styles.pointsContainerCompact,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pointsValue,
                        isCompactLayout && styles.pointsValueCompact,
                        playerPoints > 0 ? styles.pointsPositive : null,
                        playerPoints < 0 ? styles.pointsNegative : null,
                      ].filter(Boolean)}
                    >
                      {playerPoints > 0 ? "+" : ""}
                      {playerPoints.toFixed(1)}
                    </Text>
                    <Text
                      style={[
                        styles.pointsLabel,
                        isCompactLayout && styles.pointsLabelCompact,
                      ]}
                    >
                      PTS
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
          );
        })}

        {/* Hole Summary - Point Gain/Loss */}
        <Card
          glass
          style={[
            styles.holeSummaryCard,
            isCompactLayout && styles.holeSummaryCardCompact,
          ]}
        >
          <Text
            style={[
              styles.holeSummaryTitle,
              isCompactLayout && styles.holeSummaryTitleCompact,
            ]}
          >
            Hole {currentHole.holeNumber} Summary
          </Text>
          <View style={styles.holeSummaryRow}>
            {players.map((player) => {
              const playerPoints = holePoints[player.id] || 0;
              return (
                <View key={player.id} style={styles.holeSummaryItem}>
                  <Text
                    style={[
                      styles.holeSummaryName,
                      isCompactLayout && styles.holeSummaryNameCompact,
                    ]}
                    numberOfLines={1}
                  >
                    {player.name}
                  </Text>
                  <Text
                    style={[
                      styles.holeSummaryPoints,
                      isCompactLayout && styles.holeSummaryPointsCompact,
                      playerPoints > 0 ? styles.pointsPositive : null,
                      playerPoints < 0 ? styles.pointsNegative : null,
                    ].filter(Boolean)}
                  >
                    {playerPoints > 0 ? "+" : ""}
                    {playerPoints.toFixed(1)}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Current Standings - cumulative points from confirmed holes */}
        <Card
          glass
          style={[
            styles.holeSummaryCard,
            isCompactLayout && styles.holeSummaryCardCompact,
          ]}
        >
          <Text
            style={[
              styles.holeSummaryTitle,
              isCompactLayout && styles.holeSummaryTitleCompact,
            ]}
          >
            Current Standings
          </Text>
          <View style={styles.holeSummaryRow}>
            {players.map((player) => {
              const cumPts = cumulativePoints[player.id] || 0;
              return (
                <View key={player.id} style={styles.holeSummaryItem}>
                  <Text
                    style={[
                      styles.holeSummaryName,
                      isCompactLayout && styles.holeSummaryNameCompact,
                    ]}
                    numberOfLines={1}
                  >
                    {player.name}
                  </Text>
                  <Text
                    style={[
                      styles.holeSummaryPoints,
                      isCompactLayout && styles.holeSummaryPointsCompact,
                      cumPts > 0 ? styles.pointsPositive : null,
                      cumPts < 0 ? styles.pointsNegative : null,
                    ].filter(Boolean)}
                  >
                    {cumPts > 0 ? "+" : ""}
                    {cumPts.toFixed(1)}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>
      </ScrollView>

      {/* Compact Navigation Footer */}
      <View style={styles.navigation}>
        <Button
          title="Prev"
          icon="chevron-left"
          onPress={() => setCurrentHoleIndex(Math.max(0, currentHoleIndex - 1))}
          disabled={currentHoleIndex === 0}
          variant="outline"
          size="small"
          style={styles.navButtonSmall}
        />

        {/* Middle button: Next or Complete (last hole) */}
        {currentHoleIndex < holes.length - 1 ? (
          <Button
            title="Next"
            icon="chevron-right"
            iconPosition="right"
            onPress={goToNextHoleOnly}
            variant="outline"
            size="small"
            style={styles.navButtonSmall}
          />
        ) : isEditingFinished ? (
          <Button
            title="Next"
            icon="chevron-right"
            iconPosition="right"
            onPress={() => setCurrentHoleIndex(0)}
            variant="primary"
            size="small"
            style={styles.navButtonSmall}
          />
        ) : (
          <Button
            title="Complete"
            icon="check-circle"
            onPress={completeCurrentHole}
            variant="primary"
            size="small"
            style={styles.navButtonWide}
          />
        )}

        {/* Right button: Finish Game (last hole) or Complete */}
        {currentHoleIndex === holes.length - 1 && !isEditingFinished ? (
          <Button
            title="Finish"
            icon="flag-checkered"
            onPress={finishGame}
            loading={finishingGame}
            disabled={finishingGame}
            variant="gold"
            glow
            size="small"
            style={styles.navButtonMed}
          />
        ) : (
          <Button
            title="Complete"
            icon="check-circle"
            onPress={completeCurrentHole}
            variant="primary"
            size="small"
            style={styles.navButtonWide}
          />
        )}
      </View>

      {/* Save/Discard buttons when editing finished game */}
      {isEditingFinished && (
        <View style={styles.editActions}>
          <Button
            title="Discard"
            variant="outline"
            onPress={handleDiscardChanges}
            style={styles.editActionButton}
          />
          <Button
            title={hasChanges ? "Save" : "Back"}
            variant={hasChanges ? "gold" : "primary"}
            glow={hasChanges}
            onPress={handleSaveChanges}
            style={styles.editActionButton}
          />
        </View>
      )}

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
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background.primary,
    },
    loadingText: {
      fontFamily: fontFamilies.body,
      fontSize: typography.bodyLarge.fontSize,
      color: colors.text.secondary,
    },
    // Editorial header
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      backgroundColor: colors.background.primary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    standingsButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.background.card,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border.goldSubtle,
    },
    holeInfoCenter: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    holeNumber: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 20,
      color: colors.text.primary,
      letterSpacing: -0.2,
    },
    parBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.goldSubtle,
      backgroundColor: "transparent",
    },
    parText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 11,
      color: colors.accent.gold,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    indexBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.light,
      backgroundColor: "transparent",
    },
    indexText: {
      fontFamily: fontFamilies.mono,
      fontSize: 10,
      color: colors.text.tertiary,
      letterSpacing: 0.5,
    },
    headerProgress: {
      minWidth: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    headerProgressText: {
      fontFamily: fontFamilies.monoMedium,
      fontSize: 12,
      color: colors.text.secondary,
      letterSpacing: 0.5,
    },
    // Compact player cards
    playersScroll: {
      flex: 1,
    },
    playersContent: {
      padding: spacing.sm,
    },
    playerCardWrapper: {
      // Wrapper to ensure stable layout during re-renders
      flexShrink: 0,
      marginBottom: spacing.lg,
      opacity: 1,
      minHeight: 1,
    },
    playerCardWrapperCompact: {
      marginBottom: 14,
      flex: 1,
    },
    playerCard: {
      padding: spacing.sm,
      // Faint gold-washed tint (subtle, brand-aligned)
      backgroundColor: "rgba(212, 175, 55, 0.05)",
      borderWidth: 1,
      borderColor: colors.border.light,
      // 6px player-color accent bar on left (color set inline per-player)
      borderLeftWidth: 6,
      // Stronger 3D shadow for elevation
      shadowColor: colors.shadowColors.default,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 12,
      elevation: 6,
    },
    playerCardWinning: {
      borderColor: colors.border.goldSubtle,
      // Preserve playerColor on left; enhance gold glow on other sides
      shadowColor: colors.accent.gold,
      shadowOpacity: 0.22,
    },
    playerCardLosing: {
      borderColor: colors.border.light,
    },
    playerHeader: {
      position: "relative",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing.sm,
      minHeight: 28,
    },
    playerHeaderCompact: {
      marginBottom: spacing.sm,
      minHeight: 22,
    },
    playerInfo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      maxWidth: "70%",
    },
    playerName: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 17,
      color: colors.text.primary,
      marginRight: spacing.xs,
      letterSpacing: -0.1,
      textAlign: "center",
    },
    playerNameCompact: {
      fontSize: 15,
      letterSpacing: -0.1,
    },
    playerNumber: {
      fontFamily: fontFamilies.mono,
      fontSize: 11,
      color: colors.text.tertiary,
      marginRight: spacing.xs,
    },
    playerNumberCompact: {
      fontSize: 9,
    },
    handicapButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: 4,
      paddingHorizontal: spacing.sm,
      backgroundColor: "transparent",
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    handicapButtonAbs: {
      position: "absolute",
      right: 0,
      top: 0,
    },
    handicapButtonCompact: {
      paddingVertical: 2,
      paddingHorizontal: spacing.xs - 2,
      gap: spacing.xs - 2,
    },
    handicapText: {
      fontFamily: fontFamilies.mono,
      fontSize: 11,
      color: colors.accent.gold,
    },
    handicapTextCompact: {
      fontSize: 9,
    },
    handicapDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: spacing.xs,
    },
    handicapDotCompact: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    handicapDotReceives: {
      backgroundColor: colors.scoring.positive,
    },
    handicapDotGives: {
      backgroundColor: colors.scoring.negative,
    },
    // Score and points row (below multipliers)
    scoreAndPointsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    scoreAndPointsRowCompact: {
      gap: spacing.xs,
    },
    // Score section (now larger and more prominent)
    scoreSection: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      flex: 1,
    },
    counterButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.background.card,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border.goldSubtle,
    },
    strokesDisplay: {
      alignItems: "center",
      minWidth: 60,
    },
    strokesDisplayCompact: {
      minWidth: 45,
    },
    strokesValue: {
      fontFamily: fontFamilies.monoBold,
      fontSize: 40,
      color: colors.text.primary,
      lineHeight: 46,
      letterSpacing: -0.5,
    },
    // Multiplier buttons (now on top, smaller than score buttons)
    multiplierRow: {
      flexDirection: "row",
      gap: spacing.xs - 2,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.xl,
    },
    multiplierRowCompact: {
      gap: spacing.xs - 4,
      marginBottom: spacing.xs - 2,
      paddingHorizontal: spacing.lg,
    },
    multiplierButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      paddingVertical: spacing.xs - 2,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.light,
      backgroundColor: "transparent",
    },
    multiplierButtonCompact: {
      paddingVertical: spacing.xs - 5,
    },
    multiplierButtonActive: {
      backgroundColor: colors.accent.gold,
      borderColor: colors.accent.gold,
    },
    multiplierText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 11,
      color: colors.text.secondary,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    multiplierTextCompact: {
      fontSize: 10,
    },
    multiplierTextActive: {
      color: colors.text.inverse,
    },
    pointsContainer: {
      alignItems: "center",
      minWidth: 60,
      paddingHorizontal: spacing.xs,
    },
    pointsContainerCompact: {
      minWidth: 50,
      paddingHorizontal: spacing.xs - 2,
    },
    pointsValue: {
      fontFamily: fontFamilies.monoBold,
      fontSize: 20,
      color: colors.text.primary,
    },
    pointsValueCompact: {
      fontSize: 16,
    },
    pointsPositive: {
      color: colors.scoring.positive,
    },
    pointsNegative: {
      color: colors.scoring.negative,
    },
    pointsLabel: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 9,
      color: colors.text.tertiary,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
    pointsLabelCompact: {
      fontSize: 8,
    },
    // Compact navigation
    navigation: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      padding: spacing.sm,
      backgroundColor: colors.background.secondary,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    navButtonSmall: {
      flex: 0.8,
      minWidth: 0,
    },
    navButtonMed: {
      flex: 1.1,
      minWidth: 0,
    },
    navButtonWide: {
      flex: 1.3,
      minWidth: 0,
    },
    // Edit actions (when editing finished game)
    editActions: {
      flexDirection: "row",
      gap: spacing.sm,
      padding: spacing.sm,
      backgroundColor: colors.background.secondary,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    editActionButton: {
      flex: 1,
    },
    // Hole summary card
    holeSummaryCard: {
      padding: spacing.sm,
      marginTop: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    holeSummaryTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 10,
      color: colors.text.tertiary,
      textAlign: "center",
      marginBottom: spacing.sm,
      letterSpacing: 1.4,
      textTransform: "uppercase",
    },
    holeSummaryRow: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    holeSummaryItem: {
      alignItems: "center",
      flex: 1,
    },
    holeSummaryName: {
      fontFamily: fontFamilies.body,
      fontSize: 11,
      color: colors.text.secondary,
      marginBottom: spacing.xs,
      maxWidth: 60,
    },
    holeSummaryPoints: {
      fontFamily: fontFamilies.monoBold,
      fontSize: 16,
      color: colors.text.primary,
    },
    // Compact layout styles for 4 players
    playersContentCompact: {
      padding: spacing.xs - 2,
      paddingBottom: spacing.xs,
      flexGrow: 1,
    },
    playerCardCompact: {
      padding: spacing.xs - 2,
    },
    scoreSectionCompact: {
      gap: spacing.sm,
    },
    counterButtonCompact: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    strokesValueCompact: {
      fontSize: 32,
      lineHeight: 36,
    },
    strokesOverPar: {
      color: "#D32F2F",
    },
    strokesUnderPar: {
      color: "#2E7D32",
    },
    holeSummaryCardCompact: {
      padding: spacing.xs - 2,
      marginTop: spacing.xs - 2,
    },
    holeSummaryTitleCompact: {
      fontSize: 10,
      marginBottom: spacing.xs,
    },
    holeSummaryNameCompact: {
      fontSize: 9,
      marginBottom: 1,
    },
    holeSummaryPointsCompact: {
      fontSize: 12,
    },
  });

export default ScoringScreen;
