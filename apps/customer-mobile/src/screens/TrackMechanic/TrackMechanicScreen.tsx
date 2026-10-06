import React, { useEffect, useState } from "react";
import { Alert, Linking, View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { connectSocket } from "../../services/socketClient";
import { apiClient } from "../../services/apiClient";
import type { ServiceRequest, TrackingPosition } from "@roadguard/shared-types";

type TrackedRequest = ServiceRequest & {
  mechanic?: {
    currentLat: number | null;
    currentLng: number | null;
    user: { fullName: string; phone: string; avatarUrl?: string | null };
  } | null;
};

/**
 * Subscribes to the "request:<id>" socket room for live mechanic position
 * updates (tracking:position) and status changes (request:status), mirroring
 * the backend's sockets/tracking.socket.ts + requests.service.ts broadcasts.
 */
export default function TrackMechanicScreen({ route, navigation }: any) {
  const { requestId } = route.params;
  const [request, setRequest] = useState<TrackedRequest | null>(null);
  const [mechanicPos, setMechanicPos] = useState<TrackingPosition | null>(null);
  const [revisedOffer, setRevisedOffer] = useState("");
  const [sendingOffer, setSendingOffer] = useState(false);

  useEffect(() => {
    let active = true;
    let socketRef: Awaited<ReturnType<typeof connectSocket>> | null = null;
    const onPosition = (pos: TrackingPosition) => {
      if (pos.requestId === requestId) setMechanicPos(pos);
    };
    const onStatus = (updated: ServiceRequest) => {
      if (updated.id !== requestId) return;
      setRequest((previous) => previous ? { ...previous, ...updated } : updated);
      void apiClient.get(`/requests/${requestId}`).then(({ data }) => {
        if (active) setRequest(data.data);
      }).catch(() => undefined);
    };
    const onOfferUpdate = (updated: ServiceRequest) => {
      if (updated.id === requestId) setRequest((previous) => previous ? { ...previous, ...updated } : updated);
    };
    const onConnect = () => {
      socketRef?.emit("tracking:subscribe", { requestId });
      void apiClient.get(`/requests/${requestId}`).then(({ data }) => {
        if (active) setRequest(data.data);
      }).catch(() => undefined);
    };

    (async () => {
      const { data } = await apiClient.get(`/requests/${requestId}`);
      if (active) setRequest(data.data);

      const socket = await connectSocket();
      socketRef = socket;
      socket.emit("tracking:subscribe", { requestId });
      socket.on("connect", onConnect);
      socket.on("tracking:position", onPosition);
      socket.on("request:status", onStatus);
      socket.on("request:offer_updated", onOfferUpdate);
      socket.on("request:offer_rejected", onOfferUpdate);
      socket.on("request:offer_accepted", onStatus);
    })();

    return () => {
      active = false;
      socketRef?.off("connect", onConnect);
      socketRef?.off("tracking:position", onPosition);
      socketRef?.off("request:status", onStatus);
      socketRef?.off("request:offer_updated", onOfferUpdate);
      socketRef?.off("request:offer_rejected", onOfferUpdate);
      socketRef?.off("request:offer_accepted", onStatus);
      socketRef?.emit("tracking:unsubscribe", { requestId });
    };
  }, [requestId]);

  if (!request) return <View style={styles.loading}><ActivityIndicator color="#24764F" /><Text style={styles.loadingText}>Connecting to your request…</Text></View>;

  const currentPosition = mechanicPos ?? (
    request.mechanic?.currentLat != null && request.mechanic.currentLng != null
      ? { lat: request.mechanic.currentLat, lng: request.mechanic.currentLng }
      : null
  );
  const distanceKm = currentPosition
    ? haversineDistanceKm(request.pickupLat, request.pickupLng, currentPosition.lat, currentPosition.lng)
    : null;

  async function callMechanic() {
    const phone = request?.mechanic?.user.phone;
    if (!phone) return;
    const url = `tel:${phone}`;
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
    else Alert.alert("Calling unavailable", "This device cannot place phone calls.");
  }

  async function sendRevisedOffer() {
    const amount = Number(revisedOffer);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert("Enter a valid offer", "The offer must be a positive amount.");
      return;
    }
    setSendingOffer(true);
    try {
      const { data } = await apiClient.post(`/requests/${requestId}/offer`, { amount });
      setRequest((previous) => previous ? { ...previous, ...data.data } : data.data);
      setRevisedOffer("");
    } catch (error: any) {
      Alert.alert("Offer not sent", error?.response?.data?.message ?? "Please try again.");
    } finally {
      setSendingOffer(false);
    }
  }

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        showsUserLocation
        showsMyLocationButton
        toolbarEnabled={false}
        initialRegion={{
          latitude: request.pickupLat,
          longitude: request.pickupLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={{ latitude: request.pickupLat, longitude: request.pickupLng }} title="Pickup" pinColor="#F59E0B" />
        {currentPosition && (
          <Marker
            coordinate={{ latitude: currentPosition.lat, longitude: currentPosition.lng }}
            title="Your mechanic"
            pinColor="#22C55E"
          />
        )}
      </MapView>

      <View style={styles.statusCard}>
        <View style={styles.sheetHandle} />
        <View style={styles.statusHeader}>
          <View><Text style={styles.statusLabel}>SERVICE STATUS</Text><Text style={styles.statusValue}>{request.status.replace("_", " ")}</Text></View>
          <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>{request.mechanic ? "LIVE" : "SEARCHING"}</Text></View>
        </View>
        <View style={styles.progressTrack}>
          {["PENDING", "ACCEPTED", "ARRIVED", "IN_PROGRESS", "COMPLETED"].map((status, index) => {
            const order = ["PENDING", "ACCEPTED", "ARRIVED", "IN_PROGRESS", "COMPLETED"].indexOf(request.status);
            return <View key={status} style={[styles.progressDot, index <= order && styles.progressDotActive]} />;
          })}
        </View>
        {request.status === "NO_MECHANIC_FOUND" && (
          <Text style={styles.distanceText}>No nearby mechanic is available right now. Your request needs to be submitted again when service becomes available.</Text>
        )}
        {request.fareMode === "CUSTOMER_OFFER" && (
          <Text style={styles.distanceText}>
            Offer: ₹{request.customerRequestedFare ?? request.agreedFare ?? request.estimatedFare}
            {request.fareOfferStatus ? ` · ${request.fareOfferStatus.toLowerCase()}` : ""}
          </Text>
        )}
        {request.status === "PENDING" && request.fareMode === "CUSTOMER_OFFER" && request.fareOfferStatus === "REJECTED" && (
          <View style={styles.offerRow}>
            <TextInput style={styles.offerInput} value={revisedOffer} onChangeText={setRevisedOffer} keyboardType="decimal-pad" placeholder="Revise your offer" placeholderTextColor="#AAB7AF" />
            <TouchableOpacity style={styles.offerButton} onPress={sendRevisedOffer} disabled={sendingOffer}>
              <Text style={styles.callButtonText}>{sendingOffer ? "Sending" : "Send"}</Text>
            </TouchableOpacity>
          </View>
        )}
        {request.mechanic && (
          <>
            <View style={styles.mechanicRow}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{request.mechanic.user.fullName.slice(0, 1).toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}><Text style={styles.mechanicName}>{request.mechanic.user.fullName}</Text><Text style={styles.distanceText}>{distanceKm === null ? "Waiting for mechanic location" : `${distanceKm.toFixed(1)} km from pickup`}</Text></View>
              <TouchableOpacity style={styles.callIcon} onPress={callMechanic}><Text style={styles.actionGlyph}>☎</Text></TouchableOpacity>
              <TouchableOpacity style={styles.messageIcon} onPress={() => navigation.navigate("Chat", { requestId })}><Text style={styles.actionGlyph}>▣</Text></TouchableOpacity>
            </View>
          </>
        )}
        <TouchableOpacity
          style={[styles.chatButton, !request.mechanic && styles.disabledButton]}
          disabled={!request.mechanic}
          onPress={() => navigation.navigate("Chat", { requestId })}
        >
          <Text style={styles.chatButtonText}>{request.mechanic ? "Message mechanic" : "Chat unavailable until accepted"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E7ECE8" },
  loading: { flex: 1, backgroundColor: "#F5F7F5", alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: "#63736A", fontSize: 12, fontWeight: "700" },
  statusCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 18,
    paddingBottom: 27,
    borderWidth: 1,
    borderColor: "#E1E7E2",
  },
  sheetHandle: { width: 38, height: 4, borderRadius: 3, backgroundColor: "#D9E0DB", alignSelf: "center", marginBottom: 15 },
  statusHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusLabel: { color: "#75847A", fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  statusValue: { color: "#1D3226", fontSize: 19, fontWeight: "900", marginTop: 4, marginBottom: 2, textTransform: "capitalize" },
  livePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#E8F4EC", borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#2A9A60" },
  liveText: { color: "#28764E", fontSize: 8, fontWeight: "900" },
  progressTrack: { height: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 7 },
  progressDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#DDE4DF" },
  progressDotActive: { backgroundColor: "#2B9A60" },
  mechanicRow: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: "#E9EEEA", paddingTop: 12, marginTop: 7 },
  avatar: { width: 39, height: 39, borderRadius: 20, backgroundColor: "#DFECE2", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#26764E", fontWeight: "900", fontSize: 16 },
  mechanicName: { color: "#20352A", fontSize: 13, fontWeight: "800", marginBottom: 3 },
  distanceText: { color: "#78877D", fontSize: 10, marginBottom: 6 },
  callIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#E7F1E9", alignItems: "center", justifyContent: "center" },
  messageIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFF3D8", alignItems: "center", justifyContent: "center" },
  actionGlyph: { color: "#286E4A", fontSize: 15, fontWeight: "800" },
  offerRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  offerInput: { flex: 1, backgroundColor: "#25342B", color: "#fff", borderRadius: 6, paddingHorizontal: 10 },
  offerButton: { backgroundColor: "#237A57", borderRadius: 6, justifyContent: "center", paddingHorizontal: 16 },
  callButton: { backgroundColor: "#237A57", borderRadius: 10, padding: 12, alignItems: "center", marginBottom: 8 },
  callButtonText: { color: "#fff", fontWeight: "700" },
  chatButton: { backgroundColor: "#F5BE3D", borderRadius: 7, padding: 12, alignItems: "center", marginTop: 8 },
  disabledButton: { opacity: 0.5 },
  chatButtonText: { color: "#203126", fontWeight: "900", fontSize: 12 },
});

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDifference = toRadians(lat2 - lat1);
  const longitudeDifference = toRadians(lng2 - lng1);
  const value = Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(longitudeDifference / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
