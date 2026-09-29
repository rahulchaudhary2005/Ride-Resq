import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import * as Location from "expo-location";
import { api } from "../../services/api";
import { getSocket } from "../../services/socket";

const NEXT_STATUS: Record<string, string> = {
  ACCEPTED: "ARRIVED",
  ARRIVED: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
};

const ACTION_LABEL: Record<string, string> = {
  ACCEPTED: "I've Arrived",
  ARRIVED: "Start Job",
  IN_PROGRESS: "Mark Complete",
};

export function ActiveJobScreen({ route, navigation }: any) {
  const { requestId } = route.params;
  const [request, setRequest] = useState<any>(null);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    api.get(`/requests/${requestId}`).then(({ data }) => setRequest(data.data));
  }, [requestId]);

  useEffect(() => {
    if (!tracking) return;
    let sub: Location.LocationSubscription;
    (async () => {
      const socket = await getSocket();
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 15 },
        (pos) => {
          socket.emit("tracking:update", {
            requestId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            heading: pos.coords.heading ?? undefined,
          });
        }
      );
    })();
    return () => sub?.remove();
  }, [tracking, requestId]);

  async function advanceStatus() {
    if (!request) return;
    const next = NEXT_STATUS[request.status];
    if (!next) return;
    try {
      const { data } = await api.patch(`/requests/${requestId}/status`, { status: next });
      setRequest(data.data);
      if (next === "ACCEPTED" || next === "ARRIVED") setTracking(true);
      if (next === "COMPLETED") {
        setTracking(false);
        Alert.alert("Job complete", "Great work! Payment will be collected from the customer.");
        navigation.popToTop();
      }
    } catch (err: any) {
      Alert.alert("Update failed", err?.response?.data?.message ?? "Please try again");
    }
  }

  if (!request) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{request.category.replace("_", " ")}</Text>
      <Text style={styles.address}>{request.pickupAddress}</Text>
      <Text style={styles.status}>Status: {request.status.replace("_", " ")}</Text>

      <Pressable style={styles.chatButton} onPress={() => navigation.navigate("Chat", { requestId })}>
        <Text style={styles.chatText}>💬 Chat with customer</Text>
      </Pressable>

      {NEXT_STATUS[request.status] && (
        <Pressable style={styles.actionButton} onPress={advanceStatus}>
          <Text style={styles.actionText}>{ACTION_LABEL[request.status]}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", padding: 24 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  address: { color: "#94A3B8", marginTop: 6 },
  status: { color: "#60A5FA", marginTop: 10, fontWeight: "600" },
  chatButton: { backgroundColor: "#1E293B", borderRadius: 12, padding: 14, alignItems: "center", marginTop: 24 },
  chatText: { color: "#fff" },
  actionButton: { backgroundColor: "#2563EB", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 16 },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
