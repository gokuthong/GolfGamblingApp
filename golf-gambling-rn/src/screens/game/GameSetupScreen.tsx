import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { crossPlatformAlert } from "../../utils/crossPlatformAlert";
import { Button, Card, Checkbox, Icon, Badge, EmptyState } from "../../components/common";
import { dataService } from "../../services/DataService";
import { localStorageService } from "../../services/storage/LocalStorageService";
import { Player, Course } from "../../types";
import { typography, spacing, fontFamilies, borderRadius } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../store";

export const GameSetupScreen = () => {
  const navigation = useNavigation<any>();
  const scrollViewRef = useRef<ScrollView>(null);
  const colors = useThemedColors();
  const [registeredPlayers, setRegisteredPlayers] = useState<Player[]>([]);
  const [guestPlayers, setGuestPlayers] = useState<Player[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newGuestName, setNewGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadCourses();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRegisteredPlayers();
    }, [user]),
  );

  const loadRegisteredPlayers = async () => {
    try {
      const allPlayers = await dataService.getAllPlayers(user?.uid);
      setRegisteredPlayers(allPlayers.filter((p) => !p.isGuest));
    } catch (error) {
      console.error("Failed to load players:", error);
    }
  };

  const loadCourses = async () => {
    try {
      const fetchedCourses = await dataService.getAllCourses();
      setCourses(fetchedCourses);
    } catch (error) {
      console.error("Failed to load courses:", error);
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
      crossPlatformAlert("Error", "Please enter a guest name");
      return;
    }

    if (!user?.uid) {
      crossPlatformAlert("Error", "You must be logged in to add guests");
      return;
    }

    try {
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
      setNewGuestName("");
    } catch (error: any) {
      console.error("Failed to create guest:", error);
      crossPlatformAlert("Error", `Failed to create guest: ${error.message || error}`);
    }
  };

  const removeGuest = (guestId: string) => {
    setGuestPlayers(guestPlayers.filter((g) => g.id !== guestId));
    const newSelected = new Set(selectedPlayerIds);
    newSelected.delete(guestId);
    setSelectedPlayerIds(newSelected);
  };

  const startGame = async () => {
    if (selectedPlayerIds.size < 2) {
      crossPlatformAlert("Error", "Please select at least 2 players");
      return;
    }

    setLoading(true);
    try {
      const selectedCourse = selectedCourseId ? courses.find((c) => c.id === selectedCourseId) : null;
      const courseName = selectedCourse?.name;

      const gameId = await dataService.createGame(
        Array.from(selectedPlayerIds),
        user?.uid,
        selectedCourseId || undefined,
        courseName,
      );

      if (selectedCourseId) {
        await dataService.initializeHolesForGameFromCourse(gameId, selectedCourseId);
      } else {
        await dataService.initializeHolesForGame(gameId);
      }

      navigation.navigate("Scoring", { gameId });
    } catch (error: any) {
      console.error("Failed to create game:", error);
      crossPlatformAlert("Error", `Failed to create game: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = searchQuery.trim()
    ? registeredPlayers.filter(
        (player) =>
          player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          player.userNumber?.includes(searchQuery),
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Editorial hero */}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Start a match</Text>
          <Text style={styles.heroTitle}>New game</Text>
          <View style={styles.goldRule} />
          <Text style={styles.heroMeta}>
            Choose a course and pick at least two players.
          </Text>
        </View>

        {/* Selected count */}
        <View style={styles.countStrip}>
          <Text style={styles.countNumber}>{selectedCount}</Text>
          <View style={styles.countLabelWrap}>
            <Text style={styles.countLabel}>Players selected</Text>
            <Text style={styles.countHint}>Minimum two to begin</Text>
          </View>
        </View>

        {/* Course selection */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Course</Text>
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
              <Text style={styles.courseDetails}>18 holes · Par 72</Text>
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
                  <Text style={styles.courseName} numberOfLines={1}>
                    {course.name}
                  </Text>
                  <Text style={styles.courseDetails}>
                    {course.holes.length} holes · Par {totalPar}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Registered players */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionEyebrow}>Players</Text>
            {selectedCount > 0 && (
              <Badge label={`${selectedCount}`} variant="primary" size="small" />
            )}
          </View>

          <View style={styles.searchContainer}>
            <Icon name="magnify" size={18} color={colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search players…"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          {filteredPlayers.length === 0 ? (
            <Card style={styles.emptyCard}>
              <EmptyState
                icon={searchQuery ? "account-search" : "account-off"}
                title={searchQuery ? "No players found" : "No players yet"}
                description={
                  searchQuery ? "Try a different search" : "Register players to get started"
                }
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
                    <Text
                      style={[
                        styles.playerChipText,
                        isSelected && styles.playerChipTextSelected,
                      ]}
                    >
                      {player.name}
                    </Text>
                    {player.userNumber && (
                      <Text
                        style={[
                          styles.playerChipNumber,
                          isSelected && styles.playerChipNumberSelected,
                        ]}
                      >
                        #{player.userNumber}
                      </Text>
                    )}
                    {isSelected && (
                      <Icon name="check" size={14} color={colors.text.inverse} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Guests */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Add guests</Text>

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
            <Button title="Add" onPress={addGuestPlayer} variant="gold" size="small" />
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
                      <Checkbox checked={isSelected} onPress={() => togglePlayer(guest.id)} />
                      <Text style={styles.guestName}>{guest.name}</Text>
                      <Badge label="Guest" variant="neutral" size="small" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeGuest(guest.id)}
                      style={styles.removeButton}
                    >
                      <Icon name="close" size={16} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={selectedCount >= 2 ? `Start game (${selectedCount})` : "Start game"}
          onPress={startGame}
          loading={loading}
          disabled={selectedCount < 2}
          variant="gold"
          fullWidth
          size="large"
        />
      </View>
    </KeyboardAvoidingView>
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
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xxxl,
      paddingBottom: spacing.xxl,
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
      maxWidth: 340,
    },
    countStrip: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    countNumber: {
      fontFamily: fontFamilies.display,
      fontSize: 56,
      lineHeight: 60,
      color: colors.accent.gold,
      letterSpacing: -1.8,
      minWidth: 64,
    },
    countLabelWrap: {
      flex: 1,
    },
    countLabel: {
      ...typography.bodyLarge,
      fontFamily: fontFamilies.bodySemiBold,
      color: colors.text.primary,
    },
    countHint: {
      ...typography.bodySmall,
      color: colors.text.tertiary,
      marginTop: 2,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    sectionEyebrow: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginBottom: spacing.md,
    },
    courseScroll: {
      gap: spacing.sm,
      paddingBottom: spacing.xs,
    },
    courseCard: {
      backgroundColor: colors.background.card,
      borderWidth: 1,
      borderColor: colors.border.light,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      minWidth: 150,
      maxWidth: 210,
    },
    courseCardSelected: {
      borderColor: colors.accent.gold,
      borderWidth: 1.5,
    },
    courseName: {
      ...typography.bodyMedium,
      fontFamily: fontFamilies.bodySemiBold,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    courseDetails: {
      ...typography.bodySmall,
      color: colors.text.tertiary,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.background.card,
      borderWidth: 1,
      borderColor: colors.border.light,
      borderRadius: borderRadius.full,
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
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    playerChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: colors.background.card,
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
      fontFamily: fontFamilies.bodySemiBold,
    },
    playerChipNumber: {
      fontFamily: fontFamilies.mono,
      fontSize: typography.bodySmall.fontSize,
      color: colors.text.tertiary,
    },
    playerChipNumberSelected: {
      color: colors.text.inverse,
      opacity: 0.9,
    },
    addGuestRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    guestInput: {
      flex: 1,
      backgroundColor: colors.background.card,
      borderWidth: 1,
      borderColor: colors.border.light,
      borderRadius: borderRadius.full,
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
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.background.card,
      borderWidth: 1,
      borderColor: colors.border.light,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
    },
    guestItemSelected: {
      borderColor: colors.border.goldSubtle,
    },
    guestCheckArea: {
      flexDirection: "row",
      alignItems: "center",
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
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      backgroundColor: colors.surfaces.level2,
    },
    footerSpacer: {
      height: 100,
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      backgroundColor: colors.background.primary,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
  });

export default GameSetupScreen;
