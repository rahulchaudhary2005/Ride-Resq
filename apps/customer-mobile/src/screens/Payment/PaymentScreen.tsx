import { useEffect, useState } from "react";
import { Alert, View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { apiClient } from "../../services/apiClient";

export default function PaymentScreen({ route, navigation }: any) {
  const { requestId } = route.params;
  const [request, setRequest] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("NOT_STARTED");

  useEffect(() => {
    let active = true;
    const loadRequest = async () => {
      try {
        const { data } = await apiClient.get(`/requests/${requestId}`);
        if (active) {
          setRequest(data.data);
          setPaymentStatus(data.data.payment?.status ?? "NOT_STARTED");
        }
      } catch {
        if (active) Alert.alert("Unable to load payment", "Please return to your request and try again.");
      }
    };
    void loadRequest();
    const refreshTimer = setInterval(loadRequest, 5000);
    return () => {
      active = false;
      clearInterval(refreshTimer);
    };
  }, [requestId]);

  async function handlePay() {
    setPaying(true);
    try {
      const { data } = await apiClient.post("/payments/intent", { requestId, provider: "RAZORPAY" });
      setPaymentStatus(data.data.status ?? "PENDING");
      Alert.alert(
        "Checkout is not configured",
        "A payment order was prepared, but this app does not have the Razorpay checkout SDK connected. No payment has been taken.",
      );
    } catch (error: any) {
      Alert.alert("Payment could not be started", error?.response?.data?.message ?? "Please try again.");
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
        <Text style={styles.label}>Payment status</Text>
        <Text style={styles.value}>{paymentStatus.replaceAll("_", " ")}</Text>
      </View>
      <Pressable style={styles.button} onPress={handlePay} disabled={paying || paymentStatus === "PAID"}>
        <Text style={styles.buttonText}>{paymentStatus === "PAID" ? "Payment received" : paying ? "Preparing..." : "Prepare payment"}</Text>
      </Pressable>
      <Pressable style={styles.returnButton} onPress={() => navigation.navigate("MainTabs")}>
        <Text style={styles.returnButtonText}>Return to home</Text>
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
  returnButton: { padding: 14, alignItems: "center" },
  returnButtonText: { color: "#CBD5E1", fontWeight: "600", fontSize: 14 },
});
