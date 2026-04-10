import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { crossPlatformAlert } from '../../utils/crossPlatformAlert';
import { useNavigation } from '@react-navigation/native';
import { Button, Badge } from '../../components/common';
import { authService } from '../../services/firebase';
import { localStorageService } from '../../services/storage';
import { dataService } from '../../services/DataService';
import { useStore } from '../../store';
import { typography, spacing } from '../../theme';
import { useThemedColors } from '../../contexts/ThemeContext';
import { ScoreCalculator } from '../../utils/scoreCalculator';

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

  const isGuest = user?.role === 'guest' || user?.isOffline;
  const isSuperAdmin = user?.role === 'super_admin';

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
      console.error('Failed to load user data:', error);
    }
  };

  const loadUserStats = async (userId: string) => {
    try {
      const stats = await dataService.getUserStats(userId);
      setUserStats(prev => ({ ...prev, [userId]: stats }));
    } catch (error) {
      console.error('Failed to load user stats:', error);
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
    crossPlatformAlert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await authService.signOut();
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    if (!user) return;

    setExportingData(true);
    try {
      // Get all games for the user
      const games = await dataService.getGamesForUser(user.uid);

      if (games.length === 0) {
        crossPlatformAlert('No Data', 'You have no games to export.');
        setExportingData(false);
        return;
      }

      // Get details for all games
      const gamesWithDetails = await Promise.all(
        games.map(game => dataService.getGameWithDetails(game.id))
      );

      // Create CSV content
      let csvContent = 'Game Date,Status,Players,Winner,Final Scores\n';

      for (const gameDetails of gamesWithDetails) {
        if (!gameDetails) continue;

        const { game, players, scores, holes } = gameDetails;

        // Calculate final points
        const finalPoints: Record<string, number> = {};
        game.playerIds.forEach(playerId => {
          finalPoints[playerId] = 0;
        });

        holes.forEach(hole => {
          const holeScores = scores.filter(s => s.holeId === hole.id);
          const holePoints = ScoreCalculator.calculateHolePoints(hole, holeScores, players, game.handicaps);

          Object.keys(holePoints).forEach(playerId => {
            finalPoints[playerId] = (finalPoints[playerId] || 0) + holePoints[playerId];
          });
        });

        // Find winner
        let winnerId = '';
        let maxPoints = -Infinity;
        Object.entries(finalPoints).forEach(([playerId, points]) => {
          if (points > maxPoints) {
            maxPoints = points;
            winnerId = playerId;
          }
        });

        const winner = players.find(p => p.id === winnerId);
        const playerNames = players.map(p => p.name).join('; ');
        const scoresText = players
          .map(p => `${p.name}: ${finalPoints[p.id] || 0}`)
          .join('; ');

        const dateStr = game.completedAt
          ? game.completedAt.toLocaleDateString()
          : game.date.toLocaleDateString();

        csvContent += `${dateStr},${game.status},${playerNames},${winner?.name || 'N/A'},${scoresText}\n`;
      }

      // Share / download the CSV
      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'golf-gambling-history.csv';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({
          message: csvContent,
          title: 'Golf Gambling History',
        });
      }
    } catch (error: any) {
      crossPlatformAlert('Export Failed', error.message || 'Failed to export data');
    } finally {
      setExportingData(false);
    }
  };

  const handleClearData = () => {
    if (!user) return;

    crossPlatformAlert(
      'Clear All Data',
      'This will permanently delete all your games. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const games = await dataService.getGamesForUser(user.uid);

              for (const game of games) {
                await dataService.deleteGame(game.id);
              }

              crossPlatformAlert('Success', 'All game data has been deleted.');
            } catch (error: any) {
              crossPlatformAlert('Error', error.message || 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    crossPlatformAlert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.\n\nYou will need to sign in again to confirm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all user data first
              if (user) {
                const games = await dataService.getGamesForUser(user.uid);
                for (const game of games) {
                  await dataService.deleteGame(game.id);
                }
              }

              // Delete Firebase Auth account
              await authService.deleteAccount();

              crossPlatformAlert('Account Deleted', 'Your account has been permanently deleted.');
            } catch (error: any) {
              if (error.code === 'auth/requires-recent-login') {
                crossPlatformAlert(
                  'Re-authentication Required',
                  'For security, please sign out and sign back in before deleting your account.'
                );
              } else {
                crossPlatformAlert('Error', error.message || 'Failed to delete account');
              }
            }
          },
        },
      ]
    );
  };

  const handleSendFeedback = () => {
    crossPlatformAlert(
      'Send Feedback',
      'Thank you for your interest! Please email your feedback to support@golfgambling.app',
      [{ text: 'OK' }]
    );
  };

  const handleClearAllUsers = () => {
    const isSignedIn = user && !user.isOffline && user.role !== 'guest';

    crossPlatformAlert(
      '⚠️ Clear All Users & Reset Database',
      isSignedIn
        ? 'This will:\n\n1. Delete your Firebase Auth account\n2. Delete ALL user data from local storage\n3. Reset the database\n\nThe next signup will be User #001 (super admin).\n\nThis cannot be undone. Continue?'
        : 'This will DELETE ALL USER DATA from local storage.\n\nNote: You need to be signed in to also delete Firebase Auth accounts.\n\nContinue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Database',
          style: 'destructive',
          onPress: async () => {
            try {
              // If signed in, delete Firebase Auth account first
              if (isSignedIn) {
                try {
                  await authService.deleteAccount();
                  console.log('Firebase Auth account deleted');
                } catch (error: any) {
                  if (error.code === 'auth/requires-recent-login') {
                    crossPlatformAlert(
                      'Re-authentication Required',
                      'For security, you need to sign out and sign back in before deleting your Firebase account.\n\nThen try again.'
                    );
                    return;
                  }
                  console.error('Error deleting Firebase account:', error);
                  // Continue anyway to clear local data
                }
              }

              // Clear all local user data
              const result = await localStorageService.clearAllUsers();

              if (result.success) {
                crossPlatformAlert(
                  'Database Reset Complete',
                  'All users have been cleared.\n\nYou can now sign up as User #001 (super admin).',
                  [
                    {
                      text: 'OK',
                      onPress: async () => {
                        // Sign out if still signed in
                        try {
                          await authService.signOut();
                        } catch (e) {
                          // Already signed out
                        }
                      },
                    },
                  ]
                );
              } else {
                crossPlatformAlert('Error', result.message);
              }
            } catch (error: any) {
              crossPlatformAlert('Error', error.message || 'Failed to reset database');
            }
          },
        },
      ]
    );
  };

  const handleApprovePendingUser = async (userId: string, displayName: string) => {
    crossPlatformAlert(
      'Approve User',
      `Approve ${displayName}'s account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              await dataService.approvePendingUser(userId);
              crossPlatformAlert('Success', `${displayName}'s account has been approved`);
              await loadUserData();
            } catch (error: any) {
              crossPlatformAlert('Error', error.message || 'Failed to approve user');
            }
          },
        },
      ]
    );
  };

  const handleRejectPendingUser = async (userId: string, displayName: string) => {
    crossPlatformAlert(
      'Reject User',
      `Are you sure you want to reject ${displayName}'s account? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataService.rejectPendingUser(userId);
              crossPlatformAlert('Success', `${displayName}'s account has been rejected`);
              await loadUserData();
            } catch (error: any) {
              crossPlatformAlert('Error', error.message || 'Failed to reject user');
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = async (userId: string, displayName: string) => {
    // Prevent deleting super admin
    const userToDelete = allUsers.find(u => u.id === userId);
    if (userToDelete?.role === 'super_admin') {
      crossPlatformAlert('Cannot Delete', 'Super admin cannot be deleted');
      return;
    }

    crossPlatformAlert(
      'Delete User',
      `Are you sure you want to delete ${displayName}?\n\nThis will permanently delete:\n• User account\n• All their games\n• All their data\n\nThis cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataService.deleteUser(userId);
              crossPlatformAlert('Success', `${displayName} has been deleted`);
              await loadUserData();
            } catch (error: any) {
              crossPlatformAlert('Error', error.message || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
      {/* Guest Auth Section */}
      {isGuest && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Text style={styles.sectionDescription}>
            Sign up to sync your data and access online features.
          </Text>

          <View style={styles.guestButtonContainer}>
            <Button
              title="Sign Up"
              onPress={() => navigation.navigate('Register')}
              fullWidth
              style={styles.guestButton}
            />
            <Button
              title="Sign In"
              onPress={() => navigation.navigate('Login')}
              variant="outline"
              fullWidth
              style={styles.guestButton}
            />
          </View>
        </View>
      )}

      {/* User Management Section */}
      {isSuperAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Management</Text>

          {/* Pending Users Subsection */}
          {pendingUsers.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>
                Pending Approvals ({pendingUsers.length})
              </Text>
              {pendingUsers.map((pendingUser) => (
                <View key={pendingUser.id} style={styles.userCard}>
                  <View style={styles.userCardHeader}>
                    <View style={styles.userCardInfo}>
                      <Text style={styles.userCardName}>{pendingUser.displayName}</Text>
                      <Text style={styles.userCardEmail}>{pendingUser.email}</Text>
                      <Text style={styles.userCardMeta}>User #{pendingUser.userNumber}</Text>
                    </View>
                  </View>
                  <View style={styles.userCardActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleApprovePendingUser(pendingUser.id, pendingUser.displayName)}
                    >
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleRejectPendingUser(pendingUser.id, pendingUser.displayName)}
                    >
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Existing Users Subsection */}
          <Text style={styles.subsectionTitle}>
            All Users ({allUsers.length})
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
                      <Text style={styles.userCardName}>{existingUser.displayName}</Text>
                      {existingUser.role === 'super_admin' && (
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>ADMIN</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.userCardEmail}>{existingUser.email}</Text>
                    <Text style={styles.userCardMeta}>User #{existingUser.userNumber}</Text>
                  </View>
                  <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.userCardExpanded}>
                    {stats ? (
                      <>
                        <View style={styles.statsRow}>
                          <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Games Played</Text>
                            <Text style={styles.statValue}>{stats.gamesPlayed}</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Total Points</Text>
                            <Text style={[styles.statValue, stats.totalPoints > 0 ? styles.positive : styles.negative]}>
                              {stats.totalPoints > 0 ? '+' : ''}{stats.totalPoints.toFixed(1)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.statsRow}>
                          <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Wins</Text>
                            <Text style={styles.statValue}>{stats.wins}</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Losses</Text>
                            <Text style={styles.statValue}>{stats.losses}</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Win Rate</Text>
                            <Text style={styles.statValue}>{stats.winRate}%</Text>
                          </View>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.loadingStats}>Loading stats...</Text>
                    )}

                    {existingUser.role !== 'super_admin' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDeleteUser(existingUser.id, existingUser.displayName)}
                      >
                        <Text style={styles.deleteButtonText}>Delete User</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Theme Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Text style={styles.settingDescription}>
              {settings.darkMode
                ? 'Premium dark theme for low-light environments'
                : 'Clean light theme for bright areas'}
            </Text>
          </View>
          <Switch
            value={settings.darkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: colors.border.medium, true: colors.accent.gold }}
            thumbColor={settings.darkMode ? colors.accent.goldLight : '#f4f3f4'}
            ios_backgroundColor={colors.border.medium}
          />
        </View>
      </View>

      {/* User Profile Section - only for authenticated users */}
      {!isGuest && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Display Name</Text>
              <Text style={styles.settingValue}>
                {user?.displayName || 'Not set'}
              </Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Email</Text>
              <Text style={styles.settingValue}>{user?.email || 'Not set'}</Text>
            </View>
          </View>

          {user?.userNumber && (
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>User Number</Text>
                <Text style={styles.settingValue}>#{user.userNumber}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Data Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleExportData}
          disabled={exportingData}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Export Game History</Text>
            <Text style={styles.settingDescription}>
              {exportingData ? 'Exporting...' : 'Download your data as CSV'}
            </Text>
          </View>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleClearData}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, styles.dangerText]}>Clear All Data</Text>
            <Text style={styles.settingDescription}>
              Delete all games permanently
            </Text>
          </View>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, styles.dangerText]}>Delete Account</Text>
            <Text style={styles.settingDescription}>
              Permanently delete your account
            </Text>
          </View>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>App Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.settingItem} onPress={handleSendFeedback}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Send Feedback</Text>
            <Text style={styles.settingDescription}>
              Help us improve the app
            </Text>
          </View>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Developer Tools - Temporary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developer Tools</Text>

        <TouchableOpacity style={styles.settingItem} onPress={handleClearAllUsers}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, styles.dangerText]}>Clear All Users</Text>
            <Text style={styles.settingDescription}>
              Delete all users. Next signup will be User #001 (super admin)
            </Text>
          </View>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Account Section - only for authenticated users */}
      {!isGuest && (
        <View style={styles.section}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="outline"
            fullWidth
          />
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Made with care for golf gamblers
        </Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    color: colors.text.primary,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    ...typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  settingValue: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  settingDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  settingChevron: {
    fontSize: 24,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  dangerText: {
    color: colors.status.error,
  },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    alignItems: 'center',
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
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
  guestButton: {
    marginBottom: 0,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.accent.gold,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.bodySmall,
    color: colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 12,
  },
  subsectionTitle: {
    ...typography.h4,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    color: colors.text.secondary,
  },
  userCard: {
    backgroundColor: colors.background.card,
    borderRadius: 8,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userCardInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userCardName: {
    ...typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
  },
  userCardEmail: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  userCardMeta: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    ...typography.bodySmall,
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  expandIcon: {
    fontSize: 16,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  userCardExpanded: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '600',
  },
  positive: {
    color: colors.accent.gold,
  },
  negative: {
    color: colors.status.error,
  },
  loadingStats: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  userCardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: colors.accent.gold,
  },
  approveButtonText: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  rejectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  rejectButtonText: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  deleteButton: {
    backgroundColor: colors.status.error,
    marginTop: spacing.sm,
  },
  deleteButtonText: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});
