import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { SwipeDeck } from "../components/SwipeDeck";
import { RestaurantCard } from "../types/Types";
import { initializeDeviceOptimizations } from "../utils/deviceOptimization";
import { useAuth } from "../contexts/AuthContext";

const Index = () => {
  const { isAuthenticated, userProfile } = useAuth();
  const [swipeStats, setSwipeStats] = useState({ likes: 0, passes: 0 });

  // Get status bar height dynamically
  const getStatusBarHeight = () => {
    if (Platform.OS === "ios") {
      // iOS: Approximate based on device type
      const { height } = Dimensions.get("window");
      const isIPhoneX = height >= 812; // iPhone X and newer
      return isIPhoneX ? 44 : 20;
    } else {
      // Android: Use StatusBar.currentHeight
      return StatusBar.currentHeight || 0;
    }
  };

  const statusBarHeight = getStatusBarHeight();

  // Log status bar height for debugging
  console.log("Status bar height:", statusBarHeight, "Platform:", Platform.OS);

  // Initialize device optimizations on component mount
  useEffect(() => {
    initializeDeviceOptimizations();
  }, []);

  const handleSwipeAction = (cardId: string, action: "menu" | "pass") => {
    console.log(`Swiped ${action} on restaurant:`, cardId);

    // Update stats
    setSwipeStats((prev) => ({
      ...prev,
      [action === "menu" ? "likes" : "passes"]:
        prev[action === "menu" ? "likes" : "passes"] + 1,
    }));
  };

  const handleCardTap = (card: RestaurantCard) => {
    console.log("Tapped on restaurant:", card.title);
    // In a real app, this would navigate to restaurant detail page
  };

  const handleFilterButtonReady = (button: React.ReactNode) => {
    // Filter button is ready - could be used for additional UI
    console.log("Filter button ready");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: statusBarHeight + 20 }]}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🍕</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.appTitle}>NomNom</Text>
            <Text style={styles.appSubtitle}>Discover amazing restaurants</Text>
          </View>
        </View>
      </View>

      {/* Swipe Deck */}
      <SwipeDeck
        onSwipeAction={handleSwipeAction}
        onCardTap={handleCardTap}
        onFilterButtonReady={handleFilterButtonReady}
        enableFiltering={true}
        statusBarHeight={statusBarHeight}
        initialFilters={[]}
        swipeOptions={{
          searchConfig: {
            radius: 5000, // 5km radius
            type: "restaurant",
            minRating: 3.0,
          },
          autoStart: true,
          maxCards: 2,
          prefetchDetails: true,
          enableFiltering: true,
        }}
      />
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  logoContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoText: {
    fontSize: 24,
    color: "white",
    fontWeight: "bold",
  },
  headerText: {
    flex: 1,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  debugStats: {
    position: "absolute",
    bottom: 16,
    left: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  debugText: {
    color: "white",
    fontSize: 12,
  },
});

export default Index;
