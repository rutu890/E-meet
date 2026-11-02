import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { useApp } from "./context/AppContext";
import { adminAuthService } from "./services/adminAuthService"; 
import "./pages/dashboard.css";

const AuthPage = lazy(() => import("./pages/AuthPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const MeetingPage = lazy(() => import("./pages/MeetingPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const CallsPage = lazy(() => import("./pages/CallsPage"));
const NotificationHistoryPage = lazy(() => import("./pages/NotificationHistoryPage"));
const WaitingRoomPage = lazy(() => import("./features/waiting-room/WaitingRoomPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));

function RouteFallback() {
  return (
    <div className="em-route-loader" role="status" aria-label="Loading">
      <span className="em-brand-mark">E</span>
    </div>
  );
}

function AdminRoute({ children }) {
  return adminAuthService.getSession()
    ? children
    : <Navigate to="/admin-login" replace />;
}

function AdminLoginRoute({ children }) {
  return adminAuthService.getSession()
    ? <Navigate to="/admin" replace />
    : children;
}

export default function App() {
  const { user } = useApp();

  const guard = (element) =>
    user ? element : <Navigate to="/login" replace />;

  return (
    <>
      <Toaster
        position="top-right"
        richColors
        closeButton={false}
        expand={false}
        visibleToasts={3}
        toastOptions={{
          duration: 2200,
          style: { borderRadius: "12px", fontSize: "13px", fontFamily: "inherit" },
        }}
      />

      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" />} />
          <Route path="/signup" element={user ? <Navigate to="/" replace /> : <AuthPage mode="signup" />} />
          <Route path="/calls" element={<CallsPage />} />

          {/* Admin: exactly ONE route per path, using the admin session (not `user`) */}
          <Route path="/admin-login" element={<AdminLoginRoute><AdminLoginPage /></AdminLoginRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

          <Route path="/" element={guard(<HomePage />)} />
          <Route path="/settings" element={guard(<SettingsPage />)} />
          <Route path="/profile" element={guard(<ProfilePage />)} />
          <Route path="/notifications" element={guard(<NotificationHistoryPage />)} />
          <Route path="/waiting-room/:meetingId" element={<WaitingRoomPage />} />
          <Route path="/support" element={guard(<SupportPage />)} />
          <Route path="/meeting/:meetingId" element={guard(<MeetingPage />)} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
