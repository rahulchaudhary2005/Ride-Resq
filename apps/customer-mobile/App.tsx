import React from "react";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "@roadguard/theme";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <ThemeProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </ThemeProvider>
  );
}
