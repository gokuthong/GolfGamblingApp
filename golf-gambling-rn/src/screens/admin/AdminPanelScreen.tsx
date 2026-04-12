import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { crossPlatformAlert } from "../../utils/crossPlatformAlert";
import { Card, EmptyState } from "../../components/common";
import { dataService } from "../../services/DataService";
import { typography, spacing, fontFamilies, borderRadius } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";

export const AdminPanelScreen = () => {
  const colors = useThemedColors();
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      const users = await dataService.getPendingUsers();
      setPendingUsers(users);
    } catch (error) {
      console.error("Failed to load pending users:", error);
      crossPlatformAlert("Error", "Failed to load pending users");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPendingUsers();
    setRefreshing(false);
  }, []);

  const handleApprove = async (userId: string, displayName: string) => {
    crossPlatformAlert("Approve user", `Approve ${displayName}'s account?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        style: "default",
        onPress: async () => {
          try {
            await dataService.approvePendingUser(userId);
            await loadPendingUsers();
          } catch (error) {
            crossPlatformAlert("Error", "Failed to approve user");
          }
        },
      },
    ]);
  };

  const handleReject = async (userId: string, displayName: string) => {
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
              await loadPendingUsers();
            } catch (error) {
              crossPlatformAlert("Error", "Failed to reject user");
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={["top", "left", "right"]}>
        <Text style={styles.loadingText}>Loading pending approvals…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
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
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Admin</Text>
          <Text style={styles.heroTitle}>User approvals</Text>
          <View style={styles.goldRule} />
          <Text style={styles.heroMeta}>
            {pendingUsers.length === 0
              ? "No pending requests"
              : `${pendingUsers.length} user${pendingUsers.length === 1 ? "" : "s"} waiting for approval`}
          </Text>
        </View>

        {pendingUsers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              icon="check-circle-outline"
              title="All caught up"
              description="There are no pending user approvals at this time."
            />
          </Card>
        ) : (
          <View style={styles.userList}>
            {pendingUsers.map((user) => (
              <Card key={user.id} style={styles.userCard}>
                <View style={styles.userInfo}>
                  <View style={styles.userHeader}>
                    <Text style={styles.displayName}>{user.displayName}</Text>
                    <Text style={styles.userNumberText}>
                      #{user.userNumber}
                    </Text>
                  </View>

                  <Text style={styles.email}>{user.email}</Text>

                  <View style={styles.signupRow}>
                    <View style={styles.signupDot} />
                    <Text style={styles.signupDate}>
                      Signed up {formatDate(user.createdAt)}
                    </Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => handleApprove(user.id, user.displayName)}
                  >
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleReject(user.id, user.displayName)}
                  >
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}
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
    },
    userList: {
      gap: spacing.md,
    },
    userCard: {
      padding: spacing.lg,
    },
    userInfo: {
      marginBottom: spacing.md,
    },
    userHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.xs,
      gap: spacing.sm,
    },
    displayName: {
      fontFamily: fontFamilies.display,
      fontSize: 20,
      color: colors.text.primary,
      letterSpacing: -0.4,
      flex: 1,
    },
    userNumberText: {
      fontFamily: fontFamilies.mono,
      fontSize: typography.bodySmall.fontSize,
      color: colors.accent.gold,
      letterSpacing: 0.3,
    },
    email: {
      ...typography.bodyMedium,
      color: colors.text.secondary,
      marginBottom: spacing.sm,
    },
    signupRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    signupDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.accent.gold,
    },
    signupDate: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
    },
    actions: {
      flexDirection: "row",
      gap: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      paddingTop: spacing.md,
    },
    approveButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
      backgroundColor: colors.accent.gold,
      alignItems: "center",
      justifyContent: "center",
    },
    approveButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: typography.button.fontSize,
      color: colors.text.inverse,
      letterSpacing: 0.3,
    },
    rejectButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.light,
      alignItems: "center",
      justifyContent: "center",
    },
    rejectButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: typography.button.fontSize,
      color: colors.text.secondary,
      letterSpacing: 0.3,
    },
    emptyCard: {
      padding: spacing.xl,
    },
  });
