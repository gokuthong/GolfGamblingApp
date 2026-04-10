import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../../components/common';
import { dataService } from '../../services/DataService';
import { Hole, Score, Player, Game } from '../../types';
import { typography, spacing } from '../../theme';
import { useThemedColors } from '../../contexts/ThemeContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ScoreCalculator } from '../../utils/scoreCalculator';

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

      // Load all data in parallel
      const [gameData, holesData, scoresData] = await Promise.all([
        dataService.getGame(gameId),
        dataService.getHolesForGame(gameId),
        dataService.getScoresForGame(gameId),
      ]);

      if (gameData) {
        setGame(gameData);
        setHoles(holesData);
        setScores(scoresData);

        // Load players
        const playersList = await dataService.getPlayersForGame(gameData);
        setPlayers(playersList);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading standings data:', error);
      setLoading(false);
    }
  }, [gameId]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getScoresByHoleId = () => {
    const byHole: Record<string, Score[]> = {};
    // Track unique player-hole combinations to prevent duplicates
    const seenPlayerHoles = new Set<string>();

    scores.forEach((score) => {
      const playerHoleKey = `${score.holeId}_${score.playerId}`;

      // Skip if we've already seen this player-hole combination
      if (seenPlayerHoles.has(playerHoleKey)) {
        return;
      }

      seenPlayerHoles.add(playerHoleKey);
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
      game?.handicaps
    );
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  if (loading || players.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const totalPoints = getTotalPoints();
  const sortedPlayers = [...players].sort((a, b) =>
    (totalPoints[b.id] || 0) - (totalPoints[a.id] || 0)
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Overall Standings</Text>
        <Text style={styles.subtitle}>Cumulative points across all holes</Text>

        <View style={styles.standingsContainer}>
          {sortedPlayers.map((player, index) => (
            <View key={player.id} style={styles.standingRow}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={[
                styles.points,
                totalPoints[player.id] > 0 ? styles.positive : null,
                totalPoints[player.id] < 0 ? styles.negative : null,
              ].filter(Boolean)}>
                {totalPoints[player.id] > 0 ? '+' : ''}
                {totalPoints[player.id]?.toFixed(1) || '0.0'}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          title="Back to Scoring"
          onPress={() => navigation.goBack()}
          fullWidth
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  standingsContainer: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: spacing.md,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rankText: {
    color: colors.text.inverse,
    fontWeight: '700',
    fontSize: 16,
  },
  playerName: {
    ...typography.h4,
    flex: 1,
    color: colors.text.primary,
  },
  points: {
    ...typography.h3,
    fontWeight: '700',
  },
  positive: {
    color: colors.scoring.positive,
  },
  negative: {
    color: colors.scoring.negative,
  },
  buttonContainer: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
  },
});
