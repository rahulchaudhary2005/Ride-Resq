import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { useAuth } from "../../store/authStore";

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert("Login failed", err?.response?.data?.message ?? "Please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RoadGuard Partner</Text>
      <Text style={styles.subtitle}>Accept jobs. Earn on your schedule.</Text>

      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address"
        value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry
        value={password} onChangeText={setPassword} />

      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Signing in..." : "Sign In"}</Text>
      </Pressable>
      <Text style={styles.note}>New partners are onboarded by the RoadGuard team.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#0F172A" },
  title: { fontSize: 28, fontWeight: "700", color: "#fff", marginBottom: 4 },
  subtitle: { color: "#94A3B8", marginBottom: 32 },
  input: { backgroundColor: "#1E293B", color: "#fff", borderRadius: 12, padding: 14, marginBottom: 12 },
  button: { backgroundColor: "#2563EB", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  note: { color: "#64748B", textAlign: "center", marginTop: 24, fontSize: 12 },
});
