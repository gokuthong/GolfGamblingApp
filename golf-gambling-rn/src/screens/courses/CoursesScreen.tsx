import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { crossPlatformAlert } from '../../utils/crossPlatformAlert';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Button, Card, Icon, EmptyState } from '../../components/common';
import { dataService } from '../../services/DataService';
import { Course } from '../../types';
import { typography, spacing, fontFamilies, borderRadius } from '../../theme';
import { useThemedColors } from '../../contexts/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStore } from '../../store';

export const CoursesScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemedColors();
  const settings = useStore((state) => state.settings);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCourses = useCallback(async () => {
    const coursesData = await dataService.getAllCourses();
    setCourses(coursesData);
    setLoading(false);
  }, []);

  // Load courses when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCourses();
    }, [loadCourses])
  );

  const handleDeleteCourse = (course: Course) => {
    crossPlatformAlert(
      'Delete Course',
      `Are you sure you want to delete "${course.name}"?`,
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
              await dataService.deleteCourse(course.id);
              // Reload courses
              await loadCourses();
            } catch (error) {
              crossPlatformAlert('Error', 'Failed to delete course');
            }
          },
        },
      ]
    );
  };

  const renderCourse = ({ item: course, index }: { item: Course; index: number }) => {
    const totalPar = course.holes.reduce((sum, hole) => sum + hole.par, 0);

    return (
      <Animated.View entering={FadeInUp.delay(100 * index).duration(400)}>
        <Card glass style={styles.courseCard}>
          <View style={styles.courseHeader}>
            <View style={styles.courseIconContainer}>
              <Icon name="golf-tee" size={32} color={colors.accent.gold} />
            </View>
            <View style={styles.courseInfo}>
              <Text style={styles.courseName}>{course.name}</Text>
              <View style={styles.courseMetaRow}>
                <View style={styles.metaBadge}>
                  <Icon name="flag" size={14} color={colors.text.secondary} />
                  <Text style={styles.metaText}>{course.holes.length} holes</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Icon name="golf" size={14} color={colors.accent.gold} />
                  <Text style={styles.parText}>Par {totalPar}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditCourse', { courseId: course.id })}
            >
              <Icon name="pencil" size={16} color={colors.accent.gold} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteCourse(course)}
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
          <Text style={styles.loadingText}>Loading courses...</Text>
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
          <Icon name="golf-tee" size={32} color={colors.accent.gold} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Courses</Text>
            <Text style={styles.headerSubtitle}>Manage your golf courses</Text>
          </View>
        </View>
      </Animated.View>

      {courses.length === 0 ? (
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.emptyState}>
          <Card glass style={styles.emptyCard}>
            <EmptyState
              icon="golf-tee"
              title="No courses yet"
              description="Create your first course to get started"
            />
          </Card>
        </Animated.View>
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
          title="Create New Course"
          icon="plus"
          variant="gold"
          glow
          fullWidth
          onPress={() => navigation.navigate('CreateCourse')}
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
  courseCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  courseIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaces.level2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border.goldSubtle,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.h4.fontSize,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  courseMetaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaces.level2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  metaText: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
  },
  parText: {
    fontFamily: fontFamilies.monoBold,
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
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaces.level3,
    borderWidth: 1,
    borderColor: colors.border.goldSubtle,
  },
  editButtonText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.bodySmall.fontSize,
    color: colors.accent.gold,
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
});
