import React from "react";
import { ThemeProvider } from "@roadguard/theme";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}