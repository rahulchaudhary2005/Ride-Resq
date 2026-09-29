import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import { useRequestStore } from "../../store/requestStore";

export default function RequestServiceScreen({ route, navigation }: any) {
  const { category } = route.params;
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const createRequest = useRequestStore((s) => s.createRequest);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location required", "RoadGuard needs your location to find nearby help.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });

      const [place] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (place) setAddress(`${place.street ?? ""} ${place.city ?? ""}`.trim());
    })();
  }, []);

  const onConfirm = async () => {
    if (!coords) return Alert.alert("Waiting for location...");
    setSubmitting(true);
    try {
      const request = await createRequest({
        category,
        pickupLat: coords.lat,
        pickupLng: coords.lng,
        pickupAddress: address || "Current location",
        description,
      });
      navigation.replace("TrackMechanic", { requestId: request.id });
    } catch (err: any) {
      Alert.alert("Could not create request", err?.response?.data?.message ?? "Please try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Service</Text>
      <Text style={styles.category}>{category.replace("_", " ")}</Text>

      <Text style={styles.label}>Pickup location</Text>
      {coords ? (
        <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Confirm your address" />
      ) : (
        <ActivityIndicator color="#F59E0B" />
      )}

      <Text style={styles.label}>What's going on? (optional)</Text>
      <TextInput
        style={[styles.input, { height: 90 }]}
        multiline
        value={description}
        onChangeText={setDescription}
        placeholder="e.g. Car won't start, flat rear tire..."
        placeholderTextColor="#6B7280"
      />

      <TouchableOpacity style={styles.button} onPress={onConfirm} disabled={submitting || !coords}>
        <Text style={styles.buttonText}>{submitting ? "Requesting..." : "Confirm & Request Help"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1220", padding: 20 },
  label: { color: "#9CA3AF", fontSize: 13, marginTop: 16, marginBottom: 6 },
  category: { color: "#fff", fontSize: 22, fontWeight: "700" },
  input: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  button: { backgroundColor: "#F59E0B", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 32 },
  buttonText: { color: "#0B1220", fontWeight: "700", fontSize: 16 },
});
