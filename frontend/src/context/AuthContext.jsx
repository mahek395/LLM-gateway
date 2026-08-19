import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = still checking
  const [email, setEmail] = useState(null);

  // On first load, check if an existing session cookie is still valid by
  // hitting a protected endpoint. No dedicated "/admin/me" route yet —
  // /v1/stats works fine as a cheap authenticated ping.
  useEffect(() => {
    api
      .get("/v1/stats")
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  async function login(loginEmail, password) {
    const result = await api.post("/admin/login", { email: loginEmail, password });
    setEmail(result.email);
    setIsAuthenticated(true);
  }

  async function logout() {
    await api.post("/admin/logout", {});
    setIsAuthenticated(false);
    setEmail(null);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, email, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}