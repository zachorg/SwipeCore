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

const Stack = createStackNavigator();
const queryClient = new QueryClient();

// Navigation wrapper components
const GetStartedScreenWrapper = () => {
  const navigation = useNavigation();

  const handleComplete = () => {
    navigation.navigate("PhoneVerification" as never);
  };

  return <GetStartedScreen onComplete={handleComplete} />;
};

const PhoneVerificationScreenWrapper = () => {
  const navigation = useNavigation();
  const { loadingAuthentication, isAuthenticated } = useAuth();

  const handleComplete = () => {
    navigation.navigate("UserProfile" as never);
    return <LoadingState />;
  };

  if (isAuthenticated) {
    return handleComplete();
  }

  return (
    <>
      {loadingAuthentication ? (
        <LoadingState />
      ) : (
        <PhoneVerificationScreen onComplete={handleComplete} />
      )}
    </>
  );
};

const UserProfileScreenWrapper = () => {
  const navigation = useNavigation();
  const { loadingUserProfile, userProfile } = useAuth();

  const handleComplete = () => {
    navigation.navigate("Welcome" as never);
    return <LoadingState />;
  };

  if (userProfile?.phone_number && userProfile?.age) {
    return handleComplete();
  }

  return (
    <>
      {loadingUserProfile ? (
        <LoadingState />
      ) : (
        <UserProfileScreen onComplete={handleComplete} />
      )}
    </>
  );
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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor="#000000" />
          <AuthProvider>
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName="GetStarted"
                screenOptions={{
                  headerShown: false,
                  cardStyle: { backgroundColor: "#000000" },
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
