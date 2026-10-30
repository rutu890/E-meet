import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react";
import { adminAuthService } from "../services/adminAuthService";
import { playTone } from "../utils/tones";

import "./AdminLoginPage.css";
import "./admin-enhancements.css";

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const timers = useRef([]);

  const later = useCallback((fn, ms) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const fail = useCallback((message) => {
    setError(message);
    setShake(true);
    playTone("error");
    later(() => setShake(false), 400);
  }, [later]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      fail("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      await adminAuthService.login({ email: cleanEmail, password, rememberMe });
      setSuccess(true);
      setToast("Signed in. Opening admin console…");
      playTone("admitted");
      later(() => navigate("/admin", { replace: true }), 900);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to sign in. Please try again.";
      fail(message === "Failed to fetch" ? "Unable to connect to the server. Please try again." : message);
    } finally {
      setLoading(false);
    }
  }

  const demo = adminAuthService.isDemo() ? adminAuthService.demoCredentials : null;

  return (
    <main className="em-admin-login">
      {toast && (
        <div className="em-admin-toast" role="status" aria-live="polite">
          <span><Check size={14} /></span>
          {toast}
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={14} /></button>
        </div>
      )}

      <header className="em-admin-login-header">
        <button type="button" className="em-admin-brand" onClick={() => navigate("/login")} aria-label="Go to regular login">
          <span className="em-admin-brand-mark">E</span>
          <span>Euodoo <strong>Meet</strong></span>
        </button>
        <span className="em-admin-secure-label">
          <ShieldCheck size={16} aria-hidden="true" />
          Secure administration
        </span>
      </header>

      <section className="em-admin-login-content">
        <div className={`em-admin-login-card ${shake ? "is-shake" : ""}`}>
          <div className={`em-admin-login-icon ${success ? "is-success" : ""}`} aria-hidden="true">
            {success ? <Check size={27} /> : <LockKeyhole size={27} />}
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

          <form onSubmit={handleSubmit} noValidate>
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
                  disabled={loading || success}
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
                  disabled={loading || success}
                />
                <button
                  type="button"
                  className="em-admin-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </label>

            <div className="em-admin-login-options">
              <label className="em-admin-remember">
                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                Remember me
              </label>
              <button
                type="button"
                className="em-admin-forgot"
                onClick={() => { setError("Please contact your administrator to reset your password."); playTone("info"); }}
              >
                Forgot password?
              </button>
            </div>

            <button className={`em-admin-submit ${success ? "is-success" : ""}`} type="submit" disabled={loading || success}>
              {success ? (
                <><Check size={18} aria-hidden="true" /> Signed in</>
              ) : loading ? (
                <><LoaderCircle className="em-admin-spinner" size={19} aria-hidden="true" /> Signing in...</>
              ) : (
                <>Sign in to Admin <ArrowRight size={18} aria-hidden="true" /></>
              )}
            </button>
          </form>

          {demo && (
            <p className="em-admin-demo-hint">
              Demo mode: <b>{demo.email}</b> / <b>{demo.password}</b>
            </p>
          )}

          <div className="em-admin-security-note">
            <ShieldCheck size={17} aria-hidden="true" />
            <span>Restricted access. Only authorized administrators may continue.</span>
          </div>
        </div>

        <p className="em-admin-footer">Euodoo Meet · Administration Portal</p>
      </section>
    </main>
  );
}
