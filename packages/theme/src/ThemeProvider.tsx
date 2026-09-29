import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";
import { Appearance } from "react-native";
import {
  darkTheme,
  lightTheme,
  RoadGuardTheme,
  ThemeMode,
} from "./tokens";

interface ThemeContextValue {
  theme: RoadGuardTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const systemScheme = Appearance.getColorScheme();

    // RoadGuard defaults to dark mode.
    // If the device explicitly uses light mode, use light mode.
    return systemScheme === "light" ? "light" : "dark";
  });

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: mode === "dark" ? darkTheme : lightTheme,
      mode,
      setMode,
      toggle: () => {
        setMode((currentMode) =>
          currentMode === "dark" ? "light" : "dark"
        );
      },
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error(
      "useTheme() must be used inside a <ThemeProvider>"
    );
  }

  return context;
}