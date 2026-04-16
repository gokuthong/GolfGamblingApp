import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Switch,
  Button,
  CircularProgress,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronUpIcon from "@mui/icons-material/ExpandLess";
import ChevronDownIcon from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router-dom";
import { crossPlatformAlert } from "../utils/alert";
import { authService } from "../services/firebase";
import { localStorageService } from "../services/storage";
import { dataService } from "../services/DataService";
import { useStore } from "../store";
import { typography, fontFamilies, spacing, borderRadius } from "../theme";
import { useThemedColors } from "../contexts/ThemeContext";
import { ScoreCalculator } from "../utils/scoreCalculator";

export const SettingsPage = () => {
  const navigate = useNavigate();
  const user = useStore((state) => state.user) as any;
  const settings = useStore((state) => state.settings);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);
  const colors = useThemedColors();
  const [exportingData, setExportingData] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<Record<string, any>>({});

  const isGuest = user?.role === "guest" || user?.isOffline;
  const isSuperAdmin = user?.role === "super_admin";

  useEffect(() => {
    if (isSuperAdmin) {
      loadUserData();
    }
  }, [isSuperAdmin]);

  const loadUserData = async () => {
    try {
      const [pending, users] = await Promise.all([
        dataService.getPendingUsers(),
        dataService.getAllUsers(),
      ]);
      setPendingUsers(pending);
      setAllUsers(users);
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  const loadUserStats = async (userId: string) => {
    try {
      const stats = await dataService.getUserStats(userId);
      setUserStats((prev) => ({ ...prev, [userId]: stats }));
    } catch (error) {
      console.error("Failed to load user stats:", error);
    }
  };

  const handleToggleUserExpand = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
    } else {
      setExpandedUserId(userId);
      if (!userStats[userId]) {
        await loadUserStats(userId);
      }
    }
  };

  const handleSignOut = async () => {
    crossPlatformAlert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await authService.signOut();
        },
      },
    ]);
  };

  const handleExportData = async () => {
    if (!user) return;

    setExportingData(true);
    try {
      const games = await dataService.getGamesForUser(user.uid);

      if (games.length === 0) {
        crossPlatformAlert("No data", "You have no games to export.");
        setExportingData(false);
        return;
      }

      const gamesWithDetails = await Promise.all(
        games.map((game) => dataService.getGameWithDetails(game.id)),
      );

      let csvContent = "Game Date,Status,Players,Winner,Final Scores\n";

      for (const gameDetails of gamesWithDetails) {
        if (!gameDetails) continue;

        const { game, players, scores, holes } = gameDetails;

        const finalPoints: Record<string, number> = {};
        game.playerIds.forEach((playerId) => {
          finalPoints[playerId] = 0;
        });

        holes.forEach((hole) => {
          const holeScores = scores.filter((s) => s.holeId === hole.id);
          const holePoints = ScoreCalculator.calculateHolePoints(
            hole,
            holeScores,
            players,
            game.handicaps,
          );

          Object.keys(holePoints).forEach((playerId) => {
            finalPoints[playerId] =
              (finalPoints[playerId] || 0) + holePoints[playerId];
          });
        });

        let winnerId = "";
        let maxPoints = -Infinity;
        Object.entries(finalPoints).forEach(([playerId, points]) => {
          if (points > maxPoints) {
            maxPoints = points;
            winnerId = playerId;
          }
        });

        const winner = players.find((p) => p.id === winnerId);
        const playerNames = players.map((p) => p.name).join("; ");
        const scoresText = players
          .map((p) => `${p.name}: ${finalPoints[p.id] || 0}`)
          .join("; ");

        const dateStr = game.completedAt
          ? game.completedAt.toLocaleDateString()
          : game.date.toLocaleDateString();

        csvContent += `${dateStr},${game.status},${playerNames},${winner?.name || "N/A"},${scoresText}\n`;
      }

      // Web download
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "golf-gambling-history.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      crossPlatformAlert(
        "Export failed",
        error.message || "Failed to export data",
      );
    } finally {
      setExportingData(false);
    }
  };

  const handleClearData = () => {
    if (!user) return;

    crossPlatformAlert(
      "Clear all data",
      "This will permanently delete all your games. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete all",
          style: "destructive",
          onPress: async () => {
            try {
              const games = await dataService.getGamesForUser(user.uid);

              for (const game of games) {
                await dataService.deleteGame(game.id);
              }

              crossPlatformAlert("Success", "All game data has been deleted.");
            } catch (error: any) {
              crossPlatformAlert(
                "Error",
                error.message || "Failed to clear data",
              );
            }
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    crossPlatformAlert(
      "Delete account",
      "This will permanently delete your account and all associated data. This action cannot be undone.\n\nYou will need to sign in again to confirm.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: async () => {
            try {
              if (user) {
                const games = await dataService.getGamesForUser(user.uid);
                for (const game of games) {
                  await dataService.deleteGame(game.id);
                }
              }

              await authService.deleteAccount();

              crossPlatformAlert(
                "Account deleted",
                "Your account has been permanently deleted.",
              );
            } catch (error: any) {
              if (error.code === "auth/requires-recent-login") {
                crossPlatformAlert(
                  "Re-authentication required",
                  "For security, please sign out and sign back in before deleting your account.",
                );
              } else {
                crossPlatformAlert(
                  "Error",
                  error.message || "Failed to delete account",
                );
              }
            }
          },
        },
      ],
    );
  };

  const handleSendFeedback = () => {
    crossPlatformAlert(
      "Send feedback",
      "Thank you for your interest. Please email your feedback to support@golfgambling.app",
      [{ text: "OK" }],
    );
  };

  const handleClearAllUsers = () => {
    const isSignedIn = user && !user.isOffline && user.role !== "guest";

    crossPlatformAlert(
      "Clear all users & reset database",
      isSignedIn
        ? "This will:\n\n1. Delete your Firebase Auth account\n2. Delete ALL user data from local storage\n3. Reset the database\n\nThe next signup will be User #001 (super admin).\n\nThis cannot be undone. Continue?"
        : "This will DELETE ALL USER DATA from local storage.\n\nNote: You need to be signed in to also delete Firebase Auth accounts.\n\nContinue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset database",
          style: "destructive",
          onPress: async () => {
            try {
              if (isSignedIn) {
                try {
                  await authService.deleteAccount();
                } catch (error: any) {
                  if (error.code === "auth/requires-recent-login") {
                    crossPlatformAlert(
                      "Re-authentication required",
                      "For security, you need to sign out and sign back in before deleting your Firebase account.\n\nThen try again.",
                    );
                    return;
                  }
                }
              }

              const result = await localStorageService.clearAllUsers();

              if (result.success) {
                crossPlatformAlert(
                  "Database reset complete",
                  "All users have been cleared.\n\nYou can now sign up as User #001 (super admin).",
                  [
                    {
                      text: "OK",
                      onPress: async () => {
                        try {
                          await authService.signOut();
                        } catch (e) {}
                      },
                    },
                  ],
                );
              } else {
                crossPlatformAlert("Error", result.message);
              }
            } catch (error: any) {
              crossPlatformAlert(
                "Error",
                error.message || "Failed to reset database",
              );
            }
          },
        },
      ],
    );
  };

  const handleApprovePendingUser = async (
    userId: string,
    displayName: string,
  ) => {
    crossPlatformAlert("Approve user", `Approve ${displayName}'s account?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        style: "default",
        onPress: async () => {
          try {
            await dataService.approvePendingUser(userId);
            await loadUserData();
          } catch (error: any) {
            crossPlatformAlert(
              "Error",
              error.message || "Failed to approve user",
            );
          }
        },
      },
    ]);
  };

  const handleRejectPendingUser = async (
    userId: string,
    displayName: string,
  ) => {
    crossPlatformAlert(
      "Reject user",
      `Are you sure you want to reject ${displayName}'s account? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              await dataService.rejectPendingUser(userId);
              await loadUserData();
            } catch (error: any) {
              crossPlatformAlert(
                "Error",
                error.message || "Failed to reject user",
              );
            }
          },
        },
      ],
    );
  };

  const handleDeleteUser = async (userId: string, displayName: string) => {
    const userToDelete = allUsers.find((u) => u.id === userId);
    if (userToDelete?.role === "super_admin") {
      crossPlatformAlert("Cannot delete", "Super admin cannot be deleted");
      return;
    }

    crossPlatformAlert(
      "Delete user",
      `Are you sure you want to delete ${displayName}?\n\nThis will permanently delete:\n- User account\n- All their games\n- All their data\n\nThis cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await dataService.deleteUser(userId);
              await loadUserData();
            } catch (error: any) {
              crossPlatformAlert(
                "Error",
                error.message || "Failed to delete user",
              );
            }
          },
        },
      ],
    );
  };

  const renderRow = (
    label: string,
    value: string | undefined,
    onPress?: () => void,
    danger?: boolean,
  ) => (
    <Box
      onClick={onPress}
      sx={{
        display: "flex",
        alignItems: "center",
        py: `${spacing.md}px`,
        px: `${spacing.lg}px`,
        gap: `${spacing.sm}px`,
        cursor: onPress ? "pointer" : "default",
        transition: "opacity 150ms ease",
        "&:active": onPress ? { opacity: 0.6 } : undefined,
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography
          sx={{
            fontFamily: fontFamilies.bodySemiBold,
            fontSize: typography.bodyMedium.fontSize,
            color: danger ? colors.scoring.negative : colors.text.primary,
            mb: "2px",
          }}
        >
          {label}
        </Typography>
        {value !== undefined && (
          <Typography
            sx={{
              ...typography.bodySmall,
              color: colors.text.secondary,
            }}
          >
            {value || "\u2014"}
          </Typography>
        )}
      </Box>
      {onPress && (
        <ChevronRightIcon sx={{ fontSize: 18, color: colors.text.tertiary }} />
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: "100%",
        bgcolor: colors.background.primary,
        overflow: "auto",
      }}
    >
      <Box
        sx={{
          px: `${spacing.xl}px`,
          pt: `${spacing.xxxl}px`,
          pb: `${spacing.xxl}px`,
        }}
      >
        {/* Hero */}
        <Box sx={{ mb: `${spacing.xxl}px` }}>
          <Typography
            sx={{
              ...typography.label,
              color: colors.text.tertiary,
              textTransform: "uppercase",
              mb: `${spacing.sm}px`,
            }}
          >
            Preferences
          </Typography>
          <Typography
            sx={{
              ...typography.displayMedium,
              color: colors.text.primary,
              mb: `${spacing.md}px`,
            }}
          >
            Settings
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
            Manage your account, preferences, and data.
          </Typography>
        </Box>

        {/* Guest account section */}
        {isGuest && (
          <Box sx={{ mb: `${spacing.xl}px` }}>
            <Typography
              sx={{
                ...typography.label,
                color: colors.text.tertiary,
                textTransform: "uppercase",
                mb: `${spacing.md}px`,
              }}
            >
              Account
            </Typography>
            <Typography
              sx={{
                ...typography.bodyMedium,
                color: colors.text.secondary,
                mb: `${spacing.md}px`,
                lineHeight: "20px",
              }}
            >
              Sign up to sync your data and access online features.
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: `${spacing.md}px`,
              }}
            >
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate("/register")}
                sx={{
                  py: 1.5,
                  bgcolor: colors.accent.gold,
                  color: colors.text.inverse,
                  fontFamily: fontFamilies.bodySemiBold,
                  fontWeight: 600,
                  fontSize: typography.button.fontSize,
                  borderRadius: "9999px",
                  textTransform: "none",
                  "&:hover": { bgcolor: colors.accent.goldDark },
                }}
              >
                Sign up
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate("/login")}
                sx={{
                  py: 1.5,
                  borderColor: colors.border.medium,
                  color: colors.text.primary,
                  fontFamily: fontFamilies.bodySemiBold,
                  fontWeight: 600,
                  fontSize: typography.button.fontSize,
                  borderRadius: "9999px",
                  textTransform: "none",
                  "&:hover": {
                    borderColor: colors.accent.gold,
                    bgcolor: "transparent",
                  },
                }}
              >
                Sign in
              </Button>
            </Box>
          </Box>
        )}

        {/* User management (super admin) */}
        {isSuperAdmin && (
          <Box sx={{ mb: `${spacing.xl}px` }}>
            <Typography
              sx={{
                ...typography.label,
                color: colors.text.tertiary,
                textTransform: "uppercase",
                mb: `${spacing.md}px`,
              }}
            >
              User management
            </Typography>

            {/* Pending approvals */}
            {pendingUsers.length > 0 && (
              <>
                <Typography
                  sx={{
                    ...typography.label,
                    color: colors.text.tertiary,
                    textTransform: "uppercase",
                    mt: `${spacing.md}px`,
                    mb: `${spacing.sm}px`,
                  }}
                >
                  Pending approvals &middot; {pendingUsers.length}
                </Typography>
                {pendingUsers.map((pendingUser) => (
                  <Box
                    key={pendingUser.id}
                    sx={{
                      bgcolor: colors.background.card,
                      borderRadius: `${borderRadius.lg}px`,
                      p: `${spacing.lg}px`,
                      mb: `${spacing.sm}px`,
                      border: `1px solid ${colors.border.light}`,
                    }}
                  >
                    <Box sx={{ mb: `${spacing.md}px` }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: `${spacing.sm}px`,
                          mb: "2px",
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: fontFamilies.display,
                            fontSize: 18,
                            color: colors.text.primary,
                            letterSpacing: -0.3,
                          }}
                        >
                          {pendingUser.displayName}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: fontFamilies.mono,
                            fontSize: typography.bodySmall.fontSize,
                            color: colors.accent.gold,
                            letterSpacing: 0.3,
                          }}
                        >
                          #{pendingUser.userNumber}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          ...typography.bodySmall,
                          color: colors.text.tertiary,
                        }}
                      >
                        {pendingUser.email}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        gap: `${spacing.sm}px`,
                        pt: `${spacing.md}px`,
                        borderTop: `1px solid ${colors.border.light}`,
                      }}
                    >
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() =>
                          handleApprovePendingUser(
                            pendingUser.id,
                            pendingUser.displayName,
                          )
                        }
                        sx={{
                          py: `${spacing.sm}px`,
                          bgcolor: colors.accent.gold,
                          color: colors.text.inverse,
                          fontFamily: fontFamilies.bodySemiBold,
                          fontSize: typography.bodySmall.fontSize,
                          borderRadius: "9999px",
                          textTransform: "none",
                          letterSpacing: 0.3,
                          "&:hover": { bgcolor: colors.accent.goldDark },
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() =>
                          handleRejectPendingUser(
                            pendingUser.id,
                            pendingUser.displayName,
                          )
                        }
                        sx={{
                          py: `${spacing.sm}px`,
                          borderColor: colors.border.light,
                          color: colors.text.secondary,
                          fontFamily: fontFamilies.bodySemiBold,
                          fontSize: typography.bodySmall.fontSize,
                          borderRadius: "9999px",
                          textTransform: "none",
                          letterSpacing: 0.3,
                          "&:hover": {
                            borderColor: colors.border.medium,
                            bgcolor: "transparent",
                          },
                        }}
                      >
                        Reject
                      </Button>
                    </Box>
                  </Box>
                ))}
              </>
            )}

            {/* All users */}
            <Typography
              sx={{
                ...typography.label,
                color: colors.text.tertiary,
                textTransform: "uppercase",
                mt: `${spacing.md}px`,
                mb: `${spacing.sm}px`,
              }}
            >
              All users &middot; {allUsers.length}
            </Typography>
            {allUsers.map((existingUser) => {
              const isExpanded = expandedUserId === existingUser.id;
              const stats = userStats[existingUser.id];
              return (
                <Box
                  key={existingUser.id}
                  sx={{
                    bgcolor: colors.background.card,
                    borderRadius: `${borderRadius.lg}px`,
                    p: `${spacing.lg}px`,
                    mb: `${spacing.sm}px`,
                    border: `1px solid ${colors.border.light}`,
                  }}
                >
                  <Box
                    onClick={() => handleToggleUserExpand(existingUser.id)}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: `${spacing.sm}px`,
                      cursor: "pointer",
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: `${spacing.sm}px`,
                          mb: "2px",
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: fontFamilies.display,
                            fontSize: 18,
                            color: colors.text.primary,
                            letterSpacing: -0.3,
                          }}
                        >
                          {existingUser.displayName}
                        </Typography>
                        {existingUser.role === "super_admin" && (
                          <Box
                            sx={{
                              px: `${spacing.xs}px`,
                              py: "2px",
                              borderRadius: `${borderRadius.full}px`,
                              border: `1px solid ${colors.border.goldSubtle}`,
                            }}
                          >
                            <Typography
                              sx={{
                                fontFamily: fontFamilies.bodySemiBold,
                                fontSize: 9,
                                color: colors.accent.gold,
                                letterSpacing: 0.8,
                                textTransform: "uppercase",
                              }}
                            >
                              Admin
                            </Typography>
                          </Box>
                        )}
                        <Typography
                          sx={{
                            fontFamily: fontFamilies.mono,
                            fontSize: typography.bodySmall.fontSize,
                            color: colors.accent.gold,
                            letterSpacing: 0.3,
                          }}
                        >
                          #{existingUser.userNumber}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          ...typography.bodySmall,
                          color: colors.text.tertiary,
                        }}
                      >
                        {existingUser.email}
                      </Typography>
                    </Box>
                    {isExpanded ? (
                      <ChevronUpIcon
                        sx={{ fontSize: 18, color: colors.text.tertiary }}
                      />
                    ) : (
                      <ChevronDownIcon
                        sx={{ fontSize: 18, color: colors.text.tertiary }}
                      />
                    )}
                  </Box>

                  {isExpanded && (
                    <Box
                      sx={{
                        mt: `${spacing.md}px`,
                        pt: `${spacing.md}px`,
                        borderTop: `1px solid ${colors.border.light}`,
                      }}
                    >
                      {stats ? (
                        <>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: `${spacing.md}px`,
                              gap: `${spacing.sm}px`,
                            }}
                          >
                            {[
                              { label: "Games", value: stats.gamesPlayed },
                              {
                                label: "Points",
                                value: `${stats.totalPoints > 0 ? "+" : ""}${stats.totalPoints.toFixed(1)}`,
                                color:
                                  stats.totalPoints > 0
                                    ? colors.scoring.positive
                                    : stats.totalPoints < 0
                                      ? colors.scoring.negative
                                      : undefined,
                              },
                              { label: "Wins", value: stats.wins },
                              {
                                label: "Win rate",
                                value: `${stats.winRate}%`,
                              },
                            ].map((stat) => (
                              <Box
                                key={stat.label}
                                sx={{ flex: 1, textAlign: "center" }}
                              >
                                <Typography
                                  sx={{
                                    ...typography.label,
                                    color: colors.text.tertiary,
                                    textTransform: "uppercase",
                                    mb: `${spacing.xs}px`,
                                  }}
                                >
                                  {stat.label}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontFamily: fontFamilies.monoBold,
                                    fontSize: 18,
                                    color: stat.color || colors.text.primary,
                                    letterSpacing: 0.3,
                                  }}
                                >
                                  {stat.value}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                          {existingUser.role !== "super_admin" && (
                            <Button
                              fullWidth
                              variant="outlined"
                              onClick={() =>
                                handleDeleteUser(
                                  existingUser.id,
                                  existingUser.displayName,
                                )
                              }
                              sx={{
                                py: `${spacing.sm}px`,
                                borderColor: colors.border.light,
                                color: colors.scoring.negative,
                                fontFamily: fontFamilies.bodySemiBold,
                                fontSize: typography.bodySmall.fontSize,
                                borderRadius: "9999px",
                                textTransform: "none",
                                letterSpacing: 0.3,
                                "&:hover": {
                                  borderColor: colors.scoring.negative,
                                  bgcolor: "transparent",
                                },
                              }}
                            >
                              Delete user
                            </Button>
                          )}
                        </>
                      ) : (
                        <Typography
                          sx={{
                            ...typography.bodyMedium,
                            color: colors.text.tertiary,
                            textAlign: "center",
                            py: `${spacing.md}px`,
                            fontStyle: "italic",
                          }}
                        >
                          Loading stats...
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}

        {/* Appearance */}
        <Box sx={{ mb: `${spacing.xl}px` }}>
          <Typography
            sx={{
              ...typography.label,
              color: colors.text.tertiary,
              textTransform: "uppercase",
              mb: `${spacing.md}px`,
            }}
          >
            Appearance
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              py: `${spacing.md}px`,
              px: `${spacing.lg}px`,
              gap: `${spacing.md}px`,
              bgcolor: colors.background.card,
              borderRadius: `${borderRadius.xl}px`,
              border: `1px solid ${colors.border.light}`,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontFamily: fontFamilies.bodySemiBold,
                  fontSize: typography.bodyMedium.fontSize,
                  color: colors.text.primary,
                  mb: "2px",
                }}
              >
                Dark mode
              </Typography>
              <Typography
                sx={{
                  ...typography.bodySmall,
                  color: colors.text.tertiary,
                  mt: "2px",
                }}
              >
                {settings.darkMode
                  ? "Low-light editorial theme"
                  : "Clean Augusta cream theme"}
              </Typography>
            </Box>
            <Switch
              checked={settings.darkMode}
              onChange={toggleDarkMode}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: colors.accent.goldLight,
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  bgcolor: colors.accent.gold,
                },
                "& .MuiSwitch-track": {
                  bgcolor: colors.border.medium,
                },
              }}
            />
          </Box>
        </Box>

        {/* Profile */}
        {!isGuest && (
          <Box sx={{ mb: `${spacing.xl}px` }}>
            <Typography
              sx={{
                ...typography.label,
                color: colors.text.tertiary,
                textTransform: "uppercase",
                mb: `${spacing.md}px`,
              }}
            >
              Profile
            </Typography>
            <Box
              sx={{
                bgcolor: colors.background.card,
                borderRadius: `${borderRadius.xl}px`,
                border: `1px solid ${colors.border.light}`,
                overflow: "hidden",
              }}
            >
              {renderRow("Display name", user?.displayName || "Not set")}
              <Box
                sx={{
                  height: 1,
                  bgcolor: colors.border.light,
                  mx: `${spacing.lg}px`,
                }}
              />
              {renderRow("Email", user?.email || "Not set")}
              {user?.userNumber && (
                <>
                  <Box
                    sx={{
                      height: 1,
                      bgcolor: colors.border.light,
                      mx: `${spacing.lg}px`,
                    }}
                  />
                  {renderRow("User number", `#${user.userNumber}`)}
                </>
              )}
            </Box>
          </Box>
        )}

        {/* Data */}
        <Box sx={{ mb: `${spacing.xl}px` }}>
          <Typography
            sx={{
              ...typography.label,
              color: colors.text.tertiary,
              textTransform: "uppercase",
              mb: `${spacing.md}px`,
            }}
          >
            Data
          </Typography>
          <Box
            sx={{
              bgcolor: colors.background.card,
              borderRadius: `${borderRadius.xl}px`,
              border: `1px solid ${colors.border.light}`,
              overflow: "hidden",
            }}
          >
            {renderRow(
              "Export game history",
              exportingData ? "Exporting..." : "Download as CSV",
              handleExportData,
            )}
            <Box
              sx={{
                height: 1,
                bgcolor: colors.border.light,
                mx: `${spacing.lg}px`,
              }}
            />
            {renderRow(
              "Clear all data",
              "Delete all games permanently",
              handleClearData,
              true,
            )}
            {!isGuest && (
              <>
                <Box
                  sx={{
                    height: 1,
                    bgcolor: colors.border.light,
                    mx: `${spacing.lg}px`,
                  }}
                />
                {renderRow(
                  "Delete account",
                  "Permanently remove your account",
                  handleDeleteAccount,
                  true,
                )}
              </>
            )}
          </Box>
        </Box>

        {/* About */}
        <Box sx={{ mb: `${spacing.xl}px` }}>
          <Typography
            sx={{
              ...typography.label,
              color: colors.text.tertiary,
              textTransform: "uppercase",
              mb: `${spacing.md}px`,
            }}
          >
            About
          </Typography>
          <Box
            sx={{
              bgcolor: colors.background.card,
              borderRadius: `${borderRadius.xl}px`,
              border: `1px solid ${colors.border.light}`,
              overflow: "hidden",
            }}
          >
            {renderRow("App version", "1.0.0")}
            <Box
              sx={{
                height: 1,
                bgcolor: colors.border.light,
                mx: `${spacing.lg}px`,
              }}
            />
            {renderRow(
              "Send feedback",
              "Help us improve the app",
              handleSendFeedback,
            )}
          </Box>
        </Box>

        {/* Developer */}
        <Box sx={{ mb: `${spacing.xl}px` }}>
          <Typography
            sx={{
              ...typography.label,
              color: colors.text.tertiary,
              textTransform: "uppercase",
              mb: `${spacing.md}px`,
            }}
          >
            Developer
          </Typography>
          <Box
            sx={{
              bgcolor: colors.background.card,
              borderRadius: `${borderRadius.xl}px`,
              border: `1px solid ${colors.border.light}`,
              overflow: "hidden",
            }}
          >
            {renderRow(
              "Clear all users",
              "Resets database \u2014 next signup is User #001",
              handleClearAllUsers,
              true,
            )}
          </Box>
        </Box>

        {/* Sign out */}
        {!isGuest && (
          <Box sx={{ mb: `${spacing.xl}px` }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleSignOut}
              sx={{
                py: 1.5,
                borderColor: colors.border.medium,
                color: colors.text.primary,
                fontFamily: fontFamilies.bodySemiBold,
                fontWeight: 600,
                fontSize: typography.button.fontSize,
                borderRadius: "9999px",
                textTransform: "none",
                "&:hover": {
                  borderColor: colors.accent.gold,
                  bgcolor: "transparent",
                },
              }}
            >
              Sign out
            </Button>
          </Box>
        )}

        {/* Footer */}
        <Box
          sx={{
            mt: `${spacing.xl}px`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              height: 1,
              width: 32,
              bgcolor: colors.border.light,
              mb: `${spacing.md}px`,
            }}
          />
          <Typography
            sx={{
              ...typography.bodySmall,
              color: colors.text.tertiary,
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            Made for the wager on the green.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default SettingsPage;
