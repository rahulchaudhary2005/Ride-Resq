import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "@roadguard/theme";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/store/authStore";

function ThemedStatusBar() {
  return <StatusBar style="light" />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemedStatusBar />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
