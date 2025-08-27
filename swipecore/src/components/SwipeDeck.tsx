import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { SwipeCard } from "./SwipeCard";
import { SwipeControls } from "./SwipeControls";
import { openUrl } from "../utils/browser";
import {
  RestaurantCard,
  SwipeConfig,
  defaultSwipeConfig,
  androidOptimizedSwipeConfig,
} from "../types/Types";
import {
  useFilteredPlaces,
  UseFilteredPlacesOptions,
} from "../hooks/useFilteredPlaces";
import { Platform } from "react-native";

interface SwipeDeckProps {
  config?: Partial<SwipeConfig>;
  onSwipeAction?: (cardId: string, action: "menu" | "pass") => void;
  statusBarHeight?: number;
  maxVisibleCards?: number;
  onCardTap?: (card: RestaurantCard) => void;
  swipeOptions?: UseFilteredPlacesOptions;
  enableFiltering?: boolean;
  onFilterButtonReady?: (filterButton: React.ReactNode) => void;
  initialFilters?: Array<{ filterId: string; value: any }>;
}

export function SwipeDeck({
  config = {},
  onSwipeAction,
  maxVisibleCards = 3,
  statusBarHeight = 0,
  onCardTap,
  swipeOptions = {},
  enableFiltering = true,
  onFilterButtonReady,
  initialFilters = [],
}: SwipeDeckProps) {
  const [swipeDirection, setSwipeDirection] = useState<"menu" | "pass" | null>(
    null
  );

  const baseConfig =
    Platform.OS === "android"
      ? androidOptimizedSwipeConfig
      : defaultSwipeConfig;
  const swipeConfig = useMemo(
    () => ({ ...baseConfig, ...config }),
    [baseConfig, config]
  );

  const {
    cards,
    currentCard,
    isLoading,
    isLocationLoading,
    isFilterLoading,
    error,
    hasLocation,
    swipeCard,
    expandCard,
    refreshCards,
    requestLocation,
    usingLiveData,
    // Filter management
    addFilter,
    updateFilter,
    removeFilter,
    clearFilters,
    onNewFiltersApplied,
    allFilters,
  } = useFilteredPlaces({
    ...swipeOptions,
    enableFiltering,
    maxCards: 2,
  });

  // Provide a filter button to parent if requested
  useEffect(() => {
    if (onFilterButtonReady && enableFiltering) {
      const button = (
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            // Parent can render this button and handle opening a sheet/panel if desired
          }}
        >
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      );
      onFilterButtonReady(button);
    }
  }, [onFilterButtonReady, enableFiltering, allFilters]);

  // Apply initial filters from voice input on mount
  useEffect(() => {
    if (initialFilters.length > 0 && enableFiltering) {
      initialFilters.forEach((filter) => {
        addFilter(filter.filterId, filter.value);
      });
      onNewFiltersApplied();
    }
  }, []);

  const handleSwipe = useCallback(
    (cardId: string, action: "menu" | "pass") => {
      swipeCard({ cardId, action, timestamp: Date.now() });
      onSwipeAction?.(cardId, action);
    },
    [onSwipeAction, swipeCard]
  );

  const handleExpand = useCallback(
    (cardId: string) => {
      expandCard?.({ cardId, timestamp: Date.now() });
    },
    [expandCard]
  );

  const handleSponsoredSwipe = useCallback(
    (cardId: string) => {
      swipeCard({ cardId, action: "pass", timestamp: Date.now() });
      onSwipeAction?.(cardId, "pass");
    },
    [onSwipeAction, swipeCard]
  );

  const handleCardTapInternal = useCallback(
    (card: RestaurantCard) => {
      if (card.adData) {
        // Native ad click tracking would go here if implemented
        return;
      }
      onCardTap?.(card);
    },
    [onCardTap]
  );

  const handleControlAction = useCallback(
    (action: "pass") => {
      if (currentCard) {
        handleSwipe(currentCard.id, action);
      }
    },
    [currentCard, handleSwipe]
  );

  const handleMenuOpen = useCallback(() => {
    if (!currentCard) return;
    handleExpand(currentCard.id);

    const queryClient = useQueryClient();
    const poll = () => {
      const detailsData = queryClient.getQueryData([
        "places",
        "details",
        currentCard.id,
      ]);
      if (!detailsData) {
        setTimeout(poll, 100);
      }
    };

    if (!currentCard.website) {
      poll();
    } else {
      openUrl(currentCard.website);
    }
  }, [currentCard, handleExpand]);

  const visibleCards = useMemo(
    () => cards.slice(0, maxVisibleCards),
    [cards, maxVisibleCards]
  );

  const showLoading = isLoading && (isFilterLoading || cards.length === 0);
  const showError = Boolean(error);
  const showLocationNeeded =
    !hasLocation && !isLocationLoading && usingLiveData;
  const showNoCards = cards.length === 0 && !isLoading && !error;

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      {showLoading && (
        <View style={styles.statusBar}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.statusText}>
            {isLocationLoading
              ? "Getting your location..."
              : isFilterLoading
              ? "Applying filters..."
              : "Finding restaurants..."}
          </Text>
        </View>
      )}

      {showError && (
        <View style={[styles.statusBar, { paddingTop: statusBarHeight }]}>
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <Text style={styles.statusText}>Error: {String(error)}</Text>
        </View>
      )}

      {showLocationNeeded && (
        <View style={[styles.statusBar, { paddingTop: statusBarHeight }]}>
          <Ionicons name="location" size={16} color="#F59E0B" />
          <Text style={styles.statusText}>Location access needed</Text>
        </View>
      )}

      {/* Main Content */}
      {showLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>
            {isLocationLoading
              ? "Getting your location..."
              : isFilterLoading
              ? "Applying filters..."
              : "Finding restaurants..."}
          </Text>
          <Text style={styles.loadingSubtext}>
            {usingLiveData
              ? "Loading restaurants near you"
              : "Preparing your restaurant deck"}
          </Text>
        </View>
      )}

      {showError && (
        <View style={styles.centerPadding}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{String(error)}</Text>
          {!hasLocation && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={requestLocation}
            >
              <Text style={styles.primaryButtonText}>
                Enable Location Services
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={refreshCards}
          >
            <Text style={styles.secondaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {showLocationNeeded && (
        <View style={styles.centerPadding}>
          <Text style={styles.title}>Location Access Needed</Text>
          <Text style={styles.muted}>
            We need your location to find restaurants near you.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={requestLocation}
          >
            <Text style={styles.primaryButtonText}>
              Enable Location Services
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {showNoCards && (
        <View style={styles.centerPadding}>
          <Text style={styles.title}>No more restaurants!</Text>
          <Text style={styles.muted}>
            {usingLiveData
              ? "You've seen all nearby restaurants. Try refreshing or expanding your search area."
              : "Check back later for more options."}
          </Text>
          {usingLiveData && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={refreshCards}
            >
              <Text style={styles.secondaryButtonText}>Refresh Results</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {visibleCards.length > 0 && (
        <View
          style={[styles.stackContainer, { paddingTop: statusBarHeight - 16 }]}
        >
          <View
            style={[
              styles.cardsArea,
              { marginBottom: statusBarHeight - 16 },
              { marginHorizontal: statusBarHeight - 16 },
            ]}
          >
            {visibleCards.map((card, index) => {
              if (card.adData) {
                return (
                  <SwipeCard
                    key={card.id}
                    card={card}
                    onSwipe={() => handleSponsoredSwipe(card.id)}
                    config={swipeConfig}
                    isTop={index === 0}
                    index={index}
                    onCardTap={handleCardTapInternal}
                    onSwipeDirection={setSwipeDirection}
                  />
                );
              }
              return (
                <SwipeCard
                  key={card.id}
                  card={card}
                  onSwipe={handleSwipe}
                  config={swipeConfig}
                  isTop={index === 0}
                  index={index}
                  onCardTap={handleCardTapInternal}
                  handleOnExpand={handleExpand}
                  onSwipeDirection={setSwipeDirection}
                  statusBarHeight={statusBarHeight}
                />
              );
            })}
          </View>

          <SwipeControls
            onAction={handleControlAction}
            onMenuOpen={currentCard?.adData ? undefined : handleMenuOpen}
            onVoiceFiltersApplied={
              enableFiltering
                ? (filters) => {
                    filters.forEach((f) => addFilter(f.filterId, f.value));
                    onNewFiltersApplied();
                  }
                : undefined
            }
            swipeDirection={swipeDirection}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  statusBarContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusBarActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  centerPadding: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  loadingText: {
    marginTop: 12,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingSubtext: {
    color: "#FFFFFFAA",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
  errorTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  errorText: {
    color: "#FFFFFFCC",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  muted: {
    color: "#FFFFFFAA",
    textAlign: "center",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  stackContainer: {
    flex: 1,
  },
  cardsArea: {
    flex: 1,
    position: "relative",
  },
  filterButton: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  filterButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
