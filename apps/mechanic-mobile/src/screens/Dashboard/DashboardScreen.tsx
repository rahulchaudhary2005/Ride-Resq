import { useEffect, useRef, useState } from "react";
import { View, Text, Switch, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import * as Location from "expo-location";
import { api } from "../../services/api";
import { getSocket } from "../../services/socket";
import type { ServiceRequest } from "@roadguard/shared-types";
import { useTheme, RoadGuardTheme, RoadBackground } from "@roadguard/theme";

export function DashboardScreen({ navigation }: any) {
  const [isOnline, setIsOnline] = useState(false);
  const [incoming, setIncoming] = useState<ServiceRequest[]>([]);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  useEffect(() => {
    let socketRef: any;

    (async () => {
      const socket = await getSocket();
      socketRef = socket;
      socket.on("request:new", (req: ServiceRequest) => {
        setIncoming((prev) => (prev.find((r) => r.id === req.id) ? prev : [req, ...prev]));
      });
    })();

    return () => {
      socketRef?.off("request:new");
      locationSubRef.current?.remove();
      locationSubRef.current = null;
    };
  }, []);

  async function toggleOnline(value: boolean) {
    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      await api.patch("/mechanics/me/availability", {
        isOnline: true,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });

      // Stream location updates every 5s while online (foreground). For background
      // tracking use expo-location's startLocationUpdatesAsync + TaskManager.
      locationSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 20 },
        async (pos) => {
          await api.patch("/mechanics/me/availability", {
            isOnline: true,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        }
      );
    } else {
      locationSubRef.current?.remove();
      locationSubRef.current = null;
      await api.patch("/mechanics/me/availability", { isOnline: false });
    }
    setIsOnline(value);
  }

  async function acceptRequest(id: string) {
    try {
      await api.patch(`/requests/${id}/status`, { status: "ACCEPTED" });
      setIncoming((prev) => prev.filter((r) => r.id !== id));
      navigation.navigate("ActiveJob", { requestId: id });
    } catch (err: any) {
      Alert.alert("Could not accept", err?.response?.data?.message ?? "Someone else may have taken it");
      setIncoming((prev) => prev.filter((r) => r.id !== id));
    }
  }

  return (
    <RoadBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <View style={styles.toggleRow}>
            {/* Online = beacon amber, same signal color as a PENDING job elsewhere in the app */}
            <View style={[styles.statusDot, { backgroundColor: isOnline ? theme.beacon : theme.textTertiary }]} />
            <Text style={styles.toggleLabel}>{isOnline ? "Online" : "Offline"}</Text>
            <Switch
              value={isOnline}
              onValueChange={toggleOnline}
              trackColor={{ false: theme.border, true: theme.beacon }}
              thumbColor={theme.bgElevated}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Incoming Requests</Text>
        <FlatList
          data={incoming}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.category}>{item.category.replace("_", " ")}</Text>
                <View style={styles.pendingBadge}>
                  <View style={styles.pendingDot} />
                  <Text style={styles.pendingBadgeText}>New</Text>
                </View>
              </View>
              <Text style={styles.address}>{item.pickupAddress}</Text>
              <Text style={styles.fare}>Est. ₹{item.estimatedFare}</Text>
              <Pressable style={styles.acceptButton} onPress={() => acceptRequest(item.id)}>
                <Text style={styles.acceptText}>Accept Job</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {isOnline ? "Waiting for requests nearby..." : "Go online to start receiving requests."}
            </Text>
          }
        />
      </View>
    </RoadBackground>
  );
}

function makeStyles(theme: RoadGuardTheme) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
    title: { color: theme.textPrimary, fontSize: 22, fontWeight: "700" },
    toggleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    toggleLabel: { color: theme.textSecondary },
    sectionTitle: { color: theme.textSecondary, paddingHorizontal: 20, fontWeight: "600" },
    card: {
      backgroundColor: theme.bgElevated,
      borderRadius: theme.radius.lg,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
      borderLeftWidth: 4,
      borderLeftColor: theme.beacon,
    },
    cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    category: { color: theme.textPrimary, fontWeight: "700", fontSize: 16 },
    pendingBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: `${theme.beacon}1F`,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.radius.pill,
    },
    pendingDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.beacon },
    pendingBadgeText: { color: theme.beacon, fontSize: 11, fontWeight: "600" },
    address: { color: theme.textSecondary, marginTop: 4 },
    fare: { color: theme.clear, marginTop: 4, fontWeight: "600" },
    acceptButton: {
      backgroundColor: theme.route,
      borderRadius: theme.radius.md,
      padding: 12,
      alignItems: "center",
      marginTop: 12,
    },
    acceptText: { color: "#fff", fontWeight: "600" },
    empty: { color: theme.textTertiary, textAlign: "center", marginTop: 40 },
  });
}
