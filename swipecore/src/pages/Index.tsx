import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, Dimensions } from "react-native";
import { SwipeDeck } from "../components/SwipeDeck";
import { RestaurantCard } from "../types/Types";
import { initializeDeviceOptimizations } from "../utils/deviceOptimization";
import { useAuth } from "../contexts/AuthContext";

const Index = () => {
  const { isAuthenticated, userProfile } = useAuth();
  const [swipeStats, setSwipeStats] = useState({ likes: 0, passes: 0 });

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
      <View style={styles.header}>
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

      {/* Debug Stats */}
      {__DEV__ && (
        <View style={styles.debugStats}>
          <Text style={styles.debugText}>👍 {swipeStats.likes} | 👎 {swipeStats.passes}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  logoContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
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
    color: "#8B5CF6",
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
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
