import React from "react";
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { RoadBackground } from "@roadguard/theme";
import { useAuthStore } from "../../store/authStore";

const SERVICES = [
    { key: "MECHANICAL_REPAIR", label: "Car breakdown", note: "Get back on the road", icon: "🚘", tint: "#EAF2FF" },
    { key: "FLAT_TIRE", label: "Flat tyre", note: "Quick tyre change", icon: "◉", tint: "#FFF1DE" },
    { key: "BATTERY_JUMP", label: "Battery issue", note: "Jump-start service", icon: "ϟ", tint: "#E8F5ED" },
    { key: "FUEL_DELIVERY", label: "Fuel delivery", note: "Fuel at your location", icon: "⛽", tint: "#FDECEC" },
    { key: "TOWING", label: "Towing service", note: "Safe vehicle recovery", icon: "↗", tint: "#F0EBFF" },
    { key: "LOCKOUT", label: "Other issue", note: "Describe your issue", icon: "🔧", tint: "#E5F5F3" },
] as const;

export default function HomeScreen({ navigation }: any) {
    const user = useAuthStore((state) => state.user);

    return (
        <RoadBackground>
            <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.topBar}>
                    <View>
                        <Text style={styles.wordmark}>Road<Text style={styles.wordmarkAccent}>Guard</Text></Text>
                        <Text style={styles.locationLabel}>CURRENT LOCATION</Text>
                        <Pressable style={styles.locationButton} onPress={() => navigation.navigate("RequestService", { category: "MECHANICAL_REPAIR" })}>
                            <Text style={styles.pin}>⌖</Text>
                            <Text style={styles.locationText}>Set your location</Text>
                            <Text style={styles.chevron}>›</Text>
                        </Pressable>
                    </View>
                    <Pressable style={styles.bellButton} onPress={() => navigation.navigate("History")} accessibilityLabel="Notifications and requests">
                        <Text style={styles.bell}>♧</Text>
                        <View style={styles.notificationDot} />
                    </Pressable>
                </View>

                <Text style={styles.greeting}>Welcome, {user?.fullName?.split(" ")[0] ?? "Driver"} 👋</Text>
                <Text style={styles.subtitle}>What do you need help with today?</Text>

                <ImageBackground
                    source={{ uri: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85" }}
                    style={styles.hero}
                    imageStyle={styles.heroImage}
                >
                    <View style={styles.heroShade} />
                    <View style={styles.heroCopy}>
                        <View style={styles.verifiedPill}><View style={styles.verifiedDot} /><Text style={styles.verifiedText}>VERIFIED ROAD ASSISTANCE</Text></View>
                        <Text style={styles.heroTitle}>Help is on{"\n"}the way.</Text>
                        <Text style={styles.heroSubtitle}>Reliable mechanics, wherever the road takes you.</Text>
                        <Pressable style={styles.heroButton} onPress={() => navigation.navigate("RequestService", { category: "MECHANICAL_REPAIR" })}>
                            <Text style={styles.heroButtonText}>Get roadside help</Text>
                            <Text style={styles.heroArrow}>→</Text>
                        </Pressable>
                    </View>
                </ImageBackground>

                <View style={styles.sectionHeader}>
                    <View><Text style={styles.sectionTitle}>Choose a service</Text><Text style={styles.sectionNote}>Professional help for every situation</Text></View>
                    <Text style={styles.serviceCount}>06 SERVICES</Text>
                </View>

                <View style={styles.grid}>
                    {SERVICES.map((service) => (
                        <Pressable
                            key={service.key}
                            style={styles.serviceTile}
                            onPress={() => navigation.navigate("RequestService", { category: service.key })}
                        >
                            <View style={[styles.serviceIcon, { backgroundColor: service.tint }]}><Text style={styles.serviceGlyph}>{service.icon}</Text></View>
                            <View style={styles.serviceCopy}><Text style={styles.serviceName}>{service.label}</Text><Text style={styles.serviceNote}>{service.note}</Text></View>
                            <Text style={styles.serviceArrow}>›</Text>
                        </Pressable>
                    ))}
                </View>

                <Pressable style={styles.historyRow} onPress={() => navigation.navigate("History")}>
                    <View style={styles.historyIcon}><Text style={styles.historyGlyph}>▤</Text></View>
                    <View style={{ flex: 1 }}><Text style={styles.historyTitle}>Your recent requests</Text><Text style={styles.historySubtitle}>View service history and receipts</Text></View>
                    <Text style={styles.historyArrow}>›</Text>
                </Pressable>
            </ScrollView>
        </RoadBackground>
    );
}

const styles = StyleSheet.create({
    page: { flex: 1, backgroundColor: "#F5F7F5" },
    content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 30 },
    topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    wordmark: { color: "#173A2C", fontSize: 20, fontWeight: "900" },
    wordmarkAccent: { color: "#F1B83B" },
    locationLabel: { color: "#77867D", fontSize: 9, fontWeight: "800", marginTop: 15, letterSpacing: 0.6 },
    locationButton: { minWidth: 200, flexDirection: "row", alignItems: "center", gap: 8, marginTop: 5 },
    pin: { color: "#287A55", fontSize: 19, fontWeight: "700" },
    locationText: { color: "#24362D", fontSize: 13, fontWeight: "700" },
    chevron: { color: "#86938A", fontSize: 21, marginLeft: 4 },
    bellButton: { width: 42, height: 42, marginTop: 4, borderRadius: 21, borderWidth: 1, borderColor: "#E0E6E1", backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
    bell: { color: "#20372B", fontSize: 21 },
    notificationDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#F0B532", position: "absolute", right: 10, top: 9 },
    greeting: { color: "#1B2E24", fontSize: 22, fontWeight: "800", marginTop: 20 },
    subtitle: { color: "#718078", fontSize: 13, marginTop: 4, marginBottom: 15 },
    hero: { minHeight: 218, borderRadius: 11, overflow: "hidden", justifyContent: "center", backgroundColor: "#173A4B" },
    heroImage: { borderRadius: 11 },
    heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,18,27,0.48)" },
    heroCopy: { padding: 18, alignItems: "flex-start" },
    verifiedPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6 },
    verifiedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#56D49A" },
    verifiedText: { color: "#F5F7F5", fontSize: 8, fontWeight: "800" },
    heroTitle: { color: "#fff", fontSize: 30, fontWeight: "900", lineHeight: 32, marginTop: 13 },
    heroSubtitle: { maxWidth: 240, color: "#E1E9E4", fontSize: 11, lineHeight: 16, marginTop: 5 },
    heroButton: { minWidth: 165, height: 39, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 13, backgroundColor: "#F5BE3D", borderRadius: 6, paddingHorizontal: 12 },
    heroButtonText: { color: "#203126", fontSize: 11, fontWeight: "900" },
    heroArrow: { color: "#203126", fontSize: 17, fontWeight: "700" },
    sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 21, marginBottom: 10 },
    sectionTitle: { color: "#1E3026", fontSize: 16, fontWeight: "800" },
    sectionNote: { color: "#819087", fontSize: 10, marginTop: 3 },
    serviceCount: { color: "#8A958D", fontSize: 8, fontWeight: "800", letterSpacing: 0.7, marginBottom: 2 },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    serviceTile: { width: "48.5%", minHeight: 75, flexDirection: "row", alignItems: "center", marginBottom: 9, padding: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5EAE6", borderRadius: 8 },
    serviceIcon: { width: 38, height: 38, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    serviceGlyph: { color: "#1F5038", fontSize: 20, fontWeight: "700" },
    serviceCopy: { flex: 1, minWidth: 0, paddingLeft: 8 },
    serviceName: { color: "#26362D", fontSize: 10, fontWeight: "800" },
    serviceNote: { color: "#8A968E", fontSize: 8, marginTop: 4 },
    serviceArrow: { color: "#A6B0A9", fontSize: 18, marginLeft: 2 },
    historyRow: { minHeight: 65, flexDirection: "row", alignItems: "center", gap: 11, marginTop: 3, paddingHorizontal: 11, borderRadius: 8, backgroundColor: "#E9F0EB" },
    historyIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#D4E5D9", alignItems: "center", justifyContent: "center" },
    historyGlyph: { color: "#286A49", fontSize: 18 },
    historyTitle: { color: "#26372D", fontSize: 11, fontWeight: "800" },
    historySubtitle: { color: "#78867D", fontSize: 9, marginTop: 3 },
    historyArrow: { color: "#658271", fontSize: 23, paddingHorizontal: 5 },
});
