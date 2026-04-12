import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { crossPlatformAlert } from "../../utils/crossPlatformAlert";
import { useNavigation } from "@react-navigation/native";
import { Button, Icon } from "../../components/common";
import { authService } from "../../services/firebase";
import { localStorageService } from "../../services/storage";
import { dataService } from "../../services/DataService";
import { useStore } from "../../store";
import { typography, spacing, fontFamilies, borderRadius } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";
import { ScoreCalculator } from "../../utils/scoreCalculator";

export const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const user = useStore((state) => state.user);
  const settings = useStore((state) => state.settings);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);
  const colors = useThemedColors();
  const [exportingData, setExportingData] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<Record<string, any>>({});

  const isGuest = user?.role === "guest" || user?.isOffline;
  const isSuperAdmin = user?.role === "super_admin";

  useEffect(() => {
    if (isSuperAdmin) {
      loadUserData();
    }
  }, [isSuperAdmin]);

  const loadUserData = async () => {
    try {
      const [pending, users] = await Promise.all([
        dataService.getPendingUsers(),
        dataService.getAllUsers(),
      ]);
      setPendingUsers(pending);
      setAllUsers(users);
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  const loadUserStats = async (userId: string) => {
    try {
      const stats = await dataService.getUserStats(userId);
      setUserStats((prev) => ({ ...prev, [userId]: stats }));
    } catch (error) {
      console.error("Failed to load user stats:", error);
    }
  };

  const handleToggleUserExpand = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
    } else {
      setExpandedUserId(userId);
      if (!userStats[userId]) {
        await loadUserStats(userId);
      }
    }
  };

  const handleSignOut = async () => {
    crossPlatformAlert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await authService.signOut();
        },
      },
    ]);
  };

  const handleExportData = async () => {
    if (!user) return;

    setExportingData(true);
    try {
      const games = await dataService.getGamesForUser(user.uid);

      if (games.length === 0) {
        crossPlatformAlert("No data", "You have no games to export.");
        setExportingData(false);
        return;
      }

      const gamesWithDetails = await Promise.all(
        games.map((game) => dataService.getGameWithDetails(game.id)),
      );

      let csvContent = "Game Date,Status,Players,Winner,Final Scores\n";

      for (const gameDetails of gamesWithDetails) {
        if (!gameDetails) continue;

        const { game, players, scores, holes } = gameDetails;

        const finalPoints: Record<string, number> = {};
        game.playerIds.forEach((playerId) => {
          finalPoints[playerId] = 0;
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
        });

        let winnerId = "";
        let maxPoints = -Infinity;
        Object.entries(finalPoints).forEach(([playerId, points]) => {
          if (points > maxPoints) {
            maxPoints = points;
            winnerId = playerId;
          }
        });

        const winner = players.find((p) => p.id === winnerId);
        const playerNames = players.map((p) => p.name).join("; ");
        const scoresText = players
          .map((p) => `${p.name}: ${finalPoints[p.id] || 0}`)
          .join("; ");

        const dateStr = game.completedAt
          ? game.completedAt.toLocaleDateString()
          : game.date.toLocaleDateString();

        csvContent += `${dateStr},${game.status},${playerNames},${winner?.name || "N/A"},${scoresText}\n`;
      }

      if (Platform.OS === "web") {
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "golf-gambling-history.csv";
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({
          message: csvContent,
          title: "Golf Gambling History",
        });
      }
    } catch (error: any) {
      crossPlatformAlert(
        "Export failed",
        error.message || "Failed to export data",
      );
    } finally {
      setExportingData(false);
    }
  };

  const handleClearData = () => {
    if (!user) return;

    crossPlatformAlert(
      "Clear all data",
      "This will permanently delete all your games. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete all",
          style: "destructive",
          onPress: async () => {
            try {
              const games = await dataService.getGamesForUser(user.uid);

              for (const game of games) {
                await dataService.deleteGame(game.id);
              }

              crossPlatformAlert("Success", "All game data has been deleted.");
            } catch (error: any) {
              crossPlatformAlert(
                "Error",
                error.message || "Failed to clear data",
              );
            }
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    crossPlatformAlert(
      "Delete account",
      "This will permanently delete your account and all associated data. This action cannot be undone.\n\nYou will need to sign in again to confirm.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: async () => {
            try {
              if (user) {
                const games = await dataService.getGamesForUser(user.uid);
                for (const game of games) {
                  await dataService.deleteGame(game.id);
                }
              }

              await authService.deleteAccount();

              crossPlatformAlert(
                "Account deleted",
                "Your account has been permanently deleted.",
              );
            } catch (error: any) {
              if (error.code === "auth/requires-recent-login") {
                crossPlatformAlert(
                  "Re-authentication required",
                  "For security, please sign out and sign back in before deleting your account.",
                );
              } else {
                crossPlatformAlert(
                  "Error",
                  error.message || "Failed to delete account",
                );
              }
            }
          },
        },
      ],
    );
  };

  const handleSendFeedback = () => {
    crossPlatformAlert(
      "Send feedback",
      "Thank you for your interest. Please email your feedback to support@golfgambling.app",
      [{ text: "OK" }],
    );
  };

  const handleClearAllUsers = () => {
    const isSignedIn = user && !user.isOffline && user.role !== "guest";

    crossPlatformAlert(
      "Clear all users & reset database",
      isSignedIn
        ? "This will:\n\n1. Delete your Firebase Auth account\n2. Delete ALL user data from local storage\n3. Reset the database\n\nThe next signup will be User #001 (super admin).\n\nThis cannot be undone. Continue?"
        : "This will DELETE ALL USER DATA from local storage.\n\nNote: You need to be signed in to also delete Firebase Auth accounts.\n\nContinue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset database",
          style: "destructive",
          onPress: async () => {
            try {
              if (isSignedIn) {
                try {
                  await authService.deleteAccount();
                } catch (error: any) {
                  if (error.code === "auth/requires-recent-login") {
                    crossPlatformAlert(
                      "Re-authentication required",
                      "For security, you need to sign out and sign back in before deleting your Firebase account.\n\nThen try again.",
                    );
                    return;
                  }
                }
              }

              const result = await localStorageService.clearAllUsers();

              if (result.success) {
                crossPlatformAlert(
                  "Database reset complete",
                  "All users have been cleared.\n\nYou can now sign up as User #001 (super admin).",
                  [
                    {
                      text: "OK",
                      onPress: async () => {
                        try {
                          await authService.signOut();
                        } catch (e) {}
                      },
                    },
                  ],
                );
              } else {
                crossPlatformAlert("Error", result.message);
              }
            } catch (error: any) {
              crossPlatformAlert(
                "Error",
                error.message || "Failed to reset database",
              );
            }
          },
        },
      ],
    );
  };

  const handleApprovePendingUser = async (
    userId: string,
    displayName: string,
  ) => {
    crossPlatformAlert("Approve user", `Approve ${displayName}'s account?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        style: "default",
        onPress: async () => {
          try {
            await dataService.approvePendingUser(userId);
            await loadUserData();
          } catch (error: any) {
            crossPlatformAlert(
              "Error",
              error.message || "Failed to approve user",
            );
          }
        },
      },
    ]);
  };

  const handleRejectPendingUser = async (
    userId: string,
    displayName: string,
  ) => {
    crossPlatformAlert(
      "Reject user",
      `Are you sure you want to reject ${displayName}'s account? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              await dataService.rejectPendingUser(userId);
              await loadUserData();
            } catch (error: any) {
              crossPlatformAlert(
                "Error",
                error.message || "Failed to reject user",
              );
            }
          },
        },
      ],
    );
  };

  const handleDeleteUser = async (userId: string, displayName: string) => {
    const userToDelete = allUsers.find((u) => u.id === userId);
    if (userToDelete?.role === "super_admin") {
      crossPlatformAlert("Cannot delete", "Super admin cannot be deleted");
      return;
    }

    crossPlatformAlert(
      "Delete user",
      `Are you sure you want to delete ${displayName}?\n\nThis will permanently delete:\n• User account\n• All their games\n• All their data\n\nThis cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await dataService.deleteUser(userId);
              await loadUserData();
            } catch (error: any) {
              crossPlatformAlert(
                "Error",
                error.message || "Failed to delete user",
              );
            }
          },
        },
      ],
    );
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  const renderRow = (
    label: string,
    value: string | undefined,
    onPress?: () => void,
    danger?: boolean,
  ) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={styles.rowInfo}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>
          {label}
        </Text>
        {value !== undefined && (
          <Text style={styles.rowValue}>{value || "—"}</Text>
        )}
      </View>
      {onPress && (
        <Icon name="chevron-right" size={18} color={colors.text.tertiary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Preferences</Text>
          <Text style={styles.heroTitle}>Settings</Text>
          <View style={styles.goldRule} />
          <Text style={styles.heroMeta}>
            Manage your account, preferences, and data.
          </Text>
        </View>

        {isGuest && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Account</Text>
            <Text style={styles.sectionDescription}>
              Sign up to sync your data and access online features.
            </Text>

            <View style={styles.guestButtonContainer}>
              <Button
                title="Sign up"
                onPress={() => navigation.navigate("Register")}
                variant="gold"
                fullWidth
              />
              <Button
                title="Sign in"
                onPress={() => navigation.navigate("Login")}
                variant="outline"
                fullWidth
              />
            </View>
          </View>
        )}

        {isSuperAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>User management</Text>

            {pendingUsers.length > 0 && (
              <>
                <Text style={styles.subsectionLabel}>
                  Pending approvals · {pendingUsers.length}
                </Text>
                {pendingUsers.map((pendingUser) => (
                  <View key={pendingUser.id} style={styles.userCard}>
                    <View style={styles.userCardInfo}>
                      <View style={styles.userNameRow}>
                        <Text style={styles.userCardName}>
                          {pendingUser.displayName}
                        </Text>
                        <Text style={styles.userNumberText}>
                          #{pendingUser.userNumber}
                        </Text>
                      </View>
                      <Text style={styles.userCardEmail}>
                        {pendingUser.email}
                      </Text>
                    </View>
                    <View style={styles.userCardActions}>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() =>
                          handleApprovePendingUser(
                            pendingUser.id,
                            pendingUser.displayName,
                          )
                        }
                      >
                        <Text style={styles.approveButtonText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() =>
                          handleRejectPendingUser(
                            pendingUser.id,
                            pendingUser.displayName,
                          )
                        }
                      >
                        <Text style={styles.rejectButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            <Text style={styles.subsectionLabel}>
              All users · {allUsers.length}
            </Text>
            {allUsers.map((existingUser) => {
              const isExpanded = expandedUserId === existingUser.id;
              const stats = userStats[existingUser.id];
              return (
                <View key={existingUser.id} style={styles.userCard}>
                  <TouchableOpacity
                    style={styles.userCardHeader}
                    onPress={() => handleToggleUserExpand(existingUser.id)}
                  >
                    <View style={styles.userCardInfo}>
                      <View style={styles.userNameRow}>
                        <Text style={styles.userCardName}>
                          {existingUser.displayName}
                        </Text>
                        {existingUser.role === "super_admin" && (
                          <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>Admin</Text>
                          </View>
                        )}
                        <Text style={styles.userNumberText}>
                          #{existingUser.userNumber}
                        </Text>
                      </View>
                      <Text style={styles.userCardEmail}>
                        {existingUser.email}
                      </Text>
                    </View>
                    <Icon
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={colors.text.tertiary}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.userCardExpanded}>
                      {stats ? (
                        <>
                          <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                              <Text style={styles.statLabel}>Games</Text>
                              <Text style={styles.statValue}>
                                {stats.gamesPlayed}
                              </Text>
                            </View>
                            <View style={styles.statItem}>
                              <Text style={styles.statLabel}>Points</Text>
                              <Text
                                style={[
                                  styles.statValue,
                                  stats.totalPoints > 0
                                    ? styles.positive
                                    : stats.totalPoints < 0
                                      ? styles.negative
                                      : null,
                                ]}
                              >
                                {stats.totalPoints > 0 ? "+" : ""}
                                {stats.totalPoints.toFixed(1)}
                              </Text>
                            </View>
                            <View style={styles.statItem}>
                              <Text style={styles.statLabel}>Wins</Text>
                              <Text style={styles.statValue}>{stats.wins}</Text>
                            </View>
                            <View style={styles.statItem}>
                              <Text style={styles.statLabel}>Win rate</Text>
                              <Text style={styles.statValue}>
                                {stats.winRate}%
                              </Text>
                            </View>
                          </View>
                          {existingUser.role !== "super_admin" && (
                            <TouchableOpacity
                              style={styles.deleteUserButton}
                              onPress={() =>
                                handleDeleteUser(
                                  existingUser.id,
                                  existingUser.displayName,
                                )
                              }
                            >
                              <Text style={styles.deleteUserButtonText}>
                                Delete user
                              </Text>
                            </TouchableOpacity>
                          )}
                        </>
                      ) : (
                        <Text style={styles.loadingStats}>
                          Loading stats…
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Appearance</Text>
          <View style={styles.toggleRow}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Dark mode</Text>
              <Text style={styles.rowHint}>
                {settings.darkMode
                  ? "Low-light editorial theme"
                  : "Clean Augusta cream theme"}
              </Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{
                false: colors.border.medium,
                true: colors.accent.gold,
              }}
              thumbColor={
                settings.darkMode ? colors.accent.goldLight : "#ffffff"
              }
              ios_backgroundColor={colors.border.medium}
            />
          </View>
        </View>

        {!isGuest && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Profile</Text>
            <View style={styles.rowCard}>
              {renderRow("Display name", user?.displayName || "Not set")}
              <View style={styles.rowDivider} />
              {renderRow("Email", user?.email || "Not set")}
              {user?.userNumber && (
                <>
                  <View style={styles.rowDivider} />
                  {renderRow("User number", `#${user.userNumber}`)}
                </>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Data</Text>
          <View style={styles.rowCard}>
            {renderRow(
              "Export game history",
              exportingData ? "Exporting…" : "Download as CSV",
              handleExportData,
            )}
            <View style={styles.rowDivider} />
            {renderRow(
              "Clear all data",
              "Delete all games permanently",
              handleClearData,
              true,
            )}
            {!isGuest && (
              <>
                <View style={styles.rowDivider} />
                {renderRow(
                  "Delete account",
                  "Permanently remove your account",
                  handleDeleteAccount,
                  true,
                )}
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About</Text>
          <View style={styles.rowCard}>
            {renderRow("App version", "1.0.0")}
            <View style={styles.rowDivider} />
            {renderRow(
              "Send feedback",
              "Help us improve the app",
              handleSendFeedback,
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Developer</Text>
          <View style={styles.rowCard}>
            {renderRow(
              "Clear all users",
              "Resets database — next signup is User #001",
              handleClearAllUsers,
              true,
            )}
          </View>
        </View>

        {!isGuest && (
          <View style={styles.section}>
            <Button
              title="Sign out"
              onPress={handleSignOut}
              variant="outline"
              fullWidth
            />
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.footerRule} />
          <Text style={styles.footerText}>Made for the wager on the green.</Text>
        </View>
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
    scrollContainer: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xxxl,
      paddingBottom: spacing.xxl,
    },
    hero: {
      marginBottom: spacing.xxl,
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
    section: {
      marginBottom: spacing.xl,
    },
    sectionLabel: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginBottom: spacing.md,
    },
    subsectionLabel: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    sectionDescription: {
      ...typography.bodyMedium,
      color: colors.text.secondary,
      marginBottom: spacing.md,
      lineHeight: 20,
    },
    guestButtonContainer: {
      gap: spacing.md,
    },
    rowCard: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.border.light,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    rowDivider: {
      height: 1,
      backgroundColor: colors.border.light,
      marginHorizontal: spacing.lg,
    },
    rowInfo: {
      flex: 1,
    },
    rowLabel: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: typography.bodyMedium.fontSize,
      color: colors.text.primary,
      marginBottom: 2,
    },
    rowLabelDanger: {
      color: colors.scoring.negative,
    },
    rowValue: {
      ...typography.bodySmall,
      color: colors.text.secondary,
    },
    rowHint: {
      ...typography.bodySmall,
      color: colors.text.tertiary,
      marginTop: 2,
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    userCard: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    userCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm,
    },
    userCardInfo: {
      flex: 1,
    },
    userNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: 2,
      flexWrap: "wrap",
    },
    userCardName: {
      fontFamily: fontFamilies.display,
      fontSize: 18,
      color: colors.text.primary,
      letterSpacing: -0.3,
    },
    userCardEmail: {
      ...typography.bodySmall,
      color: colors.text.tertiary,
    },
    userNumberText: {
      fontFamily: fontFamilies.mono,
      fontSize: typography.bodySmall.fontSize,
      color: colors.accent.gold,
      letterSpacing: 0.3,
    },
    adminBadge: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.goldSubtle,
    },
    adminBadgeText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 9,
      color: colors.accent.gold,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    userCardExpanded: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    statItem: {
      flex: 1,
      alignItems: "center",
    },
    statLabel: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginBottom: spacing.xs,
    },
    statValue: {
      fontFamily: fontFamilies.monoBold,
      fontSize: 18,
      color: colors.text.primary,
      letterSpacing: 0.3,
    },
    positive: {
      color: colors.scoring.positive,
    },
    negative: {
      color: colors.scoring.negative,
    },
    loadingStats: {
      ...typography.bodyMedium,
      color: colors.text.tertiary,
      textAlign: "center",
      paddingVertical: spacing.md,
      fontStyle: "italic",
    },
    userCardActions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    approveButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.accent.gold,
      alignItems: "center",
      justifyContent: "center",
    },
    approveButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: typography.bodySmall.fontSize,
      color: colors.text.inverse,
      letterSpacing: 0.3,
    },
    rejectButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.light,
      alignItems: "center",
      justifyContent: "center",
    },
    rejectButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: typography.bodySmall.fontSize,
      color: colors.text.secondary,
      letterSpacing: 0.3,
    },
    deleteUserButton: {
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.light,
      alignItems: "center",
      justifyContent: "center",
    },
    deleteUserButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: typography.bodySmall.fontSize,
      color: colors.scoring.negative,
      letterSpacing: 0.3,
    },
    footer: {
      marginTop: spacing.xl,
      alignItems: "center",
    },
    footerRule: {
      height: 1,
      width: 32,
      backgroundColor: colors.border.light,
      marginBottom: spacing.md,
    },
    footerText: {
      ...typography.bodySmall,
      color: colors.text.tertiary,
      textAlign: "center",
      fontStyle: "italic",
    },
  });
