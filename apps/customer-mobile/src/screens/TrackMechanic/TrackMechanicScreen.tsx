import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { connectSocket } from "../../services/socketClient";
import { apiClient } from "../../services/apiClient";
import type { ServiceRequest, TrackingPosition } from "@roadguard/shared-types";

/**
 * Subscribes to the "request:<id>" socket room for live mechanic position
 * updates (tracking:position) and status changes (request:status), mirroring
 * the backend's sockets/tracking.socket.ts + requests.service.ts broadcasts.
 */
export default function TrackMechanicScreen({ route, navigation }: any) {
  const { requestId } = route.params;
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [mechanicPos, setMechanicPos] = useState<TrackingPosition | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const { data } = await apiClient.get(`/requests/${requestId}`);
      if (active) setRequest(data.data);

      const socket = await connectSocket();
      socket.emit("tracking:subscribe", { requestId });

      socket.on("tracking:position", (pos: TrackingPosition) => {
        if (pos.requestId === requestId) setMechanicPos(pos);
      });

      socket.on("request:status", (updated: ServiceRequest) => {
        if (updated.id === requestId) setRequest(updated);
      });
    })();

    return () => {
      active = false;
    };
  }, [requestId]);

  if (!request) return null;

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: request.pickupLat,
          longitude: request.pickupLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={{ latitude: request.pickupLat, longitude: request.pickupLng }} title="Pickup" pinColor="#F59E0B" />
        {mechanicPos && (
          <Marker
            coordinate={{ latitude: mechanicPos.lat, longitude: mechanicPos.lng }}
            title="Your mechanic"
            pinColor="#22C55E"
          />
        )}
      </MapView>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Status</Text>
        <Text style={styles.statusValue}>{request.status.replace("_", " ")}</Text>
        <TouchableOpacity style={styles.chatButton} onPress={() => navigation.navigate("Chat", { requestId })}>
          <Text style={styles.chatButtonText}>Message mechanic</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statusCard: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  statusLabel: { color: "#9CA3AF", fontSize: 12 },
  statusValue: { color: "#fff", fontSize: 20, fontWeight: "700", marginTop: 2, marginBottom: 12, textTransform: "capitalize" },
  chatButton: { backgroundColor: "#F59E0B", borderRadius: 10, padding: 12, alignItems: "center" },
  chatButtonText: { color: "#0B1220", fontWeight: "700" },
});
