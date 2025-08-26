import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { verificationService } from "../services/verificationService";
import userProfileService, {
  UserProfile,
} from "../services/userProfileService";

interface AuthContextType {
  userProfile: Omit<UserProfile, "id" | "created_at" | "updated_at"> | null;
  loadingAuthentication: boolean;
  isAuthenticated: boolean;
  loadingUserProfile: boolean;
  setUserProfile: (
    profile: Omit<UserProfile, "id" | "created_at" | "updated_at">
  ) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
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
  const [loadingAuthentication, setLoadingAuthentication] = useState(true);
  const [loadingUserProfile, setLoadingUserProfile] = useState(true);
  const [userProfile, setUserProfile] = useState<Omit<
    UserProfile,
    "id" | "created_at" | "updated_at"
  > | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const initializeAuth = async () => {
    try {
      console.log("[AuthContext] Initializing authentication...");
      setLoadingAuthentication(true);

      // Get verification status from verification service
      const isVerified =
        (await verificationService.isVerified()) ||
        (await verificationService.refreshAccessToken());
      if (isVerified) {
        console.log(
          "[AuthContext] User has valid verification, setting verified to true"
        );
        setIsAuthenticated(true);
      } else {
        console.info("User verification invalid or expired");
      }
    } catch (error) {
      console.error("[AuthContext] Error checking verification status:", error);
    } finally {
      setLoadingAuthentication(false);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (isAuthenticated && userProfile === null) {
          console.log("[AuthContext] Fetching user profile");
          // check if user profile exists
          const userProfile = await userProfileService.getUserProfile();
          if (userProfile) {
            console.log(
              "[AuthContext] Fetched user profile:",
              JSON.stringify(userProfile)
            );

            setUserProfile(userProfile);
            setLoadingUserProfile(false);
          } else {
            throw new Error("Failed to fetch user profile");
          }
        }
      } catch (error) {
        console.error("[AuthContext] Error fetching user profile:", error);
        setLoadingUserProfile(false);
      }
    };
    fetchUserProfile();
  }, [isAuthenticated]);

  // Initialize authentication only once when component mounts
  useEffect(() => {
    const initializeAuthOnce = async () => {
      try {
        console.log("[AuthContext] Initializing authentication...");

        // First check if user has valid verification
        await initializeAuth();
      } catch (error) {
        console.error("[AuthContext] Error initializing auth:", error);
      } finally {
        setLoadingAuthentication(false);
      }
    };

    initializeAuthOnce();
  }, []); // Empty dependency array ensures this runs only once

  const value: AuthContextType = {
    isAuthenticated,
    userProfile,
    loadingAuthentication: loadingAuthentication,
    loadingUserProfile,
    setUserProfile,
    setIsAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
