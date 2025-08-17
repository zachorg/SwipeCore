import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Smartphone, Shield } from "lucide-react";
import { otpService } from "@/services/otpService";
import { useAuth } from "@/contexts/AuthContext";

interface PhoneVerificationScreenProps {
  onVerified: (phoneNumber: string, verificationId: string) => void;
  onBack: () => void;
}

export const PhoneVerificationScreen: React.FC<
  PhoneVerificationScreenProps
> = ({ onVerified, onBack }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { setVerificationData } = useAuth();

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

      if (response.success) {
        setIsOtpSent(true);
        setError("");
      } else {
        throw new Error(response.message || "Failed to send OTP");
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      setError(`Failed to send OTP: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formattedPhone = `+1${phoneNumber.replace(/\D/g, "")}`;
      console.log("Verifying OTP...");

      const response = await otpService.verifyOtp(formattedPhone, otp);

      if (response.success) {
        // Store verification ID in persistent storage
        if (response.verificationId) {
          try {
            setVerificationData({
              verificationId: response.verificationId,
              phoneNumber: formattedPhone,
            });
            console.log("OTP verification successful");
          } catch (storageError) {
            console.error("Failed to store verification ID:", storageError);
          }
        }

        // Call onVerified with the verification ID from backend response
        onVerified(phoneNumber, response.verificationId);
      } else {
        throw new Error(response.message || "Failed to verify OTP");
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      setError(`Verification failed: ${error.message}`);
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
    onBack();
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-8">
      <div className="max-w-sm mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isOtpSent ? "Enter Verification Code" : "Verify Your Phone"}
          </h1>
          <p className="text-gray-600">
            {isOtpSent
              ? `We've sent a 6-digit code to ${phoneNumber}`
              : "Enter your phone number to receive a verification code"}
          </p>
        </div>

        {/* Phone Number Input */}
        {!isOtpSent && (
          <div className="space-y-4 mb-6">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phoneNumber}
                onChange={(e) => handlePhoneNumberChange(e.target.value)}
                className="text-center text-lg"
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={handleSendOtp}
              disabled={
                isLoading ||
                !phoneNumber ||
                phoneNumber.replace(/\D/g, "").length !== 10
              }
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending...
                </div>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Send Verification Code
                </>
              )}
            </Button>
          </div>
        )}

        {/* OTP Input */}
        {isOtpSent && (
          <div className="space-y-4 mb-6">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Verification Code
              </label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={handleVerifyOtp}
              disabled={isLoading || !otp || otp.length !== 6}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Verifying...
                </div>
              ) : (
                "Verify Code"
              )}
            </Button>

            {/* Resend Code */}
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={handleSendOtp}
                className="text-purple-600 hover:text-purple-700"
                disabled={isLoading}
              >
                Resend Code
              </Button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="w-full text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    </div>
  );
};
