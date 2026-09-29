"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "roadguard-admin-theme";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default to dark ("night dispatch") — most breakdown jobs are logged
  // after dark, so that's the console's native state, not a preference.
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Avoid a flash of the wrong theme on first paint
  if (!mounted) return <div style={{ visibility: "hidden" }}>{children}</div>;

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="btn-ghost w-full justify-start"
      aria-label={`Switch to ${theme === "dark" ? "day ops (light)" : "night dispatch (dark)"} mode`}
    >
      <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
      {theme === "dark" ? "Day ops" : "Night dispatch"}
    </button>
  );
}
