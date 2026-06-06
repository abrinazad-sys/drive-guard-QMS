import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { loginApi } from "@/services/authService";
import createAxiosInstance from "@/config/axios-config";
import type { Role } from "@/lib/mock-data";

const axios = createAxiosInstance(import.meta.env.VITE_BASE_URL ?? "");

export interface AuthUser {
  id: string | number;
  name: string;
  email: string;
  role: string;
  passwordChangeRequired?: boolean;
  profilePhotoUrl?: string | null;
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
  updateProfile: (name: string, photo?: File) => Promise<AuthUser>;
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
      const msg = error?.response?.data?.error?.message || "Login failed due to server error.";
      console.error("Login error:", msg);
      return { success: false, error: msg };
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

  const updateProfile = async (name: string, photo?: File) => {
    const formData = new FormData();
    formData.append("name", name);
    if (photo) {
      formData.append("profilePhoto", photo);
    }

    const { data } = await axios.patch("/auth/me", formData);

    if (!data.success) {
      throw new Error(data.message || "Failed to update profile");
    }

    const updatedUser: AuthUser = {
      id: data.data.user.id,
      email: data.data.user.email,
      name: data.data.user.name,
      role: data.data.user.role,
      profilePhotoUrl: data.data.user.profilePhotoUrl,
      passwordChangeRequired: data.data.user.passwordChangeRequired,
    };

    setUser(updatedUser);
    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, mustReset, completeReset, updateProfile }}
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
