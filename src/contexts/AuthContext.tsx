import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { loginApi } from "@/services/authService";
import type { Role } from "@/lib/mock-data";

export interface AuthUser {
  id: string | number;
  name: string;
  email: string;
  role: string;
  passwordChangeRequired?: boolean;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string; mustReset?: boolean }>;
  logout: () => void;
  completeReset: () => void;
  mustReset: boolean;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("USER");
    return stored ? JSON.parse(stored) : null;
  });
  const [mustReset, setMustReset] = useState(() => {
    const stored = localStorage.getItem("USER");
    if (stored) {
      const u = JSON.parse(stored);
      return u.passwordChangeRequired === true;
    }
    return false;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("USER", JSON.stringify(user));
    } else {
      localStorage.removeItem("USER");
      // localStorage.removeItem("token");
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const response = await loginApi(email, password);
      if (response.success && response.data) {
        localStorage.setItem("token", response.data.accessToken);
        setUser(response.data.user);
        setMustReset(response.data.user.passwordChangeRequired);
        return {
          success: true,
          mustReset: response.data.user.passwordChangeRequired,
        };
      }
      return { success: false, error: "Login failed." };
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message || "Login failed due to server error.",
      };
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };
  const completeReset = () => {
    setMustReset(false);
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, passwordChangeRequired: false };
    });
  };


  return (
    <AuthContext.Provider
      value={{ user, login, logout, mustReset, completeReset }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
