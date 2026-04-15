import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useThemedColors } from '../contexts/ThemeContext';
import { useStore } from '../store';
import { dataService } from '../services/DataService';
import { crossPlatformAlert } from '../utils/alert';
import { CourseHole } from '../types';
import { typography, fontFamilies, spacing, borderRadius, shadows } from '../theme';

export const CreateCoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const colors = useThemedColors();
  const user = useStore((state) => state.user);
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
        await dataService.updateCourse(courseId!, { name: courseName, holes });
        crossPlatformAlert('Success', 'Course updated successfully', [
          { text: 'OK', onPress: () => navigate(-1 as any) },
        ]);
      } else {
        await dataService.createCourse(courseName, holes, (user as any)?.uid);
        crossPlatformAlert('Success', 'Course created successfully', [
          { text: 'OK', onPress: () => navigate(-1 as any) },
        ]);
      }
    } catch (error: any) {
      console.error('Error saving course:', error);
      crossPlatformAlert(
        'Error',
        `Failed to save course: ${error.message || error}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const totalPar = holes.reduce((sum, hole) => sum + hole.par, 0);

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
        <Box
          sx={{
            px: `${spacing.xl}px`,
            pt: `${spacing.xxxl}px`,
            pb: `${spacing.xxl}px`,
          }}
        >
          {/* Hero header */}
          <Box sx={{ mb: `${spacing.xl}px` }}>
            <Typography
              sx={{
                ...typography.label,
                color: colors.text.tertiary,
                textTransform: 'uppercase',
                mb: `${spacing.sm}px`,
              }}
            >
              {isEditing ? 'Editing' : 'New layout'}
            </Typography>
            <Typography
              sx={{
                ...typography.displayMedium,
                color: colors.text.primary,
                mb: `${spacing.md}px`,
              }}
            >
              {isEditing ? 'Edit course' : 'Create course'}
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
              {isEditing
                ? 'Modify details, par, and stroke index.'
                : 'Set up a new golf course from scratch.'}
            </Typography>
          </Box>

          {/* Course details section */}
          <Box sx={{ mb: `${spacing.xl}px` }}>
            <Typography
              sx={{
                ...typography.label,
                color: colors.text.tertiary,
                textTransform: 'uppercase',
                mb: `${spacing.sm}px`,
              }}
            >
              Course details
            </Typography>
            <Box
              sx={{
                bgcolor: colors.background.card,
                borderRadius: `${borderRadius.xl}px`,
                border: `1px solid ${colors.border.light}`,
                p: `${spacing.lg}px`,
                boxShadow: shadows.small,
              }}
            >
              <Typography
                sx={{
                  ...typography.label,
                  color: colors.text.tertiary,
                  textTransform: 'uppercase',
                  mb: `${spacing.xs}px`,
                  mt: `${spacing.md}px`,
                }}
              >
                Course name
              </Typography>
              <TextField
                fullWidth
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g., Pebble Beach"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: fontFamilies.body,
                    fontSize: typography.bodyMedium.fontSize,
                    color: colors.text.primary,
                    bgcolor: colors.background.primary,
                    borderRadius: `${borderRadius.md}px`,
                    '& fieldset': {
                      borderColor: colors.border.light,
                    },
                    '&:hover fieldset': {
                      borderColor: colors.border.medium,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: colors.accent.gold,
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    p: `${spacing.md}px`,
                    '&::placeholder': {
                      color: colors.text.tertiary,
                      opacity: 1,
                    },
                  },
                }}
              />

              {!isEditing && (
                <>
                  <Typography
                    sx={{
                      ...typography.label,
                      color: colors.text.tertiary,
                      textTransform: 'uppercase',
                      mb: `${spacing.xs}px`,
                      mt: `${spacing.md}px`,
                    }}
                  >
                    Number of holes
                  </Typography>
                  <TextField
                    fullWidth
                    value={numberOfHoles}
                    onChange={(e) => handleNumberOfHolesChange(e.target.value)}
                    placeholder="18"
                    type="number"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontFamily: fontFamilies.body,
                        fontSize: typography.bodyMedium.fontSize,
                        color: colors.text.primary,
                        bgcolor: colors.background.primary,
                        borderRadius: `${borderRadius.md}px`,
                        '& fieldset': {
                          borderColor: colors.border.light,
                        },
                        '&:hover fieldset': {
                          borderColor: colors.border.medium,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.accent.gold,
                        },
                      },
                      '& .MuiOutlinedInput-input': {
                        p: `${spacing.md}px`,
                        '&::placeholder': {
                          color: colors.text.tertiary,
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </>
              )}

              {/* Total par display */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mt: `${spacing.lg}px`,
                  pt: `${spacing.md}px`,
                  borderTop: `1px solid ${colors.border.light}`,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      ...typography.label,
                      color: colors.text.tertiary,
                      textTransform: 'uppercase',
                      mb: '2px',
                    }}
                  >
                    Total par
                  </Typography>
                  <Typography
                    sx={{
                      ...typography.bodySmall,
                      color: colors.text.tertiary,
                    }}
                  >
                    {holes.length} holes configured
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontFamily: fontFamilies.display,
                    fontSize: 40,
                    lineHeight: '44px',
                    color: colors.accent.gold,
                    letterSpacing: -1.2,
                  }}
                >
                  {totalPar}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Par for each hole section */}
          <Box sx={{ mb: `${spacing.xl}px` }}>
            <Typography
              sx={{
                ...typography.label,
                color: colors.text.tertiary,
                textTransform: 'uppercase',
                mb: `${spacing.sm}px`,
              }}
            >
              Par for each hole
            </Typography>
            <Box
              sx={{
                bgcolor: colors.background.card,
                borderRadius: `${borderRadius.xl}px`,
                border: `1px solid ${colors.border.light}`,
                p: `${spacing.lg}px`,
                boxShadow: shadows.small,
              }}
            >
              {/* Holes grid */}
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: `${spacing.sm}px`,
                }}
              >
                {holes.map((hole) => (
                  <Box
                    key={hole.holeNumber}
                    sx={{
                      width: 'calc(50% - 4px)',
                    }}
                  >
                    <Box
                      sx={{
                        p: `${spacing.md}px`,
                        bgcolor: colors.background.primary,
                        borderRadius: `${borderRadius.lg}px`,
                        border: `1px solid ${colors.border.light}`,
                      }}
                    >
                      {/* Hole header */}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: `${spacing.sm}px`,
                        }}
                      >
                        <Typography
                          sx={{
                            ...typography.bodyMedium,
                            fontFamily: fontFamilies.bodySemiBold,
                            color: colors.text.primary,
                          }}
                        >
                          Hole {hole.holeNumber}
                        </Typography>
                        <Box
                          sx={{
                            px: `${spacing.sm}px`,
                            py: '2px',
                            borderRadius: `${borderRadius.full}px`,
                            border: `1px solid ${colors.border.goldSubtle}`,
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily: fontFamilies.monoMedium,
                              fontSize: 10,
                              color: colors.accent.gold,
                              letterSpacing: 0.3,
                            }}
                          >
                            #{hole.index || hole.holeNumber}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Par controls */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: `${spacing.sm}px`,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() =>
                            updateHolePar(hole.holeNumber, Math.max(3, hole.par - 1))
                          }
                          sx={{
                            width: 30,
                            height: 30,
                            border: `1px solid ${colors.border.goldSubtle}`,
                            bgcolor: colors.background.card,
                            color: colors.text.primary,
                            '&:hover': {
                              bgcolor: colors.surfaces.level2,
                            },
                          }}
                        >
                          <RemoveIcon sx={{ fontSize: 14 }} />
                        </IconButton>

                        <Typography
                          sx={{
                            ...typography.bodyMedium,
                            fontFamily: fontFamilies.bodySemiBold,
                            color: colors.text.primary,
                          }}
                        >
                          Par {hole.par}
                        </Typography>

                        <IconButton
                          size="small"
                          onClick={() =>
                            updateHolePar(hole.holeNumber, Math.min(6, hole.par + 1))
                          }
                          sx={{
                            width: 30,
                            height: 30,
                            border: `1px solid ${colors.border.goldSubtle}`,
                            bgcolor: colors.background.card,
                            color: colors.text.primary,
                            '&:hover': {
                              bgcolor: colors.surfaces.level2,
                            },
                          }}
                        >
                          <AddIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>

                      {/* Index selector */}
                      <Box
                        onClick={() =>
                          setExpandedHole(
                            expandedHole === hole.holeNumber ? null : hole.holeNumber,
                          )
                        }
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mt: `${spacing.xs}px`,
                          pt: `${spacing.sm}px`,
                          borderTop: `1px solid ${colors.border.light}`,
                          cursor: 'pointer',
                        }}
                      >
                        <Typography
                          sx={{
                            ...typography.label,
                            color: colors.text.tertiary,
                            textTransform: 'uppercase',
                          }}
                        >
                          Index
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.xs}px` }}>
                          <Typography
                            sx={{
                              fontFamily: fontFamilies.monoMedium,
                              fontSize: 13,
                              color: colors.accent.gold,
                              minWidth: 18,
                              textAlign: 'center',
                            }}
                          >
                            {hole.index || hole.holeNumber}
                          </Typography>
                          {expandedHole === hole.holeNumber ? (
                            <ExpandLessIcon sx={{ fontSize: 14, color: colors.accent.gold }} />
                          ) : (
                            <ExpandMoreIcon sx={{ fontSize: 14, color: colors.accent.gold }} />
                          )}
                        </Box>
                      </Box>
                    </Box>

                    {/* Index dropdown */}
                    {expandedHole === hole.holeNumber && (
                      <Box
                        sx={{
                          mt: `${spacing.xs}px`,
                          p: `${spacing.md}px`,
                          bgcolor: colors.background.card,
                          borderRadius: `${borderRadius.lg}px`,
                          border: `1px solid ${colors.border.goldSubtle}`,
                        }}
                      >
                        <Typography
                          sx={{
                            ...typography.label,
                            color: colors.text.tertiary,
                            mb: `${spacing.sm}px`,
                            textAlign: 'center',
                            textTransform: 'uppercase',
                          }}
                        >
                          Select index difficulty
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: `${spacing.xs}px`,
                          }}
                        >
                          {Array.from({ length: holes.length }, (_, i) => i + 1).map((idx) => {
                            const isSelected = (hole.index || hole.holeNumber) === idx;
                            return (
                              <Box
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateHoleIndex(hole.holeNumber, idx);
                                  setExpandedHole(null);
                                }}
                                sx={{
                                  minWidth: 36,
                                  px: `${spacing.xs}px`,
                                  py: `${spacing.xs}px`,
                                  borderRadius: `${borderRadius.full}px`,
                                  border: `1px solid ${isSelected ? colors.accent.gold : colors.border.light}`,
                                  bgcolor: isSelected ? colors.accent.gold : 'transparent',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  transition: 'all 150ms ease',
                                  '&:hover': {
                                    borderColor: colors.accent.gold,
                                  },
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontFamily: fontFamilies.monoMedium,
                                    fontSize: 12,
                                    color: isSelected ? colors.text.inverse : colors.text.secondary,
                                    textAlign: 'center',
                                  }}
                                >
                                  {idx}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>

              {/* Quick set buttons */}
              <Box
                sx={{
                  mt: `${spacing.lg}px`,
                  pt: `${spacing.lg}px`,
                  borderTop: `1px solid ${colors.border.light}`,
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
                  Quick set all
                </Typography>
                <Box sx={{ display: 'flex', gap: `${spacing.sm}px` }}>
                  {[3, 4, 5].map((par) => (
                    <Box
                      key={par}
                      onClick={() => setHoles(holes.map((h) => ({ ...h, par })))}
                      sx={{
                        px: `${spacing.md}px`,
                        py: `${spacing.sm}px`,
                        borderRadius: `${borderRadius.full}px`,
                        border: `1px solid ${colors.border.goldSubtle}`,
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                        '&:hover': {
                          bgcolor: `${colors.accent.gold}11`,
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: fontFamilies.bodySemiBold,
                          fontSize: typography.bodySmall.fontSize,
                          color: colors.accent.gold,
                          letterSpacing: 0.3,
                        }}
                      >
                        Par {par}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Footer with save button */}
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
          onClick={loading ? undefined : handleSave}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: `${spacing.sm}px`,
            py: `${spacing.md}px`,
            bgcolor: loading ? colors.text.disabled : colors.accent.gold,
            borderRadius: `${borderRadius.full}px`,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 200ms ease',
            '&:hover': {
              bgcolor: loading ? colors.text.disabled : colors.accent.goldDark,
            },
          }}
        >
          {loading && (
            <CircularProgress size={18} sx={{ color: colors.text.inverse }} />
          )}
          <Typography
            sx={{
              fontFamily: fontFamilies.bodySemiBold,
              fontSize: typography.button.fontSize,
              color: colors.text.inverse,
              letterSpacing: 0.2,
            }}
          >
            {isEditing ? 'Update course' : 'Create course'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateCoursePage;
