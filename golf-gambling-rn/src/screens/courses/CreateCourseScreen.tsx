import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { crossPlatformAlert } from '../../utils/crossPlatformAlert';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Button, Card, Icon } from '../../components/common';
import { dataService } from '../../services/DataService';
import { Course, CourseHole } from '../../types';
import { typography, spacing, fontFamilies, borderRadius } from '../../theme';
import { useThemedColors } from '../../contexts/ThemeContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useStore } from '../../store';

export const CreateCourseScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const colors = useThemedColors();
  const user = useStore((state) => state.user);
  const settings = useStore((state) => state.settings);
  const courseId = route.params?.courseId;
  const isEditing = !!courseId;

  const [courseName, setCourseName] = useState('');
  const [numberOfHoles, setNumberOfHoles] = useState('18');
  const [holes, setHoles] = useState<CourseHole[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedHole, setExpandedHole] = useState<number | null>(null);

  useEffect(() => {
    if (isEditing) {
      loadCourse();
    } else {
      // Initialize with default 18 holes
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
      crossPlatformAlert('Error', 'Failed to load course');
    }
  };

  const initializeHoles = (count: number) => {
    const newHoles: CourseHole[] = [];
    for (let i = 1; i <= count; i++) {
      newHoles.push({
        holeNumber: i,
        par: 4, // Default par
        index: i, // Default index (same as hole number)
      });
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
    setHoles(prevHoles =>
      prevHoles.map(hole =>
        hole.holeNumber === holeNumber ? { ...hole, par } : hole
      )
    );
  };

  const updateHoleIndex = (holeNumber: number, index: number) => {
    setHoles(prevHoles =>
      prevHoles.map(hole =>
        hole.holeNumber === holeNumber ? { ...hole, index } : hole
      )
    );
  };

  const handleSave = async () => {
    if (!courseName.trim()) {
      crossPlatformAlert('Error', 'Please enter a course name');
      return;
    }

    if (holes.length === 0) {
      crossPlatformAlert('Error', 'Please add at least one hole');
      return;
    }

    setLoading(true);

    try {
      if (isEditing) {
        await dataService.updateCourse(courseId, {
          name: courseName,
          holes,
        });
        crossPlatformAlert('Success', 'Course updated successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        await dataService.createCourse(courseName, holes, user?.uid);
        crossPlatformAlert('Success', 'Course created successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error: any) {
      console.error('Error saving course:', error);
      crossPlatformAlert('Error', `Failed to save course: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const totalPar = holes.reduce((sum, hole) => sum + hole.par, 0);
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
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
            <Text style={styles.headerTitle}>
              {isEditing ? 'Edit Course' : 'Create Course'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEditing ? 'Modify course details' : 'Set up a new golf course'}
            </Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(100).duration(500)}>
          <Card glass style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="information-outline" size={24} color={colors.accent.gold} />
              <Text style={styles.sectionTitle}>Course Details</Text>
            </View>

            <Text style={styles.label}>Course Name</Text>
            <TextInput
              style={styles.input}
              value={courseName}
              onChangeText={setCourseName}
              placeholder="e.g., Pebble Beach"
              placeholderTextColor={colors.text.tertiary}
            />

            {!isEditing && (
              <>
                <Text style={styles.label}>Number of Holes</Text>
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
              <Icon name="golf" size={20} color={colors.accent.gold} />
              <Text style={styles.totalParLabel}>Total Par:</Text>
              <Text style={styles.totalParValue}>{totalPar}</Text>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <Card glass style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="flag" size={24} color={colors.accent.gold} />
              <Text style={styles.sectionTitle}>Par for Each Hole</Text>
            </View>

          <View style={styles.holesGrid}>
            {holes.map((hole) => (
              <View key={hole.holeNumber} style={styles.holeItemWrapper}>
                <View style={styles.holeItem}>
                  <View style={styles.holeHeader}>
                    <Text style={styles.holeNumber}>Hole {hole.holeNumber}</Text>
                    <View style={styles.indexBadge}>
                      <Text style={styles.indexBadgeText}>#{hole.index || hole.holeNumber}</Text>
                    </View>
                  </View>

                  <View style={styles.parControls}>
                    <TouchableOpacity
                      style={styles.parButton}
                      onPress={() => updateHolePar(hole.holeNumber, Math.max(3, hole.par - 1))}
                    >
                      <Text style={styles.parButtonText}>−</Text>
                    </TouchableOpacity>

                    <Text style={styles.parValue}>Par {hole.par}</Text>

                    <TouchableOpacity
                      style={styles.parButton}
                      onPress={() => updateHolePar(hole.holeNumber, Math.min(6, hole.par + 1))}
                    >
                      <Text style={styles.parButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.indexSelector}
                    onPress={() => setExpandedHole(expandedHole === hole.holeNumber ? null : hole.holeNumber)}
                  >
                    <Text style={styles.indexSelectorLabel}>Index:</Text>
                    <View style={styles.indexSelectorValue}>
                      <Text style={styles.indexSelectorText}>{hole.index || hole.holeNumber}</Text>
                      <Icon
                        name={expandedHole === hole.holeNumber ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={colors.accent.gold}
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Dropdown Panel */}
                {expandedHole === hole.holeNumber && (
                  <View style={styles.indexDropdown}>
                    <Text style={styles.dropdownTitle}>Select Index Difficulty</Text>
                    <View style={styles.indexGrid}>
                      {Array.from({ length: holes.length }, (_, i) => i + 1).map((idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.indexOption,
                            (hole.index || hole.holeNumber) === idx && styles.indexOptionSelected
                          ]}
                          onPress={() => {
                            updateHoleIndex(hole.holeNumber, idx);
                            setExpandedHole(null);
                          }}
                        >
                          <Text style={[
                            styles.indexOptionText,
                            (hole.index || hole.holeNumber) === idx && styles.indexOptionTextSelected
                          ]}>
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

            <View style={styles.quickSetButtons}>
              <Text style={styles.quickSetLabel}>Quick Set All:</Text>
              <TouchableOpacity
                style={styles.quickSetButton}
                onPress={() => setHoles(holes.map(h => ({ ...h, par: 3 })))}
              >
                <Text style={styles.quickSetButtonText}>Par 3</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickSetButton}
                onPress={() => setHoles(holes.map(h => ({ ...h, par: 4 })))}
              >
                <Text style={styles.quickSetButtonText}>Par 4</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickSetButton}
                onPress={() => setHoles(holes.map(h => ({ ...h, par: 5 })))}
              >
                <Text style={styles.quickSetButtonText}>Par 5</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isEditing ? 'Update Course' : 'Create Course'}
          onPress={handleSave}
          disabled={loading}
          variant="gold"
          glow
          fullWidth
        />
      </View>
    </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.h4.fontSize,
    color: colors.text.primary,
  },
  label: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.primary,
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
    backgroundColor: colors.surfaces.level2,
  },
  totalPar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaces.level3,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.goldSubtle,
  },
  totalParLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.h4.fontSize,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  totalParValue: {
    fontFamily: fontFamilies.display,
    fontSize: typography.h2.fontSize,
    color: colors.accent.gold,
  },
  holesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  holeItemWrapper: {
    width: '48%',
  },
  holeItem: {
    padding: spacing.md,
    backgroundColor: colors.surfaces.level2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  holeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  holeNumber: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.primary,
  },
  indexBadge: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  indexBadgeText: {
    fontFamily: fontFamilies.monoBold,
    fontSize: 11,
    color: colors.text.inverse,
    fontWeight: '700',
  },
  parControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  parButton: {
    backgroundColor: colors.accent.gold,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  parButtonText: {
    color: colors.text.inverse,
    fontSize: 20,
    fontFamily: fontFamilies.bodySemiBold,
  },
  parValue: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.primary,
  },
  indexSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingVertical: spacing.xs,
  },
  indexSelectorLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 12,
    color: colors.text.secondary,
  },
  indexSelectorValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaces.level3,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.goldSubtle,
  },
  indexSelectorText: {
    fontFamily: fontFamilies.monoBold,
    fontSize: 13,
    color: colors.accent.gold,
    minWidth: 20,
    textAlign: 'center',
  },
  indexDropdown: {
    marginTop: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.surfaces.level3,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.goldSubtle,
    shadowColor: colors.shadowColors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  dropdownTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 11,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  indexGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  indexOption: {
    minWidth: 40,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaces.level2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexOptionSelected: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  indexOptionText: {
    fontFamily: fontFamilies.monoBold,
    fontSize: 12,
    color: colors.text.primary,
    textAlign: 'center',
  },
  indexOptionTextSelected: {
    color: colors.text.inverse,
    fontWeight: '700',
  },
  quickSetButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.sm,
  },
  quickSetLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  quickSetButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaces.level3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.goldSubtle,
  },
  quickSetButtonText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.bodySmall.fontSize,
    color: colors.accent.gold,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});
