import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { ThemeProvider, useTheme } from "@roadguard/theme";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/store/authStore";

function ThemedStatusBar() {
  // Keep the OS status bar icons legible against night-dispatch vs day-ops backgrounds.
  const { mode } = useTheme();
  return <StatusBar style={mode === "dark" ? "light" : "dark"} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer>
          <ThemedStatusBar />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  );
}
