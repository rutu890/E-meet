import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";
import "./AdminLoginPage.css";

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
      const response = await fetch(`${apiBase}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: cleanEmail,
          password,
          rememberMe,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.role !== "admin") {
        throw new Error(
          data.message || "Invalid credentials or administrator access denied."
        );
      }

      // The API must establish a valid server-side session before returning success.
      navigate("/admin", { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to sign in. Please try again.";

      setError(
        message === "Failed to fetch"
          ? "Unable to connect to the server. Please try again."
          : message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="em-admin-login">
      <header className="em-admin-login-header">
        <button
          type="button"
          className="em-admin-brand"
          onClick={() => navigate("/login")}
          aria-label="Go to regular login"
        >
          <span className="em-admin-brand-mark">E</span>
          <span>
            Euodoo <strong>Meet</strong>
          </span>
        </button>

        <span className="em-admin-secure-label">
          <ShieldCheck size={16} aria-hidden="true" />
          Secure administration
        </span>
      </header>

      <section className="em-admin-login-content">
        <div className="em-admin-login-card">
          <div className="em-admin-login-icon" aria-hidden="true">
            <LockKeyhole size={27} />
          </div>

          <span className="em-admin-eyebrow">ADMINISTRATOR ACCESS</span>
          <h1>Welcome back</h1>

          <p className="em-admin-description">
            Sign in to manage meetings, attendees, recordings, and workspace activity.
          </p>

          {error && (
            <div className="em-admin-error" role="alert">
              <AlertCircle size={17} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="em-admin-field">
              <span>Email address</span>
              <div className="em-admin-input-wrap">
                <Mail size={18} aria-hidden="true" />
                <input
                  type="email"
                  name="email"
                  placeholder="admin@euodoo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </label>

            <label className="em-admin-field">
              <span>Password</span>
              <div className="em-admin-input-wrap">
                <LockKeyhole size={18} aria-hidden="true" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="em-admin-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </label>

            <div className="em-admin-login-options">
              <label className="em-admin-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                Remember me
              </label>

              <button
                type="button"
                className="em-admin-forgot"
                onClick={() =>
                  setError("Please contact your administrator to reset your password.")
                }
              >
                Forgot password?
              </button>
            </div>

            <button
              className="em-admin-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle
                    className="em-admin-spinner"
                    size={19}
                    aria-hidden="true"
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in to Admin
                  <ArrowRight size={18} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <div className="em-admin-security-note">
            <ShieldCheck size={17} aria-hidden="true" />
            <span>
              Restricted access. Only authorized administrators may continue.
            </span>
          </div>
        </div>

        <p className="em-admin-footer">Euodoo Meet · Administration Portal</p>
      </section>
    </main>
  );
}
