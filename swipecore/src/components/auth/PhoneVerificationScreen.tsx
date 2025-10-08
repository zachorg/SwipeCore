import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Keyboard,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { verificationService } from "../../services/verificationService";
import { otpService } from "../../services/otpService";
import {
  getHash,
  startOtpListener,
  removeListener,
  getOtp,
} from "react-native-otp-verify";

interface PhoneVerificationScreenProps {
  onComplete: () => void;
}

export function PhoneVerificationScreen({
  onComplete,
}: PhoneVerificationScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [smsSupported, setSmsSupported] = useState(false);
  const { setIsAuthenticated } = useAuth();

  // Check if SMS auto-detection is supported
  useEffect(() => {
    const checkSmsSupport = async () => {
      try {
        // For Android, we can check if we can get hash
        if (Platform.OS === "android") {
          await getHash();
          setSmsSupported(true);
          console.log("SMS auto-detection is supported on Android");
        } else {
          // For iOS, we assume it's supported but limited
          setSmsSupported(true);
          console.log("SMS auto-detection is supported on iOS");
        }
      } catch (error) {
        console.log("SMS auto-detection not supported:", error);
        setSmsSupported(false);
      }
    };

    checkSmsSupport();
  }, []);

  // Start SMS listener when OTP is sent
  useEffect(() => {
    if (isOtpSent && smsSupported) {
      startSmsListener();
    }

    return () => {
      if (smsSupported) {
        removeListener();
      }
    };
  }, [isOtpSent, smsSupported]);

  // Start SMS listener for auto-detection
  const startSmsListener = async () => {
    try {
      if (Platform.OS === "android") {
        // Get hash for Android
        const hash = await getHash();
        console.log("App hash:", hash);
      }

      // Start listening for SMS
      const subscription = await startOtpListener((message: string) => {
        console.log("SMS received:", message);

        // Extract OTP from message (look for 6-digit number)
        const otpMatch = message.match(/\b\d{6}\b/);
        if (otpMatch) {
          const detectedOtp = otpMatch[0];
          console.log("Auto-detected OTP:", detectedOtp);
          setOtp(detectedOtp);

          // Auto-verify if we have the complete OTP
          setTimeout(() => {
            handleVerifyOtp(true);
          }, 500); // Small delay to ensure state is updated
        }
      });

      // Also try to get OTP immediately (for some cases)
      getOtp()
        .then((success: boolean) => {
          console.log("Immediate OTP check result:", success);
          // getOtp returns boolean, the actual OTP will come through the listener
        })
        .catch((error) => {
          console.log("Immediate OTP check failed:", error);
        });
    } catch (error) {
      console.error("Failed to start SMS listener:", error);
      // Don't show error to user as manual entry is still possible
    }
  };

  // Format phone number as user types
  const handlePhoneNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 10) {
      let formatted = cleaned;
      if (cleaned.length >= 3) {
        formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      }
      if (cleaned.length >= 6) {
        formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(
          3,
          6
        )}-${cleaned.slice(6)}`;
      }
      setPhoneNumber(formatted);

      // Auto-dismiss keyboard on iOS when phone number is complete
      if (Platform.OS === "ios" && cleaned.length === 10) {
        Keyboard.dismiss();
      }
    }
  };

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, "").length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formattedPhone = `+1${phoneNumber.replace(/\D/g, "")}`;
      console.log("Sending OTP to:", formattedPhone);

      const response = await otpService.sendOtp(formattedPhone);

      if (response && response.success) {
        setIsOtpSent(true);
        setError("");
        Alert.alert("Success", "Verification code sent to your phone!");
      } else {
        throw new Error("Failed to send OTP");
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      setError("Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (autoVerified = false) => {
    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formattedPhone = `+1${phoneNumber.replace(/\D/g, "")}`;
      console.log("Verifying OTP...", autoVerified ? "(auto-detected)" : "");

      const response = await otpService.verifyOtp(formattedPhone, otp);

      if (
        response &&
        response.success &&
        response.accessToken &&
        response.refreshToken
      ) {
        // Store verification in secure storage
        try {
          await verificationService.storeVerification({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          });
          setIsAuthenticated(true);
          console.log("OTP verification successful");

          // Show success message for auto-verification
          if (autoVerified) {
            Alert.alert("Success", "Code automatically detected and verified!");
          }

          onComplete();
        } catch (storageError) {
          console.error("Failed to store verification:", storageError);
          setError("Failed to store verification");
        }
      } else {
        throw new Error("Invalid OTP response");
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      setError("Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    // Reset state
    setPhoneNumber("");
    setOtp("");
    setIsOtpSent(false);
    setError("");
    // Note: In React Navigation, we don't need onBack as navigation is handled by the stack
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="phone-portrait" size={32} color="white" />
          </View>
          <Text style={styles.title}>
            {isOtpSent ? "Enter Verification Code" : "Verify Your Phone"}
          </Text>
          <Text style={styles.subtitle}>
            {isOtpSent
              ? `We've sent a 6-digit code to ${phoneNumber}`
              : "Enter your phone number to receive a verification code"}
          </Text>
          {isOtpSent && smsSupported && (
            <View style={styles.autoDetectContainer}>
              <Ionicons name="flash" size={16} color="#10B981" />
              <Text style={styles.autoDetectText}>Auto-detection enabled</Text>
            </View>
          )}
        </View>

        {/* Phone Number Input */}
        {!isOtpSent && (
          <View style={styles.inputSection}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="(555) 123-4567"
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              keyboardType="phone-pad"
              editable={!isLoading}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              blurOnSubmit={true}
            />

            {/* Consent Checkbox */}
            <View style={styles.consentContainer}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: consentChecked ? "#8B5CF6" : "transparent",
                  },
                ]}
                onPress={() => setConsentChecked(!consentChecked)}
              >
                {consentChecked && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </TouchableOpacity>
              <Text style={styles.consentText}>
                I consent to receive SMS messages for verification purposes. Msg
                & data rates may apply.
              </Text>
            </View>

            {consentChecked && (
              <TouchableOpacity
                style={[
                  styles.button,
                  (!phoneNumber ||
                    phoneNumber.replace(/\D/g, "").length !== 10) &&
                    styles.buttonDisabled,
                ]}
                onPress={handleSendOtp}
                disabled={
                  isLoading ||
                  !phoneNumber ||
                  phoneNumber.replace(/\D/g, "").length !== 10
                }
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.buttonText}>Sending...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="shield-checkmark" size={20} color="white" />
                    <Text style={styles.buttonText}>
                      Send Verification Code
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* OTP Input */}
        {isOtpSent && (
          <View style={styles.inputSection}>
            <Text style={styles.label}>Verification Code</Text>
            {smsSupported && (
              <Text style={styles.helperText}>
                Code will be automatically detected from SMS
              </Text>
            )}
            <TextInput
              style={styles.otpInput}
              placeholder="123456"
              value={otp}
              onChangeText={(value) => {
                const cleanedValue = value.replace(/\D/g, "").slice(0, 6);
                setOtp(cleanedValue);

                // Auto-dismiss keyboard on iOS when OTP is complete
                if (Platform.OS === "ios" && cleanedValue.length === 6) {
                  Keyboard.dismiss();
                }
              }}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isLoading}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              blurOnSubmit={true}
            />

            <TouchableOpacity
              style={[
                styles.verifyButton,
                (!otp || otp.length !== 6) && styles.buttonDisabled,
              ]}
              onPress={() => handleVerifyOtp()}
              disabled={isLoading || !otp || otp.length !== 6}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.buttonText}>Verifying...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Verify Code</Text>
              )}
            </TouchableOpacity>

            {/* Resend Code */}
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleSendOtp}
              disabled={isLoading}
            >
              <Text style={styles.resendText}>Resend Code</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: "#8B5CF6",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: "#10B981",
    marginBottom: 8,
    fontStyle: "italic",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    textAlign: "center",
    backgroundColor: "white",
    marginBottom: 16,
  },
  consentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  consentText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
    lineHeight: 20,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    textAlign: "center",
    backgroundColor: "white",
    marginBottom: 16,
    letterSpacing: 8,
    fontFamily: "monospace",
  },
  button: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  verifyButton: {
    backgroundColor: "#10B981",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  resendButton: {
    alignItems: "center",
  },
  resendText: {
    color: "#8B5CF6",
    fontSize: 16,
    fontWeight: "500",
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  autoDetectContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F0FDF4",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  autoDetectText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
});
