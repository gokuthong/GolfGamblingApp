import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import HomeIcon from "@mui/icons-material/Home";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import GolfCourseIcon from "@mui/icons-material/GolfCourse";
import GolfCourseOutlinedIcon from "@mui/icons-material/GolfCourseOutlined";
import PeopleIcon from "@mui/icons-material/People";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { useThemedColors } from "../../contexts/ThemeContext";
import { fontFamilies } from "../../theme";

interface TabConfig {
  path: string;
  label: string;
  filledIcon: React.ReactNode;
  outlinedIcon: React.ReactNode;
  /** Match any path starting with this prefix */
  matchPrefix: string;
}

const TABS: TabConfig[] = [
  {
    path: "/",
    label: "Home",
    filledIcon: <HomeIcon />,
    outlinedIcon: <HomeOutlinedIcon />,
    matchPrefix: "/",
  },
  {
    path: "/courses",
    label: "Courses",
    filledIcon: <GolfCourseIcon />,
    outlinedIcon: <GolfCourseOutlinedIcon />,
    matchPrefix: "/courses",
  },
  {
    path: "/players",
    label: "Players",
    filledIcon: <PeopleIcon />,
    outlinedIcon: <PeopleOutlinedIcon />,
    matchPrefix: "/players",
  },
  {
    path: "/history",
    label: "History",
    filledIcon: <HistoryIcon />,
    outlinedIcon: <HistoryIcon />,
    matchPrefix: "/history",
  },
  {
    path: "/settings",
    label: "Settings",
    filledIcon: <SettingsIcon />,
    outlinedIcon: <SettingsOutlinedIcon />,
    matchPrefix: "/settings",
  },
];

function isTabActive(tab: TabConfig, pathname: string): boolean {
  // Home tab: exact match only (otherwise every path matches "/")
  if (tab.path === "/") return pathname === "/";
  return pathname.startsWith(tab.matchPrefix);
}

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const colors = useThemedColors();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide tab bar on game screens (scoring, setup, etc.)
  const hideTabBar = location.pathname.startsWith("/game/");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        // 100dvh accounts for dynamic browser chrome on mobile; fallback to 100vh.
        height: "100vh",
        "@supports (height: 100dvh)": { height: "100dvh" },
        // Respect top safe area (status bar / notch) so content doesn't sit
        // underneath the system clock/notifications row.
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        bgcolor: colors.background.primary,
        overflow: "hidden",
      }}
    >
      {/* Scrollable content area */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
          // On screens where the bottom tab bar is hidden (game flows),
          // reserve room for the system gesture bar. max() with a floor
          // covers Xiaomi/MIUI WebViews that report 0 for the inset.
          ...(hideTabBar && {
            paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)",
          }),
        }}
      >
        {children}
      </Box>

      {/* Bottom tab bar */}
      {!hideTabBar && (
        <Box
          component="nav"
          sx={{
            display: "flex",
            alignItems: "stretch",
            // Base height 68px + whatever the OS reports for the gesture bar,
            // with a 12px floor so MIUI (which sometimes reports 0) still
            // leaves the nav visible above the system pill.
            minHeight: 68,
            paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)",
            bgcolor: colors.background.primary,
            borderTop: `1px solid ${colors.border.light}`,
            flexShrink: 0,
          }}
        >
          {TABS.map((tab) => {
            const active = isTabActive(tab, location.pathname);
            return (
              <Box
                key={tab.path}
                onClick={() => navigate(tab.path)}
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pt: 1,
                  pb: "10px",
                  cursor: "pointer",
                  position: "relative",
                  userSelect: "none",
                  WebkitTapHighlightColor: "transparent",
                  transition: "opacity 150ms ease",
                  "&:active": {
                    opacity: 0.7,
                  },
                }}
              >
                {/* Active indicator line */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    width: 28,
                    height: 2,
                    borderRadius: "1px",
                    bgcolor: active ? colors.accent.gold : "transparent",
                    transition: "background-color 200ms ease",
                  }}
                />

                {/* Icon container */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 48,
                    color: active ? colors.accent.gold : colors.text.tertiary,
                    "& .MuiSvgIcon-root": {
                      fontSize: 24,
                    },
                  }}
                >
                  {active ? tab.filledIcon : tab.outlinedIcon}
                </Box>

                {/* Label */}
                <Typography
                  sx={{
                    fontFamily: fontFamilies.bodySemiBold,
                    fontSize: 10,
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    mt: "4px",
                    color: active ? colors.accent.gold : colors.text.tertiary,
                    transition: "color 200ms ease",
                    lineHeight: 1,
                  }}
                >
                  {tab.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default AppLayout;
