import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAuthStore } from "../../store/authStore";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.fullName?.[0] ?? "?"}</Text>
      </View>
      <Text style={styles.name}>{user?.fullName}</Text>
      <Text style={styles.detail}>{user?.email}</Text>
      <Text style={styles.detail}>{user?.phone}</Text>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", alignItems: "center", paddingTop: 60 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "#EF4444",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "700" },
  name: { color: "#fff", fontSize: 20, fontWeight: "700" },
  detail: { color: "#94A3B8", marginTop: 4 },
  logoutButton: { marginTop: 40, backgroundColor: "#1E293B", padding: 14, borderRadius: 12, width: "80%", alignItems: "center" },
  logoutText: { color: "#EF4444", fontWeight: "600" },
});
