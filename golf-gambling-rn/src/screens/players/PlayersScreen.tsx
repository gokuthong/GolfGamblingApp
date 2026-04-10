import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { crossPlatformAlert } from '../../utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Button, Card, Icon, EmptyState, Badge } from '../../components/common';
import { dataService } from '../../services/DataService';
import { Player } from '../../types';
import { typography, spacing, fontFamilies, borderRadius } from '../../theme';
import { useThemedColors } from '../../contexts/ThemeContext';
import { useStore } from '../../store';
import { useFocusEffect } from '@react-navigation/native';

export const PlayersScreen = () => {
  const colors = useThemedColors();
  const user = useStore((state) => state.user);
  const settings = useStore((state) => state.settings);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [addingPlayer, setAddingPlayer] = useState(false);

  const loadPlayers = useCallback(async () => {
    if (!user) return;

    const playersData = await dataService.getAllPlayers(user.uid);
    // Filter out game-setup guests — only show players added from this screen
    setPlayers(playersData.filter(p => !p.isGuest));
    setLoading(false);
  }, [user]);

  // Load players when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPlayers();
    }, [loadPlayers])
  );

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) {
      crossPlatformAlert('Error', 'Please enter a player name');
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
      setNewPlayerName('');
      setShowAddModal(false);
      // Reload players to show the new one
      await loadPlayers();
      crossPlatformAlert('Success', 'Player added successfully');
    } catch (error) {
      crossPlatformAlert('Error', 'Failed to add player');
    } finally {
      setAddingPlayer(false);
    }
  };

  const handleDeletePlayer = (player: Player) => {
    crossPlatformAlert(
      'Delete Player',
      `Are you sure you want to delete "${player.name}"?`,
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
              await dataService.deletePlayer(player.id);
              // Reload players to remove the deleted one
              await loadPlayers();
            } catch (error) {
              crossPlatformAlert('Error', 'Failed to delete player');
            }
          },
        },
      ]
    );
  };

  const getPlayerStats = async (playerId: string) => {
    if (!user) return { gamesPlayed: 0, wins: 0 };

    try {
      const games = await dataService.getGamesForUser(user.uid);
      const playerGames = games.filter(g => g.playerIds.includes(playerId));

      // Would need to calculate wins by checking scores for each game
      return {
        gamesPlayed: playerGames.length,
        wins: 0, // Simplified for now
      };
    } catch (error) {
      return { gamesPlayed: 0, wins: 0 };
    }
  };

  const renderPlayer = ({ item: player, index }: { item: Player; index: number }) => {
    return (
      <Animated.View entering={FadeInUp.delay(100 * index).duration(400)}>
        <Card glass style={styles.playerCard}>
          <View style={styles.playerHeader}>
            <View style={styles.playerIconContainer}>
              <Icon name="account" size={32} color={colors.accent.gold} />
            </View>
            <View style={styles.playerInfo}>
              <View style={styles.playerNameRow}>
                <Text style={styles.playerName}>{player.name}</Text>
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
              <Icon name="delete" size={16} color={colors.scoring.negative} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </Animated.View>
    );
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.primary[900], colors.background.primary]}
          locations={[0, 0.3]}
          style={styles.headerGradient}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.gold} />
          <Text style={styles.loadingText}>Loading players...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.innerContainer}>
        {/* Background gradient */}
        <LinearGradient
          colors={
            settings.darkMode
              ? [colors.primary[900], colors.background.primary]
              : [colors.primary[300], colors.background.primary]
          }
          locations={[0, 0.3]}
          style={styles.headerGradient}
        />

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <View style={styles.headerContent}>
          <Icon name="account-group" size={32} color={colors.accent.gold} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Players</Text>
            <Text style={styles.headerSubtitle}>
              Manage your golf players
            </Text>
          </View>
        </View>
      </Animated.View>

      {players.length === 0 ? (
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.emptyState}>
          <Card glass style={styles.emptyCard}>
            <EmptyState
              icon="account-group"
              title="No players yet"
              description="Add your first player to get started"
            />
          </Card>
        </Animated.View>
      ) : (
        <FlatList
          data={players}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Player Modal/Input */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp.duration(300)} style={styles.modalCard}>
              <Text style={styles.modalTitle}>Add New Player</Text>

              <TextInput
                style={styles.input}
                value={newPlayerName}
                onChangeText={setNewPlayerName}
                placeholder="Player Name"
                placeholderTextColor={colors.text.tertiary}
                autoFocus
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => {
                    setShowAddModal(false);
                    setNewPlayerName('');
                  }}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButtonAdd, addingPlayer && { opacity: 0.6 }]}
                  onPress={handleAddPlayer}
                  disabled={addingPlayer}
                >
                  <Text style={styles.modalButtonAddText}>
                    {addingPlayer ? "Adding..." : "Add Player"}
                  </Text>
                </TouchableOpacity>
              </View>
          </Animated.View>
        </View>
      )}

      {/* Add Button */}
      <View style={styles.footer}>
        <Button
          title="Add New Player"
          icon="plus"
          variant="gold"
          glow
          fullWidth
          onPress={() => setShowAddModal(true)}
        />
      </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  innerContainer: {
    flex: 1,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 32,
    color: colors.text.primary,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  playerCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  playerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaces.level2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border.goldSubtle,
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  playerName: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.h4.fontSize,
    color: colors.text.primary,
  },
  playerNumber: {
    fontFamily: fontFamilies.mono,
    fontSize: typography.bodySmall.fontSize,
    color: colors.accent.gold,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.md,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaces.level2,
    borderWidth: 1,
    borderColor: colors.scoring.negative + '40',
  },
  deleteButtonText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.bodySmall.fontSize,
    color: colors.scoring.negative,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
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
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    padding: spacing.xl,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  modalTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.h3.fontSize,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontFamily: fontFamilies.body,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.primary,
    backgroundColor: colors.surfaces.level2,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancelText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.button.fontSize,
    color: colors.accent.gold,
  },
  modalButtonAdd: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonAddText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.button.fontSize,
    color: colors.text.inverse,
  },
});

export default PlayersScreen;
