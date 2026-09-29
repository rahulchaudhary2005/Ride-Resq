import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAuth } from "../../store/authStore";

export function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.fullName?.[0] ?? "?"}</Text>
      </View>
      <Text style={styles.name}>{user?.fullName}</Text>
      <Text style={styles.detail}>{user?.email}</Text>
      <Text style={styles.detail}>{user?.phone}</Text>
      <Text style={styles.hint}>
        Verification documents (license, vehicle, insurance) are submitted via
        POST /mechanics/me/verification — wire this to an upload screen using the
        pre-signed S3 URL flow from the backend's storage service.
      </Text>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", alignItems: "center", paddingTop: 60, paddingHorizontal: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "#2563EB",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "700" },
  name: { color: "#fff", fontSize: 20, fontWeight: "700" },
  detail: { color: "#94A3B8", marginTop: 4 },
  hint: { color: "#64748B", fontSize: 12, textAlign: "center", marginTop: 24 },
  logoutButton: { marginTop: 40, backgroundColor: "#1E293B", padding: 14, borderRadius: 12, width: "80%", alignItems: "center" },
  logoutText: { color: "#EF4444", fontWeight: "600" },
});
