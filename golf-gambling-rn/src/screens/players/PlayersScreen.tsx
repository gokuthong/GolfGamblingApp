import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { crossPlatformAlert } from "../../utils/crossPlatformAlert";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Icon, EmptyState, Badge } from "../../components/common";
import { dataService } from "../../services/DataService";
import { Player } from "../../types";
import { typography, spacing, fontFamilies, borderRadius } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";
import { useStore } from "../../store";
import { useFocusEffect } from "@react-navigation/native";

export const PlayersScreen = () => {
  const colors = useThemedColors();
  const user = useStore((state) => state.user);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [addingPlayer, setAddingPlayer] = useState(false);

  const loadPlayers = useCallback(async () => {
    if (!user) return;

    const playersData = await dataService.getAllPlayers(user.uid);
    setPlayers(playersData.filter((p) => !p.isGuest));
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadPlayers();
    }, [loadPlayers]),
  );

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) {
      crossPlatformAlert("Error", "Please enter a player name");
      return;
    }

    if (!user) return;

    setAddingPlayer(true);
    try {
      await dataService.createPlayer({
        name: newPlayerName.trim(),
        userId: user.uid,
        isGuest: false,
      });
      setNewPlayerName("");
      setShowAddModal(false);
      await loadPlayers();
    } catch (error) {
      crossPlatformAlert("Error", "Failed to add player");
    } finally {
      setAddingPlayer(false);
    }
  };

  const handleDeletePlayer = (player: Player) => {
    crossPlatformAlert(
      "Delete player",
      `Are you sure you want to delete "${player.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await dataService.deletePlayer(player.id);
              await loadPlayers();
            } catch (error) {
              crossPlatformAlert("Error", "Failed to delete player");
            }
          },
        },
      ],
    );
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  const renderPlayer = ({ item: player }: { item: Player }) => {
    return (
      <Card style={styles.playerCard}>
        <View style={styles.playerHeader}>
          <View style={styles.playerIconContainer}>
            <Icon name="account" size={22} color={colors.accent.gold} />
          </View>
          <View style={styles.playerInfo}>
            <View style={styles.playerNameRow}>
              <Text style={styles.playerName} numberOfLines={1}>
                {player.name}
              </Text>
              {player.isGuest && (
                <Badge label="Guest" variant="neutral" size="small" />
              )}
            </View>
            {player.userNumber && (
              <Text style={styles.playerNumber}>#{player.userNumber}</Text>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePlayer(player)}
          >
            <Icon
              name="delete-outline"
              size={14}
              color={colors.scoring.negative}
            />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.gold} />
          <Text style={styles.loadingText}>Loading players…</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Roster</Text>
          <Text style={styles.headerTitle}>Players</Text>
          <View style={styles.goldRule} />
          <Text style={styles.headerSubtitle}>Manage your golf players</Text>
        </View>

        {players.length === 0 ? (
          <View style={styles.emptyState}>
            <Card style={styles.emptyCard}>
              <EmptyState
                icon="account-group"
                title="No players yet"
                description="Add your first player to get started"
              />
            </Card>
          </View>
        ) : (
          <FlatList
            data={players}
            renderItem={renderPlayer}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {showAddModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalEyebrow}>New entry</Text>
              <Text style={styles.modalTitle}>Add a player</Text>
              <View style={styles.modalRule} />

              <Text style={styles.inputLabel}>Player name</Text>
              <TextInput
                style={styles.input}
                value={newPlayerName}
                onChangeText={setNewPlayerName}
                placeholder="Enter name"
                placeholderTextColor={colors.text.tertiary}
                autoFocus
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => {
                    setShowAddModal(false);
                    setNewPlayerName("");
                  }}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButtonAdd,
                    addingPlayer && { opacity: 0.6 },
                  ]}
                  onPress={handleAddPlayer}
                  disabled={addingPlayer}
                >
                  <Text style={styles.modalButtonAddText}>
                    {addingPlayer ? "Adding…" : "Add player"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Button
            title="Add new player"
            icon="plus"
            variant="gold"
            fullWidth
            onPress={() => setShowAddModal(true)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    innerContainer: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
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
    playerCard: {
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    playerHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    playerIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaces.level2,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border.goldSubtle,
    },
    playerInfo: {
      flex: 1,
    },
    playerNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    playerName: {
      ...typography.h4,
      fontFamily: fontFamilies.display,
      color: colors.text.primary,
      letterSpacing: -0.3,
      flexShrink: 1,
    },
    playerNumber: {
      fontFamily: fontFamilies.mono,
      fontSize: typography.bodySmall.fontSize,
      color: colors.accent.gold,
      letterSpacing: 0.3,
    },
    actions: {
      flexDirection: "row",
      gap: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      paddingTop: spacing.md,
    },
    deleteButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    deleteButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: typography.bodySmall.fontSize,
      color: colors.scoring.negative,
      letterSpacing: 0.3,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
    },
    emptyCard: {
      padding: spacing.xl,
    },
    footer: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      backgroundColor: colors.background.primary,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    modalOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.lg,
    },
    modalCard: {
      width: "100%",
      maxWidth: 400,
      padding: spacing.xl,
      backgroundColor: colors.background.elevated,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    modalEyebrow: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    modalTitle: {
      ...typography.h2,
      fontFamily: fontFamilies.display,
      color: colors.text.primary,
      letterSpacing: -0.5,
      marginBottom: spacing.md,
    },
    modalRule: {
      height: 1.5,
      width: 48,
      backgroundColor: colors.accent.gold,
      marginBottom: spacing.lg,
    },
    inputLabel: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    input: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
      paddingVertical: spacing.md,
      fontFamily: fontFamilies.body,
      fontSize: typography.bodyLarge.fontSize,
      color: colors.text.primary,
      marginBottom: spacing.xl,
    },
    modalActions: {
      flexDirection: "row",
      gap: spacing.md,
    },
    modalButtonCancel: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.light,
      alignItems: "center",
      justifyContent: "center",
    },
    modalButtonCancelText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: typography.button.fontSize,
      color: colors.text.secondary,
      letterSpacing: 0.3,
    },
    modalButtonAdd: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
      backgroundColor: colors.accent.gold,
      alignItems: "center",
      justifyContent: "center",
    },
    modalButtonAddText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: typography.button.fontSize,
      color: colors.text.inverse,
      letterSpacing: 0.3,
    },
  });

export default PlayersScreen;
