// Restaurant Filtering System - React Native Filter Panel Component

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  Switch,
  Dimensions,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import {
  FilterDefinition,
  FILTER_DEFINITIONS,
  Filter as FilterType,
  FilterValue,
} from "@/hooks/useFilters";
import { useFilterContext } from "@/contexts/FilterContext";

interface FilterPanelRNProps {
  // UI props
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  // Optional callbacks for when filters are applied or cleared
  onFiltersApplied?: () => void;
  onFiltersCleared?: () => void;
}

export function FilterPanelRN({
  trigger,
  isOpen: controlledOpen,
  onOpenChange,
  onFiltersApplied,
  onFiltersCleared,
}: FilterPanelRNProps) {
  // Use filter context for centralized state management
  const {
    filters: allFilters,
    addFilter,
    updateFilter,
    removeFilter,
    clearFilters,
    onNewFiltersApplied,
    getFilterValue,
  } = useFilterContext();

  // Local state for distance filter to prevent immediate radius changes
  const [localDistance, setLocalDistance] = useState<number>(10);

  const [isOpen, setIsOpen] = useState(false);

  // Initialize local distance from current filter value
  useEffect(() => {
    const currentDistance = (getFilterValue("distance") as number) || 10;
    setLocalDistance(currentDistance);
  }, [getFilterValue]);

  // Handle controlled/uncontrolled open state
  const actualIsOpen = controlledOpen !== undefined ? controlledOpen : isOpen;
  const setActualIsOpen = useCallback(
    (open: boolean) => {
      if (controlledOpen !== undefined) {
        onOpenChange?.(open);
      } else {
        setIsOpen(open);
      }
    },
    [controlledOpen, onOpenChange]
  );

  // Derive active filters directly instead of using state
  const currentFilters = Array.isArray(allFilters) ? allFilters : [];
  const activeFilters = currentFilters.filter((f) => f.enabled);
  const hasActiveFilters = activeFilters.length > 0;
  const filterCount = activeFilters.length;

  // Debug effect to see when allFilters changes
  useEffect(() => {
    console.log("🎛️ FilterPanelRN - allFilters changed:", allFilters);
    console.log("🎛️ FilterPanelRN - activeFilters:", activeFilters);
    console.log("🎛️ FilterPanelRN - filterCount:", filterCount);
  }, [allFilters, activeFilters, filterCount]);

  const handleFilterUpdate = useCallback(
    (filterId: string, value: FilterValue) => {
      const existingFilter = allFilters.find((f) => f.id === filterId);

      if (existingFilter) {
        updateFilter(filterId, value);
      } else {
        addFilter(filterId, value);
      }
    },
    [allFilters, addFilter, updateFilter]
  );

  const handleFilterRemove = useCallback(
    (filterId: string) => {
      removeFilter(filterId);
    },
    [removeFilter]
  );

  const cuisineTypes = [
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
    { value: 1, label: "$ (Budget)" },
    { value: 2, label: "$$ (Moderate)" },
    { value: 3, label: "$$$ (Expensive)" },
    { value: 4, label: "$$$$ (Luxury)" },
  ];

  const renderCuisineFilter = () => {
    const rawCuisines = (getFilterValue("cuisine") as string[]) || [];
    // Normalize cuisine values to handle any stored inconsistencies
    const selectedCuisines = rawCuisines.map((c) =>
      String(c).toLowerCase().trim()
    );

    const toggleCuisine = (cuisine: string) => {
      // Case-insensitive comparison for checking if cuisine is already selected
      const cuisineLower = cuisine.toLowerCase();
      const isSelected = selectedCuisines.some(
        (c) => String(c).toLowerCase() === cuisineLower
      );

      const newCuisines = isSelected
        ? selectedCuisines.filter(
            (c) => String(c).toLowerCase() !== cuisineLower
          )
        : [...selectedCuisines, cuisine];

      // Normalize cuisine values before passing to filter functions
      const normalizedCuisines = newCuisines.map((c) =>
        String(c).toLowerCase().trim()
      );

      if (normalizedCuisines.length === 0) {
        handleFilterRemove("cuisine");
      } else {
        handleFilterUpdate("cuisine", normalizedCuisines);
      }
    };

    return (
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Cuisine Types</Text>
        <View style={styles.cuisineGrid}>
          {cuisineTypes.map((cuisine) => {
            // Case-insensitive check for UI state
            const isSelected = selectedCuisines.some(
              (c) => String(c).toLowerCase() === cuisine.toLowerCase()
            );

            return (
              <TouchableOpacity
                key={cuisine}
                style={[
                  styles.cuisineButton,
                  isSelected && styles.cuisineButtonActive,
                ]}
                onPress={() => toggleCuisine(cuisine)}
              >
                <Text
                  style={[
                    styles.cuisineButtonText,
                    isSelected && styles.cuisineButtonTextActive,
                  ]}
                >
                  {cuisine}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderRatingFilter = () => {
    const currentRating = (getFilterValue("minRating") as number) || 3.0;

    return (
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Minimum Rating</Text>
        <Text style={styles.filterValue}>{currentRating}+ stars</Text>
        <Slider
          style={styles.slider}
          minimumValue={0.5}
          maximumValue={5}
          value={currentRating}
          onValueChange={(value: number) => {
            if (value === 3.0) {
              handleFilterRemove("minRating");
            } else {
              handleFilterUpdate("minRating", value);
            }
          }}
          minimumTrackTintColor="#3B82F6"
          maximumTrackTintColor="#E2E8F0"
          thumbTintColor="#3B82F6"
          step={0.5}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>0.5★</Text>
          <Text style={styles.sliderLabel}>5★</Text>
        </View>
      </View>
    );
  };

  const renderPriceFilter = () => {
    const currentPrice = getFilterValue("priceLevel") as number;

    return (
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Price Level</Text>
        <View style={styles.priceButtons}>
          {priceLevels.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.priceButton,
                currentPrice === level.value && styles.priceButtonActive,
              ]}
              onPress={() => {
                if (currentPrice === level.value) {
                  handleFilterRemove("priceLevel");
                } else {
                  handleFilterUpdate("priceLevel", level.value);
                }
              }}
            >
              <Text
                style={[
                  styles.priceButtonText,
                  currentPrice === level.value && styles.priceButtonTextActive,
                ]}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderDistanceFilter = () => {
    return (
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Max Distance (Radius)</Text>
        <Text style={styles.filterValue}>{localDistance} km</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={50}
          value={localDistance}
          onValueChange={(value: number) => {
            // Only update local state, don't apply filter immediately
            setLocalDistance(value);
          }}
          minimumTrackTintColor="#3B82F6"
          maximumTrackTintColor="#E2E8F0"
          thumbTintColor="#3B82F6"
          step={1}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>1 km</Text>
          <Text style={styles.sliderLabel}>50 km</Text>
        </View>
        <Text style={styles.filterNote}>
          Distance filter will be applied when you click "Apply Filters"
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={actualIsOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setActualIsOpen(false)}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Filters</Text>
              <Text style={styles.subtitle}>
                Customize your restaurant search
              </Text>
            </View>

            {hasActiveFilters && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  clearFilters();
                  onFiltersCleared?.();
                }}
              >
                <Ionicons name="close-circle" size={20} color="#64748B" />
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setActualIsOpen(false)}
          >
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        {hasActiveFilters && (
          <View style={styles.activeFiltersSection}>
            <Text style={styles.activeFiltersTitle}>
              Active Filters ({filterCount})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.activeFiltersContainer}>
                {activeFilters.map((filter) => {
                  const definition = (FILTER_DEFINITIONS as any)[filter.id];
                  return (
                    <View key={filter.id} style={styles.activeFilterBadge}>
                      <Text style={styles.activeFilterText}>
                        {definition?.label || filter.id}:{" "}
                        {filter.id === "cuisine" && Array.isArray(filter.value)
                          ? filter.value
                              .map((c) => String(c).toLowerCase().trim())
                              .join(", ")
                          : String(filter.value)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleFilterRemove(filter.id)}
                        style={styles.removeFilterButton}
                      >
                        <Ionicons name="close" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
          {renderCuisineFilter()}
          {renderRatingFilter()}
          {renderPriceFilter()}
          {renderDistanceFilter()}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => {
              // Apply distance filter when Apply Filters is clicked
              if (localDistance === 10) {
                handleFilterRemove("distance");
              } else {
                handleFilterUpdate("distance", localDistance);
              }

              onNewFiltersApplied();
              onFiltersApplied?.();
              setActualIsOpen(false);
            }}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>

          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                clearFilters();
                onFiltersCleared?.();
              }}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
  },
  clearButtonText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  closeButton: {
    padding: 8,
  },
  activeFiltersSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  activeFiltersContainer: {
    flexDirection: "row",
    gap: 8,
  },
  activeFilterBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  removeFilterButton: {
    padding: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
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
    marginBottom: 12,
    textAlign: "center",
  },
  slider: {
    height: 40,
    marginVertical: 8,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  filterNote: {
    fontSize: 12,
    color: "#64748B",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
  },
  cuisineGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cuisineButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    marginBottom: 4,
  },
  cuisineButtonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  cuisineButtonText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  cuisineButtonTextActive: {
    color: "#FFFFFF",
  },
  priceButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  priceButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
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
    fontWeight: "500",
  },
  priceButtonTextActive: {
    color: "#FFFFFF",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  applyButton: {
    flex: 1,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  resetButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
});
