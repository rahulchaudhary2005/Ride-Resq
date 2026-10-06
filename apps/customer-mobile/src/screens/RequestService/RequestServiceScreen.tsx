import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import MapView, { Marker, MapPressEvent, Region } from "react-native-maps";
import * as Location from "expo-location";
import { apiClient } from "../../services/apiClient";
import { useRequestStore } from "../../store/requestStore";
import type { VehicleClass } from "../../store/requestStore";
import type { ServiceCategory, Vehicle } from "@roadguard/shared-types";

interface Coordinates {
    lat: number;
    lng: number;
}

interface Quote {
    estimatedFare: number;
    distanceKm: number;
    baseFare: number;
    distanceFare: number;
    minFare: number;
    surgeMultiplier: number;
    distanceTax: number;
}

interface NearbyMechanic {
    id: string;
    distanceKm: number;
    rating: number;
    approximateLat: number;
    approximateLng: number;
}

export default function RequestServiceScreen({ route, navigation }: any) {
    const category = route.params.category as ServiceCategory;
    const [pickup, setPickup] = useState<Coordinates | null>(null);
    const [dropoff, setDropoff] = useState<Coordinates | null>(null);
    const [mapRegion, setMapRegion] = useState<Region>({
        latitude: 28.6139,
        longitude: 77.209,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
    });
    const [selectingDropoff, setSelectingDropoff] = useState(false);
    const [pickupAddress, setPickupAddress] = useState("");
    const [dropoffAddress, setDropoffAddress] = useState("");
    const [description, setDescription] = useState("");
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [vehicleId, setVehicleId] = useState<string | undefined>();
    const [vehicleClass, setVehicleClass] = useState<VehicleClass>("SMALL");
    const [quote, setQuote] = useState<Quote | null>(null);
    const [nearby, setNearby] = useState<NearbyMechanic[]>([]);
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [loadingQuote, setLoadingQuote] = useState(false);
    const [loadingNearby, setLoadingNearby] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [offer, setOffer] = useState("");
    const createRequest = useRequestStore((state) => state.createRequest);
    const getQuote = useRequestStore((state) => state.getQuote);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === "granted") {
                    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    if (active) {
                        setPickup({ lat: location.coords.latitude, lng: location.coords.longitude });
                        setMapRegion({ latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.025, longitudeDelta: 0.025 });
                    }
                }
            } catch {
                Alert.alert("Location unavailable", "Choose your pickup by tapping the map.");
            } finally {
                if (active) setLoadingLocation(false);
            }
        })();

        apiClient.get("/vehicles/mine").then(({ data }) => {
            if (!active) return;
            setVehicles(data.data);
            if (data.data.length > 0) {
                setVehicleId(data.data[0].id);
                setVehicleClass(classifyVehicle(data.data[0].vehicleType));
            }
        }).catch(() => undefined);

        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!pickup) return;
        let active = true;
        setLoadingNearby(true);
        apiClient.get("/mechanics/nearby", {
            params: { lat: pickup.lat, lng: pickup.lng, category },
        }).then(({ data }) => {
            if (active) setNearby(data.data);
        }).catch(() => {
            if (active) setNearby([]);
        }).finally(() => {
            if (active) setLoadingNearby(false);
        });

        return () => { active = false; };
    }, [pickup, category]);

    useEffect(() => {
        if (!pickup) return;
        let active = true;
        setLoadingQuote(true);
        getQuote({
            category,
            pickupLat: pickup.lat,
            pickupLng: pickup.lng,
            vehicleClass,
            ...(dropoff ? { dropLat: dropoff.lat, dropLng: dropoff.lng } : {}),
        }).then((result) => {
            if (active) setQuote(result);
        }).catch(() => {
            if (active) setQuote(null);
        }).finally(() => {
            if (active) setLoadingQuote(false);
        });

        return () => { active = false; };
    }, [pickup, dropoff, category, vehicleClass, getQuote]);

    useEffect(() => {
        if (!pickup) return;
        const point = selectingDropoff ? dropoff : pickup;
        if (!point) return;
        let active = true;
        Location.reverseGeocodeAsync({ latitude: point.lat, longitude: point.lng }).then(([place]) => {
            if (!active || !place) return;
            const address = [place.name, place.street, place.city, place.region].filter(Boolean).join(", ");
            if (selectingDropoff) setDropoffAddress(address);
            else setPickupAddress(address);
        }).catch(() => undefined);
        return () => { active = false; };
    }, [pickup, dropoff, selectingDropoff]);

    function selectMapPoint(event: MapPressEvent) {
        const point = {
            lat: event.nativeEvent.coordinate.latitude,
            lng: event.nativeEvent.coordinate.longitude,
        };
        setMapRegion((current) => ({ ...current, latitude: point.lat, longitude: point.lng }));
        if (selectingDropoff) setDropoff(point);
        else setPickup(point);
    }

    async function useCurrentLocation() {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") throw new Error("Location permission was not granted.");
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setSelectingDropoff(false);
            setPickup({ lat: location.coords.latitude, lng: location.coords.longitude });
            setMapRegion({ latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.025, longitudeDelta: 0.025 });
        } catch (error: any) {
            Alert.alert("Could not get location", error?.message ?? "Choose your pickup by tapping the map.");
        }
    }

    async function submitRequest() {
        if (!pickup) return Alert.alert("Choose a pickup", "Use your current location or tap the map to place the pickup pin.");
        if (!pickupAddress.trim()) return Alert.alert("Pickup address needed", "Enter a recognizable pickup address.");
        if (!quote) return Alert.alert("Quote unavailable", "Wait for the fare quote or adjust the location and try again.");

        const requestedFare = offer.trim() ? Number(offer) : undefined;
        const minimumFare = quote.minFare + quote.distanceTax;
        if (requestedFare !== undefined && (!Number.isFinite(requestedFare) || requestedFare < minimumFare)) {
            return Alert.alert("Offer is below minimum", `The minimum accepted offer is ₹${minimumFare.toFixed(0)}.`);
        }

        setSubmitting(true);
        try {
            const request = await createRequest({
                category,
                pickupLat: pickup.lat,
                pickupLng: pickup.lng,
                pickupAddress: pickupAddress.trim(),
                ...(dropoff ? { dropLat: dropoff.lat, dropLng: dropoff.lng, dropAddress: dropoffAddress.trim() || "Selected destination" } : {}),
                ...(vehicleId ? { vehicleId } : {}),
                vehicleClass,
                ...(description.trim() ? { description: description.trim() } : {}),
                ...(requestedFare !== undefined ? { customerRequestedFare: requestedFare } : {}),
            });
            navigation.replace("TrackMechanic", { requestId: request.id });
        } catch (error: any) {
            Alert.alert("Could not create request", error?.response?.data?.message ?? "Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.eyebrow}>ROADGUARD DISPATCH</Text>
            <Text style={styles.title}>{category.replaceAll("_", " ")}</Text>
            <Text style={styles.subtitle}>Set the pickup pin and review your quote before requesting help.</Text>

            <View style={styles.mapFrame}>
                <MapView style={StyleSheet.absoluteFillObject} initialRegion={mapRegion} region={mapRegion} onRegionChangeComplete={setMapRegion} onPress={selectMapPoint}>
                    {pickup && <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} title="Pickup" pinColor="#F59E0B" />}
                    {dropoff && <Marker coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }} title="Destination" pinColor="#16A085" />}
                    {nearby.slice(0, 20).map((mechanic) => (
                        <Marker
                            key={mechanic.id}
                            coordinate={{ latitude: mechanic.approximateLat, longitude: mechanic.approximateLng }}
                            title="Available nearby"
                            pinColor="#237A57"
                        />
                    ))}
                </MapView>
                {loadingLocation && <View style={styles.locationLoading}><ActivityIndicator color="#F59E0B" /></View>}
                <View style={styles.mapBadge}><Text style={styles.mapBadgeText}>{selectingDropoff ? "Tap to set destination" : "Tap to adjust pickup"}</Text></View>
            </View>

            <View style={styles.locationActions}>
                <Pressable style={[styles.modeButton, !selectingDropoff && styles.modeButtonActive]} onPress={() => setSelectingDropoff(false)}>
                    <Text style={[styles.modeText, !selectingDropoff && styles.modeTextActive]}>Pickup pin</Text>
                </Pressable>
                <Pressable style={[styles.modeButton, selectingDropoff && styles.modeButtonActive]} onPress={() => setSelectingDropoff(true)}>
                    <Text style={[styles.modeText, selectingDropoff && styles.modeTextActive]}>Destination</Text>
                </Pressable>
                <Pressable style={styles.gpsButton} onPress={useCurrentLocation}><Text style={styles.gpsText}>◎ GPS</Text></Pressable>
            </View>

            <Text style={styles.label}>Pickup address</Text>
            <TextInput style={styles.input} value={pickupAddress} onChangeText={setPickupAddress} placeholder="Road, landmark, city" placeholderTextColor="#748078" />
            <Text style={styles.label}>Destination (optional)</Text>
            <TextInput style={styles.input} value={dropoffAddress} onChangeText={setDropoffAddress} placeholder="Set destination pin, then add details" placeholderTextColor="#748078" />

            <View style={styles.availabilityRow}>
                <View style={styles.liveDot} />
                <Text style={styles.availabilityText}>
                    {loadingNearby ? "Checking nearby mechanics…" : `${nearby.length} approved mechanic${nearby.length === 1 ? "" : "s"} nearby`}
                </Text>
            </View>

            <Text style={styles.label}>Vehicle</Text>
            {vehicles.length ? (
                <View style={styles.vehicleList}>
                    {vehicles.map((vehicle) => (
                        <Pressable key={vehicle.id} style={[styles.vehicleOption, vehicleId === vehicle.id && styles.vehicleSelected]} onPress={() => { setVehicleId(vehicle.id); setVehicleClass(classifyVehicle(vehicle.vehicleType)); }}>
                            <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model}</Text>
                            <Text style={styles.vehicleMeta}>{vehicle.vehicleType} · {vehicle.plateNumber}</Text>
                        </Pressable>
                    ))}
                </View>
            ) : (
                <>
                    <Text style={styles.note}>Choose the closest vehicle class for the distance tax estimate.</Text>
                    <View style={styles.vehicleClassRow}>
                        {(["SMALL", "MEDIUM", "HEAVY"] as VehicleClass[]).map((item) => (
                            <Pressable key={item} style={[styles.classOption, vehicleClass === item && styles.vehicleSelected]} onPress={() => setVehicleClass(item)}>
                                <Text style={[styles.vehicleName, vehicleClass === item && styles.classSelectedText]}>{item}</Text>
                            </Pressable>
                        ))}
                    </View>
                </>
            )}

            <Text style={styles.label}>Issue details</Text>
            <TextInput style={[styles.input, styles.multiline]} multiline value={description} onChangeText={setDescription} maxLength={500} placeholder="Tell the mechanic what happened" placeholderTextColor="#748078" />

            <View style={styles.quotePanel}>
                <Text style={styles.quoteTitle}>Fare estimate</Text>
                {loadingQuote ? <ActivityIndicator color="#F59E0B" /> : quote ? (
                    <>
                        <Text style={styles.quoteAmount}>₹{quote.estimatedFare.toFixed(0)}</Text>
                        <Text style={styles.quoteDetail}>{quote.distanceKm.toFixed(1)} km route · includes service category pricing</Text>
                        <Text style={styles.quoteTax}>Distance tax ({vehicleClass.toLowerCase()} vehicle): ₹{quote.distanceTax.toFixed(2)}</Text>
                    </>
                ) : <Text style={styles.note}>Quote will appear when a pickup is selected.</Text>}
                {quote && <TextInput style={styles.offerInput} value={offer} onChangeText={setOffer} keyboardType="decimal-pad" placeholder={`Optional offer · minimum ₹${(quote.minFare + quote.distanceTax).toFixed(0)}`} placeholderTextColor="#748078" />}
            </View>

            <Pressable style={[styles.submit, (submitting || !pickup || !quote) && styles.submitDisabled]} onPress={submitRequest} disabled={submitting || !pickup || !quote}>
                <Text style={styles.submitText}>{submitting ? "Sending request…" : offer.trim() ? "Send request with offer" : "Request nearby help"}</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    page: { flex: 1, backgroundColor: "#F5F7F5" },
    content: { padding: 16, paddingBottom: 34 },
    eyebrow: { color: "#237A57", fontSize: 9, fontWeight: "800", letterSpacing: 1.1, marginTop: 8 },
    title: { color: "#1B2E24", fontSize: 22, fontWeight: "900", marginTop: 4, textTransform: "capitalize" },
    subtitle: { color: "#58645D", fontSize: 14, lineHeight: 20, marginTop: 5, marginBottom: 16 },
    mapFrame: { height: 265, overflow: "hidden", borderRadius: 9, backgroundColor: "#DCE5DF", borderWidth: 1, borderColor: "#CFD8D1" },
    mapPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", padding: 18 },
    locationLoading: { position: "absolute", right: 10, bottom: 10, backgroundColor: "#fff", borderRadius: 18, padding: 7 },
    mapHint: { color: "#58645D", textAlign: "center" },
    mapBadge: { position: "absolute", top: 10, left: 10, backgroundColor: "#fff", borderRadius: 5, paddingHorizontal: 10, paddingVertical: 7, elevation: 3 },
    mapBadgeText: { color: "#26362D", fontWeight: "800", fontSize: 11 },
    locationActions: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 6 },
    modeButton: { flex: 1, borderWidth: 1, borderColor: "#CDD7D0", borderRadius: 6, paddingVertical: 10, alignItems: "center" },
    modeButtonActive: { borderColor: "#237A57", backgroundColor: "#E4EEE7" },
    modeText: { color: "#58645D", fontSize: 12, fontWeight: "700" },
    modeTextActive: { color: "#1C6044" },
    gpsButton: { backgroundColor: "#18221D", borderRadius: 6, paddingVertical: 11, paddingHorizontal: 12 },
    gpsText: { color: "#fff", fontSize: 12, fontWeight: "700" },
    label: { color: "#37443C", fontSize: 10, fontWeight: "900", marginTop: 15, marginBottom: 6 },
    input: { minHeight: 44, borderRadius: 6, borderWidth: 1, borderColor: "#DDE5DF", backgroundColor: "#fff", paddingHorizontal: 12, color: "#18221D", fontSize: 13 },
    multiline: { height: 84, textAlignVertical: "top", paddingTop: 12 },
    availabilityRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14, padding: 11, borderRadius: 7, backgroundColor: "#E8F3EB" },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#237A57" },
    availabilityText: { color: "#237A57", fontSize: 13, fontWeight: "700" },
    vehicleList: { gap: 8 },
    vehicleClassRow: { flexDirection: "row", gap: 8, marginTop: 8 },
    classOption: { flex: 1, borderWidth: 1, borderColor: "#CFD8D1", backgroundColor: "#fff", borderRadius: 6, padding: 12, alignItems: "center" },
    classSelectedText: { color: "#1C6044" },
    vehicleOption: { borderWidth: 1, borderColor: "#CFD8D1", backgroundColor: "#fff", borderRadius: 6, padding: 12 },
    vehicleSelected: { borderColor: "#237A57", backgroundColor: "#E4EEE7" },
    vehicleName: { color: "#18221D", fontWeight: "700" },
    vehicleMeta: { color: "#68746C", fontSize: 12, marginTop: 3, textTransform: "capitalize" },
    note: { color: "#68746C", fontSize: 12, lineHeight: 18 },
    quotePanel: { marginTop: 17, padding: 15, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#DDE5DF" },
    quoteTitle: { color: "#64746A", fontWeight: "800", fontSize: 11 },
    quoteAmount: { color: "#1E3528", fontSize: 28, fontWeight: "900", marginTop: 4 },
    quoteDetail: { color: "#78867D", fontSize: 11, marginTop: 3 },
    quoteTax: { color: "#78867D", fontSize: 10, marginTop: 5 },
    offerInput: { height: 42, marginTop: 11, borderRadius: 5, backgroundColor: "#F3F6F3", paddingHorizontal: 10, color: "#26362D", fontSize: 12 },
    submit: { marginTop: 16, minHeight: 49, backgroundColor: "#F5BE3D", borderRadius: 6, alignItems: "center", justifyContent: "center" },
    submitDisabled: { opacity: 0.45 },
    submitText: { color: "#203126", fontSize: 14, fontWeight: "900" },
});

function classifyVehicle(vehicleType: string): VehicleClass {
    const value = vehicleType.toLowerCase();
    if (/bus|truck|heavy|commercial|tractor/.test(value)) return "HEAVY";
    if (/suv|van|pickup|medium/.test(value)) return "MEDIUM";
    return "SMALL";
}
