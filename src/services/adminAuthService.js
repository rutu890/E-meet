

const KEY = "euodoo-admin-session";
const DEMO_ADMIN = { email: "admin@euodoo.com", password: "Admin@123" };

const apiBase = () => (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

function read(storage) {
  try {
    const session = JSON.parse(storage.getItem(KEY) || "null");
    if (session && session.expiresAt > Date.now()) return session;
    storage.removeItem(KEY);
  } catch {
    /* storage unavailable or corrupted */
  }
  return null;
}

export const adminAuthService = {
  isDemo: () => !apiBase(),
  demoCredentials: DEMO_ADMIN,

  getSession() {
    return read(sessionStorage) || read(localStorage);
  },

  async login({ email, password, rememberMe = false }) {
    let admin;

    if (apiBase()) {
      const response = await fetch(`${apiBase()}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.role !== "admin") {
        throw new Error(data.message || "Invalid credentials or administrator access denied.");
      }
      admin = { email, name: data.name || "Administrator" };
    } else {
      await new Promise((resolve) => setTimeout(resolve, 600)); // feels like a real request
      if (email.toLowerCase() !== DEMO_ADMIN.email || password !== DEMO_ADMIN.password) {
        throw new Error("Invalid credentials or administrator access denied.");
      }
      admin = { email, name: "Administrator" };
    }

    const ttl = rememberMe ? 7 * 24 * 3600 * 1000 : 8 * 3600 * 1000;
    const session = { ...admin, role: "admin", expiresAt: Date.now() + ttl };
    (rememberMe ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session));
    (rememberMe ? sessionStorage : localStorage).removeItem(KEY);
    return session;
  },

  logout() {
    try {
      sessionStorage.removeItem(KEY);
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};