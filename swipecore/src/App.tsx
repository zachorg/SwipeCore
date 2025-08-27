import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoadingState } from "./components/LoadingState";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { PhoneVerificationScreen } from "./components/auth/PhoneVerificationScreen";
import { GetStartedScreen } from "./components/GetStartedScreen";
import { UserProfileScreen } from "./components/UserProfileScreen";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { useInAppBrowser } from "./hooks/useInAppBrowser";

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
    GoToScreenBasedOnAuth(
      navigation,
      loadingAuthentication,
      isAuthenticated,
      loadingUserProfile,
      userProfile
    );
  }, [isAuthenticated]);

  if (loadingAuthentication) {
    return <LoadingState />;
  }
  return <GetStartedScreen onComplete={handleComplete} />;
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

  // Use useEffect to handle navigation when authenticated
  useEffect(() => {
    GoToScreenBasedOnAuth(
      navigation,
      loadingAuthentication,
      isAuthenticated,
      loadingUserProfile,
      userProfile
    );
  }, [isAuthenticated]);

  if (loadingAuthentication) {
    return <LoadingState />;
  }

  // If authenticated, show loading while navigating
  if (isAuthenticated) {
    return <LoadingState />;
  }

  return <PhoneVerificationScreen onComplete={handleComplete} />;
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
  // Initialize InAppBrowser
  useInAppBrowser();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" backgroundColor="#FFFFFF" />
          <AuthProvider>
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
                <Stack.Screen name="Welcome" component={WelcomeScreenWrapper} />
                <Stack.Screen name="Index" component={Index} />
                <Stack.Screen name="NotFound" component={NotFound} />
              </Stack.Navigator>
            </NavigationContainer>
          </AuthProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
