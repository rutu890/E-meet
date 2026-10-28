
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./context/AppContext";
import "./pages/dashboard.css";

const AuthPage = lazy(() => import("./pages/AuthPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const MeetingPage = lazy(() => import("./pages/MeetingPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotificationHistoryPage = lazy(
  () => import("./pages/NotificationHistoryPage")
);
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));

function RouteFallback() {
  return (
    <div
      className="em-route-loader"
      role="status"
      aria-label="Loading"
    >
      <span className="em-brand-mark">E</span>
    </div>
  );
}

export default function App() {
  const { user } = useApp();

  const guard = (element) =>
    user ? element : <Navigate to="/login" replace />;

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" replace /> : <AuthPage mode="login" />
          }
        />

        <Route
          path="/signup"
          element={
            user ? <Navigate to="/" replace /> : <AuthPage mode="signup" />
          }
        />

        <Route
          path="/admin-login"
          element={<AdminLoginPage />}
        />

        <Route path="/" element={guard(<HomePage />)} />
        <Route path="/settings" element={guard(<SettingsPage />)} />
        <Route path="/profile" element={guard(<ProfilePage />)} />
        <Route
          path="/notifications"
          element={guard(<NotificationHistoryPage />)}
        />
        <Route path="/support" element={guard(<SupportPage />)} />
        <Route
          path="/meeting/:meetingId"
          element={guard(<MeetingPage />)}
        />

        {/* Access the admin page directly through the URL */}
        <Route path="/admin" element={guard(<AdminPage />)} />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </Suspense>
  );
}
