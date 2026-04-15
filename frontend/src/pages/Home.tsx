import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import GolfCourseIcon from "@mui/icons-material/GolfCourse";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import HistoryIcon from "@mui/icons-material/History";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SportsGolfIcon from "@mui/icons-material/SportsGolf";
import { useThemedColors } from "../contexts/ThemeContext";
import { useAuth } from "../store";
import { dataService } from "../services/DataService";
import { crossPlatformAlert } from "../utils/alert";
import {
  typography,
  fontFamilies,
  spacing,
  borderRadius,
  shadows,
} from "../theme";

export const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const colors = useThemedColors();
  const [ongoingGames, setOngoingGames] = useState<any[]>([]);
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    wins: 0,
    bestScore: 0,
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      const activeGames = await dataService.getActiveGamesForUser(
        (user as any).uid,
      );
      setOngoingGames(activeGames);
    } catch (error) {
      console.error("Failed to load games:", error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const displayName = (() => {
    if (!user) return "Guest";
    const u = user as any;
    if (u.role === "guest" || u.isOffline) return "Guest";
    const name = u.displayName || u.email?.split("@")[0] || "Player";
    return name.split(" ")[0];
  })();

  const handleDeleteGame = (gameId: string) => {
    crossPlatformAlert(
      "Delete Game",
      "Are you sure you want to delete this ongoing game? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await dataService.deleteGame(gameId);
              await loadData();
            } catch (error) {
              crossPlatformAlert("Error", "Failed to delete game");
            }
          },
        },
      ],
    );
  };

  const mostRecentOngoing = ongoingGames[0];

  return (
    <Box sx={{ minHeight: "100%", bgcolor: colors.background.primary }}>
      {/* Auth modal for guest users */}
      <Dialog
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        slotProps={{
          paper: {
            sx: {
              bgcolor: colors.background.elevated,
              borderRadius: `${borderRadius.xl}px`,
              border: `1px solid ${colors.border.light}`,
              maxWidth: 400,
              width: "100%",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: fontFamilies.display,
            fontSize: typography.h2.fontSize,
            color: colors.text.primary,
            letterSpacing: -0.5,
          }}
        >
          Sign in required
        </DialogTitle>
        <DialogContent>
          <Typography
            sx={{
              fontFamily: fontFamilies.body,
              fontSize: typography.bodyLarge.fontSize,
              color: colors.text.secondary,
            }}
          >
            Create an account or sign in to save your data and sync across
            devices.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: `${spacing.lg}px`, gap: `${spacing.md}px` }}>
          <Button
            onClick={() => {
              setShowAuthModal(false);
              navigate("/login");
            }}
            sx={{
              flex: 1,
              borderRadius: `${borderRadius.full}px`,
              border: `1px solid ${colors.border.light}`,
              color: colors.text.secondary,
              fontFamily: fontFamilies.bodySemiBold,
              fontSize: typography.button.fontSize,
              textTransform: "none",
              py: `${spacing.sm}px`,
            }}
          >
            Sign in
          </Button>
          <Button
            onClick={() => {
              setShowAuthModal(false);
              navigate("/register");
            }}
            sx={{
              flex: 1,
              borderRadius: `${borderRadius.full}px`,
              bgcolor: colors.accent.gold,
              color: colors.text.inverse,
              fontFamily: fontFamilies.bodySemiBold,
              fontSize: typography.button.fontSize,
              textTransform: "none",
              py: `${spacing.sm}px`,
              "&:hover": {
                bgcolor: colors.accent.goldDark,
              },
            }}
          >
            Sign up
          </Button>
        </DialogActions>
      </Dialog>

      <Box
        sx={{
          px: `${spacing.lg}px`,
          pt: `${spacing.xxxl}px`,
          pb: `${spacing.xxxl}px`,
        }}
      >
        {/* Header section */}
        <Box sx={{ mb: `${spacing.xl}px` }}>
          <Typography
            sx={{
              ...typography.bodyMedium,
              fontFamily: fontFamilies.body,
              color: colors.text.tertiary,
              mb: "4px",
            }}
          >
            {getGreeting()},
          </Typography>
          <Typography
            sx={{
              ...typography.displayMedium,
              fontFamily: fontFamilies.display,
              color: colors.text.primary,
              mb: `${spacing.md}px`,
            }}
          >
            {displayName}
          </Typography>
          <Box
            sx={{
              height: 1.5,
              width: 44,
              bgcolor: colors.accent.gold,
              borderRadius: "1px",
            }}
          />
        </Box>

        {/* Action cards row */}
        <Box
          sx={{
            display: "flex",
            gap: `${spacing.md}px`,
            mb: `${spacing.xl}px`,
          }}
        >
          {/* Primary action - New game */}
          <Box
            onClick={() => navigate("/game/setup")}
            sx={{
              flex: 7,
              minHeight: 130,
              background: `linear-gradient(135deg, ${colors.accent.gold}, ${colors.accent.goldDark})`,
              borderRadius: `${borderRadius.xl}px`,
              cursor: "pointer",
              overflow: "hidden",
              transition: "transform 200ms ease, box-shadow 200ms ease",
              boxShadow: shadows.medium,
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: shadows.large,
              },
              "&:active": {
                transform: "scale(0.98)",
              },
            }}
          >
            <Box
              sx={{
                p: `${spacing.lg}px`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%",
              }}
            >
              <GolfCourseIcon
                sx={{ fontSize: 28, color: colors.text.inverse }}
              />
              <Box>
                <Typography
                  sx={{
                    ...typography.h3,
                    fontFamily: fontFamilies.display,
                    color: colors.text.inverse,
                    mt: `${spacing.sm}px`,
                  }}
                >
                  New game
                </Typography>
                <Typography
                  sx={{
                    ...typography.bodySmall,
                    fontFamily: fontFamilies.body,
                    color: colors.text.inverse,
                    opacity: 0.85,
                    mt: "2px",
                  }}
                >
                  Set up and begin
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Secondary action - Resume/History */}
          <Box
            onClick={() =>
              mostRecentOngoing
                ? navigate(`/game/scoring/${mostRecentOngoing.id}`)
                : navigate("/history")
            }
            sx={{
              flex: 3,
              minHeight: 130,
              bgcolor: colors.background.card,
              borderRadius: `${borderRadius.xl}px`,
              cursor: "pointer",
              border: mostRecentOngoing
                ? `1px solid ${colors.border.goldSubtle}`
                : `1px solid ${colors.border.light}`,
              boxShadow: shadows.medium,
              transition: "transform 200ms ease, box-shadow 200ms ease",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: shadows.large,
              },
              "&:active": {
                transform: "scale(0.98)",
              },
            }}
          >
            <Box
              sx={{
                p: `${spacing.lg}px`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%",
              }}
            >
              {mostRecentOngoing ? (
                <PlayCircleOutlineIcon
                  sx={{ fontSize: 28, color: colors.accent.gold }}
                />
              ) : (
                <HistoryIcon sx={{ fontSize: 28, color: colors.accent.gold }} />
              )}
              <Box>
                <Typography
                  sx={{
                    ...typography.h3,
                    fontFamily: fontFamilies.display,
                    color: colors.text.primary,
                    mt: `${spacing.sm}px`,
                  }}
                >
                  {mostRecentOngoing ? "Resume" : "History"}
                </Typography>
                <Typography
                  sx={{
                    ...typography.bodySmall,
                    fontFamily: fontFamilies.body,
                    color: colors.text.tertiary,
                    mt: "2px",
                  }}
                >
                  {mostRecentOngoing
                    ? `${ongoingGames.length} active`
                    : "Past games"}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Stats section */}
        <Box sx={{ mb: `${spacing.xl}px` }}>
          <Typography
            sx={{
              ...typography.label,
              textTransform: "uppercase",
              color: colors.text.tertiary,
              mb: `${spacing.sm}px`,
            }}
          >
            At a glance
          </Typography>
          <Box sx={{ display: "flex", gap: `${spacing.sm}px` }}>
            {[
              { value: stats.gamesPlayed, label: "Games" },
              { value: stats.wins, label: "Wins" },
              { value: stats.bestScore || "\u2014", label: "Best" },
            ].map((stat) => (
              <Box
                key={stat.label}
                sx={{
                  flex: 1,
                  bgcolor: colors.background.card,
                  borderRadius: `${borderRadius.xl}px`,
                  border: `1px solid ${colors.border.light}`,
                  p: `${spacing.lg}px`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  boxShadow: shadows.small,
                }}
              >
                <Typography
                  sx={{
                    ...typography.statDisplay,
                    fontFamily: fontFamilies.display,
                    color: colors.text.primary,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  sx={{
                    ...typography.statLabel,
                    fontFamily: fontFamilies.bodySemiBold,
                    color: colors.text.tertiary,
                  }}
                >
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Ongoing games section */}
        {ongoingGames.length > 0 && (
          <Box sx={{ mb: `${spacing.xl}px` }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                mb: `${spacing.xs}px`,
              }}
            >
              <Typography
                sx={{
                  ...typography.h4,
                  fontFamily: fontFamilies.display,
                  color: colors.text.primary,
                }}
              >
                Ongoing games
              </Typography>
              <Typography
                sx={{
                  ...typography.bodySmall,
                  color: colors.text.tertiary,
                }}
              >
                {ongoingGames.length} active
              </Typography>
            </Box>
            {/* Gold divider */}
            <Box
              sx={{
                height: 1,
                bgcolor: colors.accent.gold,
                opacity: 0.3,
                my: `${spacing.sm}px`,
              }}
            />
            {ongoingGames.map((game) => (
              <Box
                key={game.id}
                onClick={() => navigate(`/game/scoring/${game.id}`)}
                sx={{
                  bgcolor: colors.background.card,
                  borderRadius: `${borderRadius.xl}px`,
                  border: `1px solid ${colors.border.light}`,
                  p: `${spacing.lg}px`,
                  mb: `${spacing.sm}px`,
                  cursor: "pointer",
                  boxShadow: shadows.small,
                  transition: "transform 200ms ease, box-shadow 200ms ease",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: shadows.medium,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        ...typography.h4,
                        fontFamily: fontFamilies.display,
                        color: colors.text.primary,
                        mb: "2px",
                      }}
                    >
                      Game #{game.id.slice(-6).toUpperCase()}
                    </Typography>
                    <Typography
                      sx={{
                        ...typography.bodySmall,
                        color: colors.text.tertiary,
                      }}
                    >
                      {game.playerIds.length} players &middot; started{" "}
                      {game.createdAt
                        ? new Date(game.createdAt).toLocaleDateString()
                        : ""}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: `${spacing.sm}px`,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGame(game.id);
                      }}
                      sx={{
                        width: 32,
                        height: 32,
                        color: colors.text.tertiary,
                        "&:hover": {
                          color: colors.scoring.negative,
                          bgcolor: `${colors.scoring.negative}11`,
                        },
                      }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <ChevronRightIcon
                      sx={{ fontSize: 22, color: colors.accent.gold }}
                    />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Explore section */}
        <Box sx={{ mb: `${spacing.xl}px` }}>
          <Typography
            sx={{
              ...typography.h4,
              fontFamily: fontFamilies.display,
              color: colors.text.primary,
            }}
          >
            Explore
          </Typography>
          {/* Gold divider */}
          <Box
            sx={{
              height: 1,
              bgcolor: colors.accent.gold,
              opacity: 0.3,
              my: `${spacing.sm}px`,
            }}
          />
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: `${spacing.sm}px`,
            }}
          >
            {[
              { icon: <HistoryIcon />, label: "History", path: "/history" },
              {
                icon: <PeopleOutlineIcon />,
                label: "Players",
                path: "/players",
              },
              { icon: <GolfCourseIcon />, label: "Courses", path: "/courses" },
              {
                icon: <SettingsOutlinedIcon />,
                label: "Settings",
                path: "/settings",
              },
            ].map((item) => (
              <Box
                key={item.label}
                onClick={() => navigate(item.path)}
                sx={{
                  flexBasis: "48%",
                  flexGrow: 1,
                  bgcolor: colors.background.card,
                  borderRadius: `${borderRadius.xl}px`,
                  border: `1px solid ${colors.border.light}`,
                  py: `${spacing.lg}px`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: `${spacing.sm}px`,
                  cursor: "pointer",
                  boxShadow: shadows.small,
                  transition: "transform 200ms ease, box-shadow 200ms ease",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: shadows.medium,
                  },
                  "&:active": {
                    transform: "scale(0.98)",
                  },
                  "& .MuiSvgIcon-root": {
                    fontSize: 22,
                    color: colors.accent.gold,
                  },
                }}
              >
                {item.icon}
                <Typography
                  sx={{
                    ...typography.labelLarge,
                    color: colors.text.primary,
                    letterSpacing: 0.5,
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Empty state when no ongoing games */}
        {ongoingGames.length === 0 && (
          <Box sx={{ mb: `${spacing.xl}px` }}>
            <Box
              sx={{
                bgcolor: colors.background.card,
                borderRadius: `${borderRadius.xl}px`,
                border: `1px solid ${colors.border.light}`,
                p: `${spacing.xl}px`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                boxShadow: shadows.small,
              }}
            >
              <SportsGolfIcon
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
                Tee it up
              </Typography>
              <Typography
                sx={{
                  ...typography.bodyMedium,
                  color: colors.text.secondary,
                  mb: `${spacing.lg}px`,
                  maxWidth: 280,
                }}
              >
                Start a new game to begin tracking scores, stats, and bets.
              </Typography>
              <Box
                onClick={() => navigate("/game/setup")}
                sx={{
                  px: `${spacing.xl}px`,
                  py: `${spacing.md}px`,
                  bgcolor: colors.accent.gold,
                  borderRadius: `${borderRadius.full}px`,
                  cursor: "pointer",
                  transition: "background-color 200ms ease",
                  "&:hover": {
                    bgcolor: colors.accent.goldDark,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontFamily: fontFamilies.bodySemiBold,
                    fontSize: typography.button.fontSize,
                    color: colors.text.inverse,
                    letterSpacing: 0.2,
                  }}
                >
                  New game
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Footer spacer */}
        <Box sx={{ height: `${spacing.xxl}px` }} />
      </Box>
    </Box>
  );
};

export default HomePage;
