import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuthStore } from "../../store/authStore";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const login = useAuthStore((s) => s.login);

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert("Login failed", err?.response?.data?.message ?? "Please try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RoadGuard</Text>
      <Text style={styles.subtitle}>Roadside help, minutes away.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? "Logging in..." : "Log In"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#0B1220" },
  title: { fontSize: 32, fontWeight: "700", color: "#fff", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#9CA3AF", marginBottom: 32 },
  input: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  button: { backgroundColor: "#F59E0B", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#0B1220", fontWeight: "700", fontSize: 16 },
  link: { color: "#9CA3AF", textAlign: "center", marginTop: 20 },
});
