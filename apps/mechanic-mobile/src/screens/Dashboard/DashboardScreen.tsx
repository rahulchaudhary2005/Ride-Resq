import { useEffect, useRef, useState } from "react";
import { View, Text, Switch, StyleSheet, FlatList, Pressable, Alert, ScrollView } from "react-native";
import * as Location from "expo-location";
import { api } from "../../services/api";
import { getSocket } from "../../services/socket";
import type { ServiceRequest } from "@roadguard/shared-types";
import { useTheme, RoadGuardTheme, RoadBackground } from "@roadguard/theme";

export function DashboardScreen({ navigation }: any) {
  const [isOnline, setIsOnline] = useState(false);
  const [incoming, setIncoming] = useState<ServiceRequest[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  useEffect(() => {
    api.get("/mechanics/me").then(({ data }) => setProfile(data.data)).catch(() => undefined);
  }, []);

  async function refreshIncoming() {
    try {
      const { data } = await api.get("/requests/available");
      setIncoming(data.data);
    } catch {
      // The socket notification remains available if a refresh is temporarily offline.
    }
  }

  useEffect(() => {
    let socketRef: any;
    let refreshTimer: ReturnType<typeof setInterval>;
    const onConnect = () => { void refreshIncoming(); };
    const onRequest = (req: ServiceRequest) => {
      setIncoming((prev) => (prev.find((r) => r.id === req.id) ? prev : [req, ...prev]));
      void refreshIncoming();
    };

    (async () => {
      const socket = await getSocket();
      socketRef = socket;
      socket.on("connect", onConnect);
      socket.on("request:new", onRequest);
      await refreshIncoming();
      refreshTimer = setInterval(() => { void refreshIncoming(); }, 20000);
    })();

    return () => {
      socketRef?.off("connect", onConnect);
      socketRef?.off("request:new", onRequest);
      if (refreshTimer) clearInterval(refreshTimer);
      locationSubRef.current?.remove();
      locationSubRef.current = null;
    };
  }, []);

  async function toggleOnline(value: boolean) {
    try {
      if (value) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Location required", "Allow location access to receive nearby requests.");
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        await api.patch("/mechanics/me/availability", {
          isOnline: true,
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });

        locationSubRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 20 },
          async (pos) => {
            await api.patch("/mechanics/me/availability", {
              isOnline: true,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }).catch(() => undefined);
          }
        );
        await refreshIncoming();
      } else {
        locationSubRef.current?.remove();
        locationSubRef.current = null;
        await api.patch("/mechanics/me/availability", { isOnline: false });
      }
      setIsOnline(value);
    } catch (error: any) {
      Alert.alert("Availability not changed", error?.response?.data?.message ?? "Please try again.");
    }
  }

  async function acceptRequest(id: string) {
    try {
      const request = incoming.find((item) => item.id === id);
      if (request?.fareMode === "CUSTOMER_OFFER") {
        await api.post(`/requests/${id}/offer/accept`);
      } else {
        await api.patch(`/requests/${id}/status`, { status: "ACCEPTED" });
      }
      setIncoming((prev) => prev.filter((r) => r.id !== id));
      navigation.navigate("ActiveJob", { requestId: id });
    } catch (err: any) {
      Alert.alert("Could not accept", err?.response?.data?.message ?? "Someone else may have taken it");
      setIncoming((prev) => prev.filter((r) => r.id !== id));
    }
  }

  async function rejectOffer(id: string) {
    try {
      await api.post(`/requests/${id}/offer/reject`);
      setIncoming((prev) => prev.filter((request) => request.id !== id));
    } catch (err: any) {
      Alert.alert("Could not decline offer", err?.response?.data?.message ?? "Please refresh and try again.");
      await refreshIncoming();
    }
  }

  return (
    <RoadBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>ROADGUARD PARTNER</Text><Text style={styles.title}>Good morning,</Text><Text style={styles.name}>{profile?.user?.fullName?.split(" ")[0] ?? "Mechanic"} 👋</Text></View>
          <Pressable style={styles.avatar} onPress={() => navigation.navigate("Profile")}><Text style={styles.avatarText}>{profile?.user?.fullName?.[0] ?? "M"}</Text></Pressable>
        </View>
        <View style={styles.onlinePanel}>
          <View style={styles.onlineCopy}><View style={[styles.statusDot, { backgroundColor: isOnline ? "#20A464" : "#99A59C" }]} /><View><Text style={styles.onlineTitle}>{isOnline ? "You're online" : "You're offline"}</Text><Text style={styles.onlineHint}>{isOnline ? "Ready to receive nearby jobs" : "Go online to see nearby jobs"}</Text></View></View>
          <View style={styles.toggleRow}>
            <Switch
              value={isOnline}
              onValueChange={toggleOnline}
              trackColor={{ false: theme.border, true: theme.beacon }}
              thumbColor={theme.bgElevated}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statLabel}>TODAY'S JOBS</Text><Text style={styles.statValue}>{incoming.length}</Text><Text style={styles.statHint}>Available nearby</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>WALLET BALANCE</Text><Text style={styles.statValue}>₹{Number(profile?.walletBalance ?? 0).toLocaleString("en-IN")}</Text><Text style={styles.statHint}>See earnings →</Text></View>
        </View>

        <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>New requests</Text><Text style={styles.sectionHint}>Jobs that match your service area</Text></View><Text style={styles.requestCount}>{incoming.length} NEW</Text></View>
        <FlatList
          scrollEnabled={false}
          data={incoming}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.category}>{item.category.replace("_", " ")}</Text>
                <View style={styles.pendingBadge}><View style={styles.pendingDot} /><Text style={styles.pendingBadgeText}>NEW</Text></View>
              </View>
              <Text style={styles.address}>{item.pickupAddress}</Text>
              <Text style={styles.address}>
                {(item as any).customer?.fullName ?? "Customer"}
              </Text>
              <Text style={styles.fare}>
                {item.fareMode === "CUSTOMER_OFFER" && item.customerRequestedFare != null
                  ? `Customer offer ₹${item.customerRequestedFare}`
                  : `Est. ₹${item.estimatedFare}`}
                {typeof (item as any).distanceToPickupKm === "number"
                  ? ` · ${(item as any).distanceToPickupKm} km away`
                  : ""}
              </Text>
              <View style={styles.actionRow}>
                {item.fareMode === "CUSTOMER_OFFER" && <Pressable style={styles.declineButton} onPress={() => rejectOffer(item.id)}><Text style={styles.declineText}>Decline</Text></Pressable>}
                <Pressable style={styles.acceptButton} onPress={() => acceptRequest(item.id)}><Text style={styles.acceptText}>{item.fareMode === "CUSTOMER_OFFER" ? "Accept offer" : "Accept request"}</Text></Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {isOnline ? "Waiting for requests nearby..." : "Go online to start receiving requests."}
            </Text>
          }
        />
      </ScrollView>
    </RoadBackground>
  );
}

function makeStyles(theme: RoadGuardTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F2F6F2" },
    content: { padding: 16, paddingBottom: 32 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 11, paddingBottom: 15 },
    eyebrow: { color: "#438164", fontSize: 9, fontWeight: "900", letterSpacing: 0.8, marginBottom: 5 },
    title: { color: "#1D382A", fontSize: 20, fontWeight: "700" },
    name: { color: "#1D382A", fontSize: 24, fontWeight: "900", marginTop: 1 },
    avatar: { width: 43, height: 43, borderRadius: 22, backgroundColor: "#DCEBE0", borderWidth: 2, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
    avatarText: { color: "#276B49", fontSize: 17, fontWeight: "900" },
    onlinePanel: { minHeight: 68, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 13, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E0E9E2" },
    onlineCopy: { flexDirection: "row", alignItems: "center", gap: 9 },
    onlineTitle: { color: "#253A2D", fontSize: 12, fontWeight: "900" },
    onlineHint: { color: "#839088", fontSize: 9, marginTop: 3 },
    toggleRow: { flexDirection: "row", alignItems: "center" },
    statusDot: { width: 9, height: 9, borderRadius: 5 },
    statsRow: { flexDirection: "row", gap: 9, marginTop: 10 },
    statCard: { flex: 1, minHeight: 91, backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#E0E9E2", padding: 12 },
    statLabel: { color: "#829087", fontSize: 8, fontWeight: "900", letterSpacing: 0.4 },
    statValue: { color: "#203A2B", fontSize: 22, fontWeight: "900", marginTop: 8 },
    statHint: { color: "#86938A", fontSize: 9, marginTop: 3 },
    sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 21, paddingHorizontal: 1 },
    sectionTitle: { color: "#20382B", fontSize: 17, fontWeight: "900" },
    sectionHint: { color: "#829087", fontSize: 9, marginTop: 3 },
    requestCount: { color: "#318056", fontSize: 8, fontWeight: "900" },
    card: {
      backgroundColor: "#fff",
      borderRadius: 8,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: "#E0E9E2",
      borderLeftWidth: 4,
      borderLeftColor: "#F0B938",
    },
    cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    category: { color: theme.textPrimary, fontWeight: "700", fontSize: 16 },
    pendingBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "#FFF3D6",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 30,
    },
    pendingDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#D99C16" },
    pendingBadgeText: { color: "#A77613", fontSize: 8, fontWeight: "900" },
    address: { color: "#6C7B71", marginTop: 4, fontSize: 10 },
    fare: { color: "#28734D", marginTop: 6, fontWeight: "900", fontSize: 12 },
    actionRow: { flexDirection: "row", gap: 8 },
    acceptButton: {
      flex: 1,
      backgroundColor: "#27905B",
      borderRadius: 6,
      padding: 12,
      alignItems: "center",
      marginTop: 12,
    },
    acceptText: { color: "#fff", fontWeight: "900", fontSize: 12, textAlign: "center" },
    declineButton: { width: 100, borderWidth: 1, borderColor: "#DCE5DE", borderRadius: 6, padding: 11, alignItems: "center" },
    declineText: { color: "#66756B", fontWeight: "800", fontSize: 11 },
    empty: { color: "#87948B", textAlign: "center", marginTop: 34, paddingHorizontal: 20, fontSize: 11 },
  });
}
