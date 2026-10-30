import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MessageSquare,
  Video,
  X,
  LoaderCircle,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import "./AuthPage.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function getInitialErrors(values, isSignup) {
  const errors = {};

  if (isSignup) {
    if (!values.name.trim()) {
      errors.name = "Please enter your full name.";
    } else if (values.name.trim().length < 2) {
      errors.name = "Name must contain at least 2 characters.";
    }
  }

  if (!values.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (isSignup && values.password.length < 8) {
    errors.password = "Password must contain at least 8 characters.";
  } else if (isSignup && !/(?=.*[A-Za-z])(?=.*\d)/.test(values.password)) {
    errors.password = "Include at least one letter and one number.";
  }

  if (isSignup) {
    if (!values.confirmPassword) errors.confirmPassword = "Please confirm your password.";
    else if (values.password !== values.confirmPassword) errors.confirmPassword = "Passwords do not match.";
    if (!values.termsAccepted) errors.termsAccepted = "Please accept the Terms of Service and Privacy Policy.";
  }

  return errors;
}

export default function AuthPage({ mode = "login" }) {
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const { login, signup: register, guestLogin } = useApp();
  const [values, setValues] = useState({
    name: "", email: "", password: "", confirmPassword: "", termsAccepted: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!forgotOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setForgotOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [forgotOpen]);

  function notify(message, type = "info") {
    setToast({ message, type });
  }

  function updateField(field, value) {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);

    if (touched[field] || errors[field]) {
      const nextErrors = getInitialErrors(nextValues, isSignup);
      setErrors((previous) => ({ ...previous, [field]: nextErrors[field] || "" }));
    }
  }

  function blurField(field) {
    setTouched((previous) => ({ ...previous, [field]: true }));
    const nextErrors = getInitialErrors(values, isSignup);
    setErrors((previous) => ({ ...previous, [field]: nextErrors[field] || "" }));
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = getInitialErrors(values, isSignup);
    setErrors(nextErrors);
    setTouched({ name: true, email: true, password: true, confirmPassword: true, termsAccepted: true });

    if (Object.values(nextErrors).some(Boolean)) {
      notify("Please correct the highlighted fields.", "error");
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        await register({
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
        });
      } else {
        await login({
          email: values.email.trim(),
          password: values.password,
        });
      }

      notify(isSignup ? "Account created successfully!" : "Welcome back!", "success");
      navigate("/", { replace: true });
    } catch (error) {
      notify(error?.message || "Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }


  function handleGoogleLogin() {
    notify(
      "Google sign-in is not connected yet. Configure Google OAuth to enable it.",
      "info"
    );
  }

  async function handleGuestLogin() {
    setLoading(true);
    try {
      await guestLogin(values.name);
      notify("Joined as guest!", "success");
      navigate("/", { replace: true });
    } catch (error) {
      notify(error?.message || "Could not continue as guest.", "error");
    } finally {
      setLoading(false);
    }
  }
  function handleForgotPassword(event) {
    event.preventDefault();
    if (!emailPattern.test(resetEmail.trim())) {
      setResetError("Enter a valid email address.");
      return;
    }

    setForgotOpen(false);
    setResetError("");
    notify(
      "Password reset requires a connected backend email service.",
      "info"
    );
  }

  const fieldClass = (field) =>
    `auth-input-wrap ${touched[field] && errors[field] ? "has-error" : ""}`;

  return (
    <div className="auth-page">
      {toast && (
        <div
          className={`auth-toast auth-toast--${toast.type}`}
          role="status"
          aria-live="polite"
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={19} />
          ) : (
            <span className="auth-toast-dot" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            className="auth-toast-close"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div className="auth-shell">
        <aside className="auth-aside">
          <div className="auth-orange-orb" />

          <Link to="/" className="auth-brand" aria-label="Euodoo Meet home">
            <span className="auth-brand-mark">E</span>
            <span className="auth-brand-name">
              Euodoo <span>Meet</span>
            </span>
          </Link>

          <div className="auth-aside-content">
            <h1>
              Welcome to
              <br />
              Euodoo <span>Meet</span>
            </h1>
            <p className="auth-description">
              Connect with your team. Meet, collaborate, and communicate securely.
            </p>

            <div className="auth-features">
              <div className="auth-feature">
                <span className="auth-feature-icon auth-feature-icon--teal">
                  <Video size={22} />
                </span>
                <strong>HD Video</strong>
                <p>Clear and smooth meetings</p>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon auth-feature-icon--orange">
                  <MessageSquare size={21} />
                </span>
                <strong>Real-time Chat</strong>
                <p>Stay connected instantly</p>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon auth-feature-icon--teal">
                  <CalendarDays size={21} />
                </span>
                <strong>Schedule Meetings</strong>
                <p>Plan and manage easily</p>
              </div>
            </div>
          </div>

          <div className="auth-teal-orb">
            <span />
          </div>

        </aside>

        <main className="auth-main">
          <section className="auth-card" aria-labelledby="auth-heading">
            <div className="auth-mobile-brand">
              <span className="auth-brand-mark">E</span>
              <span className="auth-brand-name">
                Euodoo <span>Meet</span>
              </span>
            </div>

            <div className="auth-card-heading">
              <h2 id="auth-heading">{isSignup ? "Create account" : "Sign in"}</h2>
              <p>
                {isSignup
                  ? "Create your account and bring your team together."
                  : "Enter your details to continue to your workspace."}
              </p>
            </div>

            <form className="auth-form" onSubmit={submit} noValidate>
              {isSignup && (
                <div className="auth-field-group">
                  <label htmlFor="auth-name">Full name</label>
                  <div className={fieldClass("name")}>
                    <UserRound size={19} aria-hidden="true" />
                    <input
                      id="auth-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Enter your full name"
                      value={values.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      onBlur={() => blurField("name")}
                      aria-invalid={Boolean(touched.name && errors.name)}
                      aria-describedby={touched.name && errors.name ? "auth-name-error" : undefined}
                      disabled={loading}
                    />
                  </div>
                  {touched.name && errors.name && (
                    <p className="auth-field-error" id="auth-name-error">{errors.name}</p>
                  )}
                </div>
              )}

              <div className="auth-field-group">
                <label htmlFor="auth-email">Email</label>
                <div className={fieldClass("email")}>
                  <Mail size={19} aria-hidden="true" />
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    value={values.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    onBlur={() => blurField("email")}
                    aria-invalid={Boolean(touched.email && errors.email)}
                    aria-describedby={touched.email && errors.email ? "auth-email-error" : undefined}
                    disabled={loading}
                  />
                </div>
                {touched.email && errors.email && (
                  <p className="auth-field-error" id="auth-email-error">{errors.email}</p>
                )}
              </div>

              <div className="auth-field-group">
                <label htmlFor="auth-password">Password</label>
                <div className={fieldClass("password")}>
                  <LockKeyhole size={19} aria-hidden="true" />
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    placeholder="Enter your password"
                    value={values.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    onBlur={() => blurField("password")}
                    aria-invalid={Boolean(touched.password && errors.password)}
                    aria-describedby={
                      touched.password && errors.password ? "auth-password-error" : undefined
                    }
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p className="auth-field-error" id="auth-password-error">{errors.password}</p>
                )}

                {!isSignup && (
                  <div className="auth-forgot-row">
                    <button
                      type="button"
                      className="auth-text-link"
                      onClick={() => {
                        setResetEmail(values.email);
                        setResetError("");
                        setForgotOpen(true);
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
                {isSignup && (
                  <p className="auth-hint">Use at least 8 characters, including a letter and a number.</p>
                )}
              </div>

              {isSignup && (
                <>
                  <div className="auth-field-group">
                    <label htmlFor="auth-confirm-password">Confirm password</label>
                    <div className={fieldClass("confirmPassword")}>
                      <LockKeyhole size={19} aria-hidden="true" />
                      <input
                        id="auth-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Re-enter your password"
                        value={values.confirmPassword}
                        onChange={(event) => updateField("confirmPassword", event.target.value)}
                        onBlur={() => blurField("confirmPassword")}
                        aria-invalid={Boolean(touched.confirmPassword && errors.confirmPassword)}
                        aria-describedby={touched.confirmPassword && errors.confirmPassword ? "auth-confirm-password-error" : undefined}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() => setShowConfirmPassword((previous) => !previous)}
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        disabled={loading}
                      >
                        {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                      </button>
                    </div>
                    {touched.confirmPassword && errors.confirmPassword && (
                      <p className="auth-field-error" id="auth-confirm-password-error">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <div className={`auth-terms-row ${touched.termsAccepted && errors.termsAccepted ? "auth-terms-row--error" : ""}`}>
                    <input
                      id="auth-terms"
                      className="auth-terms-checkbox"
                      type="checkbox"
                      checked={values.termsAccepted}
                      onChange={(event) => updateField("termsAccepted", event.target.checked)}
                      onBlur={() => blurField("termsAccepted")}
                      aria-invalid={Boolean(touched.termsAccepted && errors.termsAccepted)}
                      aria-describedby={touched.termsAccepted && errors.termsAccepted ? "auth-terms-error" : undefined}
                      disabled={loading}
                    />
                    <label htmlFor="auth-terms">
                      I agree to the{" "}
                      <Link to="/terms" target="_blank" rel="noreferrer">Terms of Service</Link>
                      {" "}and{" "}
                      <Link to="/privacy" target="_blank" rel="noreferrer">Privacy Policy</Link>
                    </label>
                  </div>
                  {touched.termsAccepted && errors.termsAccepted && (
                    <p className="auth-field-error auth-terms-error" id="auth-terms-error">{errors.termsAccepted}</p>
                  )}
                </>
              )}

              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <LoaderCircle className="auth-spinner" size={19} />
                    Please wait...
                  </>
                ) : (
                  <>
                    {isSignup ? "Create account" : "Sign in"}
                    <ArrowRight size={19} />
                  </>
                )}
              </button>
              {loading && (
                <div className="auth-loading-skeleton" role="status" aria-label="Processing sign-in">
                  <span className="auth-skeleton-block auth-skeleton-line" />
                  <span className="auth-skeleton-block auth-skeleton-line auth-skeleton-line--short" />
                </div>
              )}
            </form>

            <div className="auth-divider">
              <span />
              <span>OR</span>
              <span />
            </div>

            <button
              type="button"
              className="auth-google-button"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <span className="auth-google-g" aria-hidden="true">G</span>
              Continue with Google
            </button>

            <button
              type="button"
              className="auth-guest-button"
              onClick={handleGuestLogin}
              disabled={loading}
            >
              <UserRound size={19} aria-hidden="true" />
              Continue as guest
            </button>

            <p className="auth-switch">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <Link to={isSignup ? "/login" : "/signup"}>
                {isSignup ? "Sign in" : "Create account"}
              </Link>
            </p>

          </section>
        </main>
      </div>

      {forgotOpen && (
        <div
          className="auth-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setForgotOpen(false);
          }}
        >
          <section
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-heading"
          >
            <button
              type="button"
              className="auth-modal-close"
              onClick={() => setForgotOpen(false)}
              aria-label="Close dialog"
            >
              <X size={19} />
            </button>
            <div className="auth-modal-icon"><Mail size={23} /></div>
            <h3 id="forgot-heading">Forgot your password?</h3>
            <p>
              Enter your registered email. Password reset will work once your
              backend email service is connected.
            </p>
            <form onSubmit={handleForgotPassword} noValidate>
              <label htmlFor="reset-email">Email address</label>
              <div className={`auth-input-wrap ${resetError ? "has-error" : ""}`}>
                <Mail size={18} aria-hidden="true" />
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={resetEmail}
                  onChange={(event) => {
                    setResetEmail(event.target.value);
                    if (resetError) setResetError("");
                  }}
                  aria-invalid={Boolean(resetError)}
                  aria-describedby={resetError ? "reset-email-error" : undefined}
                />
              </div>
              {resetError && <p className="auth-field-error" id="reset-email-error">{resetError}</p>}
              <button className="auth-submit" type="submit">
                Continue <ArrowRight size={18} />
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
