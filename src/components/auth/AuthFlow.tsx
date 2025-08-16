import React, { useState, useEffect } from "react";
import { GetStartedScreen } from "./GetStartedScreen";
import { PhoneVerificationScreen } from "./PhoneVerificationScreen";
import { UserProfileScreen } from "./UserProfileScreen";
import { verificationService } from "@/services/verificationService";

type AuthStep =
  | "get-started"
  | "phone-verification"
  | "user-profile"
  | "welcome";

interface AuthFlowProps {
  onComplete: () => void;
}

export const AuthFlow: React.FC<AuthFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>("get-started");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);

  // Check for existing verification on mount
  useEffect(() => {
    const checkExistingVerification = async () => {
      try {
        setIsCheckingVerification(true);
        console.log("🔍 AuthFlow: Checking verification status...");

        // Check if user has valid verification stored
        const verificationStatus =
          await verificationService.getVerificationStatus();

        if (verificationStatus.isValid) {
          console.log(
            "✅ AuthFlow: User has valid verification, going to welcome screen"
          );
          setCurrentStep("welcome");
        } else {
          console.log(
            "ℹ️ AuthFlow: No valid verification found, starting from get-started"
          );
          setCurrentStep("get-started");
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
        // Continue with normal flow if verification check fails
        setCurrentStep("get-started");
      } finally {
        setIsCheckingVerification(false);
      }
    };

    checkExistingVerification();
  }, []);

  const handleGetStarted = () => {
    console.log("🚀 User clicked get started, moving to phone verification");
    setCurrentStep("phone-verification");
  };

  const handleExitAuthFlow = () => {
    console.log("👤 Profile complete, moving to welcome screen");
    onComplete();
  };

  const handlePhoneVerified = (
    phone: string,
    verificationId: string,
    isNewUser: boolean
  ) => {
    console.log("📱 Phone verified, moving to user profile setup");
    setPhoneNumber(phone);

    if (isNewUser) {
      setCurrentStep("user-profile");
    } else {
      handleExitAuthFlow();
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case "phone-verification":
        console.log("⬅️ Going back to get started");
        setCurrentStep("get-started");
        break;
      case "user-profile":
        console.log("⬅️ Going back to phone verification");
        setCurrentStep("phone-verification");
        break;
      case "welcome":
        console.log("⬅️ Going back to user profile");
        setCurrentStep("user-profile");
        break;
      default:
        break;
    }
  };

  // Show loading while checking verification
  if (isCheckingVerification) {
    return (
      <div className="h-screen flex flex-col bg-white/10 backdrop-blur-xl overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600">Checking verification status...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "get-started":
        return <GetStartedScreen onGetStarted={handleGetStarted} />;

      case "phone-verification":
        return (
          <PhoneVerificationScreen
            onVerified={handlePhoneVerified}
            onBack={handleBack}
          />
        );

      case "user-profile":
        return (
          <UserProfileScreen
            phoneNumber={phoneNumber}
            onComplete={handleExitAuthFlow}
          />
        );

      default:
        return <GetStartedScreen onGetStarted={handleGetStarted} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white/10 backdrop-blur-xl overflow-hidden">
      {renderCurrentStep()}
    </div>
  );
};
