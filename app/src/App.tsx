import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { View, Text } from "react-native";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { FilterProvider } from "./contexts/FilterContext";
import { LoadingState } from "./components/LoadingState";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { PhoneVerificationScreen } from "./components/auth/PhoneVerificationScreen";
import { GetStartedScreen } from "./components/GetStartedScreen";
import { UserProfileScreen } from "./components/UserProfileScreen";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { useInAppBrowser } from "./hooks/useInAppBrowser";
import { ErrorBoundary } from "./components/ErrorBoundary";

const Stack = createStackNavigator();
const queryClient = new QueryClient();

const GoToScreenBasedOnAuth = (
  navigation: any,
  loadingAuthentication: boolean,
  isAuthenticated: boolean,
  loadingUserProfile: boolean,
  userProfile: any
) => {
  const auth = !loadingAuthentication && isAuthenticated;
  const profile = !loadingUserProfile && userProfile;

  if (auth) {
    if (profile) {
      navigation.navigate("Welcome" as never);
    } else {
      navigation.navigate("UserProfile" as never);
    }
  } else {
    navigation.navigate("PhoneVerification" as never);
  }
};

// Navigation wrapper components
const GetStartedScreenWrapper = () => {
  const navigation = useNavigation();
  const {
    loadingAuthentication,
    isAuthenticated,
    loadingUserProfile,
    userProfile,
  } = useAuth();

  const handleComplete = () => {
    navigation.navigate("PhoneVerification" as never);
  };

  useEffect(() => {
    // Only navigate away if authentication is complete AND user is authenticated
    if (!loadingAuthentication && isAuthenticated) {
      GoToScreenBasedOnAuth(
        navigation,
        loadingAuthentication,
        isAuthenticated,
        loadingUserProfile,
        userProfile
      );
    }
  }, [loadingAuthentication, isAuthenticated, loadingUserProfile, userProfile]);

  // Show loading while checking authentication
  if (loadingAuthentication) {
    return <LoadingState />;
  }

  // Show Get Started screen if user is not authenticated
  if (!isAuthenticated) {
    return <GetStartedScreen onComplete={handleComplete} />;
  }

  // Show loading while navigating to next screen
  return <LoadingState />;
};

const PhoneVerificationScreenWrapper = () => {
  const navigation = useNavigation();
  const {
    loadingAuthentication,
    isAuthenticated,
    loadingUserProfile,
    userProfile,
  } = useAuth();

  const handleComplete = () => {
    navigation.navigate("UserProfile" as never);
  };

  // Only navigate away if user becomes authenticated
  useEffect(() => {
    if (!loadingAuthentication && isAuthenticated) {
      GoToScreenBasedOnAuth(
        navigation,
        loadingAuthentication,
        isAuthenticated,
        loadingUserProfile,
        userProfile
      );
    }
  }, [loadingAuthentication, isAuthenticated, loadingUserProfile, userProfile]);

  // Show loading while checking authentication
  if (loadingAuthentication) {
    return <LoadingState />;
  }

  // Show phone verification if user is not authenticated
  if (!isAuthenticated) {
    return <PhoneVerificationScreen onComplete={handleComplete} />;
  }

  // Show loading while navigating to next screen
  return <LoadingState />;
};

const UserProfileScreenWrapper = () => {
  const navigation = useNavigation();
  const { loadingUserProfile, userProfile } = useAuth();

  const handleComplete = () => {
    navigation.navigate("Welcome" as never);
  };

  // Use useEffect to handle navigation when profile is complete
  useEffect(() => {
    if (userProfile?.phone_number && userProfile?.age) {
      handleComplete();
    }
  }, [userProfile]);

  if (loadingUserProfile) {
    return <LoadingState />;
  }

  // If profile is complete, show loading while navigating
  if (userProfile?.phone_number && userProfile?.age) {
    return <LoadingState />;
  }

  return <UserProfileScreen onComplete={handleComplete} />;
};

const WelcomeScreenWrapper = () => {
  const navigation = useNavigation();

  const handleVoiceFiltersApplied = (
    filters: Array<{ filterId: string; value: any }>
  ) => {
    navigation.navigate("Index" as never);
  };

  const handleSkip = () => {
    navigation.navigate("Index" as never);
  };

  return (
    <WelcomeScreen
      onVoiceFiltersApplied={handleVoiceFiltersApplied}
      onSkip={handleSkip}
    />
  );
};

export default function App() {
  console.log("=== APP STARTING ===");

  // Initialize InAppBrowser - TEMPORARILY COMMENTED OUT FOR DEBUGGING
  // useInAppBrowser();

  console.log("Rendering main App component...");

  try {
    return (
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
              <StatusBar style="dark" backgroundColor="#FFFFFF" />
              <AuthProvider>
                <FilterProvider>
                  <NavigationContainer>
                    <Stack.Navigator
                      initialRouteName="GetStarted"
                      screenOptions={{
                        headerShown: false,
                        cardStyle: { backgroundColor: "#FFFFFF" },
                      }}
                    >
                      <Stack.Screen
                        name="GetStarted"
                        component={GetStartedScreenWrapper}
                      />
                      <Stack.Screen
                        name="PhoneVerification"
                        component={PhoneVerificationScreenWrapper}
                      />
                      <Stack.Screen
                        name="UserProfile"
                        component={UserProfileScreenWrapper}
                      />
                      <Stack.Screen
                        name="Welcome"
                        component={WelcomeScreenWrapper}
                      />
                      <Stack.Screen name="Index" component={Index} />
                      <Stack.Screen name="NotFound" component={NotFound} />
                    </Stack.Navigator>
                  </NavigationContainer>
                </FilterProvider>
              </AuthProvider>
            </SafeAreaProvider>
          </QueryClientProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error("=== CRITICAL ERROR IN APP COMPONENT ===", error);
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
          Critical Error!
        </Text>
        <Text style={{ fontSize: 14, textAlign: "center", marginBottom: 10 }}>
          The app encountered a critical error during initialization.
        </Text>
        <Text style={{ fontSize: 12, color: "red" }}>{error?.toString()}</Text>
      </View>
    );
  }
}
