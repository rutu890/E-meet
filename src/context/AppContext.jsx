import { createContext, useContext, useMemo, useState } from "react";
import { authService } from "../services/authService";
const Context = createContext(null);
export function AppProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const value = useMemo(() => ({
  user,
  isGuest: Boolean(user?.isGuest),
  login: async (data) => { const u = await authService.login(data); setUser(u); return u; },
  signup: async (data) => { const u = await authService.signup(data); setUser(u); return u; },
  guestLogin: async (name) => { const u = await authService.guestLogin(name); setUser(u); return u; },
  logout: () => { authService.logout(); setUser(null); }
}), [user]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useApp() { return useContext(Context); }
