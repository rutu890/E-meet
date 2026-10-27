const KEY = "euodoomeet-demo-user";
export const authService = {
  getCurrentUser() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; } },
  async login({ email, password }) {
    if (!email?.trim() || !password) throw new Error("Enter your email and password.");
    const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const user = { name: name || "Demo User", email, initials: name.split(/\s+/).map(x => x[0]).join("").slice(0,2).toUpperCase() || "DU" };
    localStorage.setItem(KEY, JSON.stringify(user)); return user;
  },
  async signup({ name, email, password }) {
    if (!name?.trim() || !email?.trim() || !password) throw new Error("Complete all fields.");
    const user = { name: name.trim(), email: email.trim(), initials: name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase() };
    localStorage.setItem(KEY, JSON.stringify(user)); return user;
  },
  logout() { localStorage.removeItem(KEY); }
};
