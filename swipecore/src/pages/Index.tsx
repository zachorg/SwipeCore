import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SwipeDeck } from "../components/SwipeDeck";
import { RestaurantCard } from "../types/Types";
import { initializeDeviceOptimizations } from "../utils/deviceOptimization";
import { useAuth } from "../contexts/AuthContext";
import { useFilterContext } from "../contexts/FilterContext";
import { FilterPanelRN } from "../components/filters/FilterPanelRN";
import { FilterTest } from "../components/FilterTest";
import { VoicePrompt } from "../components/VoicePrompt";

const Index = () => {
  const { isAuthenticated, userProfile } = useAuth();
  const { filters: contextFilters } = useFilterContext();
  const [showFilters, setShowFilters] = useState(false);
  const [showVoiceTest, setShowVoiceTest] = useState(false);
  const [showVoicePrompt, setShowVoicePrompt] = useState(false);

  // Get status bar height dynamically
  const getStatusBarHeight = () => {
    if (Platform.OS === "ios") {
      // iOS: Default status bar height
      return 44;
    } else {
      // Android: Use StatusBar.currentHeight
      return StatusBar.currentHeight || 0;
    }
  };

  const statusBarHeight = getStatusBarHeight();

  // Initialize device optimizations on component mount
  useEffect(() => {
    initializeDeviceOptimizations();
  }, []);

  const handleSwipeAction = (cardId: string, action: "menu" | "pass") => {
    // Swipe action handled
  };

  const handleCardTap = (card: RestaurantCard) => {
    // In a real app, this would navigate to restaurant detail page
  };

  const handleFilterButtonReady = (button: React.ReactNode) => {
    // Filter button is ready - could be used for additional UI
  };

  const handleFiltersApplied = () => {
    console.log("📋 Index - Filters applied via FilterPanel");
    setShowFilters(false);
  };

  const handleFiltersCleared = () => {
    console.log("📋 Index - Filters cleared via FilterPanel");
  };

  const handleVoiceFiltersApplied = (
    filters: Array<{ filterId: string; value: any }>
  ) => {
    console.log("🎤 Index - Voice filters applied:", filters);
    setShowVoicePrompt(false);
    // VoicePrompt now handles filter application directly through FilterProvider
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
          <TouchableOpacity
            style={styles.filtersButton}
            onPress={() => {
              setShowFilters(true);
            }}
          >
            <Ionicons name="funnel" size={20} color="#64748B" />
            <Text style={styles.filtersButtonText}>
              Filters{" "}
              {contextFilters.length > 0 ? `(${contextFilters.length})` : ""}
            </Text>
          </TouchableOpacity>

          <FilterPanelRN
            isOpen={showFilters}
            onOpenChange={setShowFilters}
            onFiltersApplied={handleFiltersApplied}
            onFiltersCleared={handleFiltersCleared}
          />
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
          autoStart: true,
          maxCards: 2,
          prefetchDetails: true,
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 16,
    paddingHorizontal: 24,
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
  filtersButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filtersButtonText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3B82F6",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  voiceButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  voiceTestButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  voiceTestButtonText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
});

export default Index;
