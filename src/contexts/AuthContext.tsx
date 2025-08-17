import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  VerificationData,
  verificationService,
} from "@/services/verificationService";
import userProfileService from "@/services/userProfileService";

interface AuthContextType {
  verificationData: Omit<VerificationData, "verifiedAt">;
  isProfileComplete: boolean;
  loadingVerification: boolean;
  loadingUserProfile: boolean;
  setVerificationData: (data: Omit<VerificationData, "verifiedAt">) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [loadingVerification, setLoadingVerification] = useState(true);
  const [loadingUserProfile, setLoadingUserProfile] = useState(true);
  const [verificationData, setVerificationData] =
    useState<VerificationData | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(true);

  const checkVerificationStatus = async () => {
    try {
      console.log("🔍 Checking verification status in AuthContext...");

      // Get verification status from verification service
      const hasValidVerification =
        await verificationService.hasValidVerification();

      if (hasValidVerification) {
        console.log("✅ User has valid verification, setting verified to true");
        const verificationData =
          await verificationService.getStoredVerification();
        setVerificationData(verificationData);
      } else {
        console.log(
          "❌ User verification invalid or expired, setting verified to false"
        );
        setVerificationData(null);
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (
        verificationData !== null &&
        (verificationData.age === undefined ||
          verificationData.gender === undefined)
      ) {
        // check if user profile exists
        const userProfile =
          await userProfileService.getUserProfileViaPhoneNumber(
            verificationData.phoneNumber
          );
        if (userProfile) {
          setIsProfileComplete(true);
          setVerificationData({
            ...verificationData,
            age: userProfile.age,
            gender: userProfile.gender,
          });
        } else {
          setIsProfileComplete(false);
        }
        setLoadingUserProfile(false);
      }
    };
    fetchUserProfile();
    if (verificationData) {
      verificationService.storeVerification(verificationData);
    }
  }, [verificationData]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("🚀 Initializing authentication...");

        // First check if user has valid verification
        await checkVerificationStatus();
        setLoadingVerification(false);
      } catch (error) {
        console.error("Error initializing auth:", error);
        setLoadingVerification(false);
      }
    };

    initializeAuth();
  }, []);

  const value: AuthContextType = {
    verificationData,
    isProfileComplete,
    loadingVerification,
    loadingUserProfile,
    setVerificationData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
