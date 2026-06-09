import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type Accent = "blue" | "teal" | "purple" | "green" | "orange" | "rose";

interface ThemeCtx {
  mode: ThemeMode;
  accent: Accent;
  resolvedDark: boolean;
  setMode: (m: ThemeMode) => void;
  setAccent: (a: Accent) => void;
  previewMode: (m: ThemeMode) => void;
  previewAccent: (a: Accent) => void;
  reset: () => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

export const ACCENTS: { value: Accent; label: string; hsl: string }[] = [
  { value: "blue", label: "Blue", hsl: "217 91% 55%" },
  { value: "teal", label: "Teal", hsl: "174 72% 40%" },
  { value: "purple", label: "Purple", hsl: "262 73% 58%" },
  { value: "green", label: "Green", hsl: "142 71% 40%" },
  { value: "orange", label: "Orange", hsl: "24 95% 53%" },
  { value: "rose", label: "Rose", hsl: "346 77% 50%" },
];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => (localStorage.getItem("qms_mode") as ThemeMode) || "system");
  const [accent, setAccentState] = useState<Accent>(() => (localStorage.getItem("qms_accent") as Accent) || "blue");
  const [resolvedDark, setResolvedDark] = useState(false);

  useEffect(() => {
    const apply = () => {
      const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const dark = mode === "dark" || (mode === "system" && sysDark);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.setAttribute("data-accent", accent);
      setResolvedDark(dark);
    };
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [mode, accent]);

  const setMode = (m: ThemeMode) => { setModeState(m); localStorage.setItem("qms_mode", m); };
  const setAccent = (a: Accent) => { setAccentState(a); localStorage.setItem("qms_accent", a); };
  const previewMode = (m: ThemeMode) => { setModeState(m); };
  const previewAccent = (a: Accent) => { setAccentState(a); };
  const reset = () => { setMode("system"); setAccent("blue"); };

  return <ThemeContext.Provider value={{ mode, accent, resolvedDark, setMode, setAccent, previewMode, previewAccent, reset }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
};
