import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Checkbox,
  IconButton,
} from "@mui/material";
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  PersonOff as PersonOffIcon,
  PersonSearch as PersonSearchIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { crossPlatformAlert } from "../utils/alert";
import { dataService } from "../services/DataService";
import { useThemedColors } from "../contexts/ThemeContext";
import { useAuth } from "../store";
import { typography, fontFamilies, spacing, borderRadius } from "../theme";
import { Player, Course } from "../types";

export const GameSetupPage = () => {
  const navigate = useNavigate();
  const colors = useThemedColors();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [registeredPlayers, setRegisteredPlayers] = useState<Player[]>([]);
  const [guestPlayers, setGuestPlayers] = useState<Player[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newGuestName, setNewGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    loadRegisteredPlayers();
  }, [user]);

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
      const playerId = await dataService.createPlayer({
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
      setGuestPlayers((prev) => [...prev, newGuest]);
      // Select the guest automatically
      setSelectedPlayerIds((prev) => {
        const next = new Set(prev);
        next.add(playerId);
        return next;
      });
      setNewGuestName("");
    } catch (error: any) {
      console.error("Failed to create guest:", error);
      crossPlatformAlert(
        "Error",
        `Failed to create guest: ${error.message || error}`,
      );
    }
  };

  const removeGuest = (guestId: string) => {
    setGuestPlayers(guestPlayers.filter((g) => g.id !== guestId));
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      next.delete(guestId);
      return next;
    });
  };

  const startGame = async () => {
    if (selectedPlayerIds.size < 2) {
      crossPlatformAlert("Error", "Please select at least 2 players");
      return;
    }

    setLoading(true);
    try {
      const selectedCourse = selectedCourseId
        ? courses.find((c) => c.id === selectedCourseId)
        : null;
      const courseName = selectedCourse?.name;

      const gameId = await dataService.createGame(
        Array.from(selectedPlayerIds),
        user?.uid,
        selectedCourseId || undefined,
        courseName,
      );

      if (selectedCourseId) {
        await dataService.initializeHolesForGameFromCourse(
          gameId,
          selectedCourseId,
        );
      } else {
        await dataService.initializeHolesForGame(gameId);
      }

      navigate(`/game/scoring/${gameId}`);
    } catch (error: any) {
      console.error("Failed to create game:", error);
      crossPlatformAlert(
        "Error",
        `Failed to create game: ${error.message || error}`,
      );
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
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: colors.background.primary,
      }}
    >
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflow: "auto",
          px: `${spacing.xl}px`,
          pt: `${spacing.xxxl}px`,
          pb: `${spacing.xxl}px`,
        }}
      >
        {/* Editorial hero */}
        <Box sx={{ mb: `${spacing.xl}px` }}>
          <Typography
            sx={{
              ...typography.label,
              color: colors.text.tertiary,
              textTransform: "uppercase",
              mb: `${spacing.sm}px`,
            }}
          >
            Start a match
          </Typography>
          <Typography
            sx={{
              ...typography.displayMedium,
              color: colors.text.primary,
              mb: `${spacing.md}px`,
            }}
          >
            New game
          </Typography>
          <Box
            sx={{
              height: 1.5,
              width: 48,
              bgcolor: colors.accent.gold,
              borderRadius: "1px",
              mb: `${spacing.md}px`,
            }}
          />
          <Typography
            sx={{
              ...typography.bodyLarge,
              color: colors.text.secondary,
              maxWidth: 340,
            }}
          >
            Choose a course and pick at least two players.
          </Typography>
        </Box>

        {/* Selected count */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: `${spacing.lg}px`,
            py: `${spacing.lg}px`,
            px: `${spacing.lg}px`,
            mb: `${spacing.lg}px`,
            borderTop: `1px solid ${colors.border.light}`,
            borderBottom: `1px solid ${colors.border.light}`,
          }}
        >
          <Typography
            sx={{
              fontFamily: fontFamilies.display,
              fontSize: 56,
              lineHeight: "60px",
              color: colors.accent.gold,
              letterSpacing: "-1.8px",
              minWidth: 64,
            }}
          >
            {selectedCount}
          </Typography>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                ...typography.bodyLarge,
                fontFamily: fontFamilies.bodySemiBold,
                fontWeight: 600,
                color: colors.text.primary,
              }}
            >
              Players selected
            </Typography>
            <Typography
              sx={{
                ...typography.bodySmall,
                color: colors.text.tertiary,
                mt: "2px",
              }}
            >
              Minimum two to begin
            </Typography>
          </Box>
        </Box>

        {/* Course selection */}
        <Box sx={{ mb: `${spacing.xl}px` }}>
          <Typography
            sx={{
              ...typography.label,
              color: colors.text.tertiary,
              textTransform: "uppercase",
              mb: `${spacing.md}px`,
            }}
          >
            Course
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: `${spacing.sm}px`,
              overflowX: "auto",
              pb: `${spacing.xs}px`,
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            <Box
              onClick={() => setSelectedCourseId(null)}
              sx={{
                bgcolor: colors.background.card,
                border: `${selectedCourseId === null ? 1.5 : 1}px solid ${selectedCourseId === null ? colors.accent.gold : colors.border.light}`,
                borderRadius: `${borderRadius.xl}px`,
                p: `${spacing.md}px`,
                minWidth: 150,
                maxWidth: 210,
                cursor: "pointer",
                flexShrink: 0,
                transition: "border-color 0.2s",
              }}
            >
              <Typography
                sx={{
                  ...typography.bodyMedium,
                  fontFamily: fontFamilies.bodySemiBold,
                  fontWeight: 600,
                  color: colors.text.primary,
                  mb: `${spacing.xs}px`,
                }}
              >
                Default
              </Typography>
              <Typography
                sx={{ ...typography.bodySmall, color: colors.text.tertiary }}
              >
                18 holes &middot; Par 72
              </Typography>
            </Box>

            {courses.map((course) => {
              const totalPar = course.holes.reduce(
                (sum, hole) => sum + hole.par,
                0,
              );
              const isSelected = selectedCourseId === course.id;
              return (
                <Box
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  sx={{
                    bgcolor: colors.background.card,
                    border: `${isSelected ? 1.5 : 1}px solid ${isSelected ? colors.accent.gold : colors.border.light}`,
                    borderRadius: `${borderRadius.xl}px`,
                    p: `${spacing.md}px`,
                    minWidth: 150,
                    maxWidth: 210,
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "border-color 0.2s",
                  }}
                >
                  <Typography
                    noWrap
                    sx={{
                      ...typography.bodyMedium,
                      fontFamily: fontFamilies.bodySemiBold,
                      fontWeight: 600,
                      color: colors.text.primary,
                      mb: `${spacing.xs}px`,
                    }}
                  >
                    {course.name}
                  </Typography>
                  <Typography
                    sx={{
                      ...typography.bodySmall,
                      color: colors.text.tertiary,
                    }}
                  >
                    {course.holes.length} holes &middot; Par {totalPar}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Registered players */}
        <Box sx={{ mb: `${spacing.xl}px` }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              mb: `${spacing.sm}px`,
            }}
          >
            <Typography
              sx={{
                ...typography.label,
                color: colors.text.tertiary,
                textTransform: "uppercase",
                mb: `${spacing.md}px`,
              }}
            >
              Players
            </Typography>
            {selectedCount > 0 && (
              <Chip
                label={`${selectedCount}`}
                size="small"
                sx={{
                  bgcolor: colors.accent.gold,
                  color: colors.text.inverse,
                  fontFamily: fontFamilies.bodySemiBold,
                  fontWeight: 600,
                  fontSize: 11,
                  height: 22,
                }}
              />
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: `${spacing.sm}px`,
              bgcolor: colors.background.card,
              border: `1px solid ${colors.border.light}`,
              borderRadius: `${borderRadius.full}px`,
              px: `${spacing.md}px`,
              mb: `${spacing.md}px`,
            }}
          >
            <SearchIcon sx={{ fontSize: 18, color: colors.text.tertiary }} />
            <TextField
              variant="standard"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  disableUnderline: true,
                  sx: {
                    fontFamily: fontFamilies.body,
                    fontSize: typography.bodyMedium.fontSize,
                    color: colors.text.primary,
                    py: `${spacing.sm}px`,
                  },
                },
              }}
            />
          </Box>

          {filteredPlayers.length === 0 ? (
            <Card sx={{ p: `${spacing.xl}px`, textAlign: "center" }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: `${spacing.sm}px`,
                }}
              >
                {searchQuery ? (
                  <PersonSearchIcon
                    sx={{ fontSize: 40, color: colors.text.tertiary }}
                  />
                ) : (
                  <PersonOffIcon
                    sx={{ fontSize: 40, color: colors.text.tertiary }}
                  />
                )}
                <Typography
                  sx={{
                    ...typography.h4,
                    color: colors.text.primary,
                  }}
                >
                  {searchQuery ? "No players found" : "No players yet"}
                </Typography>
                <Typography
                  sx={{
                    ...typography.bodySmall,
                    color: colors.text.secondary,
                  }}
                >
                  {searchQuery
                    ? "Try a different search"
                    : "Register players to get started"}
                </Typography>
              </Box>
            </Card>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                gap: `${spacing.sm}px`,
              }}
            >
              {filteredPlayers.map((player) => {
                const isSelected = selectedPlayerIds.has(player.id);
                return (
                  <Box
                    key={player.id}
                    onClick={() => togglePlayer(player.id)}
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: `${spacing.xs}px`,
                      bgcolor: isSelected
                        ? colors.accent.gold
                        : colors.background.card,
                      border: `1px solid ${isSelected ? colors.accent.gold : colors.border.light}`,
                      borderRadius: `${borderRadius.full}px`,
                      py: `${spacing.sm}px`,
                      px: `${spacing.md}px`,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        borderColor: colors.accent.gold,
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: isSelected
                          ? fontFamilies.bodySemiBold
                          : fontFamilies.bodyMedium,
                        fontWeight: isSelected ? 600 : 500,
                        fontSize: typography.bodyMedium.fontSize,
                        color: isSelected
                          ? colors.text.inverse
                          : colors.text.primary,
                      }}
                    >
                      {player.name}
                    </Typography>
                    {player.userNumber && (
                      <Typography
                        sx={{
                          fontFamily: fontFamilies.mono,
                          fontSize: typography.bodySmall.fontSize,
                          color: isSelected
                            ? colors.text.inverse
                            : colors.text.tertiary,
                          opacity: isSelected ? 0.9 : 1,
                        }}
                      >
                        #{player.userNumber}
                      </Typography>
                    )}
                    {isSelected && (
                      <CheckIcon
                        sx={{
                          fontSize: 14,
                          color: colors.text.inverse,
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Guests */}
        <Box sx={{ mb: `${spacing.xl}px` }}>
          <Typography
            sx={{
              ...typography.label,
              color: colors.text.tertiary,
              textTransform: "uppercase",
              mb: `${spacing.md}px`,
            }}
          >
            Add guests
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: `${spacing.sm}px`,
            }}
          >
            <TextField
              variant="standard"
              value={newGuestName}
              onChange={(e) => setNewGuestName(e.target.value)}
              placeholder="Guest name"
              onFocus={scrollToBottom}
              onKeyDown={(e) => {
                if (e.key === "Enter") addGuestPlayer();
              }}
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontFamily: fontFamilies.body,
                  fontSize: typography.bodyMedium.fontSize,
                  color: colors.text.primary,
                },
              }}
              sx={{
                flex: 1,
                bgcolor: colors.background.card,
                border: `1px solid ${colors.border.light}`,
                borderRadius: `${borderRadius.full}px`,
                px: `${spacing.md}px`,
                py: `${spacing.sm}px`,
              }}
            />
            <Button
              title="Add"
              onPress={addGuestPlayer}
              variant="gold"
              size="small"
            />
          </Box>

          {guestPlayers.length > 0 && (
            <Box
              sx={{
                mt: `${spacing.md}px`,
                display: "flex",
                flexDirection: "column",
                gap: `${spacing.sm}px`,
              }}
            >
              {guestPlayers.map((guest) => {
                const isSelected = selectedPlayerIds.has(guest.id);
                return (
                  <Box
                    key={guest.id}
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      bgcolor: colors.background.card,
                      border: `1px solid ${isSelected ? colors.border.goldSubtle : colors.border.light}`,
                      borderRadius: `${borderRadius.xl}px`,
                      p: `${spacing.md}px`,
                      transition: "border-color 0.15s ease",
                    }}
                  >
                    <Box
                      onClick={() => togglePlayer(guest.id)}
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: `${spacing.sm}px`,
                        flex: 1,
                        cursor: "pointer",
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => togglePlayer(guest.id)}
                        sx={{
                          color: colors.border.medium,
                          "&.Mui-checked": {
                            color: colors.accent.gold,
                          },
                          p: 0,
                        }}
                      />
                      <Typography
                        sx={{
                          fontFamily: fontFamilies.bodyMedium,
                          fontWeight: 500,
                          fontSize: typography.bodyMedium.fontSize,
                          color: colors.text.primary,
                          flex: 1,
                        }}
                      >
                        {guest.name}
                      </Typography>
                      <Chip
                        label="Guest"
                        size="small"
                        sx={{
                          bgcolor: colors.surfaces.level2,
                          color: colors.text.secondary,
                          fontFamily: fontFamilies.body,
                          fontSize: 10,
                          height: 20,
                        }}
                      />
                    </Box>
                    <IconButton
                      onClick={() => removeGuest(guest.id)}
                      size="small"
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: colors.surfaces.level2,
                        "&:hover": { bgcolor: colors.surfaces.level3 },
                      }}
                    >
                      <CloseIcon
                        sx={{ fontSize: 16, color: colors.text.secondary }}
                      />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Footer spacer */}
        <Box sx={{ height: 100 }} />
      </Box>

      {/* Sticky footer */}
      <Box
        sx={{
          p: `${spacing.lg}px`,
          pb: `${spacing.xl}px`,
          bgcolor: colors.background.primary,
          borderTop: `1px solid ${colors.border.light}`,
        }}
      >
        <Button
          title={
            selectedCount >= 2 ? `Start game (${selectedCount})` : "Start game"
          }
          onPress={startGame}
          loading={loading}
          disabled={selectedCount < 2}
          variant="gold"
          fullWidth
          size="large"
        />
      </Box>
    </Box>
  );
};

export default GameSetupPage;
