import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { useThemedColors } from '../contexts/ThemeContext';
import { dataService } from '../services/DataService';
import { crossPlatformAlert } from '../utils/alert';
import { Course } from '../types';
import { typography, fontFamilies, spacing, borderRadius, shadows } from '../theme';

export const CoursesPage = () => {
  const navigate = useNavigate();
  const colors = useThemedColors();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCourses = useCallback(async () => {
    const coursesData = await dataService.getAllCourses();
    setCourses(coursesData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleDeleteCourse = (course: Course) => {
    crossPlatformAlert(
      'Delete course',
      `Are you sure you want to delete "${course.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataService.deleteCourse(course.id);
              await loadCourses();
            } catch (error) {
              crossPlatformAlert('Error', 'Failed to delete course');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          bgcolor: colors.background.primary,
        }}
      >
        <CircularProgress sx={{ color: colors.accent.gold }} size={40} />
        <Typography
          sx={{
            ...typography.bodyMedium,
            color: colors.text.secondary,
            mt: `${spacing.md}px`,
          }}
        >
          Loading courses...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: colors.background.primary,
      }}
    >
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Header */}
        <Box
          sx={{
            px: `${spacing.xl}px`,
            pt: `${spacing.xxxl}px`,
            pb: `${spacing.lg}px`,
          }}
        >
          <Typography
            sx={{
              ...typography.label,
              color: colors.text.tertiary,
              textTransform: 'uppercase',
              mb: `${spacing.sm}px`,
            }}
          >
            Library
          </Typography>
          <Typography
            sx={{
              ...typography.displayMedium,
              color: colors.text.primary,
              mb: `${spacing.md}px`,
            }}
          >
            Courses
          </Typography>
          <Box
            sx={{
              height: 1.5,
              width: 48,
              bgcolor: colors.accent.gold,
              borderRadius: '1px',
              mb: `${spacing.md}px`,
            }}
          />
          <Typography
            sx={{
              ...typography.bodyLarge,
              color: colors.text.secondary,
            }}
          >
            Manage your golf courses
          </Typography>
        </Box>

        {/* Content */}
        {courses.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              px: `${spacing.xl}px`,
              py: `${spacing.xxl}px`,
            }}
          >
            <Box
              sx={{
                bgcolor: colors.background.card,
                borderRadius: `${borderRadius.xl}px`,
                border: `1px solid ${colors.border.light}`,
                p: `${spacing.xl}px`,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: shadows.small,
              }}
            >
              <GolfCourseIcon
                sx={{
                  fontSize: 48,
                  color: colors.text.tertiary,
                  mb: `${spacing.md}px`,
                  opacity: 0.5,
                }}
              />
              <Typography
                sx={{
                  ...typography.h3,
                  fontFamily: fontFamilies.display,
                  color: colors.text.primary,
                  mb: `${spacing.sm}px`,
                }}
              >
                No courses yet
              </Typography>
              <Typography
                sx={{
                  ...typography.bodyMedium,
                  color: colors.text.secondary,
                }}
              >
                Create your first course to get started
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ px: `${spacing.xl}px`, pb: `${spacing.xxl}px` }}>
            {courses.map((course) => {
              const totalPar = course.holes.reduce((sum, hole) => sum + hole.par, 0);

              return (
                <Box
                  key={course.id}
                  sx={{
                    bgcolor: colors.background.card,
                    borderRadius: `${borderRadius.xl}px`,
                    border: `1px solid ${colors.border.light}`,
                    p: `${spacing.lg}px`,
                    mb: `${spacing.md}px`,
                    boxShadow: shadows.small,
                  }}
                >
                  {/* Course header */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: `${spacing.md}px`,
                      mb: `${spacing.md}px`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        bgcolor: colors.surfaces.level2,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        border: `1px solid ${colors.border.goldSubtle}`,
                        flexShrink: 0,
                      }}
                    >
                      <GolfCourseIcon sx={{ fontSize: 22, color: colors.accent.gold }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        noWrap
                        sx={{
                          ...typography.h4,
                          fontFamily: fontFamilies.display,
                          color: colors.text.primary,
                          mb: `${spacing.xs}px`,
                          letterSpacing: -0.3,
                        }}
                      >
                        {course.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.xs}px` }}>
                        <Typography
                          sx={{
                            ...typography.bodySmall,
                            color: colors.text.tertiary,
                          }}
                        >
                          {course.holes.length} holes
                        </Typography>
                        <Typography
                          sx={{
                            ...typography.bodySmall,
                            color: colors.text.tertiary,
                          }}
                        >
                          &middot;
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: fontFamilies.monoMedium,
                            fontSize: typography.bodySmall.fontSize,
                            color: colors.accent.gold,
                            letterSpacing: 0.3,
                          }}
                        >
                          Par {totalPar}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Actions */}
                  <Box
                    sx={{
                      display: 'flex',
                      gap: `${spacing.sm}px`,
                      borderTop: `1px solid ${colors.border.light}`,
                      pt: `${spacing.md}px`,
                    }}
                  >
                    <Box
                      onClick={() => navigate(`/courses/edit/${course.id}`)}
                      sx={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: `${spacing.xs}px`,
                        py: `${spacing.sm}px`,
                        borderRadius: `${borderRadius.full}px`,
                        border: `1px solid ${colors.border.goldSubtle}`,
                        cursor: 'pointer',
                        transition: 'background-color 200ms ease',
                        '&:hover': {
                          bgcolor: `${colors.accent.gold}11`,
                        },
                      }}
                    >
                      <EditIcon sx={{ fontSize: 14, color: colors.accent.gold }} />
                      <Typography
                        sx={{
                          fontFamily: fontFamilies.bodySemiBold,
                          fontSize: typography.bodySmall.fontSize,
                          color: colors.accent.gold,
                          letterSpacing: 0.3,
                        }}
                      >
                        Edit
                      </Typography>
                    </Box>

                    <Box
                      onClick={() => handleDeleteCourse(course)}
                      sx={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: `${spacing.xs}px`,
                        py: `${spacing.sm}px`,
                        borderRadius: `${borderRadius.full}px`,
                        border: `1px solid ${colors.border.light}`,
                        cursor: 'pointer',
                        transition: 'background-color 200ms ease',
                        '&:hover': {
                          bgcolor: `${colors.scoring.negative}11`,
                        },
                      }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 14, color: colors.scoring.negative }} />
                      <Typography
                        sx={{
                          fontFamily: fontFamilies.bodySemiBold,
                          fontSize: typography.bodySmall.fontSize,
                          color: colors.scoring.negative,
                          letterSpacing: 0.3,
                        }}
                      >
                        Delete
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Footer with create button */}
      <Box
        sx={{
          p: `${spacing.lg}px`,
          pb: `${spacing.xl}px`,
          bgcolor: colors.background.primary,
          borderTop: `1px solid ${colors.border.light}`,
          flexShrink: 0,
        }}
      >
        <Box
          onClick={() => navigate('/courses/create')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: `${spacing.sm}px`,
            py: `${spacing.md}px`,
            bgcolor: colors.accent.gold,
            borderRadius: `${borderRadius.full}px`,
            cursor: 'pointer',
            transition: 'background-color 200ms ease',
            '&:hover': {
              bgcolor: colors.accent.goldDark,
            },
            '&:active': {
              transform: 'scale(0.98)',
            },
          }}
        >
          <AddIcon sx={{ fontSize: 20, color: colors.text.inverse }} />
          <Typography
            sx={{
              fontFamily: fontFamilies.bodySemiBold,
              fontSize: typography.button.fontSize,
              color: colors.text.inverse,
              letterSpacing: 0.2,
            }}
          >
            Create new course
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CoursesPage;
