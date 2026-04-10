import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { crossPlatformAlert } from '../../utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Button, Card, Icon, EmptyState, UserAvatarButton } from '../../components/common';
import { AuthModal } from '../../components/auth/AuthModal';
import { typography, spacing, fontFamilies, borderRadius } from '../../theme';
import { useThemedColors } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth, useStore } from '../../store';
import { dataService } from '../../services/DataService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const colors = useThemedColors();
  const settings = useStore((state) => state.settings);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [ongoingGames, setOngoingGames] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ gamesPlayed: 0, wins: 0 });
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Animated gold line
  const lineWidth = useSharedValue(0);

  useEffect(() => {
    lineWidth.value = withTiming(SCREEN_WIDTH - spacing.lg * 2, {
      duration: 1000,
      easing: Easing.out(Easing.ease),
    });
    loadRecentGames();
  }, []);

  const lineStyle = useAnimatedStyle(() => ({
    width: lineWidth.value,
  }));

  const loadRecentGames = async () => {
    if (!user) return;

    try {
      // Load active ongoing games
      const activeGames = await dataService.getActiveGamesForUser(user.uid);
      setOngoingGames(activeGames);

      // Note: Recent games would be loaded here if needed
      setRecentGames([]);
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecentGames();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleAvatarPress = () => {
    const isGuest = user?.role === 'guest' || user?.isOffline;

    if (isGuest) {
      setShowAuthModal(true);
    } else {
      // Navigate to settings for authenticated users
      navigation.navigate('Settings');
    }
  };

  const handleSignUp = () => {
    navigation.navigate('Register');
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  const handleDeleteGame = (gameId: string) => {
    crossPlatformAlert(
      'Delete Game',
      'Are you sure you want to delete this ongoing game? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataService.deleteGame(gameId);
              await loadRecentGames();
            } catch (error) {
              crossPlatformAlert('Error', 'Failed to delete game');
            }
          },
        },
      ]
    );
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Background Gradient - Fixed */}
      <LinearGradient
        colors={
          settings.darkMode
            ? [colors.primary[900], colors.background.primary]
            : [colors.primary[300], colors.background.primary]
        }
        locations={[0, 0.35]}
        style={styles.headerGradient}
      />

      {/* User Avatar Button - Fixed at root level */}
      <UserAvatarButton
        user={user}
        onPress={handleAvatarPress}
      />

      {/* Auth Modal for Guest Users */}
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignUp={handleSignUp}
        onSignIn={handleSignIn}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent.gold}
            />
          ) : undefined
        }
      >
        {/* Header Section */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.headerSection}
        >
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.welcomeText}>Ready to play?</Text>
        </Animated.View>

        {/* Animated gold accent line */}
        <Animated.View style={[styles.goldLine, lineStyle]} />

        {/* Primary CTA - New Game */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(600)}
          style={styles.ctaSection}
        >
          <Card
            gradient={[colors.accent.gold, colors.accent.goldDark]}
            goldBorder
            onPress={() => navigation.navigate('GameSetup')}
            style={styles.newGameCard}
          >
            <View style={styles.newGameContent}>
              <View style={styles.newGameLeft}>
                <Text style={styles.newGameLabel}>START</Text>
                <Text style={styles.newGameTitle}>NEW GAME</Text>
                <Text style={styles.newGameSubtitle}>
                  Set up players and begin scoring
                </Text>
              </View>
              <View style={styles.newGameIcon}>
                <Icon name="golf" size={48} color={colors.text.inverse} />
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Quick Stats Row */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(500)}
          style={styles.statsRow}
        >
          <Card glass style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.gamesPlayed}</Text>
            <Text style={styles.statLabel}>GAMES PLAYED</Text>
          </Card>
          <Card glass style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.wins}</Text>
            <Text style={styles.statLabel}>WINS</Text>
          </Card>
        </Animated.View>

        {/* Ongoing Games */}
        {ongoingGames.length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(350).duration(500)}
            style={styles.ongoingGamesSection}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ongoing Games</Text>
              <Text style={styles.sectionSubtitle}>{ongoingGames.length} active</Text>
            </View>
            {ongoingGames.map((game, index) => (
              <Card
                key={game.id}
                glass
                onPress={() => navigation.navigate('Scoring', { gameId: game.id })}
                style={styles.ongoingGameCard}
              >
                <View style={styles.ongoingGameContent}>
                  <View style={styles.ongoingGameLeft}>
                    <View style={styles.ongoingGameHeader}>
                      <Icon name="golf" size={20} color={colors.accent.gold} />
                      <Text style={styles.ongoingGameTitle}>Game #{game.id.slice(-6)}</Text>
                    </View>
                    <Text style={styles.ongoingGameDate}>
                      Started {game.createdAt?.toLocaleDateString()}
                    </Text>
                    <Text style={styles.ongoingGamePlayers}>
                      {game.playerIds.length} players
                    </Text>
                  </View>
                  <View style={styles.ongoingGameActions}>
                    <TouchableOpacity
                      style={styles.deleteGameButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteGame(game.id);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon name="delete" size={20} color={colors.scoring.negative} />
                    </TouchableOpacity>
                    <View style={styles.resumeButton}>
                      <Icon name="play-circle" size={32} color={colors.accent.gold} />
                      <Text style={styles.resumeText}>Resume</Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(500)}
          style={styles.quickActionsSection}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <Card
              glass
              onPress={() => navigation.navigate('HistoryTab')}
              style={styles.quickActionCard}
            >
              <Icon name="history" size={28} color={colors.accent.gold} />
              <Text style={styles.quickActionText}>Game History</Text>
            </Card>
            <Card
              glass
              onPress={() => navigation.navigate('Players')}
              style={styles.quickActionCard}
            >
              <Icon name="account-group" size={28} color={colors.accent.gold} />
              <Text style={styles.quickActionText}>Players</Text>
            </Card>
            <Card
              glass
              onPress={() => navigation.navigate('CoursesTab')}
              style={styles.quickActionCard}
            >
              <Icon name="golf-tee" size={28} color={colors.accent.gold} />
              <Text style={styles.quickActionText}>Courses</Text>
            </Card>
            <Card
              glass
              onPress={() => navigation.navigate('Settings')}
              style={styles.quickActionCard}
            >
              <Icon name="cog" size={28} color={colors.accent.gold} />
              <Text style={styles.quickActionText}>Settings</Text>
            </Card>
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(500)}
          style={styles.recentSection}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentGames.length > 0 && (
              <Button
                title="View All"
                variant="text"
                size="small"
                onPress={() => navigation.navigate('HistoryTab')}
              />
            )}
          </View>

          {recentGames.length === 0 ? (
            <Card glass style={styles.emptyCard}>
              <EmptyState
                icon="golf"
                title="No recent games"
                description="Start a new game to see your activity here"
              />
            </Card>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentGamesScroll}
            >
              {recentGames.map((game, index) => (
                <Animated.View
                  key={game.id}
                  entering={FadeInRight.delay(100 * index).duration(400)}
                >
                  <Card
                    glass
                    goldBorder
                    onPress={() => navigation.navigate('GameSummary', { gameId: game.id })}
                    style={styles.recentGameCard}
                  >
                    <Text style={styles.recentGameDate}>
                      {new Date(game.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.recentGamePlayers}>
                      {game.playerIds?.length || 0} Players
                    </Text>
                  </Card>
                </Animated.View>
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* Footer spacing */}
        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerSection: {
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  greeting: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  welcomeText: {
    fontFamily: fontFamilies.display,
    fontSize: 36,
    color: colors.text.primary,
    letterSpacing: 1,
  },
  goldLine: {
    height: 2,
    backgroundColor: colors.accent.gold,
    marginBottom: spacing.xl,
    borderRadius: 1,
  },
  ctaSection: {
    marginBottom: spacing.lg,
  },
  newGameCard: {
    padding: spacing.lg,
  },
  newGameContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newGameLeft: {
    flex: 1,
  },
  newGameLabel: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.inverse,
    opacity: 0.8,
    letterSpacing: 2,
  },
  newGameTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 32,
    color: colors.text.inverse,
    letterSpacing: 1,
  },
  newGameSubtitle: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.inverse,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  newGameIcon: {
    marginLeft: spacing.md,
    opacity: 0.9,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: fontFamilies.display,
    fontSize: 36,
    color: colors.accent.gold,
  },
  statLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.statLabel.fontSize,
    color: colors.text.secondary,
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
  ongoingGamesSection: {
    marginBottom: spacing.xl,
  },
  ongoingGameCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  ongoingGameContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ongoingGameLeft: {
    flex: 1,
  },
  ongoingGameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  ongoingGameTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.bodyLarge.fontSize,
    color: colors.text.primary,
  },
  ongoingGameDate: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  ongoingGamePlayers: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
  },
  ongoingGameActions: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  deleteGameButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaces.level3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeButton: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  resumeText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 11,
    color: colors.accent.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickActionsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.h4.fontSize,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickActionCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2 - spacing.md / 2,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickActionText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.primary,
    textAlign: 'center',
  },
  recentSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  emptyCard: {
    padding: spacing.xl,
  },
  recentGamesScroll: {
    gap: spacing.md,
  },
  recentGameCard: {
    width: 160,
    padding: spacing.md,
  },
  recentGameDate: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  recentGamePlayers: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
  },
  footerSpacer: {
    height: spacing.xl,
  },
});

export default HomeScreen;
