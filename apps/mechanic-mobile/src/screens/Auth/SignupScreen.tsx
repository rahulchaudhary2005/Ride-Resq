import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { useAuth } from "../../store/authStore";
import { api } from "../../services/api";

export function SignupScreen({ navigation }: any) {
    const { register } = useAuth();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [verificationToken, setVerificationToken] = useState("");
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    async function sendOtp() {
        setSendingOtp(true);
        try {
            await api.post("/auth/otp/start", { phone: phone.trim() });
            Alert.alert("Code sent", "Check your phone for the verification code.");
        } catch (error: any) {
            Alert.alert("Could not send code", error?.response?.data?.message ?? "Use your phone number with country code, such as +14155552671.");
        } finally {
            setSendingOtp(false);
        }
    }

    async function verifyOtp() {
        setVerifyingOtp(true);
        try {
            const { data } = await api.post("/auth/otp/verify", { phone: phone.trim(), code: otp.trim() });
            setVerificationToken(data.data.verificationToken);
            Alert.alert("Phone verified", "You can now create your account.");
        } catch (error: any) {
            setVerificationToken("");
            Alert.alert("Code not accepted", error?.response?.data?.message ?? "Request a new code and try again.");
        } finally {
            setVerifyingOtp(false);
        }
    }

    async function submit() {
        if (fullName.trim().length < 2 || !email.trim() || phone.trim().length < 8 || password.length < 8 || !verificationToken) {
            Alert.alert("Check your details", "Enter your account details, verify your phone, and use a password of at least 8 characters.");
            return;
        }

        setSubmitting(true);
        try {
            await register({ fullName: fullName.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), password, phoneVerificationToken: verificationToken });
            Alert.alert("Account created", "Your mechanic profile is pending RoadGuard verification.");
        } catch (error: any) {
            Alert.alert("Could not create account", error?.response?.data?.message ?? "Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.eyebrow}>ROADGUARD PARTNER</Text>
            <Text style={styles.title}>Create mechanic account</Text>
            <Text style={styles.subtitle}>New accounts remain offline until your documents are approved.</Text>
            <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#829087" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
            <TextInput style={styles.input} placeholder="Email address" placeholderTextColor="#829087" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Phone with country code, e.g. +14155552671" placeholderTextColor="#829087" value={phone} onChangeText={(value) => { setPhone(value); setVerificationToken(""); }} keyboardType="phone-pad" />
            <Pressable style={styles.secondaryButton} onPress={sendOtp} disabled={sendingOtp || !phone.trim()}>
                <Text style={styles.secondaryButtonText}>{sendingOtp ? "Sending code…" : "Send verification code"}</Text>
            </Pressable>
            <TextInput style={styles.input} placeholder="SMS verification code" placeholderTextColor="#829087" value={otp} onChangeText={setOtp} keyboardType="number-pad" />
            <Pressable style={styles.secondaryButton} onPress={verifyOtp} disabled={verifyingOtp || otp.length < 4}>
                <Text style={styles.secondaryButtonText}>{verificationToken ? "Phone verified" : verifyingOtp ? "Verifying…" : "Verify phone number"}</Text>
            </Pressable>
            <TextInput style={styles.input} placeholder="Password (8+ characters)" placeholderTextColor="#829087" value={password} onChangeText={setPassword} secureTextEntry />
            <Pressable style={[styles.button, submitting && styles.disabled]} onPress={submit} disabled={submitting || !verificationToken}>
                <Text style={styles.buttonText}>{submitting ? "Creating account…" : "Create mechanic account"}</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate("Login")}>
                <Text style={styles.link}>Already registered? Sign in</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: "center", padding: 24, backgroundColor: "#F3F5F1" },
    eyebrow: { color: "#237A57", fontSize: 11, fontWeight: "800", marginBottom: 8 },
    title: { color: "#18221D", fontSize: 25, fontWeight: "800" },
    subtitle: { color: "#58645D", fontSize: 14, lineHeight: 20, marginTop: 7, marginBottom: 22 },
    input: { backgroundColor: "#fff", color: "#18221D", borderWidth: 1, borderColor: "#CFD8D1", borderRadius: 6, padding: 14, marginBottom: 10 },
    button: { backgroundColor: "#237A57", borderRadius: 6, padding: 15, alignItems: "center", marginTop: 8 },
    secondaryButton: { borderColor: "#237A57", borderWidth: 1, borderRadius: 6, padding: 12, alignItems: "center", marginBottom: 10 },
    secondaryButtonText: { color: "#237A57", fontWeight: "700" },
    disabled: { opacity: 0.5 },
    buttonText: { color: "#fff", fontWeight: "800" },
    link: { color: "#237A57", textAlign: "center", fontWeight: "700", marginTop: 20 },
});
