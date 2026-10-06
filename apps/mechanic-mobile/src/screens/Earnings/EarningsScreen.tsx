import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { api } from "../../services/api";

export function EarningsScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const [profileResponse, requestsResponse] = await Promise.all([
      api.get("/mechanics/me"),
      api.get("/requests/mine"),
    ]);
    setProfile(profileResponse.data.data);
    setJobs(requestsResponse.data.data.filter((request: any) => request.status === "COMPLETED"));
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>PARTNER OVERVIEW</Text>
      <Text style={styles.title}>Your earnings</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>WALLET BALANCE</Text>
        <Text style={styles.summaryValue}>₹{profile?.walletBalance ?? "0.00"}</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metric}><Text style={styles.summaryLabel}>JOBS COMPLETED</Text><Text style={styles.summarySub}>{profile?.totalJobsCompleted ?? 0}</Text></View>
          <View style={styles.metric}><Text style={styles.summaryLabel}>CUSTOMER RATING</Text><Text style={styles.summarySub}>★ {profile?.rating?.toFixed?.(1) ?? "-"}</Text></View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent completed jobs</Text>
      <FlatList
        data={jobs}
        keyExtractor={(j) => j.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load().finally(() => setRefreshing(false)); }} tintColor="#278151" />}
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
  container: { flex: 1, backgroundColor: "#F2F6F2", paddingTop: 16 },
  eyebrow: { color: "#58806A", fontSize: 8, fontWeight: "900", letterSpacing: 0.8, paddingHorizontal: 18 },
  title: { color: "#1E382A", fontSize: 21, fontWeight: "900", paddingHorizontal: 18, paddingTop: 4, paddingBottom: 14 },
  summaryCard: { backgroundColor: "#fff", borderRadius: 9, padding: 17, marginHorizontal: 16, borderWidth: 1, borderColor: "#E0E9E2" },
  summaryLabel: { color: "#839087", marginTop: 4, fontSize: 8, fontWeight: "900", letterSpacing: 0.4 },
  summaryValue: { color: "#278151", fontSize: 29, fontWeight: "900", marginTop: 4 },
  metricsRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#E8EEE9", marginTop: 15, paddingTop: 11 },
  metric: { flex: 1 },
  summarySub: { color: "#263B2E", fontSize: 16, fontWeight: "900", marginTop: 5 },
  sectionTitle: { color: "#263B2E", paddingHorizontal: 18, marginTop: 22, fontSize: 14, fontWeight: "900" },
  jobRow: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: "#fff", borderRadius: 7, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#E0E9E2",
  },
  jobCategory: { color: "#304337", fontWeight: "700" },
  jobFare: { color: "#278151", fontWeight: "900" },
  empty: { color: "#849188", textAlign: "center", marginTop: 20, fontSize: 11 },
});
