import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { apiClient } from "../../services/apiClient";

export default function PaymentScreen({ route, navigation }: any) {
  const { requestId } = route.params;
  const [request, setRequest] = useState<any>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    apiClient.get(`/requests/${requestId}`).then(({ data }) => setRequest(data.data));
  }, [requestId]);

  async function handlePay() {
    setPaying(true);
    try {
      // 1. Create a payment intent (Stripe/Razorpay) on the backend
      await apiClient.post("/payments/intent", { requestId, provider: "RAZORPAY" });
      // 2. In production: open the Stripe/Razorpay SDK checkout sheet here with the returned client secret / order id
      // 3. On success, confirm on the backend
      await apiClient.post("/payments/confirm", { requestId });
      navigation.navigate("HomeMain");
    } finally {
      setPaying(false);
    }
  }

  if (!request) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Service Complete ✅</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Service</Text>
        <Text style={styles.value}>{request.category.replace("_", " ")}</Text>
        <Text style={styles.label}>Amount Due</Text>
        <Text style={styles.amount}>₹{request.finalFare ?? request.estimatedFare}</Text>
      </View>
      <Pressable style={styles.button} onPress={handlePay} disabled={paying}>
        <Text style={styles.buttonText}>{paying ? "Processing..." : "Pay Now"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", padding: 24, justifyContent: "center" },
  title: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  card: { backgroundColor: "#1E293B", borderRadius: 16, padding: 20, marginBottom: 24 },
  label: { color: "#94A3B8", marginTop: 8 },
  value: { color: "#fff", fontSize: 18, fontWeight: "600" },
  amount: { color: "#4ADE80", fontSize: 28, fontWeight: "700" },
  button: { backgroundColor: "#EF4444", borderRadius: 12, padding: 16, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
