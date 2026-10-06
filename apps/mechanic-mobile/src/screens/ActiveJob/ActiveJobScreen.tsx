import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { api } from "../../services/api";
import { getSocket } from "../../services/socket";

const NEXT_STATUS: Record<string, string> = { ACCEPTED: "ARRIVED", ARRIVED: "IN_PROGRESS", IN_PROGRESS: "COMPLETED" };
const ACTION_LABEL: Record<string, string> = { ACCEPTED: "I've arrived", ARRIVED: "Start service", IN_PROGRESS: "Complete service" };

export function ActiveJobScreen({ route, navigation }: any) {
    const { requestId } = route.params;
    const [request, setRequest] = useState<any>(null);
    const [tracking, setTracking] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        api.get(`/requests/${requestId}`).then(({ data }) => {
            setRequest(data.data);
            if (["ACCEPTED", "ARRIVED", "IN_PROGRESS"].includes(data.data.status)) setTracking(true);
        }).catch((error) => Alert.alert("Job unavailable", error?.response?.data?.message ?? "Unable to load this job."));
    }, [requestId]);

    useEffect(() => {
        if (!tracking) return;
        let subscription: Location.LocationSubscription | undefined;
        let active = true;
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") return;
                const socket = await getSocket();
                subscription = await Location.watchPositionAsync(
                    { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 15 },
                    (position) => socket.emit("tracking:update", { requestId, lat: position.coords.latitude, lng: position.coords.longitude, heading: position.coords.heading ?? undefined }),
                );
                if (!active) subscription.remove();
            } catch {
                if (active) Alert.alert("Location unavailable", "Allow location access to share your route with the customer.");
            }
        })();
        return () => { active = false; subscription?.remove(); };
    }, [tracking, requestId]);

    async function advanceStatus() {
        if (!request) return;
        const next = NEXT_STATUS[request.status];
        if (!next) return;
        setUpdating(true);
        try {
            const { data } = await api.patch(`/requests/${requestId}/status`, { status: next });
            setRequest(data.data);
            if (next === "ARRIVED" || next === "IN_PROGRESS") setTracking(true);
            if (next === "COMPLETED") {
                setTracking(false);
                Alert.alert("Service complete", "The customer has been notified. Payment will be collected in their app.");
                navigation.popToTop();
            }
        } catch (error: any) {
            Alert.alert("Update failed", error?.response?.data?.message ?? "Please try again.");
        } finally {
            setUpdating(false);
        }
    }

    async function callCustomer() {
        const phone = request?.customer?.phone;
        if (!phone) return Alert.alert("Customer number unavailable", "Use in-app chat to contact the customer.");
        const url = `tel:${phone}`;
        if (await Linking.canOpenURL(url)) await Linking.openURL(url);
    }

    if (!request) return <View style={styles.loading}><Text style={styles.loadingText}>Loading job details…</Text></View>;
    const steps = ["ACCEPTED", "ARRIVED", "IN_PROGRESS", "COMPLETED"];
    const activeIndex = steps.indexOf(request.status);

    return (
        <ScrollView style={styles.page} contentContainerStyle={styles.content}>
            <View style={styles.mapFrame}>
                <MapView style={StyleSheet.absoluteFillObject} initialRegion={{ latitude: request.pickupLat, longitude: request.pickupLng, latitudeDelta: 0.035, longitudeDelta: 0.035 }} showsUserLocation showsMyLocationButton>
                    <Marker coordinate={{ latitude: request.pickupLat, longitude: request.pickupLng }} title="Customer pickup" pinColor="#E8A927" />
                </MapView>
                <Pressable style={styles.navigationPill} onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${request.pickupLat},${request.pickupLng}`)}>
                    <Text style={styles.navigationGlyph}>➤</Text><Text style={styles.navigationText}>Navigate to customer</Text><Text style={styles.navigationArrow}>↗</Text>
                </Pressable>
            </View>

            <View style={styles.jobHeader}>
                <View><Text style={styles.eyebrow}>ACTIVE REQUEST</Text><Text style={styles.title}>{request.category.replaceAll("_", " ")}</Text></View>
                <View style={styles.statusPill}><View style={styles.statusDot} /><Text style={styles.statusText}>{request.status.replaceAll("_", " ")}</Text></View>
            </View>
            <Text style={styles.address}>{request.pickupAddress}</Text>
            <Text style={styles.jobMeta}>Request {request.id.slice(0, 8)} · {request.customer?.fullName ?? "RoadGuard customer"}</Text>

            <View style={styles.customerRow}>
                <View style={styles.customerAvatar}><Text style={styles.customerInitial}>{request.customer?.fullName?.[0] ?? "C"}</Text></View>
                <View style={{ flex: 1 }}><Text style={styles.customerName}>{request.customer?.fullName ?? "Customer"}</Text><Text style={styles.customerHint}>Your customer</Text></View>
                <Pressable style={styles.roundAction} onPress={callCustomer}><Text style={styles.actionGlyph}>☎</Text></Pressable>
                <Pressable style={styles.roundAction} onPress={() => navigation.navigate("Chat", { requestId })}><Text style={styles.actionGlyph}>▣</Text></Pressable>
            </View>

            <View style={styles.progressPanel}>
                <View style={styles.panelHeading}><Text style={styles.panelTitle}>Service progress</Text><Text style={styles.stepText}>{Math.max(1, activeIndex + 1)} OF 4</Text></View>
                {steps.map((step, index) => {
                    const complete = activeIndex >= index;
                    const label = { ACCEPTED: "Request accepted", ARRIVED: "Reached location", IN_PROGRESS: "Service in progress", COMPLETED: "Service completed" }[step];
                    return <View key={step} style={styles.stepRow}><View style={[styles.stepMark, complete && styles.stepMarkComplete]}><Text style={[styles.stepMarkText, complete && styles.stepMarkTextComplete]}>{complete ? "✓" : ""}</Text></View><Text style={[styles.stepLabel, complete && styles.stepLabelComplete]}>{label}</Text></View>;
                })}
            </View>

            <View style={styles.earningsRow}><Text style={styles.earningsLabel}>Agreed service fare</Text><Text style={styles.earningsValue}>₹{request.agreedFare ?? request.customerRequestedFare ?? request.estimatedFare ?? "—"}</Text></View>
            {NEXT_STATUS[request.status] && <Pressable style={[styles.primaryButton, updating && styles.disabled]} onPress={advanceStatus} disabled={updating}><Text style={styles.primaryButtonText}>{updating ? "Updating…" : ACTION_LABEL[request.status]}</Text><Text style={styles.primaryArrow}>→</Text></Pressable>}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    page: { flex: 1, backgroundColor: "#F2F6F2" },
    content: { padding: 15, paddingBottom: 32 },
    loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F2F6F2" },
    loadingText: { color: "#708077", fontWeight: "700" },
    mapFrame: { height: 245, borderRadius: 9, overflow: "hidden", backgroundColor: "#DCE5DF" },
    navigationPill: { position: "absolute", left: 10, right: 10, bottom: 10, minHeight: 45, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 12, borderRadius: 7, backgroundColor: "#fff", elevation: 4 },
    navigationGlyph: { color: "#278151", fontSize: 16 },
    navigationText: { flex: 1, color: "#25392D", fontSize: 11, fontWeight: "900" },
    navigationArrow: { color: "#278151", fontSize: 16, fontWeight: "900" },
    jobHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 17 },
    eyebrow: { color: "#58806A", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
    title: { color: "#1E382A", fontSize: 20, fontWeight: "900", marginTop: 4, textTransform: "capitalize" },
    statusPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#E2F2E7", borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#27905B" },
    statusText: { color: "#26734C", fontSize: 8, fontWeight: "900" },
    address: { color: "#45594C", fontSize: 12, fontWeight: "700", marginTop: 7 },
    jobMeta: { color: "#88948B", fontSize: 9, marginTop: 4 },
    customerRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 13, padding: 11, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E1E9E2", borderRadius: 8 },
    customerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#E0EEE3", alignItems: "center", justifyContent: "center" },
    customerInitial: { color: "#28744D", fontSize: 15, fontWeight: "900" },
    customerName: { color: "#25392D", fontSize: 11, fontWeight: "900" },
    customerHint: { color: "#859188", fontSize: 9, marginTop: 2 },
    roundAction: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#EAF4ED", alignItems: "center", justifyContent: "center" },
    actionGlyph: { color: "#26764F", fontSize: 14, fontWeight: "900" },
    progressPanel: { marginTop: 13, padding: 13, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E1E9E2", borderRadius: 8 },
    panelHeading: { flexDirection: "row", justifyContent: "space-between", marginBottom: 9 },
    panelTitle: { color: "#25392D", fontSize: 12, fontWeight: "900" },
    stepText: { color: "#86948A", fontSize: 8, fontWeight: "900" },
    stepRow: { minHeight: 31, flexDirection: "row", alignItems: "center", gap: 9 },
    stepMark: { width: 17, height: 17, borderRadius: 9, borderWidth: 1.5, borderColor: "#CBD6CE", alignItems: "center", justifyContent: "center" },
    stepMarkComplete: { backgroundColor: "#27905B", borderColor: "#27905B" },
    stepMarkText: { color: "transparent", fontSize: 10, fontWeight: "900" },
    stepMarkTextComplete: { color: "#fff" },
    stepLabel: { color: "#849087", fontSize: 10, fontWeight: "600" },
    stepLabelComplete: { color: "#2B6947", fontWeight: "800" },
    earningsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 13, padding: 13, backgroundColor: "#E4EFE7", borderRadius: 7 },
    earningsLabel: { color: "#4F6657", fontSize: 10, fontWeight: "700" },
    earningsValue: { color: "#246D48", fontSize: 15, fontWeight: "900" },
    primaryButton: { height: 49, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, borderRadius: 7, backgroundColor: "#F5BE3D", paddingHorizontal: 15 },
    primaryButtonText: { color: "#223329", fontSize: 12, fontWeight: "900" },
    primaryArrow: { color: "#223329", fontSize: 17, fontWeight: "900" },
    disabled: { opacity: 0.55 },
});
