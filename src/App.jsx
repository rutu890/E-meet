import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./context/AppContext";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import MeetingPage from "./pages/MeetingPage";

export default function App() {
  const { user } = useApp();
  return <Routes>
    <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" />} />
    <Route path="/signup" element={user ? <Navigate to="/" replace /> : <AuthPage mode="signup" />} />
    <Route path="/" element={user ? <HomePage /> : <Navigate to="/login" replace />} />
    <Route path="/meeting/:meetingId" element={user ? <MeetingPage /> : <Navigate to="/login" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
