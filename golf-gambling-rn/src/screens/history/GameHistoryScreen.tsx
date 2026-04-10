import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { crossPlatformAlert } from '../../utils/crossPlatformAlert';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../../types';
import { dataService } from '../../services/DataService';
import { useStore } from '../../store';
import { typography, spacing } from '../../theme';
import { useThemedColors } from '../../contexts/ThemeContext';
import { Game, Player, Score, Hole } from '../../types';
import { ScoreCalculator } from '../../utils/scoreCalculator';

type GameHistoryNavigationProp = NativeStackNavigationProp<HistoryStackParamList, 'GameHistory'>;

interface GameWithDetails {
  game: Game;
  players: Player[];
  winner: Player | null;
  finalPoints: Record<string, number>;
  totalStrokes: Record<string, number>;
}

export const GameHistoryScreen = () => {
  const navigation = useNavigation<GameHistoryNavigationProp>();
  const user = useStore((state) => state.user);
  const colors = useThemedColors();
  const [games, setGames] = useState<Game[]>([]);
  const [gamesWithDetails, setGamesWithDetails] = useState<GameWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsRefreshTrigger, setDetailsRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!user || !user.uid) {
      console.log('GameHistoryScreen: No user or uid found', { user });
      setLoading(false);
      return;
    }

    const loadGames = async () => {
      try {
        console.log('GameHistoryScreen: Loading games for user', user.uid);

        // Auto-delete games older than 14 days
        await dataService.deleteGamesOlderThan(user.uid, 14);

        // Enforce 5-game limit
        await dataService.enforceGameLimit(user.uid, 5);

        // Load completed games
        const allGames = await dataService.getGamesForUser(user.uid);
        console.log('GameHistoryScreen: Found games', allGames.length);

        const completedGames = allGames
          .filter(game => game.status === 'completed')
          .sort((a, b) => {
            const aTime = a.completedAt?.getTime() || 0;
            const bTime = b.completedAt?.getTime() || 0;
            return bTime - aTime; // descending order (most recent first)
          })
          .slice(0, 5); // Only show max 5 games

        console.log('GameHistoryScreen: Completed games', completedGames.length);
        setGames(completedGames);
        setLoading(false);
        setRefreshing(false);
      } catch (error) {
        console.error('Failed to load games:', error);
        setLoading(false);
        setRefreshing(false);
      }
    };

    loadGames();
  }, [user]);

  // Reload game details when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Trigger a reload of game details
      setDetailsRefreshTrigger(prev => prev + 1);
    }, [])
  );

  // Load details for each game (players, scores, etc.)
  useEffect(() => {
    const loadGameDetails = async () => {
      const detailsPromises = games.map(async (game) => {
        const details = await dataService.getGameWithDetails(game.id);
        if (!details) {
          return null;
        }

        const { players, holes, scores } = details;

        // Calculate final points for each player
        const finalPoints: Record<string, number> = {};
        const totalStrokes: Record<string, number> = {};
        game.playerIds.forEach(playerId => {
          finalPoints[playerId] = 0;
          totalStrokes[playerId] = 0;
        });

        holes.forEach(hole => {
          const holeScores = scores.filter(s => s.holeId === hole.id);
          const holePoints = ScoreCalculator.calculateHolePoints(hole, holeScores, players, game.handicaps);

          Object.keys(holePoints).forEach(playerId => {
            finalPoints[playerId] = (finalPoints[playerId] || 0) + holePoints[playerId];
          });

          // Calculate total strokes for each player
          game.playerIds.forEach(playerId => {
            const score = holeScores.find(s => s.playerId === playerId);
            totalStrokes[playerId] += score?.strokes ?? hole.par;
          });
        });

        // Determine winner (player with highest points)
        let winner: Player | null = null;
        let maxPoints = -Infinity;

        players.forEach(player => {
          const points = finalPoints[player.id];
          if (points > maxPoints) {
            maxPoints = points;
            winner = player;
          }
        });

        return {
          game,
          players,
          winner,
          finalPoints,
          totalStrokes,
        };
      });

      const results = await Promise.all(detailsPromises);
      setGamesWithDetails(results.filter((r): r is GameWithDetails => r !== null));
    };

    if (games.length > 0) {
      loadGameDetails();
    } else {
      setGamesWithDetails([]);
    }
  }, [games, detailsRefreshTrigger]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (!user) return;

    try {
      // Reload games
      const allGames = await dataService.getGamesForUser(user.uid);
      const completedGames = allGames
        .filter(game => game.status === 'completed')
        .sort((a, b) => {
          const aTime = a.completedAt?.getTime() || 0;
          const bTime = b.completedAt?.getTime() || 0;
          return bTime - aTime;
        })
        .slice(0, 5);

      setGames(completedGames);
      setRefreshing(false);
    } catch (error) {
      console.error('Failed to refresh games:', error);
      setRefreshing(false);
    }
  };

  const handleGamePress = (gameId: string) => {
    crossPlatformAlert(
      'Game Options',
      'What would you like to do?',
      [
        {
          text: 'View Summary',
          onPress: () => navigation.navigate('GameSummary', { gameId }),
        },
        {
          text: 'Edit Scores',
          onPress: () => {
            // Navigate to Scoring screen to edit a finished game
            // Note: Navigation from HistoryStack to HomeStack
            (navigation as any).navigate('HomeTab', {
              screen: 'Scoring',
              params: { gameId, isEditingFinished: true },
            });
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleDeleteGame = (gameId: string, gameDateText: string) => {
    crossPlatformAlert(
      'Delete Game',
      `Are you sure you want to delete the game from ${gameDateText}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataService.deleteGame(gameId);
              // Reload games after deletion
              if (user) {
                const allGames = await dataService.getGamesForUser(user.uid);
                const completedGames = allGames
                  .filter(game => game.status === 'completed')
                  .sort((a, b) => {
                    const aTime = a.completedAt?.getTime() || 0;
                    const bTime = b.completedAt?.getTime() || 0;
                    return bTime - aTime;
                  })
                  .slice(0, 5);
                setGames(completedGames);
              }
            } catch (error) {
              console.error('Failed to delete game:', error);
              crossPlatformAlert('Error', 'Failed to delete game');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const renderGameCard = ({ item }: { item: GameWithDetails }) => {
    const { game, players, winner, finalPoints, totalStrokes } = item;
    const gameDateText = game.completedAt ? formatDate(game.completedAt) : formatDate(game.date);

    return (
      <TouchableOpacity
        style={styles.gameCard}
        onPress={() => handleGamePress(game.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.dateText}>
              {gameDateText}
            </Text>
            {winner && (
              <View style={styles.winnerBadge}>
                <Text style={styles.winnerBadgeText}>🏆 {winner.name}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteGame(game.id, gameDateText)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="delete" size={20} color={colors.error || '#D32F2F'} />
          </TouchableOpacity>
        </View>

        <View style={styles.playersSection}>
          <Text style={styles.playersLabel}>Players:</Text>
          <View style={styles.playersList}>
            {players.map((player, index) => (
              <Text key={player.id} style={styles.playerName}>
                {player.name}
                {index < players.length - 1 && ', '}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.scoresSection}>
          <Text style={styles.scoresLabel}>Final Scores:</Text>
          <View style={styles.scoresList}>
            {players
              .sort((a, b) => (finalPoints[b.id] || 0) - (finalPoints[a.id] || 0))
              .map(player => {
                const points = finalPoints[player.id] || 0;
                const strokes = totalStrokes[player.id] || 0;
                const isWinner = player.id === winner?.id;

                return (
                  <View key={player.id} style={styles.scoreRow}>
                    <Text style={[styles.scorePlayerName, isWinner && styles.winnerText]}>
                      {player.name}
                    </Text>
                    <View style={styles.scoreValues}>
                      <Text style={[styles.scoreStrokes, isWinner && styles.winnerText]}>
                        {strokes} strokes
                      </Text>
                      <Text
                        style={[
                          styles.scorePoints,
                          isWinner && styles.winnerText,
                          points > 0 && styles.positivePoints,
                          points < 0 && styles.negativePoints,
                        ]}
                      >
                        {points > 0 ? '+' : ''}{points} pts
                      </Text>
                    </View>
                  </View>
                );
              })}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={styles.emptyTitle}>No Games Yet</Text>
      <Text style={styles.emptyMessage}>
        Complete a game to see your history here
      </Text>
    </View>
  );

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading games...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={gamesWithDetails}
        renderItem={renderGameCard}
        keyExtractor={(item) => item.game.id}
        contentContainerStyle={[
          styles.listContent,
          gamesWithDetails.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary[500]}
              colors={[colors.primary[500]]}
            />
          ) : undefined
        }
      />
    </SafeAreaView>
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
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  listContent: {
    padding: spacing.lg,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  gameCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  dateText: {
    ...typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  winnerBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  winnerBadgeText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.primary[700],
  },
  playersSection: {
    marginBottom: spacing.md,
  },
  playersLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  playersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  playerName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  scoresSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.md,
  },
  scoresLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  scoresList: {
    gap: spacing.xs,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  scorePlayerName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  scoreValues: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  scoreStrokes: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  scorePoints: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.text.primary,
    minWidth: 60,
    textAlign: 'right',
  },
  winnerText: {
    color: colors.primary[600],
    fontWeight: '700',
  },
  positivePoints: {
    color: colors.scoring.positive,
  },
  negativePoints: {
    color: colors.scoring.negative,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
