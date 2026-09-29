import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { api } from "../../services/api";

export function EarningsScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    api.get("/mechanics/me").then(({ data }) => setProfile(data.data));
    api.get("/requests/mine").then(({ data }) =>
      setJobs(data.data.filter((r: any) => r.status === "COMPLETED"))
    );
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Earnings</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Wallet Balance</Text>
        <Text style={styles.summaryValue}>₹{profile?.walletBalance ?? "0.00"}</Text>
        <Text style={styles.summaryLabel}>Jobs Completed</Text>
        <Text style={styles.summarySub}>{profile?.totalJobsCompleted ?? 0}</Text>
        <Text style={styles.summaryLabel}>Rating</Text>
        <Text style={styles.summarySub}>⭐ {profile?.rating?.toFixed?.(1) ?? "-"}</Text>
      </View>

      <Text style={styles.sectionTitle}>Recent Completed Jobs</Text>
      <FlatList
        data={jobs}
        keyExtractor={(j) => j.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.jobRow}>
            <Text style={styles.jobCategory}>{item.category.replace("_", " ")}</Text>
            <Text style={styles.jobFare}>₹{item.finalFare ?? item.estimatedFare}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No completed jobs yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  title: { color: "#fff", fontSize: 22, fontWeight: "700", padding: 20 },
  summaryCard: { backgroundColor: "#1E293B", borderRadius: 16, padding: 20, marginHorizontal: 20 },
  summaryLabel: { color: "#94A3B8", marginTop: 8, fontSize: 12 },
  summaryValue: { color: "#4ADE80", fontSize: 28, fontWeight: "700" },
  summarySub: { color: "#fff", fontSize: 18, fontWeight: "600" },
  sectionTitle: { color: "#94A3B8", paddingHorizontal: 20, marginTop: 24, fontWeight: "600" },
  jobRow: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: "#1E293B", borderRadius: 12, padding: 14, marginBottom: 8,
  },
  jobCategory: { color: "#fff" },
  jobFare: { color: "#4ADE80", fontWeight: "600" },
  empty: { color: "#64748B", textAlign: "center", marginTop: 20 },
});
