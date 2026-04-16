import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./store";
import AppLayout from "./components/layout/AppLayout";

// Auth pages
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import ForgotPasswordPage from "./pages/ForgotPassword";

// App pages
import HomePage from "./pages/Home";
import CoursesPage from "./pages/Courses";
import CreateCoursePage from "./pages/CreateCourse";
import PlayersPage from "./pages/Players";
import GameHistoryPage from "./pages/GameHistory";
import SettingsPage from "./pages/Settings";
import AdminPanelPage from "./pages/AdminPanel";
import GameSetupPage from "./pages/GameSetup";
import HandicapSetupPage from "./pages/HandicapSetup";
import ScoringPage from "./pages/Scoring";
import OverallStandingsPage from "./pages/OverallStandings";
import GameSummaryPage from "./pages/GameSummary";

function ProtectedRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/create" element={<CreateCoursePage />} />
        <Route path="/courses/edit/:courseId" element={<CreateCoursePage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/history" element={<GameHistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminPanelPage />} />
        <Route path="/game/setup" element={<GameSetupPage />} />
        <Route path="/game/handicap/:gameId" element={<HandicapSetupPage />} />
        <Route path="/game/scoring/:gameId" element={<ScoringPage />} />
        <Route
          path="/game/standings/:gameId"
          element={<OverallStandingsPage />}
        />
        <Route path="/game/summary/:gameId" element={<GameSummaryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

function AuthRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export function AppRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // App.tsx handles the loading screen
  }

  return user ? <ProtectedRoutes /> : <AuthRoutes />;
}
