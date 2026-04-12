import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Button } from "../../components/common";
import { dataService } from "../../services/DataService";
import { Hole, Score, Player, Game } from "../../types";
import { typography, spacing, fontFamilies, borderRadius } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ScoreCalculator } from "../../utils/scoreCalculator";

export const OverallStandingsScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const colors = useThemedColors();
  const { gameId } = route.params;

  const [game, setGame] = useState<Game | null>(null);
  const [holes, setHoles] = useState<Hole[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

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

  const styles = useMemo(() => createStyles(colors), [colors]);

  if (loading || players.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  const totalPoints = getTotalPoints();
  const sortedPlayers = [...players].sort(
    (a, b) => (totalPoints[b.id] || 0) - (totalPoints[a.id] || 0),
  );
  const leader = sortedPlayers[0];
  const leaderPoints = totalPoints[leader.id] || 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Leaderboard</Text>
          <Text style={styles.heroTitle}>Overall standings</Text>
          <View style={styles.goldRule} />
          <Text style={styles.heroMeta}>
            Cumulative points across every hole played.
          </Text>
        </View>

        <View style={styles.leaderCard}>
          <Text style={styles.leaderEyebrow}>Current leader</Text>
          <Text style={styles.leaderName}>{leader.name}</Text>
          <View style={styles.leaderPointsRow}>
            <Text
              style={[
                styles.leaderPoints,
                leaderPoints > 0 && styles.positive,
                leaderPoints < 0 && styles.negative,
              ]}
            >
              {leaderPoints > 0 ? "+" : ""}
              {leaderPoints.toFixed(1)}
            </Text>
            <Text style={styles.leaderPointsLabel}>pts</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Full standings</Text>
        <View style={styles.standingsContainer}>
          {sortedPlayers.map((player, index) => {
            const points = totalPoints[player.id] || 0;
            const isLeader = index === 0;
            const isLast = index === sortedPlayers.length - 1;

            return (
              <View
                key={player.id}
                style={[styles.standingRow, !isLast && styles.rowBorder]}
              >
                <Text
                  style={[styles.rankText, isLeader && styles.rankTextLeader]}
                >
                  {index + 1}
                </Text>
                <Text
                  style={[
                    styles.playerName,
                    isLeader && styles.playerNameLeader,
                  ]}
                  numberOfLines={1}
                >
                  {player.name}
                </Text>
                <Text
                  style={[
                    styles.points,
                    points > 0 ? styles.positive : null,
                    points < 0 ? styles.negative : null,
                  ].filter(Boolean)}
                >
                  {points > 0 ? "+" : ""}
                  {points.toFixed(1)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          title="Back to scoring"
          onPress={() => navigation.goBack()}
          variant="gold"
          fullWidth
          size="large"
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
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background.primary,
    },
    loadingText: {
      ...typography.bodyMedium,
      color: colors.text.secondary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xxxl,
      paddingBottom: spacing.xxl,
    },
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
      ...typography.bodyLarge,
      color: colors.text.secondary,
      maxWidth: 340,
    },
    leaderCard: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.xl,
      padding: spacing.xl,
      borderWidth: 1,
      borderColor: colors.border.goldSubtle,
      marginBottom: spacing.xl,
      alignItems: "center",
    },
    leaderEyebrow: {
      ...typography.label,
      color: colors.accent.gold,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
      letterSpacing: 1.2,
    },
    leaderName: {
      fontFamily: fontFamilies.display,
      fontSize: 28,
      color: colors.text.primary,
      letterSpacing: -0.5,
      marginBottom: spacing.sm,
    },
    leaderPointsRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: spacing.xs,
    },
    leaderPoints: {
      fontFamily: fontFamilies.monoBold,
      fontSize: 44,
      color: colors.text.primary,
      letterSpacing: -0.5,
    },
    leaderPointsLabel: {
      fontFamily: fontFamilies.mono,
      fontSize: typography.bodyMedium.fontSize,
      color: colors.text.tertiary,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    sectionLabel: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    standingsContainer: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.border.light,
      overflow: "hidden",
    },
    standingRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    rankText: {
      fontFamily: fontFamilies.display,
      fontSize: 20,
      color: colors.text.tertiary,
      width: 24,
      letterSpacing: -0.3,
    },
    rankTextLeader: {
      color: colors.accent.gold,
    },
    playerName: {
      ...typography.bodyLarge,
      fontFamily: fontFamilies.bodySemiBold,
      color: colors.text.primary,
      flex: 1,
    },
    playerNameLeader: {
      color: colors.accent.gold,
    },
    points: {
      fontFamily: fontFamilies.monoBold,
      fontSize: typography.h4.fontSize,
      color: colors.text.primary,
      letterSpacing: 0.3,
      minWidth: 64,
      textAlign: "right",
    },
    positive: {
      color: colors.scoring.positive,
    },
    negative: {
      color: colors.scoring.negative,
    },
    buttonContainer: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      backgroundColor: colors.background.primary,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
  });
