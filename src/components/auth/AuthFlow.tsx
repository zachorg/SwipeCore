import React, { useState, useEffect } from "react";
import { GetStartedScreen } from "../GetStartedScreen";
import { PhoneVerificationScreen } from "./PhoneVerificationScreen";
import { UserProfileScreen } from "../UserProfileScreen";
import { useAuth } from "@/contexts/AuthContext";

type AuthStep =
  | "get-started"
  | "phone-verification"
  | "user-profile"
  | "welcome";

interface AuthFlowProps {
  onComplete: () => void;
}

export const AuthFlow: React.FC<AuthFlowProps> = ({ onComplete }) => {
  const { isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState<AuthStep>("get-started");

  // Check for existing verification on mount
  useEffect(() => {
    const checkExistingVerification = async () => {
      try {
        if (isAuthenticated) {
          console.log(
            "[AuthFlow]: User has valid verification, going to welcome screen"
          );
          setCurrentStep("welcome");
        } else {
          console.log(
            "[AuthFlow]: No valid verification found, starting from get-started"
          );
          setCurrentStep("get-started");
        }
      } catch (error) {
        console.error("[AuthFlow] Error checking verification status:", error);
        // Continue with normal flow if verification check fails
        setCurrentStep("get-started");
      }
    };

    checkExistingVerification();
  }, []);

  const handleGetStarted = () => {
    console.log("[AuthFlow] Moving to phone verification");
    setCurrentStep("phone-verification");
  };

  const handleExitAuthFlow = () => {
    console.log("[AuthFlow] Profile complete, moving to welcome screen");
    onComplete();
  };

  const handlePhoneVerified = (phone: string) => {
    console.log("[AuthFlow] Phone verified, moving to user profile setup");
    // setCurrentStep("user-profile");
    handleExitAuthFlow();
  };

  const handleBack = () => {
    switch (currentStep) {
      case "phone-verification":
        console.log("[AuthFlow] Going back to get started");
        setCurrentStep("get-started");
        break;
      case "user-profile":
        console.log("[AuthFlow] Going back to phone verification");
        setCurrentStep("phone-verification");
        break;
      case "welcome":
        console.log("[AuthFlow] Going back to user profile");
        setCurrentStep("user-profile");
        break;
      default:
        break;
    }
  };

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
        return <UserProfileScreen onComplete={handleExitAuthFlow} />;

      default:
        return <GetStartedScreen onGetStarted={handleGetStarted} />;
    }
  };

  return (
    <div
      className="flex flex-col bg-white/10 backdrop-blur-xl overflow-hidden"
      style={{
        height: `calc(100vh - var(--safe-area-inset-top))`,
      }}
    >
      {renderCurrentStep()}
    </div>
  );
};
