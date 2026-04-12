import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { crossPlatformAlert } from "../../utils/crossPlatformAlert";
import { Button, Card, Icon, EmptyState } from "../../components/common";
import { dataService } from "../../services/DataService";
import { Course } from "../../types";
import { typography, spacing, fontFamilies, borderRadius } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

export const CoursesScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemedColors();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCourses = useCallback(async () => {
    const coursesData = await dataService.getAllCourses();
    setCourses(coursesData);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCourses();
    }, [loadCourses]),
  );

  const handleDeleteCourse = (course: Course) => {
    crossPlatformAlert(
      "Delete course",
      `Are you sure you want to delete "${course.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await dataService.deleteCourse(course.id);
              await loadCourses();
            } catch (error) {
              crossPlatformAlert("Error", "Failed to delete course");
            }
          },
        },
      ],
    );
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  const renderCourse = ({ item: course }: { item: Course }) => {
    const totalPar = course.holes.reduce((sum, hole) => sum + hole.par, 0);

    return (
      <Card style={styles.courseCard}>
        <View style={styles.courseHeader}>
          <View style={styles.courseIconContainer}>
            <Icon name="golf-tee" size={22} color={colors.accent.gold} />
          </View>
          <View style={styles.courseInfo}>
            <Text style={styles.courseName} numberOfLines={1}>
              {course.name}
            </Text>
            <View style={styles.courseMetaRow}>
              <Text style={styles.metaText}>{course.holes.length} holes</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.parText}>Par {totalPar}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              navigation.navigate("EditCourse", { courseId: course.id })
            }
          >
            <Icon name="pencil" size={14} color={colors.accent.gold} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteCourse(course)}
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
          <Text style={styles.loadingText}>Loading courses…</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Library</Text>
          <Text style={styles.headerTitle}>Courses</Text>
          <View style={styles.goldRule} />
          <Text style={styles.headerSubtitle}>Manage your golf courses</Text>
        </View>

        {courses.length === 0 ? (
          <View style={styles.emptyState}>
            <Card style={styles.emptyCard}>
              <EmptyState
                icon="golf-tee"
                title="No courses yet"
                description="Create your first course to get started"
              />
            </Card>
          </View>
        ) : (
          <FlatList
            data={courses}
            renderItem={renderCourse}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.footer}>
          <Button
            title="Create new course"
            icon="plus"
            variant="gold"
            fullWidth
            onPress={() => navigation.navigate("CreateCourse")}
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
    courseCard: {
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    courseHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    courseIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaces.level2,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border.goldSubtle,
    },
    courseInfo: {
      flex: 1,
    },
    courseName: {
      ...typography.h4,
      fontFamily: fontFamilies.display,
      color: colors.text.primary,
      marginBottom: spacing.xs,
      letterSpacing: -0.3,
    },
    courseMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    metaText: {
      ...typography.bodySmall,
      color: colors.text.tertiary,
    },
    metaDot: {
      ...typography.bodySmall,
      color: colors.text.tertiary,
    },
    parText: {
      fontFamily: fontFamilies.monoMedium,
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
    editButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.goldSubtle,
    },
    editButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: typography.bodySmall.fontSize,
      color: colors.accent.gold,
      letterSpacing: 0.3,
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
  });

export default CoursesScreen;
