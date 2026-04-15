import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  IconButton,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import { crossPlatformAlert } from "../utils/alert";
import { dataService } from "../services/DataService";
import { typography, fontFamilies, spacing, borderRadius } from "../theme";
import { useThemedColors } from "../contexts/ThemeContext";

export const AdminPanelPage = () => {
  const colors = useThemedColors();
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      const users = await dataService.getPendingUsers();
      setPendingUsers(users);
    } catch (error) {
      console.error("Failed to load pending users:", error);
      crossPlatformAlert("Error", "Failed to load pending users");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPendingUsers();
    setRefreshing(false);
  }, []);

  const handleApprove = async (userId: string, displayName: string) => {
    crossPlatformAlert("Approve user", `Approve ${displayName}'s account?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        style: "default",
        onPress: async () => {
          try {
            await dataService.approvePendingUser(userId);
            await loadPendingUsers();
          } catch (error) {
            crossPlatformAlert("Error", "Failed to approve user");
          }
        },
      },
    ]);
  };

  const handleReject = async (userId: string, displayName: string) => {
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
              await loadPendingUsers();
            } catch (error) {
              crossPlatformAlert("Error", "Failed to reject user");
            }
          },
        },
      ],
    );
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: colors.background.primary,
        }}
      >
        <CircularProgress sx={{ color: colors.accent.gold }} />
        <Typography
          sx={{
            ...typography.bodyMedium,
            color: colors.text.secondary,
            mt: `${spacing.md}px`,
          }}
        >
          Loading pending approvals...
        </Typography>
      </Box>
    );
  }

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
        <Box sx={{ mb: `${spacing.xl}px` }}>
          <Typography
            sx={{
              ...typography.label,
              color: colors.text.tertiary,
              textTransform: "uppercase",
              mb: `${spacing.sm}px`,
            }}
          >
            Admin
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Typography
              sx={{
                ...typography.displayMedium,
                color: colors.text.primary,
                mb: `${spacing.md}px`,
              }}
            >
              User approvals
            </Typography>
            <IconButton
              onClick={onRefresh}
              disabled={refreshing}
              sx={{ color: colors.text.tertiary, mt: -0.5 }}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
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
            }}
          >
            {pendingUsers.length === 0
              ? "No pending requests"
              : `${pendingUsers.length} user${pendingUsers.length === 1 ? "" : "s"} waiting for approval`}
          </Typography>
        </Box>

        {pendingUsers.length === 0 ? (
          /* Empty state */
          <Box
            sx={{
              bgcolor: colors.background.card,
              borderRadius: `${borderRadius.xl}px`,
              border: `1px solid ${colors.border.light}`,
              p: `${spacing.xl}px`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                bgcolor: colors.surfaces.level2,
                border: `1px solid ${colors.border.goldSubtle}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: `${spacing.lg}px`,
              }}
            >
              <CheckCircleOutlineIcon
                sx={{ fontSize: 32, color: colors.accent.gold }}
              />
            </Box>
            <Typography
              sx={{
                ...typography.h2,
                fontFamily: fontFamilies.display,
                color: colors.text.primary,
                mb: `${spacing.sm}px`,
                textAlign: "center",
                letterSpacing: -0.5,
              }}
            >
              All caught up
            </Typography>
            <Typography
              sx={{
                ...typography.bodyLarge,
                color: colors.text.secondary,
                textAlign: "center",
              }}
            >
              There are no pending user approvals at this time.
            </Typography>
          </Box>
        ) : (
          /* User list */
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: `${spacing.md}px`,
            }}
          >
            {pendingUsers.map((pendingUser) => (
              <Box
                key={pendingUser.id}
                sx={{
                  bgcolor: colors.background.card,
                  borderRadius: `${borderRadius.xl}px`,
                  border: `1px solid ${colors.border.light}`,
                  p: `${spacing.lg}px`,
                }}
              >
                {/* User info */}
                <Box sx={{ mb: `${spacing.md}px` }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: `${spacing.xs}px`,
                      gap: `${spacing.sm}px`,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: fontFamilies.display,
                        fontSize: 20,
                        color: colors.text.primary,
                        letterSpacing: -0.4,
                        flex: 1,
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
                      ...typography.bodyMedium,
                      color: colors.text.secondary,
                      mb: `${spacing.sm}px`,
                    }}
                  >
                    {pendingUser.email}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: `${spacing.xs}px`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        bgcolor: colors.accent.gold,
                      }}
                    />
                    <Typography
                      sx={{
                        ...typography.label,
                        color: colors.text.tertiary,
                        textTransform: "uppercase",
                      }}
                    >
                      Signed up{" "}
                      {pendingUser.createdAt
                        ? formatDate(pendingUser.createdAt)
                        : "Unknown"}
                    </Typography>
                  </Box>
                </Box>

                {/* Actions */}
                <Box
                  sx={{
                    display: "flex",
                    gap: `${spacing.sm}px`,
                    borderTop: `1px solid ${colors.border.light}`,
                    pt: `${spacing.md}px`,
                  }}
                >
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() =>
                      handleApprove(pendingUser.id, pendingUser.displayName)
                    }
                    sx={{
                      py: `${spacing.md}px`,
                      bgcolor: colors.accent.gold,
                      color: colors.text.inverse,
                      fontFamily: fontFamilies.bodySemiBold,
                      fontSize: typography.button.fontSize,
                      borderRadius: "9999px",
                      textTransform: "none",
                      letterSpacing: 0.3,
                      "&:hover": {
                        bgcolor: colors.accent.goldDark,
                      },
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() =>
                      handleReject(pendingUser.id, pendingUser.displayName)
                    }
                    sx={{
                      py: `${spacing.md}px`,
                      borderColor: colors.border.light,
                      color: colors.text.secondary,
                      fontFamily: fontFamilies.bodySemiBold,
                      fontSize: typography.button.fontSize,
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
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AdminPanelPage;
