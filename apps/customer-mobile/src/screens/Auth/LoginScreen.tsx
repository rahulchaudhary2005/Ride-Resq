import React, { useState } from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from "react-native";
import { useAuthStore } from "../../store/authStore";

export default function LoginScreen({ navigation }: any) {
  const { height, width } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showRequired, setShowRequired] = useState(false);
  const login = useAuthStore((s) => s.login);

  const onSubmit = async () => {
    setShowRequired(true);
    if (!email.trim() || !password) return;
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert("Login failed", err?.response?.data?.message ?? err?.message ?? "Please try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { minHeight: height }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <ImageBackground
            source={{ uri: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=85" }}
            style={[styles.hero, { height: Math.min(400, Math.max(220, height * 0.42)) }]}
            imageStyle={styles.heroImage}
          >
            <View style={styles.heroShade} />
            <Text style={styles.brand}>Road<Text style={styles.brandAccent}>Guard</Text></Text>
            <Text style={[styles.heroTitle, width < 360 && styles.heroTitleSmall]}>Help on the road.{"\n"}Anytime, anywhere.</Text>
            <Text style={styles.heroNote}>Verified mechanics. Clear pricing. A safer way forward.</Text>
            <View style={styles.bulletRow}><Text style={styles.bullet}>✓</Text><Text style={styles.bulletText}>Quick roadside assistance</Text></View>
            <View style={styles.bulletRow}><Text style={styles.bullet}>✓</Text><Text style={styles.bulletText}>Live mechanic tracking</Text></View>
          </ImageBackground>
          <View style={styles.formPanel}>
            <Text style={styles.formTitle}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue with RoadGuard.</Text>
            <Text style={styles.fieldLabel}>EMAIL ADDRESS <Text style={styles.requiredMark}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#8E9991"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            {showRequired && !email.trim() && <Text style={styles.fieldError}>Email is required.</Text>}
            <Text style={styles.fieldLabel}>PASSWORD <Text style={styles.requiredMark}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#8E9991"
              autoComplete="current-password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {showRequired && !password && <Text style={styles.fieldError}>Password is required.</Text>}
            <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={submitting}>
              <Text style={styles.buttonText}>{submitting ? "Signing in…" : "Log in"}</Text>
              <Text style={styles.buttonArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.link}>New to RoadGuard? <Text style={styles.linkAccent}>Create account</Text></Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7F5" },
  scrollContent: { flexGrow: 1, justifyContent: "center" },
  content: { flex: 1 },
  hero: { minHeight: 220, justifyContent: "flex-end", paddingHorizontal: 25, paddingBottom: 25, backgroundColor: "#173A4B" },
  heroImage: { resizeMode: "cover" },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,17,27,0.43)" },
  brand: { color: "#fff", fontSize: 20, fontWeight: "900", marginBottom: "auto", paddingTop: 54 },
  brandAccent: { color: "#F5BE3D" },
  heroTitle: { color: "#fff", fontSize: 30, lineHeight: 33, fontWeight: "900" },
  heroTitleSmall: { fontSize: 26, lineHeight: 29 },
  heroNote: { color: "#E1E9E4", fontSize: 12, marginTop: 8, marginBottom: 13 },
  bulletRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  bullet: { color: "#6EE2A9", fontSize: 13, fontWeight: "900" },
  bulletText: { color: "#F2F5F3", fontSize: 11, fontWeight: "600" },
  formPanel: { flexGrow: 1, marginTop: -10, paddingHorizontal: 24, paddingTop: 23, paddingBottom: 24, borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: "#F5F7F5" },
  formTitle: { color: "#1B2E24", fontSize: 22, fontWeight: "900" },
  subtitle: { fontSize: 12, color: "#78857D", marginBottom: 16, marginTop: 4 },
  fieldLabel: { color: "#53645A", fontSize: 9, fontWeight: "800", marginBottom: 5 },
  requiredMark: { color: "#C44737", fontWeight: "900" },
  fieldError: { color: "#B42318", fontSize: 12, marginTop: -8, marginBottom: 12 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 7,
    padding: 13,
    color: "#1B2E24",
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#DDE5DF",
  },
  button: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#F5BE3D", borderRadius: 7, paddingHorizontal: 16, height: 48, marginTop: 2 },
  buttonText: { color: "#203126", fontWeight: "900", fontSize: 14 },
  buttonArrow: { color: "#203126", fontSize: 19, fontWeight: "800" },
  link: { color: "#758279", textAlign: "center", marginTop: 16, fontSize: 11 },
  linkAccent: { color: "#24764F", fontWeight: "800" },
});
