import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { crossPlatformAlert } from '../../utils/crossPlatformAlert';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Button, Card, Icon, ZoomableView } from '../../components/common';
import { Scorecard } from '../../components/scoring/Scorecard';
import { dataService } from '../../services/DataService';
import { firestoreService } from '../../services/firebase/firestore';
import { localStorageService } from '../../services/storage/LocalStorageService';
import { Hole, Score, Player, Game } from '../../types';
import { typography, spacing, fontFamilies, borderRadius } from '../../theme';
import { useThemedColors } from '../../contexts/ThemeContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ScoreCalculator } from '../../utils/scoreCalculator';
import { generateScorecardPDF } from '../../utils/pdfGenerator';
import { getTotalHandicapForMatchup, getHandicapForHole } from '../../utils/handicapUtils';
import { useStore } from '../../store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Confetti particle component
const ConfettiParticle = ({ delay, index, colors }: { delay: number; index: number; colors: any }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  const startX = (index % 10) * (SCREEN_WIDTH / 10) + Math.random() * 30;
  const isGold = index % 3 === 0;

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 100, {
        duration: 3000 + Math.random() * 2000,
        easing: Easing.linear,
      })
    );
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(30, { duration: 500 }),
          withTiming(-30, { duration: 500 })
        ),
        -1,
        true
      )
    );
    rotate.value = withDelay(
      delay,
      withRepeat(withTiming(360, { duration: 1000 }), -1)
    );
    opacity.value = withDelay(
      delay + 2000,
      withTiming(0, { duration: 1000 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
    left: startX,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 10,
          height: 10,
          borderRadius: 2,
        },
        animatedStyle,
        { backgroundColor: isGold ? colors.accent.gold : colors.primary[500] },
      ]}
    />
  );
};

// Removed podium component - replaced with simple standings

export const GameSummaryScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { gameId } = route.params;
  const colors = useThemedColors();
  const settings = useStore((state) => state.settings);

  const [game, setGame] = useState<Game | null>(null);
  const [holes, setHoles] = useState<Hole[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Trophy animation
  const trophyScale = useSharedValue(0);
  const trophyRotate = useSharedValue(0);

  useEffect(() => {
    trophyScale.value = withDelay(
      300,
      withSequence(
        withTiming(1.2, { duration: 400, easing: Easing.out(Easing.back) }),
        withTiming(1, { duration: 200 })
      )
    );
    trophyRotate.value = withDelay(
      300,
      withSequence(
        withTiming(-10, { duration: 100 }),
        withTiming(10, { duration: 200 }),
        withTiming(-5, { duration: 100 }),
        withTiming(0, { duration: 100 })
      )
    );

    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: trophyScale.value },
      { rotate: `${trophyRotate.value}deg` },
    ],
  }));

  useEffect(() => {
    Promise.all([
      dataService.getGame(gameId),
      // Fetch holes & scores from BOTH local and Firestore, then merge.
      // Local StoredGame can have incomplete data if sync was partial.
      localStorageService.getHolesForGame(gameId),
      firestoreService.getHolesForGame(gameId).catch(() => [] as Hole[]),
      localStorageService.getScoresForGame(gameId),
      firestoreService.getScoresForGame(gameId).catch(() => [] as Score[]),
    ]).then(async ([gameData, localHoles, fsHoles, localScores, fsScores]) => {
      // Merge holes: deduplicate by id, prefer larger set
      const holeMap = new Map<string, Hole>();
      for (const h of localHoles) holeMap.set(h.id, h);
      for (const h of fsHoles) holeMap.set(h.id, h);
      setHoles(Array.from(holeMap.values()).sort((a, b) => a.holeNumber - b.holeNumber));

      // Merge scores: deduplicate by id, prefer larger set
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

  // Calculate head-to-head holes won for each player pair
  // Uses match-play "up" notation: shows net advantage (difference in holes won).
  // The leading player is always listed first. Ties show as 0-0.
  const headToHead = useMemo(() => {
    if (players.length < 2 || holes.length === 0) return [];

    const pairs: Array<{
      leader: Player;
      trailer: Player;
      advantage: number; // net holes the leader is "up" (always >= 0)
    }> = [];

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const pA = players[i];
        const pB = players[j];
        let aWins = 0;
        let bWins = 0;

        for (const hole of holes) {
          const scoreA = scores.find(s => s.holeId === hole.id && s.playerId === pA.id);
          const scoreB = scores.find(s => s.holeId === hole.id && s.playerId === pB.id);
          if (!scoreA || !scoreB || scoreA.strokes === 0 || scoreB.strokes === 0) continue;

          // Handicap: strokes B gives to A on this hole (reduces A's net score)
          const bGivesA = getHandicapForHole(game?.handicaps, hole.holeNumber, pB.id, pA.id);
          // Handicap: strokes A gives to B on this hole (reduces B's net score)
          const aGivesB = getHandicapForHole(game?.handicaps, hole.holeNumber, pA.id, pB.id);

          const netA = scoreA.strokes - bGivesA;
          const netB = scoreB.strokes - aGivesB;

          if (netA < netB) aWins++;
          else if (netB < netA) bWins++;
          // ties: neither player gains a hole
        }

        const advantage = Math.abs(aWins - bWins);
        if (bWins > aWins) {
          // B is leading — put B first
          pairs.push({ leader: pB, trailer: pA, advantage });
        } else {
          // A is leading or tied — keep original order
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
      game?.handicaps
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
        gameName: 'Golf Game',
        courseName: game?.courseName,
        gameDate: game?.completedAt || game?.date,
        gameId: game?.id,
      });
    } catch (error: any) {
      console.error('Failed to generate PDF:', error);
      crossPlatformAlert(
        'PDF Generation Failed',
        error?.message || 'Unable to generate scorecard PDF. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Create styles before early returns to avoid undefined errors
  const styles = createStyles(colors);

  if (loading || players.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[colors.primary[900], colors.background.primary]}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={colors.accent.gold} />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  const scoresByHoleId = getScoresByHoleId();
  const totalPoints = getTotalPoints();
  const sortedPlayers = [...players].sort((a, b) =>
    (totalPoints[b.id] || 0) - (totalPoints[a.id] || 0)
  );

  return (
    <View style={styles.container}>
      {/* Gradient background */}
      <LinearGradient
        colors={
          settings.darkMode
            ? [colors.primary[900], colors.background.primary, colors.background.primary]
            : [colors.primary[300], colors.background.primary, colors.background.primary]
        }
        locations={[0, 0.3, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Confetti particles */}
      {showConfetti && (
        <View style={styles.confettiContainer}>
          {Array.from({ length: 30 }).map((_, i) => (
            <ConfettiParticle key={i} delay={i * 100} index={i} colors={colors} />
          ))}
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Game Complete Header */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          style={styles.headerSection}
        >
          <Animated.View style={[styles.trophyContainer, trophyStyle]}>
            <Icon name="flag-checkered" size={32} color={colors.accent.gold} />
          </Animated.View>
          <Text style={styles.gameCompleteLabel}>GAME COMPLETE</Text>
        </Animated.View>

        {/* Cumulative Standings */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(600)}
          style={styles.standingsSection}
        >
          <Text style={styles.sectionTitle}>Final Standings</Text>
          <Card glass style={styles.standingsCard}>
            {sortedPlayers.map((player, index) => {
              const points = totalPoints[player.id] || 0;
              const isWinner = index === 0;

              return (
                <View
                  key={player.id}
                  style={[
                    styles.standingsRow,
                    isWinner && styles.standingsRowWinner,
                  ]}
                >
                  <View style={styles.standingsRankContainer}>
                    {isWinner && (
                      <Icon name="trophy" size={20} color={colors.accent.gold} style={styles.trophyIcon} />
                    )}
                    <Text style={[
                      styles.standingsRank,
                      isWinner && styles.standingsRankWinner,
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={[
                    styles.standingsPlayerName,
                    isWinner && styles.standingsPlayerNameWinner,
                  ]}>
                    {player.name}
                  </Text>
                  <Text style={[
                    styles.standingsPoints,
                    isWinner && styles.standingsPointsWinner,
                    points > 0 && styles.positivePoints,
                    points < 0 && styles.negativePoints,
                  ]}>
                    {points > 0 ? '+' : ''}{points.toFixed(1)}
                  </Text>
                </View>
              );
            })}
          </Card>
        </Animated.View>

        {/* Total Strokes Summary */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(500)}
          style={styles.strokesSummarySection}
        >
          <Text style={styles.sectionTitle}>Total Strokes</Text>
          <Card glass style={styles.strokesSummaryCard}>
            {sortedPlayers.map((player) => {
              // Calculate total strokes for this player across confirmed holes only
              const playerTotalStrokes = holes.reduce((sum, hole) => {
                if (hole.confirmed === false) return sum;
                const score = scores.find(s => s.playerId === player.id && s.holeId === hole.id);
                return sum + (score?.strokes ?? hole.par);
              }, 0);

              return (
                <View key={player.id} style={styles.strokesRow}>
                  <Text style={styles.strokesPlayerName}>{player.name}</Text>
                  <Text style={styles.strokesValue}>{playerTotalStrokes}</Text>
                </View>
              );
            })}
          </Card>
        </Animated.View>

        {/* Handicaps Summary */}
        {game?.handicaps && Object.keys(game.handicaps).length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(550).duration(500)}
            style={styles.handicapsSummarySection}
          >
            <Text style={styles.sectionTitle}>Handicaps</Text>
            <Card glass style={styles.handicapsSummaryCard}>
              {players.map((player) => {
                const opponents = players.filter(p => p.id !== player.id);
                const handicapInfo = opponents.map(opp => {
                  const strokesGiven = getTotalHandicapForMatchup(game.handicaps, player.id, opp.id);
                  const strokesReceived = getTotalHandicapForMatchup(game.handicaps, opp.id, player.id);

                  if (strokesGiven > 0) {
                    return `Gives ${strokesGiven} to ${opp.name}`;
                  } else if (strokesReceived > 0) {
                    return `Receives ${strokesReceived} from ${opp.name}`;
                  }
                  return null;
                }).filter(Boolean);

                if (handicapInfo.length === 0) return null;

                return (
                  <View key={player.id} style={styles.handicapRow}>
                    <Text style={styles.handicapPlayerName}>{player.name}:</Text>
                    <View style={styles.handicapDetails}>
                      {handicapInfo.map((info, idx) => (
                        <Text key={idx} style={styles.handicapText}>{info}</Text>
                      ))}
                    </View>
                  </View>
                );
              })}
            </Card>
          </Animated.View>
        )}

        {/* Head-to-Head Holes Won */}
        {headToHead.length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(575).duration(500)}
            style={styles.h2hSection}
          >
            <Text style={styles.sectionTitle}>Head-to-Head Holes Won</Text>
            <Card glass style={styles.h2hCard}>
              {headToHead.map(({ leader, trailer, advantage }, idx) => (
                <View
                  key={`${leader.id}_${trailer.id}`}
                  style={[
                    styles.h2hRow,
                    idx < headToHead.length - 1 && styles.h2hRowBorder,
                  ]}
                >
                  <View style={styles.h2hPlayerSide}>
                    <Text style={[
                      styles.h2hPlayerName,
                      advantage > 0 && styles.h2hPlayerNameWinner,
                    ]} numberOfLines={1}>
                      {leader.name}
                    </Text>
                    <Text style={[
                      styles.h2hWins,
                      advantage > 0 && styles.h2hWinsHighlight,
                    ]}>
                      {advantage}
                    </Text>
                  </View>

                  <View style={styles.h2hCenter}>
                    <Text style={styles.h2hDash}>-</Text>
                  </View>

                  <View style={[styles.h2hPlayerSide, styles.h2hPlayerSideRight]}>
                    <Text style={styles.h2hWins}>
                      0
                    </Text>
                    <Text style={styles.h2hPlayerName} numberOfLines={1}>
                      {trailer.name}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </Animated.View>
        )}

        {/* Scorecard */}
        <Animated.View
          entering={FadeIn.delay(600).duration(500)}
          style={styles.breakdownSection}
        >
          <View style={styles.scorecardHeader}>
            <Text style={styles.sectionTitle}>Scorecard</Text>
            <Button
              title={generatingPDF ? "Generating..." : "Download PDF"}
              icon="download"
              variant="outline"
              size="small"
              onPress={handleDownloadPDF}
              disabled={generatingPDF}
              style={styles.downloadButton}
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
              <Scorecard holes={holes} scores={scores} players={players} courseName={game?.courseName} />
            </ZoomableView>
          </View>
          <Text style={styles.zoomHint}>Pinch to zoom, double-tap to reset</Text>
        </Animated.View>

        {/* Hole-by-Hole Points */}
        <Animated.View
          entering={FadeInUp.delay(700).duration(500)}
          style={styles.holePointsSection}
        >
          <Text style={styles.sectionTitle}>Hole-by-Hole Points</Text>
          <Card glass style={styles.holePointsCard}>
            {/* Header row */}
            <View style={styles.holePointsHeaderRow}>
              <Text style={[styles.holePointsCell, styles.holePointsHoleCell, styles.holePointsHeaderText]}>Hole</Text>
              {sortedPlayers.map((player) => (
                <Text key={player.id} style={[styles.holePointsCell, styles.holePointsHeaderText]} numberOfLines={1}>
                  {player.name}
                </Text>
              ))}
            </View>
            {/* Hole rows */}
            {[...holes].sort((a, b) => a.holeNumber - b.holeNumber).map((hole) => {
              const isConfirmed = hole.confirmed !== false;
              const scoresForHole = scoresByHoleId[hole.id] || [];
              const pts = isConfirmed
                ? ScoreCalculator.calculateHolePoints(hole, scoresForHole, players, game?.handicaps)
                : null;
              return (
                <View key={hole.id} style={[styles.holePointsRow, hole.holeNumber % 2 === 0 && styles.holePointsRowAlt]}>
                  <Text style={[styles.holePointsCell, styles.holePointsHoleCell, styles.holePointsHoleNum]}>{hole.holeNumber}</Text>
                  {sortedPlayers.map((player) => {
                    if (!pts) {
                      return (
                        <Text key={player.id} style={[styles.holePointsCell, styles.holePointsValue]}>-</Text>
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
                        {p > 0 ? '+' : ''}{p.toFixed(1)}
                      </Text>
                    );
                  })}
                </View>
              );
            })}
            {/* Total row */}
            <View style={styles.holePointsTotalRow}>
              <Text style={[styles.holePointsCell, styles.holePointsHoleCell, styles.holePointsTotalLabel]}>Total</Text>
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
                    {tp > 0 ? '+' : ''}{tp.toFixed(1)}
                  </Text>
                );
              })}
            </View>
          </Card>
        </Animated.View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title="New Game"
          variant="gold"
          glow
          fullWidth
          onPress={() => navigation.navigate('GameSetup')}
          style={styles.newGameButton}
        />
        <Button
          title="Done"
          variant="outline"
          fullWidth
          onPress={() => navigation.navigate('HomeTab', { screen: 'Home' })}
        />
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  confettiParticle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  // Header section
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  trophyContainer: {
    marginBottom: spacing.xs,
  },
  gameCompleteLabel: {
    fontFamily: fontFamilies.display,
    fontSize: 16,
    color: colors.accent.gold,
    letterSpacing: 3,
  },
  // Standings section
  standingsSection: {
    marginBottom: spacing.xl,
  },
  standingsCard: {
    padding: spacing.md,
  },
  standingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  standingsRowWinner: {
    backgroundColor: colors.glass.medium,
    borderBottomColor: colors.border.gold,
    borderBottomWidth: 2,
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  standingsRankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 50,
    gap: spacing.xs,
  },
  trophyIcon: {
    marginRight: spacing.xs,
  },
  standingsRank: {
    fontFamily: fontFamilies.display,
    fontSize: 24,
    color: colors.text.tertiary,
    minWidth: 30,
  },
  standingsRankWinner: {
    color: colors.accent.gold,
    fontSize: 28,
  },
  standingsPlayerName: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.bodyLarge.fontSize,
    color: colors.text.primary,
    flex: 1,
  },
  standingsPlayerNameWinner: {
    fontSize: typography.h4.fontSize,
    color: colors.accent.gold,
  },
  standingsPoints: {
    fontFamily: fontFamilies.monoBold,
    fontSize: typography.h4.fontSize,
    color: colors.text.primary,
    minWidth: 80,
    textAlign: 'right',
  },
  standingsPointsWinner: {
    fontSize: typography.h3.fontSize,
    color: colors.accent.gold,
  },
  positivePoints: {
    color: colors.scoring.positive,
  },
  negativePoints: {
    color: colors.scoring.negative,
  },
  // Total strokes summary
  strokesSummarySection: {
    marginBottom: spacing.xl,
  },
  strokesSummaryCard: {
    padding: spacing.md,
  },
  strokesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  strokesPlayerName: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.primary,
  },
  strokesValue: {
    fontFamily: fontFamilies.mono,
    fontSize: typography.bodyLarge.fontSize,
    color: colors.accent.gold,
  },
  // Handicaps summary
  handicapsSummarySection: {
    marginBottom: spacing.xl,
  },
  handicapsSummaryCard: {
    padding: spacing.md,
  },
  handicapRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  handicapPlayerName: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  handicapDetails: {
    paddingLeft: spacing.md,
  },
  handicapText: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  // Head-to-Head
  h2hSection: {
    marginBottom: spacing.xl,
  },
  h2hCard: {
    padding: spacing.md,
  },
  h2hRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  h2hRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  h2hPlayerSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  h2hPlayerSideRight: {
    justifyContent: 'flex-end',
  },
  h2hPlayerName: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.primary,
    flexShrink: 1,
  },
  h2hPlayerNameWinner: {
    color: colors.scoring.positive,
  },
  h2hWins: {
    fontFamily: fontFamilies.monoBold,
    fontSize: typography.h4.fontSize,
    color: colors.text.primary,
    minWidth: 24,
    textAlign: 'center',
  },
  h2hWinsHighlight: {
    color: colors.scoring.positive,
  },
  h2hCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    minWidth: 24,
  },
  h2hDash: {
    fontFamily: fontFamilies.monoBold,
    fontSize: typography.h4.fontSize,
    color: colors.text.secondary,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.h4.fontSize,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  // Breakdown section
  breakdownSection: {
    marginBottom: spacing.lg,
  },
  scorecardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  downloadButton: {
    minWidth: 120,
  },
  scorecardContainer: {
    width: '100%',
    height: 350,
    marginTop: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  zoomableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomableContent: {
    padding: spacing.sm,
  },
  zoomHint: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  // Bottom
  bottomSpacer: {
    height: spacing.xxl,
  },
  buttonContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.sm,
  },
  newGameButton: {
    marginBottom: spacing.xs,
  },
  // Hole-by-Hole Points
  holePointsSection: {
    marginBottom: spacing.lg,
  },
  holePointsCard: {
    padding: spacing.sm,
  },
  holePointsHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: colors.border.medium,
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
  },
  holePointsHeaderText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 11,
    color: colors.accent.gold,
    textTransform: 'uppercase',
  },
  holePointsRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  holePointsRowAlt: {
    backgroundColor: colors.glass.light,
  },
  holePointsTotalRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.border.medium,
    marginTop: spacing.xs,
  },
  holePointsCell: {
    flex: 1,
    textAlign: 'center',
  },
  holePointsHoleCell: {
    flex: 0.6,
    textAlign: 'left',
    paddingLeft: spacing.xs,
  },
  holePointsHoleNum: {
    fontFamily: fontFamilies.mono,
    fontSize: 12,
    color: colors.text.secondary,
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
  },
  holePointsTotalValue: {
    fontFamily: fontFamilies.monoBold,
    fontSize: 13,
    color: colors.text.primary,
  },
});

export default GameSummaryScreen;
