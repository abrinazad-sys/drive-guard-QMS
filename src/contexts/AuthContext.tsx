import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { Role } from "@/lib/mock-data";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (email: string, password: string) => { success: boolean; error?: string; mustReset?: boolean };
  logout: () => void;
  completeReset: () => void;
  mustReset: boolean;
}

const AuthContext = createContext<AuthCtx | null>(null);

const DEMO = [
  { email: "admin@qms.com", password: "password123", user: { id: "u1", name: "Aisha Rahman", email: "admin@qms.com", role: "admin" as Role } },
  { email: "employee@qms.com", password: "password123", user: { id: "u3", name: "Sarah Ahmed", email: "employee@qms.com", role: "employee" as Role } },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("qms_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [mustReset, setMustReset] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem("qms_user", JSON.stringify(user));
    else localStorage.removeItem("qms_user");
  }, [user]);

  const login = (email: string, password: string) => {
    const match = DEMO.find(d => d.email === email.toLowerCase().trim());
    if (!match) return { success: false, error: "No account found with that email." };
    if (match.password !== password) return { success: false, error: "Incorrect password. Please try again." };
    setUser(match.user);
    return { success: true };
  };
  const logout = () => setUser(null);
  const completeReset = () => setMustReset(false);

  return <AuthContext.Provider value={{ user, login, logout, mustReset, completeReset }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
