// Enhanced Restaurant Hook with Filtering System Integration

import { useState, useEffect, useCallback, useMemo } from "react";
import { useGeolocation } from "./useGeolocation";
import { useNearbyPlaces } from "./usePlaces";
import {
  RestaurantCard,
  SwipeAction,
  PlaceSearchConfig,
  defaultSearchConfig,
  defaultFeatureFlags,
} from "../types/Types";
import {
  transformPlacesToCards,
  getDefaultRestaurantImage,
} from "../utils/placeTransformers";
import { generateMockCards } from "@/lib/swipe-core";
import { FilterResult, useFilters } from "./useFilters";

export interface UseFilteredPlacesOptions {
  searchConfig?: Partial<PlaceSearchConfig>;
  autoStart?: boolean;
  maxCards?: number;
  prefetchDetails?: boolean;
  enableFiltering?: boolean;
}

export interface UseFilteredPlacesReturn {
  // Core data
  cards: RestaurantCard[];
  currentCard: RestaurantCard | null;
  totalCards: number;

  // Loading states
  isLoading: boolean;
  isLocationLoading: boolean;
  isFilterLoading: boolean;

  // Error handling
  error: string | null;

  // Location
  hasLocation: boolean;
  location: { latitude: number; longitude: number } | null;

  // Actions
  swipeCard: (action: SwipeAction) => void;
  refreshCards: () => void;
  requestLocation: () => void;

  // Filtering
  filterResult: FilterResult | null;
  applyFilters: (cards: RestaurantCard[]) => Promise<void>;

  // Filter management (re-exported from useFilters)
  addFilter: (filterId: string, value: any) => void;
  updateFilter: (filterId: string, value: any) => void;
  removeFilter: (filterId: string) => void;
  clearFilters: () => void;

  onNewFiltersApplied: () => void;

  allFilters: any[];

  // Utilities
  canSwipe: boolean;
  usingLiveData: boolean;
}

export function useFilteredPlaces(
  options: UseFilteredPlacesOptions = {}
): UseFilteredPlacesReturn {
  const {
    searchConfig = {},
    autoStart = true,
    maxCards = 20,
    enableFiltering = true,
  } = options;

  // State
  const [cards, setCards] = useState<RestaurantCard[]>([]);
  const [swipeHistory, setSwipeHistory] = useState<SwipeAction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);
  const [shouldRefilter, setShouldRefilter] = useState(false);

  // Hooks
  const {
    position,
    error: locationError,
    loading: isLocationLoading,
    requestPermissions,
  } = useGeolocation({ enableHighAccuracy: true });

  const {
    filters,
    isLoading: isFilterLoading,
    addFilter,
    updateFilter,
    removeFilter,
    clearFilters,
    applyFilters: applyFiltersToCards,
    onNewFiltersApplied,
  } = useFilters({
    enablePersistence: true,
    onNewFiltersApplied: () => {
      console.log("Setting refilter flag...");
      setShouldRefilter(true);
    },
  });

  // Current location
  const location = position?.coords
    ? {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }
    : null;

  // Enhanced search configuration with filters
  const finalSearchConfig = useMemo(() => {
    const baseConfig = {
      ...defaultSearchConfig,
      ...searchConfig,
    };

    // For now, just return base config to avoid infinite loops
    // Google API filtering will be handled separately
    return baseConfig;
  }, [searchConfig]);

  // Places API integration
  const {
    data: nearbyPlaces,
    isLoading: isPlacesLoading,
    error: placesError,
    refetch: refetchPlaces,
  } = useNearbyPlaces(
    {
      lat: location?.latitude || 0,
      lng: location?.longitude || 0,
      radius: finalSearchConfig.radius,
      keyword: finalSearchConfig.keyword,
      type: finalSearchConfig.type,
    },
    {
      enabled: Boolean(location) && defaultFeatureFlags.useGooglePlacesApi,
    }
  );

  // Computed values
  const isLoading = isPlacesLoading && cards.length === 0;
  const hasLocation = Boolean(location);
  const usingLiveData = defaultFeatureFlags.useGooglePlacesApi && hasLocation;
  const currentCard = cards.length > 0 ? cards[0] : null;
  const canSwipe = cards.length > 0;

  // Initialize with mock data if not using live data
  useEffect(() => {
    if (!defaultFeatureFlags.useGooglePlacesApi && autoStart) {
      console.log("SetCards with mock data");
      const mockCards = generateMockCards(8);
      applyFilters(mockCards);
    }
  }, [filters]);

  // Transform and filter places when data changes
  useEffect(() => {
    if (!nearbyPlaces || nearbyPlaces.length === 0) {
      if (defaultFeatureFlags.useGooglePlacesApi && location) {
        setError(
          "No restaurants found in your area. Try expanding your search radius or adjusting your filters."
        );
      }
      return;
    }

    if (!defaultFeatureFlags.useGooglePlacesApi || !location) {
      return;
    }

    console.log("Processing places with filtering system");
    processPlacesWithFilters(nearbyPlaces);
  }, [nearbyPlaces]);

  // Process places with filtering
  const processPlacesWithFilters = async (places: any[]) => {
    try {
      setError(null);

      // Transform places to restaurant cards
      const transformedCards = transformPlacesToCards(places, {
        userLatitude: location?.latitude,
        userLongitude: location?.longitude,
        defaultImageUrl: getDefaultRestaurantImage(),
      });

      // Apply filters if enabled and active
      if (enableFiltering && hasActiveFilters) {
        const result = await applyFiltersToCards(transformedCards);
        setFilterResult(result);
        setCards(result.filteredCards.slice(0, maxCards));
      } else {
        setCards(transformedCards.slice(0, maxCards));
        setFilterResult(null);
      }
    } catch (err) {
      console.error("Error processing places:", err);
      setError(
        err instanceof Error ? err.message : "Failed to process restaurants"
      );
    }
  };

  // Apply filters manually
  const applyFilters = useCallback(
    async (cards: RestaurantCard[]) => {
      if (!enableFiltering) return;

      try {
        const currentCards = cards.length > 0 ? cards : [];
        const result = await applyFiltersToCards(currentCards);
        setFilterResult(result);
        setCards(result.filteredCards);
      } catch (err) {
        console.error("Error applying filters:", err);
        setError(
          err instanceof Error ? err.message : "Failed to apply filters"
        );
      }
    },
    [enableFiltering, applyFiltersToCards]
  );

  useEffect(() => {
    console.log("Filtered cards: ", filterResult);
  }, [filterResult]);

  // Watch for refilter flag and trigger re-filtering
  useEffect(() => {
    if (shouldRefilter && cards.length > 0) {
      console.log("Re-filtering cards due to new filters applied...");
      applyFilters(cards);
      setShouldRefilter(false);
    }
  }, [shouldRefilter, cards.length]);

  // Swipe card action
  const swipeCard = useCallback((action: SwipeAction) => {
    setCards((prev) => prev.slice(1));
    setSwipeHistory((prev) => [...prev, action]);
  }, []);

  // Refresh cards
  const refreshCards = useCallback(() => {
    setError(null);
    setCards([]);
    setSwipeHistory([]);
    setFilterResult(null);

    if (usingLiveData) {
      refetchPlaces();
    } else {
      const mockCards = generateMockCards(maxCards);
      setCards(mockCards);
    }
  }, [usingLiveData]);

  // Request location permission
  const requestLocation = useCallback(() => {
    requestPermissions();
  }, [requestPermissions]);

  // Handle errors
  useEffect(() => {
    if (locationError) {
      setError(
        "Location access denied. Please enable location services to find nearby restaurants."
      );
    } else if (placesError) {
      setError(placesError.message || "Failed to load restaurants");
    }
  }, [locationError, placesError]);

  return {
    // Core data
    cards,
    currentCard,
    totalCards: filterResult?.totalCount || cards.length,

    // Loading states
    isLoading,
    isLocationLoading,
    isFilterLoading,

    // Error handling
    error,

    // Location
    hasLocation,
    location,

    // Actions
    swipeCard,
    refreshCards,
    requestLocation,

    // Filtering
    filterResult,
    applyFilters,

    // Filter management
    addFilter,
    updateFilter,
    removeFilter,
    clearFilters,
    allFilters: filters,
    onNewFiltersApplied,

    // Utilities
    canSwipe,
    usingLiveData,
  };
}
