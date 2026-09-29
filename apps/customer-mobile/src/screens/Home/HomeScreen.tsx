import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useTheme, RoadGuardTheme, RoadBackground } from "@roadguard/theme";

// A grid of quick-request tiles for each service category. Tapping one jumps
// straight into RequestServiceScreen with that category pre-selected.
const SERVICES: { key: string; label: string; emoji: string }[] = [
  { key: "TOWING", label: "Towing", emoji: "🚛" },
  { key: "FLAT_TIRE", label: "Flat Tire", emoji: "🛞" },
  { key: "BATTERY_JUMP", label: "Battery Jump", emoji: "🔋" },
  { key: "FUEL_DELIVERY", label: "Fuel Delivery", emoji: "⛽" },
  { key: "LOCKOUT", label: "Lockout", emoji: "🔑" },
  { key: "MECHANICAL_REPAIR", label: "Mechanical", emoji: "🔧" },
  { key: "WINCHING", label: "Winching", emoji: "🪝" },
  { key: "EV_CHARGING", label: "EV Charging", emoji: "🔌" },
];

export default function HomeScreen({ navigation }: any) {
  const { theme, mode, toggle } = useTheme();
  const styles = makeStyles(theme);

  return (
    <RoadBackground>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Need help on the road?</Text>
            <Text style={styles.subtitle}>Choose a service to get matched with a nearby mechanic.</Text>
          </View>

          {/* Day ops / night dispatch toggle — same two modes as the admin dashboard */}
          <TouchableOpacity onPress={toggle} style={styles.themeToggle} accessibilityLabel="Toggle theme">
            <Text style={styles.themeToggleText}>{mode === "dark" ? "🌙" : "☀️"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {SERVICES.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={styles.tile}
              onPress={() => navigation.navigate("RequestService", { category: s.key })}
            >
              <Text style={styles.emoji}>{s.emoji}</Text>
              <Text style={styles.tileLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </RoadBackground>
  );
}

function makeStyles(theme: RoadGuardTheme) {
  return StyleSheet.create({
    container: { flex: 1 },
    headerRow: { flexDirection: "row", alignItems: "flex-start" },
    greeting: { fontSize: 24, fontWeight: "700", color: theme.textPrimary },
    subtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 4, marginBottom: 24 },
    themeToggle: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    themeToggleText: { fontSize: 16 },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    tile: {
      width: "48%",
      backgroundColor: theme.bgElevated,
      borderRadius: theme.radius.lg,
      padding: 20,
      marginBottom: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    emoji: { fontSize: 30, marginBottom: 8 },
    tileLabel: { color: theme.textPrimary, fontWeight: "600" },
  });
}
