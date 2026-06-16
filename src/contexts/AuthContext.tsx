import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { loginApi } from "@/services/authService";
import { getSocket } from "@/lib/socket";
import createAxiosInstance from "@/config/axios-config";

const axios = createAxiosInstance(import.meta.env.VITE_BASE_URL ?? "");

export interface AuthUser {
  id: string | number;
  name: string;
  email: string;
  role: string;
  passwordChangeRequired?: boolean;
  profilePhotoUrl?: string | null;
  themeMode?: string;
  themeAccent?: string;
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
  updateThemePreferences: (themeMode: string, themeAccent: string) => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = sessionStorage.getItem("USER");
    return stored ? JSON.parse(stored) : null;
  });
  const [mustReset, setMustReset] = useState(() => {
    const stored = sessionStorage.getItem("USER");
    if (stored) {
      const u = JSON.parse(stored);
      return u.passwordChangeRequired === true;
    }
    return false;
  });

  useEffect(() => {
    if (user) {
      sessionStorage.setItem("USER", JSON.stringify(user));
    } else {
      sessionStorage.removeItem("USER");
    }
  }, [user]);

  // Listen for profile updates pushed from server (e.g. admin edits user name)
  const socketInited = useRef(false);
  useEffect(() => {
    if (!user || socketInited.current) return;
    socketInited.current = true;
    const socket = getSocket();
    const handler = (updated: AuthUser) => {
      if (updated.id === user.id) {
        setUser(updated);
      }
    };
    socket.on("user:updated", handler);
    return () => { socket.off("user:updated", handler); };
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const response = await loginApi(email, password);
      if (response.success && response.data) {
        const u = response.data.user;
        sessionStorage.setItem("token", response.data.accessToken);
        sessionStorage.setItem("qms_mode", u.themeMode || "system");
        sessionStorage.setItem("qms_accent", u.themeAccent || "blue");
        setUser(u);
        setMustReset(u.passwordChangeRequired);
        return {
          success: true,
          mustReset: u.passwordChangeRequired,
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
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("USER");
    sessionStorage.removeItem("passwordChangeRequired");
    sessionStorage.removeItem("qms_mode");
    sessionStorage.removeItem("qms_accent");
    setUser(null);
    window.location.href = "/login";
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

  const updateThemePreferences = async (themeMode: string, themeAccent: string) => {
    const formData = new FormData();
    formData.append("themeMode", themeMode);
    formData.append("themeAccent", themeAccent);
    const { data } = await axios.patch("/auth/me", formData);
    if (!data.success) {
      throw new Error(data.message || "Failed to update theme preferences");
    }
    setUser((prev) => prev ? { ...prev, themeMode, themeAccent } : prev);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, mustReset, completeReset, updateProfile, updateThemePreferences }}
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
