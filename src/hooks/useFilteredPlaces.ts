// Enhanced Restaurant Hook with Filtering System Integration

import { useState, useEffect, useCallback, useMemo } from "react";
import { useGeolocation } from "./useGeolocation";
import { useNearbyPlaces, usePhotoUrl, usePlaceDetails } from "./usePlaces";
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
  mergeCardWithDetails,
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

  // Check if there are active filters
  const hasActiveFilters = useMemo(() => {
    return filters.length > 0 && filters.some((f) => f.enabled);
  }, [filters]);

  // Enhanced search configuration with filters
  const finalSearchConfig = useMemo(() => {
    const baseConfig = {
      ...defaultSearchConfig,
      ...searchConfig,
    };

    // Incorporate filters into the API query parameters
    if (enableFiltering && hasActiveFilters) {
      // Find cuisine filters
      const cuisineFilters = filters.find(
        (f) => f.id === "cuisine" && f.enabled
      );
      if (
        cuisineFilters &&
        Array.isArray(cuisineFilters.value) &&
        cuisineFilters.value.length > 0
      ) {
        // Add the first cuisine as a keyword to narrow down results
        baseConfig.keyword =
          (baseConfig.keyword || "") +
          (baseConfig.keyword ? " " : "") +
          cuisineFilters.value[0];
      }

      // Find price level filter
      const priceFilter = filters.find(
        (f) => f.id === "priceLevel" && f.enabled
      );
      if (priceFilter && typeof priceFilter.value === "number") {
        // Map numeric price level to the enum values expected by the API
        const priceLevelMap = {
          1: "PRICE_LEVEL_INEXPENSIVE" as "PRICE_LEVEL_INEXPENSIVE",
          2: "PRICE_LEVEL_MODERATE" as "PRICE_LEVEL_MODERATE",
          3: "PRICE_LEVEL_EXPENSIVE" as "PRICE_LEVEL_EXPENSIVE",
          4: "PRICE_LEVEL_VERY_EXPENSIVE" as "PRICE_LEVEL_VERY_EXPENSIVE",
        };

        const priceLevelEnum =
          priceLevelMap[priceFilter.value as keyof typeof priceLevelMap];
        if (priceLevelEnum) {
          baseConfig.priceLevel = [priceLevelEnum];
        }
      }

      // Find rating filter
      const ratingFilter = filters.find(
        (f) => f.id === "minRating" && f.enabled
      );
      if (ratingFilter && typeof ratingFilter.value === "number") {
        baseConfig.minRating = ratingFilter.value;
      }

      // Find open now filter
      const openNowFilter = filters.find(
        (f) => f.id === "openNow" && f.enabled
      );
      if (openNowFilter && openNowFilter.value === true) {
        baseConfig.isOpenNow = true;
      }

      // Add any other relevant filters that can be passed to the Google Places API
      console.log("Enhanced search config with filters:", baseConfig);
    }

    return baseConfig;
  }, [searchConfig, filters, enableFiltering, hasActiveFilters]);

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

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  // Handle selecting a place
  const handleSelectPlace = (placeId: string) => {
    setSelectedPlaceId(placeId);
  };

  const { data: selectedPlaceDetails } = usePlaceDetails(
    selectedPlaceId || "",
    {
      // Only enable the query when a place is selected
      enabled: Boolean(selectedPlaceId),
    }
  );

  interface PhotoReference {
    id: string;
    widthPx: number;
    heightPx: number;
  }

  const [selectedPhotoReference, setSelectedPhotoReference] =
    useState<PhotoReference | null>(null);

  const { data: placePhotoUrls, error: photosError } = usePhotoUrl(
    selectedPlaceId || "",
    selectedPhotoReference?.id || "",
    selectedPhotoReference?.widthPx || 400,
    selectedPhotoReference?.heightPx || 400,
    {
      enabled: Boolean(selectedPhotoReference?.id),
    }
  );

  function handleSelectPhotoReference(
    id: string,
    widthPx: number,
    heightPx: number
  ) {
    setSelectedPhotoReference({ id, widthPx, heightPx });
  }

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
        handleSelectPlace(result.filteredCards[0].id);
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

  //
  useEffect(() => {
    if (selectedPlaceDetails) {
      const currentCard = cards[0];
      if (selectedPlaceDetails.photos) {
        const { name, widthPx, heightPx } = selectedPlaceDetails.photos[0];
        console.log(`fetching photos for ${currentCard.title}:${name} ..`);
        handleSelectPhotoReference(name, widthPx, heightPx);
      } else {
        console.log(`${currentCard.title} does not have any photos..`);
      }

      // mergeCardWithDetails returns a new card object
      const updatedCard = mergeCardWithDetails(currentCard, selectedPlaceDetails);
      const updatedCards = [...cards];
      updatedCards[0] = updatedCard;
      setCards(updatedCards);
      console.log("Place details for current card fetched!");
    }
  }, [selectedPlaceDetails]);

  useEffect(() => {
    if (placePhotoUrls) {
      // Create a new card object and new array to ensure React detects changes
      const updatedCard = { ...cards[0], imageUrl: placePhotoUrls };
      const updatedCards = [...cards];
      updatedCards[0] = updatedCard;
      setCards(updatedCards);
      console.log(`Place photos for current card fetched: ${placePhotoUrls}`);
    }
  }, [placePhotoUrls]);

  useEffect(() => {
    console.log("Selected Photo Reference:", selectedPhotoReference);
    console.log("Is Photo URL Enabled:", Boolean(selectedPhotoReference?.id));
  }, [selectedPhotoReference]);

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
