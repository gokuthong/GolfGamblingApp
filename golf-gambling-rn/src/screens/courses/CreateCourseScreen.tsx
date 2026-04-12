import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { crossPlatformAlert } from "../../utils/crossPlatformAlert";
import { Button, Card, Icon } from "../../components/common";
import { dataService } from "../../services/DataService";
import { Course, CourseHole } from "../../types";
import { typography, spacing, fontFamilies, borderRadius } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useStore } from "../../store";

export const CreateCourseScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const colors = useThemedColors();
  const user = useStore((state) => state.user);
  const courseId = route.params?.courseId;
  const isEditing = !!courseId;

  const [courseName, setCourseName] = useState("");
  const [numberOfHoles, setNumberOfHoles] = useState("18");
  const [holes, setHoles] = useState<CourseHole[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedHole, setExpandedHole] = useState<number | null>(null);

  useEffect(() => {
    if (isEditing) {
      loadCourse();
    } else {
      initializeHoles(18);
    }
  }, [courseId]);

  const loadCourse = async () => {
    if (!courseId) return;
    try {
      const course = await dataService.getCourse(courseId);
      if (course) {
        setCourseName(course.name);
        setNumberOfHoles(course.holes.length.toString());
        setHoles(course.holes);
      }
    } catch (error) {
      crossPlatformAlert("Error", "Failed to load course");
    }
  };

  const initializeHoles = (count: number) => {
    const newHoles: CourseHole[] = [];
    for (let i = 1; i <= count; i++) {
      newHoles.push({ holeNumber: i, par: 4, index: i });
    }
    setHoles(newHoles);
  };

  const handleNumberOfHolesChange = (value: string) => {
    setNumberOfHoles(value);
    const count = parseInt(value);
    if (!isNaN(count) && count > 0 && count <= 36) {
      initializeHoles(count);
    }
  };

  const updateHolePar = (holeNumber: number, par: number) => {
    setHoles((prevHoles) =>
      prevHoles.map((hole) =>
        hole.holeNumber === holeNumber ? { ...hole, par } : hole,
      ),
    );
  };

  const updateHoleIndex = (holeNumber: number, index: number) => {
    setHoles((prevHoles) =>
      prevHoles.map((hole) =>
        hole.holeNumber === holeNumber ? { ...hole, index } : hole,
      ),
    );
  };

  const handleSave = async () => {
    if (!courseName.trim()) {
      crossPlatformAlert("Error", "Please enter a course name");
      return;
    }
    if (holes.length === 0) {
      crossPlatformAlert("Error", "Please add at least one hole");
      return;
    }

    setLoading(true);

    try {
      if (isEditing) {
        await dataService.updateCourse(courseId, { name: courseName, holes });
        crossPlatformAlert("Success", "Course updated successfully", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        await dataService.createCourse(courseName, holes, user?.uid);
        crossPlatformAlert("Success", "Course created successfully", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      console.error("Error saving course:", error);
      crossPlatformAlert(
        "Error",
        `Failed to save course: ${error.message || error}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const totalPar = holes.reduce((sum, hole) => sum + hole.par, 0);
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>
            {isEditing ? "Editing" : "New layout"}
          </Text>
          <Text style={styles.heroTitle}>
            {isEditing ? "Edit course" : "Create course"}
          </Text>
          <View style={styles.goldRule} />
          <Text style={styles.heroMeta}>
            {isEditing
              ? "Modify details, par, and stroke index."
              : "Set up a new golf course from scratch."}
          </Text>
        </View>

        {/* Course details */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Course details</Text>
          <Card style={styles.sectionCard}>
            <Text style={styles.label}>Course name</Text>
            <TextInput
              style={styles.input}
              value={courseName}
              onChangeText={setCourseName}
              placeholder="e.g., Pebble Beach"
              placeholderTextColor={colors.text.tertiary}
            />

            {!isEditing && (
              <>
                <Text style={styles.label}>Number of holes</Text>
                <TextInput
                  style={styles.input}
                  value={numberOfHoles}
                  onChangeText={handleNumberOfHolesChange}
                  keyboardType="number-pad"
                  placeholder="18"
                  placeholderTextColor={colors.text.tertiary}
                />
              </>
            )}

            <View style={styles.totalPar}>
              <View>
                <Text style={styles.totalParLabel}>Total par</Text>
                <Text style={styles.totalParHint}>
                  {holes.length} holes configured
                </Text>
              </View>
              <Text style={styles.totalParValue}>{totalPar}</Text>
            </View>
          </Card>
        </View>

        {/* Par per hole */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Par for each hole</Text>
          <Card style={styles.sectionCard}>
            <View style={styles.holesGrid}>
              {holes.map((hole) => (
                <View key={hole.holeNumber} style={styles.holeItemWrapper}>
                  <View style={styles.holeItem}>
                    <View style={styles.holeHeader}>
                      <Text style={styles.holeNumber}>
                        Hole {hole.holeNumber}
                      </Text>
                      <View style={styles.indexBadge}>
                        <Text style={styles.indexBadgeText}>
                          #{hole.index || hole.holeNumber}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.parControls}>
                      <TouchableOpacity
                        style={styles.parButton}
                        onPress={() =>
                          updateHolePar(
                            hole.holeNumber,
                            Math.max(3, hole.par - 1),
                          )
                        }
                      >
                        <Icon
                          name="minus"
                          size={14}
                          color={colors.text.primary}
                        />
                      </TouchableOpacity>

                      <Text style={styles.parValue}>Par {hole.par}</Text>

                      <TouchableOpacity
                        style={styles.parButton}
                        onPress={() =>
                          updateHolePar(
                            hole.holeNumber,
                            Math.min(6, hole.par + 1),
                          )
                        }
                      >
                        <Icon
                          name="plus"
                          size={14}
                          color={colors.text.primary}
                        />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.indexSelector}
                      onPress={() =>
                        setExpandedHole(
                          expandedHole === hole.holeNumber
                            ? null
                            : hole.holeNumber,
                        )
                      }
                    >
                      <Text style={styles.indexSelectorLabel}>Index</Text>
                      <View style={styles.indexSelectorValue}>
                        <Text style={styles.indexSelectorText}>
                          {hole.index || hole.holeNumber}
                        </Text>
                        <Icon
                          name={
                            expandedHole === hole.holeNumber
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={14}
                          color={colors.accent.gold}
                        />
                      </View>
                    </TouchableOpacity>
                  </View>

                  {expandedHole === hole.holeNumber && (
                    <View style={styles.indexDropdown}>
                      <Text style={styles.dropdownTitle}>
                        Select index difficulty
                      </Text>
                      <View style={styles.indexGrid}>
                        {Array.from(
                          { length: holes.length },
                          (_, i) => i + 1,
                        ).map((idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={[
                              styles.indexOption,
                              (hole.index || hole.holeNumber) === idx &&
                                styles.indexOptionSelected,
                            ]}
                            onPress={() => {
                              updateHoleIndex(hole.holeNumber, idx);
                              setExpandedHole(null);
                            }}
                          >
                            <Text
                              style={[
                                styles.indexOptionText,
                                (hole.index || hole.holeNumber) === idx &&
                                  styles.indexOptionTextSelected,
                              ]}
                            >
                              {idx}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.quickSetRow}>
              <Text style={styles.quickSetLabel}>Quick set all</Text>
              <View style={styles.quickSetButtons}>
                <TouchableOpacity
                  style={styles.quickSetButton}
                  onPress={() => setHoles(holes.map((h) => ({ ...h, par: 3 })))}
                >
                  <Text style={styles.quickSetButtonText}>Par 3</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickSetButton}
                  onPress={() => setHoles(holes.map((h) => ({ ...h, par: 4 })))}
                >
                  <Text style={styles.quickSetButtonText}>Par 4</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickSetButton}
                  onPress={() => setHoles(holes.map((h) => ({ ...h, par: 5 })))}
                >
                  <Text style={styles.quickSetButtonText}>Par 5</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isEditing ? "Update course" : "Create course"}
          onPress={handleSave}
          disabled={loading}
          loading={loading}
          variant="gold"
          fullWidth
          size="large"
        />
      </View>
    </View>
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
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionEyebrow: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    sectionCard: {
      padding: spacing.lg,
    },
    label: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginBottom: spacing.xs,
      marginTop: spacing.md,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border.light,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontFamily: fontFamilies.body,
      fontSize: typography.bodyMedium.fontSize,
      color: colors.text.primary,
      backgroundColor: colors.background.primary,
    },
    totalPar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    totalParLabel: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginBottom: 2,
    },
    totalParHint: {
      ...typography.bodySmall,
      color: colors.text.tertiary,
    },
    totalParValue: {
      fontFamily: fontFamilies.display,
      fontSize: 40,
      lineHeight: 44,
      color: colors.accent.gold,
      letterSpacing: -1.2,
    },
    holesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    holeItemWrapper: {
      width: "48%",
    },
    holeItem: {
      padding: spacing.md,
      backgroundColor: colors.background.primary,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    holeHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    holeNumber: {
      ...typography.bodyMedium,
      fontFamily: fontFamilies.bodySemiBold,
      color: colors.text.primary,
    },
    indexBadge: {
      backgroundColor: "transparent",
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.goldSubtle,
    },
    indexBadgeText: {
      fontFamily: fontFamilies.monoMedium,
      fontSize: 10,
      color: colors.accent.gold,
      letterSpacing: 0.3,
    },
    parControls: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    parButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.border.goldSubtle,
      backgroundColor: colors.background.card,
      justifyContent: "center",
      alignItems: "center",
    },
    parValue: {
      ...typography.bodyMedium,
      fontFamily: fontFamilies.bodySemiBold,
      color: colors.text.primary,
    },
    indexSelector: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.xs,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    indexSelectorLabel: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
    },
    indexSelectorValue: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    indexSelectorText: {
      fontFamily: fontFamilies.monoMedium,
      fontSize: 13,
      color: colors.accent.gold,
      minWidth: 18,
      textAlign: "center",
    },
    indexDropdown: {
      marginTop: spacing.xs,
      padding: spacing.md,
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border.goldSubtle,
    },
    dropdownTitle: {
      ...typography.label,
      color: colors.text.tertiary,
      marginBottom: spacing.sm,
      textAlign: "center",
      textTransform: "uppercase",
    },
    indexGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    indexOption: {
      minWidth: 36,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.light,
      justifyContent: "center",
      alignItems: "center",
    },
    indexOptionSelected: {
      backgroundColor: colors.accent.gold,
      borderColor: colors.accent.gold,
    },
    indexOptionText: {
      fontFamily: fontFamilies.monoMedium,
      fontSize: 12,
      color: colors.text.secondary,
      textAlign: "center",
    },
    indexOptionTextSelected: {
      color: colors.text.inverse,
    },
    quickSetRow: {
      marginTop: spacing.lg,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    quickSetLabel: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    quickSetButtons: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    quickSetButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.goldSubtle,
    },
    quickSetButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: typography.bodySmall.fontSize,
      color: colors.accent.gold,
      letterSpacing: 0.3,
    },
    footer: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      backgroundColor: colors.background.primary,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
  });

export default CreateCourseScreen;
