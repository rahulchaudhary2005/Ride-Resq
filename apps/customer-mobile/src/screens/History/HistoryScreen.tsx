import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { apiClient } from "../../services/apiClient";
import type { ServiceRequest } from "@roadguard/shared-types";

export default function HistoryScreen() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await apiClient.get("/requests/mine");
    setRequests(data.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Request History</Text>
      <FlatList
        data={requests}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.category}>{item.category.replace("_", " ")}</Text>
            <Text style={styles.status}>{item.status.replace("_", " ")}</Text>
            <Text style={styles.fare}>₹{item.finalFare ?? item.estimatedFare ?? "-"}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No requests yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  title: { color: "#fff", fontSize: 22, fontWeight: "700", padding: 20, paddingBottom: 0 },
  card: { backgroundColor: "#1E293B", borderRadius: 14, padding: 16, marginBottom: 10 },
  category: { color: "#fff", fontWeight: "600", fontSize: 16 },
  status: { color: "#94A3B8", marginTop: 4 },
  fare: { color: "#4ADE80", marginTop: 4, fontWeight: "600" },
  empty: { color: "#64748B", textAlign: "center", marginTop: 40 },
});
