import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./context/AppContext";
import "./pages/dashboard.css";

// Each page is its own chunk, so the first load only downloads what's needed
// (MeetingPage will be the heaviest once LiveKit is added).
const AuthPage = lazy(() => import("./pages/AuthPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const MeetingPage = lazy(() => import("./pages/MeetingPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotificationHistoryPage = lazy(() => import("./pages/NotificationHistoryPage"));

function RouteFallback() {
  return <div className="em-route-loader" role="status" aria-label="Loading"><span className="em-brand-mark">E</span></div>;
}

export default function App() {
  const { user } = useApp();
  const guard = (element) => (user ? element : <Navigate to="/login" replace />);
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" />} />
        <Route path="/signup" element={user ? <Navigate to="/" replace /> : <AuthPage mode="signup" />} />
        <Route path="/" element={guard(<HomePage />)} />
        <Route path="/settings" element={guard(<SettingsPage />)} />
        <Route path="/profile" element={guard(<ProfilePage />)} />
        <Route path="/notifications" element={guard(<NotificationHistoryPage />)} />
        <Route path="/support" element={guard(<SupportPage />)} />
        <Route path="/meeting/:meetingId" element={guard(<MeetingPage />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
