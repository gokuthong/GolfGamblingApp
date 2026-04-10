import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { crossPlatformAlert } from '../../utils/crossPlatformAlert';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Button, Card, Checkbox, Icon, Badge, EmptyState } from '../../components/common';
import { dataService } from '../../services/DataService';
import { localStorageService } from '../../services/storage/LocalStorageService';
import { Player, Course } from '../../types';
import { typography, spacing, fontFamilies, borderRadius } from '../../theme';
import { useThemedColors } from '../../contexts/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth, useStore } from '../../store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const GameSetupScreen = () => {
  const navigation = useNavigation<any>();
  const scrollViewRef = useRef<ScrollView>(null);
  const colors = useThemedColors();
  const settings = useStore((state) => state.settings);
  const [registeredPlayers, setRegisteredPlayers] = useState<Player[]>([]);
  const [guestPlayers, setGuestPlayers] = useState<Player[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newGuestName, setNewGuestName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadCourses();
  }, []);

  // Reload players every time the screen gains focus (picks up newly added players)
  useFocusEffect(
    useCallback(() => {
      loadRegisteredPlayers();
    }, [user])
  );

  const loadRegisteredPlayers = async () => {
    try {
      const allPlayers = await dataService.getAllPlayers(user?.uid);
      setRegisteredPlayers(allPlayers.filter(p => !p.isGuest));
    } catch (error) {
      console.error('Failed to load players:', error);
    }
  };

  const loadCourses = async () => {
    try {
      const fetchedCourses = await dataService.getAllCourses();
      setCourses(fetchedCourses);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  const togglePlayer = (playerId: string) => {
    const newSelected = new Set(selectedPlayerIds);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayerIds(newSelected);
  };

  const addGuestPlayer = async () => {
    if (!newGuestName.trim()) {
      crossPlatformAlert('Error', 'Please enter a guest name');
      return;
    }

    if (!user?.uid) {
      crossPlatformAlert('Error', 'You must be logged in to add guests');
      return;
    }

    try {
      // Save locally only — game-setup guests should NOT appear in the
      // dedicated Players section or sync to Firestore.
      const playerId = await localStorageService.createPlayer({
        name: newGuestName.trim(),
        userId: user.uid,
        isGuest: true,
      });

      const newGuest: Player = {
        id: playerId,
        name: newGuestName.trim(),
        isGuest: true,
        createdBy: user.uid,
      };
      setGuestPlayers([...guestPlayers, newGuest]);
      togglePlayer(playerId);
      setNewGuestName('');
    } catch (error: any) {
      console.error('Failed to create guest:', error);
      crossPlatformAlert('Error', `Failed to create guest: ${error.message || error}`);
    }
  };

  const removeGuest = (guestId: string) => {
    setGuestPlayers(guestPlayers.filter(g => g.id !== guestId));
    const newSelected = new Set(selectedPlayerIds);
    newSelected.delete(guestId);
    setSelectedPlayerIds(newSelected);
  };

  const startGame = async () => {
    if (selectedPlayerIds.size < 2) {
      crossPlatformAlert('Error', 'Please select at least 2 players');
      return;
    }

    setLoading(true);
    try {
      // Get course name if a course is selected
      const selectedCourse = selectedCourseId ? courses.find(c => c.id === selectedCourseId) : null;
      const courseName = selectedCourse?.name;

      const gameId = await dataService.createGame(
        Array.from(selectedPlayerIds),
        user?.uid,
        selectedCourseId || undefined,
        courseName
      );

      if (selectedCourseId) {
        await dataService.initializeHolesForGameFromCourse(gameId, selectedCourseId);
      } else {
        await dataService.initializeHolesForGame(gameId);
      }

      navigation.navigate('Scoring', { gameId });
    } catch (error: any) {
      console.error('Failed to create game:', error);
      crossPlatformAlert('Error', `Failed to create game: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = searchQuery.trim()
    ? registeredPlayers.filter(player =>
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.userNumber?.includes(searchQuery)
      )
    : registeredPlayers;

  const selectedCount = selectedPlayerIds.size;

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <LinearGradient
        colors={
          settings.darkMode
            ? [colors.primary[900], colors.background.primary]
            : [colors.primary[300], colors.background.primary]
        }
        locations={[0, 0.5]}
        style={styles.headerGradient}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title Section */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.headerSection}
        >
          <Text style={styles.pageTitle}>NEW GAME</Text>
          <Text style={styles.pageSubtitle}>Set up your match</Text>
        </Animated.View>

        {/* Player Count Display */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(400)}
          style={styles.playerCountSection}
        >
          <Text style={styles.playerCountNumber}>{selectedCount}</Text>
          <Text style={styles.playerCountLabel}>PLAYERS SELECTED</Text>
        </Animated.View>

        {/* Course Selection */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <View style={styles.sectionHeader}>
            <Icon name="golf-tee" size={20} color={colors.accent.gold} />
            <Text style={styles.sectionTitle}>Course</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.courseScroll}
          >
            <TouchableOpacity
              style={[
                styles.courseCard,
                selectedCourseId === null && styles.courseCardSelected,
              ]}
              onPress={() => setSelectedCourseId(null)}
            >
              <Text style={styles.courseName}>Default</Text>
              <Text style={styles.courseDetails}>18 holes • Par 72</Text>
            </TouchableOpacity>

            {courses.map((course) => {
              const totalPar = course.holes.reduce((sum, hole) => sum + hole.par, 0);
              const isSelected = selectedCourseId === course.id;
              return (
                <TouchableOpacity
                  key={course.id}
                  style={[
                    styles.courseCard,
                    isSelected && styles.courseCardSelected,
                  ]}
                  onPress={() => setSelectedCourseId(course.id)}
                >
                  <Text style={styles.courseName} numberOfLines={1}>{course.name}</Text>
                  <Text style={styles.courseDetails}>
                    {course.holes.length} holes • Par {totalPar}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Registered Players Section */}
        <Animated.View entering={FadeInUp.delay(400).duration(500)}>
          <View style={styles.sectionHeader}>
            <Icon name="account-group" size={20} color={colors.accent.gold} />
            <Text style={styles.sectionTitle}>Players</Text>
            {selectedCount > 0 && (
              <Badge label={`${selectedCount}`} variant="primary" size="small" />
            )}
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="magnify" size={20} color={colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search players..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          {/* Players Grid */}
          {filteredPlayers.length === 0 ? (
            <Card glass style={styles.emptyCard}>
              <EmptyState
                icon={searchQuery ? "account-search" : "account-off"}
                title={searchQuery ? "No players found" : "No players yet"}
                description={searchQuery ? "Try a different search" : "Register players to get started"}
              />
            </Card>
          ) : (
            <View style={styles.playersGrid}>
              {filteredPlayers.map((player) => {
                const isSelected = selectedPlayerIds.has(player.id);
                return (
                  <TouchableOpacity
                    key={player.id}
                    style={[
                      styles.playerChip,
                      isSelected && styles.playerChipSelected,
                    ]}
                    onPress={() => togglePlayer(player.id)}
                  >
                    <Text style={[
                      styles.playerChipText,
                      isSelected && styles.playerChipTextSelected,
                    ]}>
                      {player.name}
                    </Text>
                    {player.userNumber && (
                      <Text style={styles.playerChipNumber}>#{player.userNumber}</Text>
                    )}
                    {isSelected && (
                      <Icon name="check" size={16} color={colors.text.inverse} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* Guest Players Section */}
        <Animated.View entering={FadeInUp.delay(500).duration(500)}>
          <View style={styles.sectionHeader}>
            <Icon name="account-plus" size={20} color={colors.accent.gold} />
            <Text style={styles.sectionTitle}>Add Guests</Text>
          </View>

          <View style={styles.addGuestRow}>
            <TextInput
              style={styles.guestInput}
              value={newGuestName}
              onChangeText={setNewGuestName}
              placeholder="Guest name"
              placeholderTextColor={colors.text.tertiary}
              onFocus={scrollToBottom}
              returnKeyType="done"
              onSubmitEditing={addGuestPlayer}
            />
            <Button
              title="Add"
              icon="plus"
              onPress={addGuestPlayer}
              variant="gold"
              size="small"
            />
          </View>

          {guestPlayers.length > 0 && (
            <View style={styles.guestList}>
              {guestPlayers.map((guest) => {
                const isSelected = selectedPlayerIds.has(guest.id);
                return (
                  <View
                    key={guest.id}
                    style={[
                      styles.guestItem,
                      isSelected && styles.guestItemSelected,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.guestCheckArea}
                      onPress={() => togglePlayer(guest.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onPress={() => togglePlayer(guest.id)}
                      />
                      <Text style={styles.guestName}>{guest.name}</Text>
                      <Badge label="Guest" variant="neutral" size="small" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeGuest(guest.id)}
                      style={styles.removeButton}
                    >
                      <Icon name="close" size={18} color={colors.status.error} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* Spacer for footer */}
        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* Start Game Footer */}
      <View style={styles.footer}>
        <Button
          title={`Start Game${selectedCount >= 2 ? ` (${selectedCount})` : ''}`}
          icon="play"
          onPress={startGame}
          loading={loading}
          disabled={selectedCount < 2}
          variant="gold"
          glow={selectedCount >= 2}
          fullWidth
          size="large"
        />
      </View>
    </KeyboardAvoidingView>
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
    height: 200,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  headerSection: {
    marginBottom: spacing.lg,
  },
  pageTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 40,
    color: colors.text.primary,
    letterSpacing: 2,
  },
  pageSubtitle: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.secondary,
  },
  playerCountSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  playerCountNumber: {
    fontFamily: fontFamilies.display,
    fontSize: 72,
    color: colors.accent.gold,
    lineHeight: 80,
  },
  playerCountLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.statLabel.fontSize,
    color: colors.text.secondary,
    letterSpacing: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.h4.fontSize,
    color: colors.text.primary,
    flex: 1,
  },
  courseScroll: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  courseCard: {
    backgroundColor: colors.glass.medium,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minWidth: 140,
    maxWidth: 200,
  },
  courseCardSelected: {
    borderColor: colors.accent.gold,
    backgroundColor: colors.glass.strong,
  },
  courseName: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  courseDetails: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.glass.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamilies.body,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  emptyCard: {
    padding: spacing.xl,
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.glass.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  playerChipSelected: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  playerChipText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.primary,
  },
  playerChipTextSelected: {
    color: colors.text.inverse,
  },
  playerChipNumber: {
    fontFamily: fontFamilies.mono,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
  },
  addGuestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  guestInput: {
    flex: 1,
    backgroundColor: colors.glass.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamilies.body,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.primary,
  },
  guestList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  guestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.glass.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  guestItemSelected: {
    borderColor: colors.accent.goldMuted,
    backgroundColor: colors.glass.medium,
  },
  guestCheckArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  guestName: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.primary,
    flex: 1,
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaces.level3,
  },
  footerSpacer: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});

export default GameSetupScreen;
