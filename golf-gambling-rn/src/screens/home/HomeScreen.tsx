import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from "react-native";
import { crossPlatformAlert } from "../../utils/crossPlatformAlert";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Card,
  Icon,
  EmptyState,
  UserAvatarButton,
  Divider,
  StatCard,
} from "../../components/common";
import { AuthModal } from "../../components/auth/AuthModal";
import { typography, spacing, fontFamilies, borderRadius } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../store";
import { dataService } from "../../services/DataService";

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const colors = useThemedColors();
  const [ongoingGames, setOngoingGames] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    wins: 0,
    bestScore: 0,
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      const activeGames = await dataService.getActiveGamesForUser(user.uid);
      setOngoingGames(activeGames);
    } catch (error) {
      console.error("Failed to load games:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const displayName = (() => {
    if (!user) return "Guest";
    if (user.role === "guest" || user.isOffline) return "Guest";
    const name = user.displayName || user.email?.split("@")[0] || "Player";
    return name.split(" ")[0];
  })();

  const handleAvatarPress = () => {
    const isGuest = user?.role === "guest" || user?.isOffline;
    if (isGuest) {
      setShowAuthModal(true);
    } else {
      navigation.navigate("Settings");
    }
  };

  const handleDeleteGame = (gameId: string) => {
    crossPlatformAlert(
      "Delete Game",
      "Are you sure you want to delete this ongoing game? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await dataService.deleteGame(gameId);
              await loadData();
            } catch (error) {
              crossPlatformAlert("Error", "Failed to delete game");
            }
          },
        },
      ],
    );
  };

  const mostRecentOngoing = ongoingGames[0];

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <UserAvatarButton user={user} onPress={handleAvatarPress} />

      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignUp={() => navigation.navigate("Register")}
        onSignIn={() => navigation.navigate("Login")}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS !== "web" ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent.gold}
            />
          ) : undefined
        }
      >
        <View style={styles.headerSection}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.nameText}>{displayName}</Text>
          <View style={styles.goldRule} />
        </View>

        <View style={styles.actionsRow}>
          <Card
            onPress={() => navigation.navigate("GameSetup")}
            style={styles.primaryAction}
            gradient={[colors.accent.gold, colors.accent.goldDark]}
          >
            <View style={styles.actionInner}>
              <Icon name="golf-tee" size={28} color={colors.text.inverse} />
              <Text style={styles.primaryActionLabel}>New game</Text>
              <Text style={styles.primaryActionSub}>Set up and begin</Text>
            </View>
          </Card>

          <Card
            onPress={
              mostRecentOngoing
                ? () =>
                    navigation.navigate("Scoring", {
                      gameId: mostRecentOngoing.id,
                    })
                : () => navigation.navigate("HistoryTab")
            }
            style={styles.secondaryAction}
            goldBorder={!!mostRecentOngoing}
          >
            <View style={styles.actionInner}>
              <Icon
                name={mostRecentOngoing ? "play-circle-outline" : "history"}
                size={28}
                color={colors.accent.gold}
              />
              <Text style={styles.secondaryActionLabel}>
                {mostRecentOngoing ? "Resume" : "History"}
              </Text>
              <Text style={styles.secondaryActionSub}>
                {mostRecentOngoing
                  ? `${ongoingGames.length} active`
                  : "Past games"}
              </Text>
            </View>
          </Card>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionEyebrow}>At a glance</Text>
          <View style={styles.statsRow}>
            <StatCard
              value={stats.gamesPlayed}
              label="Games"
              style={styles.statItem}
            />
            <StatCard value={stats.wins} label="Wins" style={styles.statItem} />
            <StatCard
              value={stats.bestScore || "—"}
              label="Best"
              style={styles.statItem}
            />
          </View>
        </View>

        {ongoingGames.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ongoing games</Text>
              <Text style={styles.sectionMeta}>
                {ongoingGames.length} active
              </Text>
            </View>
            <Divider gold thin style={styles.sectionRule} />
            {ongoingGames.map((game) => (
              <Card
                key={game.id}
                onPress={() =>
                  navigation.navigate("Scoring", { gameId: game.id })
                }
                style={styles.ongoingCard}
              >
                <View style={styles.ongoingContent}>
                  <View style={styles.ongoingLeft}>
                    <Text style={styles.ongoingTitle}>
                      Game #{game.id.slice(-6).toUpperCase()}
                    </Text>
                    <Text style={styles.ongoingMeta}>
                      {game.playerIds.length} players · started{" "}
                      {game.createdAt
                        ? new Date(game.createdAt).toLocaleDateString()
                        : ""}
                    </Text>
                  </View>
                  <View style={styles.ongoingActions}>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteGame(game.id);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon
                        name="delete-outline"
                        size={18}
                        color={colors.text.tertiary}
                      />
                    </TouchableOpacity>
                    <Icon
                      name="chevron-right"
                      size={22}
                      color={colors.accent.gold}
                    />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore</Text>
          <Divider gold thin style={styles.sectionRule} />
          <View style={styles.quickGrid}>
            <Card
              onPress={() => navigation.navigate("HistoryTab")}
              style={styles.quickCard}
            >
              <Icon name="history" size={22} color={colors.accent.gold} />
              <Text style={styles.quickLabel}>History</Text>
            </Card>
            <Card
              onPress={() => navigation.navigate("Players")}
              style={styles.quickCard}
            >
              <Icon
                name="account-group-outline"
                size={22}
                color={colors.accent.gold}
              />
              <Text style={styles.quickLabel}>Players</Text>
            </Card>
            <Card
              onPress={() => navigation.navigate("CoursesTab")}
              style={styles.quickCard}
            >
              <Icon name="golf-tee" size={22} color={colors.accent.gold} />
              <Text style={styles.quickLabel}>Courses</Text>
            </Card>
            <Card
              onPress={() => navigation.navigate("Settings")}
              style={styles.quickCard}
            >
              <Icon name="cog-outline" size={22} color={colors.accent.gold} />
              <Text style={styles.quickLabel}>Settings</Text>
            </Card>
          </View>
        </View>

        {ongoingGames.length === 0 && (
          <View style={styles.section}>
            <EmptyState
              icon="golf"
              title="Tee it up"
              description="Start a new game to begin tracking scores, stats, and bets."
              actionLabel="New game"
              onAction={() => navigation.navigate("GameSetup")}
            />
          </View>
        )}

        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxxl,
      paddingBottom: spacing.xxxl,
    },
    headerSection: {
      marginBottom: spacing.xl,
    },
    greeting: {
      ...typography.bodyMedium,
      fontFamily: fontFamilies.body,
      color: colors.text.tertiary,
      marginBottom: 4,
    },
    nameText: {
      ...typography.displayMedium,
      fontFamily: fontFamilies.display,
      color: colors.text.primary,
      marginBottom: spacing.md,
    },
    goldRule: {
      height: 1.5,
      width: 44,
      backgroundColor: colors.accent.gold,
      borderRadius: 1,
    },
    actionsRow: {
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    primaryAction: {
      flex: 1,
      padding: 0,
      minHeight: 130,
    },
    secondaryAction: {
      flex: 1,
      padding: 0,
      minHeight: 130,
    },
    actionInner: {
      padding: spacing.lg,
      justifyContent: "space-between",
      flex: 1,
    },
    primaryActionLabel: {
      ...typography.h3,
      fontFamily: fontFamilies.display,
      color: colors.text.inverse,
      marginTop: spacing.sm,
    },
    primaryActionSub: {
      ...typography.bodySmall,
      fontFamily: fontFamilies.body,
      color: colors.text.inverse,
      opacity: 0.85,
      marginTop: 2,
    },
    secondaryActionLabel: {
      ...typography.h3,
      fontFamily: fontFamilies.display,
      color: colors.text.primary,
      marginTop: spacing.sm,
    },
    secondaryActionSub: {
      ...typography.bodySmall,
      fontFamily: fontFamilies.body,
      color: colors.text.tertiary,
      marginTop: 2,
    },
    statsSection: {
      marginBottom: spacing.xl,
    },
    sectionEyebrow: {
      ...typography.label,
      textTransform: "uppercase",
      color: colors.text.tertiary,
      marginBottom: spacing.sm,
    },
    statsRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    statItem: {
      flex: 1,
      minWidth: 0,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: spacing.xs,
    },
    sectionTitle: {
      ...typography.h4,
      fontFamily: fontFamilies.display,
      color: colors.text.primary,
    },
    sectionMeta: {
      ...typography.bodySmall,
      color: colors.text.tertiary,
    },
    sectionRule: {
      marginVertical: spacing.sm,
    },
    ongoingCard: {
      marginBottom: spacing.sm,
    },
    ongoingContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    ongoingLeft: {
      flex: 1,
    },
    ongoingTitle: {
      ...typography.h4,
      fontFamily: fontFamilies.display,
      color: colors.text.primary,
      marginBottom: 2,
    },
    ongoingMeta: {
      ...typography.bodySmall,
      color: colors.text.tertiary,
    },
    ongoingActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    deleteButton: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    quickGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    quickCard: {
      flexBasis: "48%",
      flexGrow: 1,
      paddingVertical: spacing.lg,
      alignItems: "center",
      gap: spacing.sm,
    },
    quickLabel: {
      ...typography.labelSmall,
      color: colors.text.primary,
      letterSpacing: 0.5,
    },
    footerSpacer: {
      height: spacing.xxl,
    },
  });

export default HomeScreen;
