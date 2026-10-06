import React, { useState } from "react";
import axios from "axios";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useAuthStore } from "../../store/authStore";
import { apiClient } from "../../services/apiClient";

function normalizePhone(value: string) {
  return value.replace(/[\s()-]/g, "");
}

function isValidPhone(value: string) {
  return /^\+91[6-9]\d{9}$/.test(normalizePhone(value));
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export default function SignupScreen({ navigation }: any) {
  const { height } = useWindowDimensions();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequestedFor, setOtpRequestedFor] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showRequired, setShowRequired] = useState(false);
  const [formError, setFormError] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const register = useAuthStore((state) => state.register);

  const normalizedPhone = normalizePhone(phone);
  const phoneValid = isValidPhone(phone);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const fieldsValid =
    fullName.trim().length >= 2 &&
    emailValid &&
    phoneValid &&
    password.length >= 8;
  const codeWasSentForPhone = otpRequestedFor === normalizedPhone && !!otpRequestedFor;

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setOtp("");
    setOtpRequestedFor("");
    setVerificationToken("");
    setFormError("");
    setFormMessage("");
  };

  const sendOtp = async () => {
    if (!phoneValid) {
      setShowRequired(true);
      setFormError("Enter a valid Indian mobile number with country code +91, such as +919876543210.");
      return;
    }

    setSendingOtp(true);
    setFormError("");
    setFormMessage("");
    setOtp("");
    setOtpRequestedFor("");
    setVerificationToken("");
    try {
      await apiClient.post(
        "/auth/otp/start",
        { phone: normalizedPhone },
        { timeout: 20_000 },
      );
      setOtpRequestedFor(normalizedPhone);
      setFormMessage("Verification code sent. Check your SMS messages.");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.code === "ECONNABORTED"
          ? "The request timed out. Check that the backend is running and try again."
          : !error.response
            ? "Cannot reach the backend. Start it on port 4000 and make sure your phone and computer are on the same Wi-Fi."
            : getErrorMessage(error, "Could not send the code. Check your connection and try again.")
        : getErrorMessage(error, "Could not send the code. Check your connection and try again.");
      setFormError(message);
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!codeWasSentForPhone) {
      setFormError("Send a verification code to this phone number first.");
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setFormError("Enter the 6-digit code from your SMS.");
      return;
    }

    setVerifyingOtp(true);
    setFormError("");
    setFormMessage("");
    try {
      const { data } = await apiClient.post("/auth/otp/verify", {
        phone: normalizedPhone,
        code: otp.trim(),
      });
      setVerificationToken(data.data.verificationToken);
      setFormMessage("Phone number verified. You can create your account.");
    } catch (error) {
      setVerificationToken("");
      setFormError(getErrorMessage(error, "Code not accepted. Request a new code and try again."));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const onSubmit = async () => {
    setShowRequired(true);
    setFormError("");
    setFormMessage("");
    if (!fieldsValid) {
      setFormError("Complete all required fields. Passwords must contain at least 8 characters.");
      return;
    }
    if (!verificationToken) {
      setFormError("Verify your phone number before creating your account.");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: normalizedPhone,
        password,
        phoneVerificationToken: verificationToken,
      });
    } catch (error) {
      setFormError(getErrorMessage(error, "Signup failed. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { minHeight: height }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          <Text style={styles.eyebrow}>ROADGUARD CUSTOMER</Text>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            Fields marked <Text style={styles.requiredMark}>*</Text> are required.
          </Text>

          <Text style={styles.fieldLabel}>FULL NAME <Text style={styles.requiredMark}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Your full name"
            placeholderTextColor="#8E9991"
            autoComplete="name"
            returnKeyType="next"
            value={fullName}
            onChangeText={setFullName}
          />
          {showRequired && fullName.trim().length < 2 && (
            <Text style={styles.fieldError}>Enter your full name.</Text>
          )}

          <Text style={styles.fieldLabel}>EMAIL ADDRESS <Text style={styles.requiredMark}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#8E9991"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            returnKeyType="next"
            value={email}
            onChangeText={setEmail}
          />
          {showRequired && !emailValid && (
            <Text style={styles.fieldError}>Enter a valid email address.</Text>
          )}

          <Text style={styles.fieldLabel}>PHONE NUMBER <Text style={styles.requiredMark}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Indian mobile with country code, e.g. +919876543210"
            placeholderTextColor="#8E9991"
            autoComplete="tel"
            keyboardType="phone-pad"
            returnKeyType="done"
            value={phone}
            onChangeText={handlePhoneChange}
          />
          {showRequired && !phoneValid && (
            <Text style={styles.fieldError}>Use an Indian mobile number in +91 format.</Text>
          )}

          <Text style={styles.fieldLabel}>PHONE VERIFICATION <Text style={styles.requiredMark}>*</Text></Text>
          <TouchableOpacity
            style={[styles.secondaryButton, (!phoneValid || sendingOtp) && styles.disabledButton]}
            onPress={sendOtp}
            disabled={sendingOtp}
          >
            <Text style={styles.secondaryButtonText}>
              {sendingOtp ? "Sending code…" : codeWasSentForPhone ? "Resend verification code" : "Send verification code"}
            </Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="6-digit SMS code"
            placeholderTextColor="#8E9991"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={(value) => {
              setOtp(value.replace(/\D/g, ""));
              setVerificationToken("");
              setFormError("");
              setFormMessage("");
            }}
          />
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              (!codeWasSentForPhone || verifyingOtp || !!verificationToken) && styles.disabledButton,
            ]}
            onPress={verifyOtp}
            disabled={!codeWasSentForPhone || verifyingOtp || !!verificationToken}
          >
            <Text style={styles.secondaryButtonText}>
              {verificationToken ? "Phone verified" : verifyingOtp ? "Verifying…" : "Verify phone number"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>PASSWORD <Text style={styles.requiredMark}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="At least 8 characters"
            placeholderTextColor="#8E9991"
            autoComplete="new-password"
            secureTextEntry
            returnKeyType="done"
            value={password}
            onChangeText={setPassword}
          />
          {showRequired && password.length < 8 && (
            <Text style={styles.fieldError}>Use at least 8 characters.</Text>
          )}

          {!!formError && <Text accessibilityRole="alert" style={styles.formError}>{formError}</Text>}
          {!!formMessage && <Text accessibilityLiveRegion="polite" style={styles.formMessage}>{formMessage}</Text>}

          <TouchableOpacity
            style={[styles.button, (submitting || !verificationToken) && styles.disabledButton]}
            onPress={onSubmit}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>{submitting ? "Creating account…" : "Create account"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>
              Already have an account? <Text style={styles.linkAccent}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: "#F5F7F5" },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 28 },
  form: { width: "100%", maxWidth: 480, alignSelf: "center" },
  eyebrow: { color: "#24764F", fontSize: 10, fontWeight: "800", letterSpacing: 1.1, marginBottom: 8 },
  title: { color: "#1B2E24", fontSize: 28, fontWeight: "900" },
  subtitle: { color: "#78857D", fontSize: 13, marginTop: 6, marginBottom: 22 },
  fieldLabel: { color: "#53645A", fontSize: 10, fontWeight: "800", marginBottom: 6, letterSpacing: 0.4 },
  requiredMark: { color: "#C44737", fontWeight: "900" },
  input: {
    minHeight: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#1B2E24",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#DDE5DF",
    fontSize: 14,
  },
  fieldError: { color: "#B42318", fontSize: 12, marginTop: -8, marginBottom: 12 },
  secondaryButton: {
    minHeight: 44,
    borderColor: "#24764F",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: { color: "#1C6542", fontWeight: "700", fontSize: 13 },
  disabledButton: { opacity: 0.55 },
  button: {
    minHeight: 50,
    backgroundColor: "#F5BE3D",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: { color: "#203126", fontWeight: "900", fontSize: 15 },
  formError: { color: "#B42318", fontSize: 13, marginBottom: 8 },
  formMessage: { color: "#24764F", fontSize: 13, marginBottom: 8 },
  link: { color: "#758279", textAlign: "center", marginTop: 20, fontSize: 12 },
  linkAccent: { color: "#24764F", fontWeight: "800" },
});
