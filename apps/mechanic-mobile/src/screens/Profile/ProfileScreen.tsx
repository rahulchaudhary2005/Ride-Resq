import { useEffect, useState } from "react";
import { Alert, View, Text, Pressable, StyleSheet } from "react-native";
import { api } from "../../services/api";
import { useAuth } from "../../store/authStore";
import type { ServiceCategory } from "@roadguard/shared-types";

const categories: ServiceCategory[] = [
  "TOWING", "FLAT_TIRE", "BATTERY_JUMP", "FUEL_DELIVERY",
  "LOCKOUT", "MECHANICAL_REPAIR", "WINCHING", "EV_CHARGING",
];

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<ServiceCategory[]>([]);
  const [savingCategories, setSavingCategories] = useState(false);

  useEffect(() => {
    api.get("/mechanics/me").then(({ data }) => {
      setSelectedCategories(data.data.serviceCategories ?? []);
    }).catch(() => undefined);
  }, []);

  function toggleCategory(category: ServiceCategory) {
    setSelectedCategories((current) => current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category]);
  }

  async function saveCategories() {
    setSavingCategories(true);
    try {
      await api.patch("/mechanics/me/categories", { categories: selectedCategories });
      Alert.alert("Services updated", "Dispatch will match requests to these services.");
    } catch (error: any) {
      Alert.alert("Could not save services", error?.response?.data?.message ?? "Please try again.");
    } finally {
      setSavingCategories(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.fullName?.[0] ?? "?"}</Text>
      </View>
      <Text style={styles.name}>{user?.fullName}</Text>
      <Text style={styles.detail}>{user?.email}</Text>
      <Text style={styles.detail}>{user?.phone}</Text>
      <Text style={styles.sectionTitle}>Services you provide</Text>
      <View style={styles.categoryGrid}>
        {categories.map((category) => {
          const selected = selectedCategories.includes(category);
          return (
            <Pressable key={category} style={[styles.categoryButton, selected && styles.categorySelected]} onPress={() => toggleCategory(category)}>
              <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{category.replaceAll("_", " ")}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable style={styles.saveButton} onPress={saveCategories} disabled={savingCategories || selectedCategories.length === 0}>
        <Text style={styles.saveText}>{savingCategories ? "Saving…" : "Save service area"}</Text>
      </Pressable>
      <Text style={styles.hint}>New mechanic accounts remain unavailable to customers until RoadGuard approves their documents.</Text>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", alignItems: "center", paddingTop: 45, paddingHorizontal: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "#2563EB",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "700" },
  name: { color: "#fff", fontSize: 20, fontWeight: "700" },
  detail: { color: "#94A3B8", marginTop: 4 },
  sectionTitle: { color: "#fff", fontSize: 15, fontWeight: "700", alignSelf: "flex-start", marginTop: 28, marginBottom: 10 },
  categoryGrid: { width: "100%", flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryButton: { width: "48%", borderWidth: 1, borderColor: "#33423A", borderRadius: 6, padding: 10 },
  categorySelected: { backgroundColor: "#1F513B", borderColor: "#58A47D" },
  categoryText: { color: "#B3C0B7", fontSize: 11, fontWeight: "700" },
  categoryTextSelected: { color: "#fff" },
  saveButton: { width: "100%", backgroundColor: "#237A57", borderRadius: 6, padding: 13, alignItems: "center", marginTop: 12 },
  saveText: { color: "#fff", fontWeight: "800" },
  hint: { color: "#64748B", fontSize: 12, textAlign: "center", marginTop: 24 },
  logoutButton: { marginTop: 40, backgroundColor: "#1E293B", padding: 14, borderRadius: 12, width: "80%", alignItems: "center" },
  logoutText: { color: "#EF4444", fontWeight: "600" },
});
