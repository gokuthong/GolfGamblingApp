import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Menu, Divider } from "react-native-paper";
import { crossPlatformAlert } from "../../utils/crossPlatformAlert";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HistoryStackParamList } from "../../types";
import { dataService } from "../../services/DataService";
import { useStore } from "../../store";
import { typography, spacing, fontFamilies, borderRadius } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";
import { Game, Player } from "../../types";
import { ScoreCalculator } from "../../utils/scoreCalculator";

type GameHistoryNavigationProp = NativeStackNavigationProp<
  HistoryStackParamList,
  "GameHistory"
>;

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
  const [gamesWithDetails, setGamesWithDetails] = useState<GameWithDetails[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuGameId, setMenuGameId] = useState<string | null>(null);

  const loadGames = useCallback(async () => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }

    try {
      await dataService.deleteGamesOlderThan(user.uid, 14);
      await dataService.enforceGameLimit(user.uid, 5);

      const allGames = await dataService.getGamesForUser(user.uid);
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

  useFocusEffect(
    useCallback(() => {
      loadGames();
    }, [loadGames]),
  );

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
    if (!user) return;

    try {
      const allGames = await dataService.getGamesForUser(user.uid);
      const completedGames = allGames
        .filter((game) => game.status === "completed")
        .sort((a, b) => {
          const aTime = a.completedAt?.getTime() || 0;
          const bTime = b.completedAt?.getTime() || 0;
          return bTime - aTime;
        })
        .slice(0, 5);

      setGames(completedGames);
      setRefreshing(false);
    } catch (error) {
      console.error("Failed to refresh games:", error);
      setRefreshing(false);
    }
  };

  const handleViewSummary = (gameId: string) => {
    setMenuGameId(null);
    navigation.navigate("GameSummary", { gameId });
  };

  const handleEditScores = (gameId: string) => {
    setMenuGameId(null);
    (navigation as any).navigate("HomeTab", {
      screen: "Scoring",
      params: { gameId, isEditingFinished: true },
    });
  };

  const handleDeleteGame = async (gameId: string, gameDateText: string) => {
    setMenuGameId(null);
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
                const allGames = await dataService.getGamesForUser(user.uid);
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

  const styles = useMemo(() => createStyles(colors), [colors]);

  const renderGameCard = ({ item }: { item: GameWithDetails }) => {
    const { game, players, winner, finalPoints, totalStrokes } = item;
    const gameDateText = game.completedAt
      ? formatDate(game.completedAt)
      : formatDate(game.date);
    const sortedPlayers = [...players].sort(
      (a, b) => (finalPoints[b.id] || 0) - (finalPoints[a.id] || 0),
    );

    return (
      <TouchableOpacity
        style={styles.gameCard}
        onPress={() => handleViewSummary(game.id)}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.dateEyebrow}>Completed</Text>
            <Text style={styles.dateText}>{gameDateText}</Text>
            {winner && (
              <View style={styles.winnerRow}>
                <View style={styles.winnerDot} />
                <Text style={styles.winnerLabel}>Champion</Text>
                <Text style={styles.winnerName}>{winner.name}</Text>
              </View>
            )}
          </View>
          <Menu
            visible={menuGameId === game.id}
            onDismiss={() => setMenuGameId(null)}
            anchor={
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() =>
                  setMenuGameId(menuGameId === game.id ? null : game.id)
                }
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name="dots-vertical"
                  size={20}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            }
            contentStyle={[
              styles.menuContent,
              { backgroundColor: colors.background.card },
            ]}
          >
            <Menu.Item
              onPress={() => handleViewSummary(game.id)}
              title="View summary"
              leadingIcon="clipboard-text-outline"
            />
            <Menu.Item
              onPress={() => handleEditScores(game.id)}
              title="Edit scores"
              leadingIcon="pencil-outline"
            />
            <Divider />
            <Menu.Item
              onPress={() => handleDeleteGame(game.id, gameDateText)}
              title="Delete"
              leadingIcon="delete-outline"
              titleStyle={{ color: colors.scoring.negative }}
            />
          </Menu>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Final scores</Text>
        <View style={styles.scoresList}>
          {sortedPlayers.map((player, idx) => {
            const points = finalPoints[player.id] || 0;
            const strokes = totalStrokes[player.id] || 0;
            const isWinner = player.id === winner?.id;

            return (
              <View key={player.id} style={styles.scoreRow}>
                <Text style={styles.rankNumber}>{idx + 1}</Text>
                <Text
                  style={[
                    styles.scorePlayerName,
                    isWinner && styles.winnerText,
                  ]}
                  numberOfLines={1}
                >
                  {player.name}
                </Text>
                <Text style={styles.scoreStrokes}>{strokes}</Text>
                <Text
                  style={[
                    styles.scorePoints,
                    points > 0 && styles.positivePoints,
                    points < 0 && styles.negativePoints,
                  ]}
                >
                  {points > 0 ? "+" : ""}
                  {points}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.viewSummaryRow}>
          <Text style={styles.viewSummaryText}>View full summary</Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={14}
            color={colors.accent.gold}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <MaterialCommunityIcons
          name="history"
          size={32}
          color={colors.accent.gold}
        />
      </View>
      <Text style={styles.emptyTitle}>No games yet</Text>
      <Text style={styles.emptyMessage}>
        Complete a game to see your history here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
        <Text style={styles.loadingText}>Loading games…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Archive</Text>
        <Text style={styles.headerTitle}>Game history</Text>
        <View style={styles.goldRule} />
        <Text style={styles.headerSubtitle}>
          Your last five completed rounds
        </Text>
      </View>
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
          Platform.OS !== "web" ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent.gold}
              colors={[colors.accent.gold]}
            />
          ) : undefined
        }
      />
    </SafeAreaView>
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
    header: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xxxl,
      paddingBottom: spacing.lg,
    },
    eyebrow: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    headerTitle: {
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
    headerSubtitle: {
      ...typography.bodyLarge,
      color: colors.text.secondary,
    },
    listContent: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xxl,
    },
    emptyListContent: {
      flexGrow: 1,
      justifyContent: "center",
    },
    gameCard: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: spacing.md,
    },
    cardHeaderLeft: {
      flex: 1,
    },
    dateEyebrow: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginBottom: spacing.xs,
    },
    dateText: {
      fontFamily: fontFamilies.display,
      fontSize: 22,
      color: colors.text.primary,
      letterSpacing: -0.4,
      marginBottom: spacing.sm,
    },
    winnerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    winnerDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent.gold,
    },
    winnerLabel: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
    },
    winnerName: {
      ...typography.bodySmall,
      fontFamily: fontFamilies.bodySemiBold,
      color: colors.accent.gold,
      marginLeft: spacing.xs,
    },
    menuButton: {
      padding: spacing.xs,
    },
    menuContent: {
      borderRadius: borderRadius.md,
      minWidth: 180,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border.light,
      marginBottom: spacing.md,
    },
    sectionLabel: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    scoresList: {
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    scoreRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.xs,
      gap: spacing.sm,
    },
    rankNumber: {
      fontFamily: fontFamilies.display,
      fontSize: 16,
      color: colors.text.tertiary,
      width: 20,
      letterSpacing: -0.2,
    },
    scorePlayerName: {
      ...typography.bodyMedium,
      fontFamily: fontFamilies.bodySemiBold,
      color: colors.text.primary,
      flex: 1,
    },
    scoreStrokes: {
      fontFamily: fontFamilies.mono,
      fontSize: typography.bodySmall.fontSize,
      color: colors.text.tertiary,
      letterSpacing: 0.3,
      minWidth: 32,
      textAlign: "right",
    },
    scorePoints: {
      fontFamily: fontFamilies.monoBold,
      fontSize: typography.bodyMedium.fontSize,
      color: colors.text.primary,
      minWidth: 44,
      textAlign: "right",
      letterSpacing: 0.3,
    },
    winnerText: {
      color: colors.accent.gold,
    },
    positivePoints: {
      color: colors.scoring.positive,
    },
    negativePoints: {
      color: colors.scoring.negative,
    },
    viewSummaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: spacing.xs,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    viewSummaryText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: typography.bodySmall.fontSize,
      color: colors.accent.gold,
      letterSpacing: 0.3,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xl,
    },
    emptyIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.surfaces.level2,
      borderWidth: 1,
      borderColor: colors.border.goldSubtle,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      ...typography.h2,
      fontFamily: fontFamilies.display,
      color: colors.text.primary,
      marginBottom: spacing.sm,
      textAlign: "center",
      letterSpacing: -0.5,
    },
    emptyMessage: {
      ...typography.bodyLarge,
      color: colors.text.secondary,
      textAlign: "center",
    },
  });
