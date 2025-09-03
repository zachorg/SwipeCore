import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Platform,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { SwipeDeck } from "../components/SwipeDeck";
import { RestaurantCard } from "../types/Types";
import { initializeDeviceOptimizations } from "../utils/deviceOptimization";
import { useAuth } from "../contexts/AuthContext";

const Index = () => {
  const { isAuthenticated, userProfile } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    radius: 5000, // 5km default
    minRating: 3.0,
    priceLevel: "any",
    cuisineTypes: [] as string[],
    openNow: false,
    maxDistance: 10000, // 10km max
  });

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
    console.log(
      "🎯 INDEX - Component mounted, initializing device optimizations"
    );
    initializeDeviceOptimizations();
  }, []);

  // Log when component renders
  useEffect(() => {
    console.log("🎯 INDEX - Component rendered with:", {
      isAuthenticated,
      userProfile: !!userProfile,
      statusBarHeight,
      showFilters,
    });
  });

  const handleSwipeAction = (cardId: string, action: "menu" | "pass") => {
    console.log(`🎯 INDEX - Swiped ${action} on restaurant:`, cardId);
  };

  const handleCardTap = (card: RestaurantCard) => {
    console.log("Tapped on restaurant:", card.title);
    // In a real app, this would navigate to restaurant detail page
  };

  const handleFilterButtonReady = (button: React.ReactNode) => {
    // Filter button is ready - could be used for additional UI
    console.log("Filter button ready");
  };

  const handleFiltersApplied = () => {
    console.log("Filters applied:", filters);
    setShowFilters(false);
    // Here you would typically pass these filters to the SwipeDeck
    // For now, we'll just close the modal
  };

  const handleFiltersCancel = () => {
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setFilters({
      radius: 5000,
      minRating: 3.0,
      priceLevel: "any",
      cuisineTypes: [],
      openNow: false,
      maxDistance: 10000,
    });
  };

  const toggleCuisineType = (cuisine: string) => {
    setFilters((prev) => ({
      ...prev,
      cuisineTypes: prev.cuisineTypes.includes(cuisine)
        ? prev.cuisineTypes.filter((c) => c !== cuisine)
        : [...prev.cuisineTypes, cuisine],
    }));
  };

  const cuisineOptions = [
    "Italian",
    "Chinese",
    "Japanese",
    "Mexican",
    "Indian",
    "Thai",
    "American",
    "French",
    "Mediterranean",
    "Korean",
    "Vietnamese",
    "Greek",
    "Spanish",
    "Turkish",
    "Lebanese",
  ];

  const priceLevels = [
    { value: "any", label: "Any Price" },
    { value: "1", label: "$ (Budget)" },
    { value: "2", label: "$$ (Moderate)" },
    { value: "3", label: "$$$ (Expensive)" },
    { value: "4", label: "$$$$ (Luxury)" },
  ];

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
              console.log(
                "🎯 Filters button pressed, current showFilters:",
                showFilters
              );
              setShowFilters(true);
              console.log("🎯 Set showFilters to true");
            }}
          >
            <Ionicons name="funnel" size={20} color="#64748B" />
            <Text style={styles.filtersButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters Modal */}
      {showFilters && (
        <View style={[styles.filtersOverlay, { paddingTop: statusBarHeight }]}>
          <View style={styles.filtersContainer}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>Filters</Text>
              <TouchableOpacity onPress={handleFiltersCancel}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.filtersContent}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Radius Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Search Radius</Text>
                <Text style={styles.filterValue}>
                  {Math.round(filters.radius / 1000)}km
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1000}
                  maximumValue={filters.maxDistance}
                  value={filters.radius}
                  onValueChange={(value: number) =>
                    setFilters((prev) => ({
                      ...prev,
                      radius: Math.round(value),
                    }))
                  }
                  minimumTrackTintColor="#3B82F6"
                  maximumTrackTintColor="#E2E8F0"
                  thumbTintColor="#3B82F6"
                  step={100}
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>1km</Text>
                  <Text style={styles.sliderLabel}>
                    {Math.round(filters.maxDistance / 1000)}km
                  </Text>
                </View>
              </View>

              {/* Rating Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Minimum Rating</Text>
                <Text style={styles.filterValue}>
                  {filters.minRating}+ stars
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={5}
                  value={filters.minRating}
                  onValueChange={(value: number) =>
                    setFilters((prev) => ({ ...prev, minRating: value }))
                  }
                  minimumTrackTintColor="#3B82F6"
                  maximumTrackTintColor="#E2E8F0"
                  thumbTintColor="#3B82F6"
                  step={0.1}
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>1★</Text>
                  <Text style={styles.sliderLabel}>5★</Text>
                </View>
              </View>

              {/* Price Level Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Price Level</Text>
                <View style={styles.priceButtons}>
                  {priceLevels.map((level) => (
                    <TouchableOpacity
                      key={level.value}
                      style={[
                        styles.priceButton,
                        filters.priceLevel === level.value &&
                          styles.priceButtonActive,
                      ]}
                      onPress={() =>
                        setFilters((prev) => ({
                          ...prev,
                          priceLevel: level.value,
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.priceButtonText,
                          filters.priceLevel === level.value &&
                            styles.priceButtonTextActive,
                        ]}
                      >
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Open Now Filter */}
              <View style={styles.filterSection}>
                <View style={styles.switchRow}>
                  <Text style={styles.filterLabel}>Open Now</Text>
                  <Switch
                    value={filters.openNow}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, openNow: value }))
                    }
                    trackColor={{ false: "#E2E8F0", true: "#3B82F6" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {/* Cuisine Types Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Cuisine Types</Text>
                <View style={styles.cuisineGrid}>
                  {cuisineOptions.map((cuisine) => (
                    <TouchableOpacity
                      key={cuisine}
                      style={[
                        styles.cuisineButton,
                        filters.cuisineTypes.includes(cuisine) &&
                          styles.cuisineButtonActive,
                      ]}
                      onPress={() => toggleCuisineType(cuisine)}
                    >
                      <Text
                        style={[
                          styles.cuisineButtonText,
                          filters.cuisineTypes.includes(cuisine) &&
                            styles.cuisineButtonTextActive,
                        ]}
                      >
                        {cuisine}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Filter Actions */}
            <View style={styles.filterActions}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetFilters}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleFiltersApplied}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

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
            radius: filters.radius,
            type: "restaurant",
            minRating: filters.minRating,
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
  filtersOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  filtersContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    height: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  filtersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  filtersTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
  },
  filtersContent: {
    flex: 1,
    marginBottom: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 16,
    minHeight: 500,
  },
  filtersScrollContent: {
    paddingBottom: 20,
  },
  filterSection: {
    marginBottom: 30,
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },
  filterValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3B82F6",
    marginBottom: 15,
    textAlign: "center",
  },
  slider: {
    height: 40,
    marginVertical: 10,
    width: "100%",
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    paddingHorizontal: 5,
  },
  sliderLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  priceButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: 12,
    marginTop: 10,
  },
  priceButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    minWidth: 80,
    alignItems: "center",
  },
  priceButtonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  priceButtonText: {
    fontSize: 14,
    color: "#64748B",
  },
  priceButtonTextActive: {
    color: "#FFFFFF",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cuisineGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: 12,
    marginTop: 10,
  },
  cuisineButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    minWidth: 70,
    alignItems: "center",
  },
  cuisineButtonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  cuisineButtonText: {
    fontSize: 14,
    color: "#64748B",
  },
  cuisineButtonTextActive: {
    color: "#FFFFFF",
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  resetButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  resetButtonText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "600",
  },
  applyButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  applyButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

export default Index;
