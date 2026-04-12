import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { crossPlatformAlert } from "../../utils/crossPlatformAlert";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { Button, Card, Icon, ZoomableView } from "../../components/common";
import { Scorecard } from "../../components/scoring/Scorecard";
import { dataService } from "../../services/DataService";
import { firestoreService } from "../../services/firebase/firestore";
import { localStorageService } from "../../services/storage/LocalStorageService";
import { Hole, Score, Player, Game } from "../../types";
import { typography, spacing, fontFamilies, borderRadius } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ScoreCalculator } from "../../utils/scoreCalculator";
import { generateScorecardPDF } from "../../utils/pdfGenerator";
import {
  getTotalHandicapForMatchup,
  getHandicapForHole,
} from "../../utils/handicapUtils";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Minimal gold confetti — restrained, editorial
const ConfettiParticle = ({
  delay,
  index,
  colors,
}: {
  delay: number;
  index: number;
  colors: any;
}) => {
  const translateY = useSharedValue(-40);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0.85);

  const startX = (index % 12) * (SCREEN_WIDTH / 12) + Math.random() * 20;

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 80, {
        duration: 3600 + Math.random() * 1200,
        easing: Easing.linear,
      }),
    );
    rotate.value = withDelay(
      delay,
      withRepeat(withTiming(360, { duration: 1400 }), -1),
    );
    opacity.value = withDelay(delay + 2400, withTiming(0, { duration: 1000 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
    left: startX,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 6,
          height: 6,
          borderRadius: 1,
          backgroundColor: colors.accent.gold,
        },
        animatedStyle,
      ]}
    />
  );
};

export const GameSummaryScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { gameId } = route.params;
  const colors = useThemedColors();

  const [game, setGame] = useState<Game | null>(null);
  const [holes, setHoles] = useState<Hole[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      dataService.getGame(gameId),
      localStorageService.getHolesForGame(gameId),
      firestoreService.getHolesForGame(gameId).catch(() => [] as Hole[]),
      localStorageService.getScoresForGame(gameId),
      firestoreService.getScoresForGame(gameId).catch(() => [] as Score[]),
    ]).then(async ([gameData, localHoles, fsHoles, localScores, fsScores]) => {
      const holeMap = new Map<string, Hole>();
      for (const h of localHoles) holeMap.set(h.id, h);
      for (const h of fsHoles) holeMap.set(h.id, h);
      setHoles(
        Array.from(holeMap.values()).sort(
          (a, b) => a.holeNumber - b.holeNumber,
        ),
      );

      const scoreMap = new Map<string, Score>();
      for (const s of localScores) scoreMap.set(s.id, s);
      for (const s of fsScores) scoreMap.set(s.id, s);
      setScores(Array.from(scoreMap.values()));

      if (gameData) {
        setGame(gameData);
        const playersList = await dataService.getPlayersForGame(gameData);
        setPlayers(playersList);
      }

      setLoading(false);
    });
  }, [gameId]);

  const headToHead = useMemo(() => {
    if (players.length < 2 || holes.length === 0) return [];

    const pairs: Array<{
      leader: Player;
      trailer: Player;
      advantage: number;
    }> = [];

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const pA = players[i];
        const pB = players[j];
        let aWins = 0;
        let bWins = 0;

        for (const hole of holes) {
          const scoreA = scores.find(
            (s) => s.holeId === hole.id && s.playerId === pA.id,
          );
          const scoreB = scores.find(
            (s) => s.holeId === hole.id && s.playerId === pB.id,
          );
          if (
            !scoreA ||
            !scoreB ||
            scoreA.strokes === 0 ||
            scoreB.strokes === 0
          )
            continue;

          const bGivesA = getHandicapForHole(
            game?.handicaps,
            hole.holeNumber,
            pB.id,
            pA.id,
          );
          const aGivesB = getHandicapForHole(
            game?.handicaps,
            hole.holeNumber,
            pA.id,
            pB.id,
          );

          const netA = scoreA.strokes - bGivesA;
          const netB = scoreB.strokes - aGivesB;

          if (netA < netB) aWins++;
          else if (netB < netA) bWins++;
        }

        const advantage = Math.abs(aWins - bWins);
        if (bWins > aWins) {
          pairs.push({ leader: pB, trailer: pA, advantage });
        } else {
          pairs.push({ leader: pA, trailer: pB, advantage });
        }
      }
    }

    return pairs;
  }, [players, holes, scores, game?.handicaps]);

  const getScoresByHoleId = useCallback(() => {
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
  }, [scores]);

  const getTotalPoints = useCallback(() => {
    return ScoreCalculator.calculateTotalPoints(
      holes,
      getScoresByHoleId(),
      players,
      game?.handicaps,
    );
  }, [holes, getScoresByHoleId, players, game?.handicaps]);

  const handleDownloadPDF = async () => {
    if (generatingPDF) return;

    try {
      setGeneratingPDF(true);
      await generateScorecardPDF({
        holes,
        scores,
        players,
        gameName: "Golf Game",
        courseName: game?.courseName,
        gameDate: game?.completedAt || game?.date,
        gameId: game?.id,
      });
    } catch (error: any) {
      console.error("Failed to generate PDF:", error);
      crossPlatformAlert(
        "PDF Generation Failed",
        error?.message || "Unable to generate scorecard PDF. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setGeneratingPDF(false);
    }
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  if (loading || players.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
        <Text style={styles.loadingText}>Loading results…</Text>
      </View>
    );
  }

  const scoresByHoleId = getScoresByHoleId();
  const totalPoints = getTotalPoints();
  const sortedPlayers = [...players].sort(
    (a, b) => (totalPoints[b.id] || 0) - (totalPoints[a.id] || 0),
  );
  const winner = sortedPlayers[0];
  const gameDate = game?.completedAt || game?.date;
  const dateLabel = gameDate
    ? new Date(gameDate).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : undefined;

  return (
    <View style={styles.container}>
      {showConfetti && (
        <View style={styles.confettiContainer}>
          {Array.from({ length: 18 }).map((_, i) => (
            <ConfettiParticle
              key={i}
              delay={i * 120}
              index={i}
              colors={colors}
            />
          ))}
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Editorial hero */}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Final round</Text>
          <Text style={styles.heroTitle}>Game complete</Text>
          <View style={styles.goldRule} />
          {dateLabel && <Text style={styles.heroMeta}>{dateLabel}</Text>}
          {game?.courseName && (
            <Text style={styles.heroCourse}>{game.courseName}</Text>
          )}
        </View>

        {/* Winner callout */}
        {winner && (
          <Card goldBorder style={styles.winnerCard}>
            <Text style={styles.winnerLabel}>Champion</Text>
            <Text style={styles.winnerName}>{winner.name}</Text>
            <View style={styles.winnerPointsRow}>
              <Text
                style={[
                  styles.winnerPoints,
                  (totalPoints[winner.id] || 0) > 0 && styles.positivePoints,
                  (totalPoints[winner.id] || 0) < 0 && styles.negativePoints,
                ]}
              >
                {(totalPoints[winner.id] || 0) > 0 ? "+" : ""}
                {(totalPoints[winner.id] || 0).toFixed(1)}
              </Text>
              <Text style={styles.winnerPointsLabel}>pts</Text>
            </View>
          </Card>
        )}

        {/* Final standings */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Final standings</Text>
          <Card style={styles.listCard}>
            {sortedPlayers.map((player, index) => {
              const points = totalPoints[player.id] || 0;
              const isLast = index === sortedPlayers.length - 1;
              return (
                <View
                  key={player.id}
                  style={[styles.listRow, !isLast && styles.listRowDivider]}
                >
                  <Text style={styles.listRank}>{index + 1}</Text>
                  <Text style={styles.listName} numberOfLines={1}>
                    {player.name}
                  </Text>
                  <Text
                    style={[
                      styles.listValue,
                      points > 0 && styles.positivePoints,
                      points < 0 && styles.negativePoints,
                    ]}
                  >
                    {points > 0 ? "+" : ""}
                    {points.toFixed(1)}
                  </Text>
                </View>
              );
            })}
          </Card>
        </View>

        {/* Total strokes */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Total strokes</Text>
          <Card style={styles.listCard}>
            {sortedPlayers.map((player, index) => {
              const playerTotalStrokes = holes.reduce((sum, hole) => {
                if (hole.confirmed === false) return sum;
                const score = scores.find(
                  (s) => s.playerId === player.id && s.holeId === hole.id,
                );
                return sum + (score?.strokes ?? hole.par);
              }, 0);
              const isLast = index === sortedPlayers.length - 1;
              return (
                <View
                  key={player.id}
                  style={[styles.listRow, !isLast && styles.listRowDivider]}
                >
                  <Text style={styles.listName} numberOfLines={1}>
                    {player.name}
                  </Text>
                  <Text style={styles.listStrokes}>{playerTotalStrokes}</Text>
                </View>
              );
            })}
          </Card>
        </View>

        {/* Handicaps */}
        {game?.handicaps && Object.keys(game.handicaps).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>Handicaps</Text>
            <Card style={styles.listCard}>
              {players.map((player, index) => {
                const opponents = players.filter((p) => p.id !== player.id);
                const handicapInfo = opponents
                  .map((opp) => {
                    const strokesGiven = getTotalHandicapForMatchup(
                      game.handicaps,
                      player.id,
                      opp.id,
                    );
                    const strokesReceived = getTotalHandicapForMatchup(
                      game.handicaps,
                      opp.id,
                      player.id,
                    );

                    if (strokesGiven > 0) {
                      return `Gives ${strokesGiven} to ${opp.name}`;
                    } else if (strokesReceived > 0) {
                      return `Receives ${strokesReceived} from ${opp.name}`;
                    }
                    return null;
                  })
                  .filter(Boolean);

                if (handicapInfo.length === 0) return null;
                const isLast = index === players.length - 1;

                return (
                  <View
                    key={player.id}
                    style={[
                      styles.handicapBlock,
                      !isLast && styles.listRowDivider,
                    ]}
                  >
                    <Text style={styles.handicapPlayerName}>{player.name}</Text>
                    {handicapInfo.map((info, idx) => (
                      <Text key={idx} style={styles.handicapText}>
                        {info}
                      </Text>
                    ))}
                  </View>
                );
              })}
            </Card>
          </View>
        )}

        {/* Head-to-head */}
        {headToHead.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>Head-to-head holes won</Text>
            <Card style={styles.listCard}>
              {headToHead.map(({ leader, trailer, advantage }, idx) => (
                <View
                  key={`${leader.id}_${trailer.id}`}
                  style={[
                    styles.h2hRow,
                    idx < headToHead.length - 1 && styles.listRowDivider,
                  ]}
                >
                  <View style={styles.h2hSide}>
                    <Text
                      style={[
                        styles.h2hName,
                        advantage > 0 && styles.h2hNameLeader,
                      ]}
                      numberOfLines={1}
                    >
                      {leader.name}
                    </Text>
                    <Text
                      style={[
                        styles.h2hScore,
                        advantage > 0 && styles.h2hScoreLeader,
                      ]}
                    >
                      {advantage}
                    </Text>
                  </View>
                  <Text style={styles.h2hDash}>—</Text>
                  <View style={[styles.h2hSide, styles.h2hSideRight]}>
                    <Text style={styles.h2hScore}>0</Text>
                    <Text style={styles.h2hName} numberOfLines={1}>
                      {trailer.name}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Scorecard */}
        <View style={styles.section}>
          <View style={styles.scorecardHeader}>
            <Text style={styles.sectionEyebrow}>Scorecard</Text>
            <Button
              title={generatingPDF ? "Generating…" : "Download PDF"}
              icon="download"
              variant="outline"
              size="small"
              onPress={handleDownloadPDF}
              disabled={generatingPDF}
            />
          </View>
          <View style={styles.scorecardContainer}>
            <ZoomableView
              style={styles.zoomableContainer}
              contentStyle={styles.zoomableContent}
              minScale={0.4}
              maxScale={2.5}
              initialScale={0.6}
              doubleTapScale={1.2}
            >
              <Scorecard
                holes={holes}
                scores={scores}
                players={players}
                courseName={game?.courseName}
              />
            </ZoomableView>
          </View>
          <Text style={styles.zoomHint}>
            Pinch to zoom · double-tap to reset
          </Text>
        </View>

        {/* Hole-by-hole points */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Hole-by-hole points</Text>
          <Card style={styles.listCard}>
            <View style={styles.holePointsHeaderRow}>
              <Text
                style={[
                  styles.holePointsCell,
                  styles.holePointsHoleCell,
                  styles.holePointsHeaderText,
                ]}
              >
                Hole
              </Text>
              {sortedPlayers.map((player) => (
                <Text
                  key={player.id}
                  style={[styles.holePointsCell, styles.holePointsHeaderText]}
                  numberOfLines={1}
                >
                  {player.name}
                </Text>
              ))}
            </View>
            {[...holes]
              .sort((a, b) => a.holeNumber - b.holeNumber)
              .map((hole) => {
                const isConfirmed = hole.confirmed !== false;
                const scoresForHole = scoresByHoleId[hole.id] || [];
                const pts = isConfirmed
                  ? ScoreCalculator.calculateHolePoints(
                      hole,
                      scoresForHole,
                      players,
                      game?.handicaps,
                    )
                  : null;
                return (
                  <View key={hole.id} style={styles.holePointsRow}>
                    <Text
                      style={[
                        styles.holePointsCell,
                        styles.holePointsHoleCell,
                        styles.holePointsHoleNum,
                      ]}
                    >
                      {hole.holeNumber}
                    </Text>
                    {sortedPlayers.map((player) => {
                      if (!pts) {
                        return (
                          <Text
                            key={player.id}
                            style={[
                              styles.holePointsCell,
                              styles.holePointsValue,
                            ]}
                          >
                            —
                          </Text>
                        );
                      }
                      const p = pts[player.id] || 0;
                      return (
                        <Text
                          key={player.id}
                          style={[
                            styles.holePointsCell,
                            styles.holePointsValue,
                            p > 0 && styles.positivePoints,
                            p < 0 && styles.negativePoints,
                          ]}
                        >
                          {p > 0 ? "+" : ""}
                          {p.toFixed(1)}
                        </Text>
                      );
                    })}
                  </View>
                );
              })}
            <View style={styles.holePointsTotalRow}>
              <Text
                style={[
                  styles.holePointsCell,
                  styles.holePointsHoleCell,
                  styles.holePointsTotalLabel,
                ]}
              >
                Total
              </Text>
              {sortedPlayers.map((player) => {
                const tp = totalPoints[player.id] || 0;
                return (
                  <Text
                    key={player.id}
                    style={[
                      styles.holePointsCell,
                      styles.holePointsTotalValue,
                      tp > 0 && styles.positivePoints,
                      tp < 0 && styles.negativePoints,
                    ]}
                  >
                    {tp > 0 ? "+" : ""}
                    {tp.toFixed(1)}
                  </Text>
                );
              })}
            </View>
          </Card>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          title="New game"
          variant="gold"
          fullWidth
          onPress={() => navigation.navigate("GameSetup")}
        />
        <Button
          title="Done"
          variant="outline"
          fullWidth
          onPress={() => navigation.navigate("HomeTab", { screen: "Home" })}
        />
      </View>
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
      ...typography.bodyMedium,
      color: colors.text.secondary,
      marginTop: spacing.md,
    },
    confettiContainer: {
      ...StyleSheet.absoluteFillObject,
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: 10,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xxxl,
      paddingBottom: spacing.xxl,
    },
    // Editorial hero
    hero: {
      marginBottom: spacing.xl,
    },
    eyebrow: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    heroTitle: {
      ...typography.displayMedium,
      color: colors.text.primary,
      marginBottom: spacing.md,
    },
    goldRule: {
      height: 1.5,
      width: 48,
      backgroundColor: colors.accent.gold,
      borderRadius: 1,
      marginBottom: spacing.md,
    },
    heroMeta: {
      ...typography.bodyMedium,
      color: colors.text.secondary,
      marginBottom: spacing.xs,
    },
    heroCourse: {
      ...typography.bodyMedium,
      color: colors.text.tertiary,
      fontStyle: "italic",
    },
    // Winner callout
    winnerCard: {
      alignItems: "center",
      padding: spacing.xl,
      marginBottom: spacing.xl,
    },
    winnerLabel: {
      ...typography.label,
      color: colors.accent.gold,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    winnerName: {
      ...typography.displayMedium,
      color: colors.text.primary,
      marginBottom: spacing.md,
    },
    winnerPointsRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: spacing.xs,
    },
    winnerPoints: {
      fontFamily: fontFamilies.monoBold,
      fontSize: 44,
      lineHeight: 50,
      color: colors.text.primary,
      letterSpacing: -0.8,
    },
    winnerPointsLabel: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
    },
    // Sections
    section: {
      marginBottom: spacing.xl,
    },
    sectionEyebrow: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    listCard: {
      padding: 0,
    },
    listRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    listRowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    listRank: {
      fontFamily: fontFamilies.display,
      fontSize: 18,
      color: colors.text.tertiary,
      minWidth: 20,
      letterSpacing: -0.3,
    },
    listName: {
      ...typography.bodyLarge,
      fontFamily: fontFamilies.bodyMedium,
      color: colors.text.primary,
      flex: 1,
    },
    listValue: {
      fontFamily: fontFamilies.monoBold,
      fontSize: 18,
      color: colors.text.primary,
      minWidth: 72,
      textAlign: "right",
    },
    listStrokes: {
      fontFamily: fontFamilies.monoBold,
      fontSize: 18,
      color: colors.accent.gold,
    },
    positivePoints: {
      color: colors.scoring.positive,
    },
    negativePoints: {
      color: colors.scoring.negative,
    },
    // Handicaps
    handicapBlock: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    handicapPlayerName: {
      ...typography.bodyMedium,
      fontFamily: fontFamilies.bodySemiBold,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    handicapText: {
      ...typography.bodySmall,
      color: colors.text.secondary,
      lineHeight: 20,
    },
    // Head-to-head
    h2hRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    h2hSide: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    h2hSideRight: {
      justifyContent: "flex-end",
    },
    h2hName: {
      ...typography.bodySmall,
      fontFamily: fontFamilies.bodyMedium,
      color: colors.text.primary,
      flexShrink: 1,
    },
    h2hNameLeader: {
      color: colors.accent.gold,
    },
    h2hScore: {
      fontFamily: fontFamilies.monoBold,
      fontSize: 18,
      color: colors.text.primary,
      minWidth: 24,
      textAlign: "center",
    },
    h2hScoreLeader: {
      color: colors.accent.gold,
    },
    h2hDash: {
      fontFamily: fontFamilies.mono,
      fontSize: 14,
      color: colors.text.tertiary,
    },
    // Scorecard
    scorecardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    scorecardContainer: {
      width: "100%",
      height: 350,
      marginTop: spacing.sm,
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.border.light,
      overflow: "hidden",
    },
    zoomableContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    zoomableContent: {
      padding: spacing.sm,
    },
    zoomHint: {
      ...typography.bodySmall,
      color: colors.text.tertiary,
      textAlign: "center",
      marginTop: spacing.sm,
      fontStyle: "italic",
    },
    // Hole-by-hole
    holePointsHeaderRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    holePointsHeaderText: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      textAlign: "center",
    },
    holePointsRow: {
      flexDirection: "row",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    holePointsTotalRow: {
      flexDirection: "row",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.goldSubtle,
    },
    holePointsCell: {
      flex: 1,
      textAlign: "center",
    },
    holePointsHoleCell: {
      flex: 0.6,
      textAlign: "left",
    },
    holePointsHoleNum: {
      fontFamily: fontFamilies.mono,
      fontSize: 12,
      color: colors.text.tertiary,
    },
    holePointsValue: {
      fontFamily: fontFamilies.mono,
      fontSize: 12,
      color: colors.text.primary,
    },
    holePointsTotalLabel: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      color: colors.text.primary,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    holePointsTotalValue: {
      fontFamily: fontFamilies.monoBold,
      fontSize: 13,
      color: colors.text.primary,
    },
    // Bottom
    bottomSpacer: {
      height: spacing.xl,
    },
    buttonContainer: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      backgroundColor: colors.background.primary,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      gap: spacing.sm,
    },
  });

export default GameSummaryScreen;
