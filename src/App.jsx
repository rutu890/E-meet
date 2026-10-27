import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./context/AppContext";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import MeetingPage from "./pages/MeetingPage";
import SettingsPage from "./pages/SettingsPage";
import SupportPage from "./pages/SupportPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationHistoryPage from "./pages/NotificationHistoryPage";

export default function App() {
  const { user } = useApp();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <AuthPage mode="signup" />} />
      <Route path="/" element={user ? <HomePage /> : <Navigate to="/login" replace />} />
      <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" replace />} />
      <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" replace />} />
      <Route path="/notifications" element={user ? <NotificationHistoryPage /> : <Navigate to="/login" replace />} />
      <Route path="/support" element={user ? <SupportPage /> : <Navigate to="/login" replace />} />
      <Route path="/meeting/:meetingId" element={user ? <MeetingPage /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
