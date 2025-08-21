// Enhanced Restaurant Hook with Filtering System Integration and Heuristic Prefetching

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useGeolocation } from "./useGeolocation";
import { useNearbyPlaces } from "./usePlaces";
import {
  RestaurantCard,
  SwipeAction,
  PlaceSearchConfig,
  defaultSearchConfig,
  defaultFeatureFlags,
  GooglePlacesApiAdvDetails,
  UserPreferences,
  ExpandAction,
} from "../types/Types";
import {
  transformPlacesToCards,
  mergeCardWithDetails,
} from "../utils/placeTransformers";
import { FilterResult, useFilters } from "./useFilters";
import { useQueryClient } from "@tanstack/react-query";
import { ImmediateFetchRequest, usePrefetcher } from "./usePrefetcher";
import { useBehaviorTracking } from "./useBehaviorTracking";
import { PrefetchAnalytics, PrefetchEvent } from "@/types/prefetching";
import { openUrl } from "@/utils/browser";
import { isAdsEnabled } from "@/utils/ads";
import {
  getAvailableAd,
  startNativeAdsPreload,
} from "@/services/nativeAdsProvider";

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
  expandCard: (action: ExpandAction) => void;
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

  // Prefetching (new)
  prefetchAnalytics: PrefetchAnalytics;
  isPrefetchingEnabled: boolean;
}
export function useFilteredPlaces(
  options: UseFilteredPlacesOptions = {}
): UseFilteredPlacesReturn {
  const {
    searchConfig = {},
    autoStart = true,
    maxCards = 20,
    enableFiltering = true,
    prefetchDetails = true,
  } = options;

  // State
  const [cards, setCards] = useState<RestaurantCard[]>([]);
  // Base, unfiltered cards derived from the latest nearbyPlaces
  const [baseCards, setBaseCards] = useState<RestaurantCard[]>([]);
  const [swipeHistory, setSwipeHistory] = useState<SwipeAction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);
  const [shouldRefilter, setShouldRefilter] = useState(false);

  const numSwipesRef = useRef<number>(0);

  const queryClient = useQueryClient();

  // Prefetching integration
  const {
    prefetchCards,
    requestImmediateFetch,
    isEnabled: isPrefetchingEnabled,
    analytics: prefetchAnalytics,
  } = usePrefetcher({
    enabled: prefetchDetails ?? true,
    debugMode: true,
    onPrefetchEvent: (event: PrefetchEvent) => {
      if (event.type === "prefetch_completed") {
        setCards((prevCards) => {
          const cardIndex = prevCards.findIndex(
            (card) => card.id === event.cardId
          );
          if (cardIndex === -1) return prevCards;

          let updatedCards = [...cards];

          const detailsData = queryClient.getQueryData([
            "places",
            "details",
            event.cardId,
          ]) as GooglePlacesApiAdvDetails;

          const photoData = queryClient.getQueryData([
            "places",
            "photos",
            event.cardId,
          ]) as {
            photoUrl: string;
            photoReference: string;
          };

          // Prefetched Details
          let updatedCard = cards[cardIndex];
          if (detailsData) {
            updatedCard = mergeCardWithDetails(cards[cardIndex], detailsData);
          }
          // Prefetched photos
          if (photoData) {
            updatedCard.photos[0].url = photoData.photoUrl;
          }
          updatedCards[cardIndex] = updatedCard;

          return updatedCards;
        });
      }
    },
  });

  // Lazy-start native ads preload only after we have at least one real card rendered
  const adsInitStartedRef = useRef(false);
  useEffect(() => {
    if (adsInitStartedRef.current) return;
    if (!isAdsEnabled()) return;
    if (cards.length === 0) return;
    adsInitStartedRef.current = true;
    startNativeAdsPreload();
  }, [cards.length]);

  // Behavior tracking integration
  const { trackCardView, trackSwipeAction, trackDetailView } =
    useBehaviorTracking({
      enabled: true,
      autoTrackCardViews: false, // We'll track manually
      autoTrackSwipes: false, // We'll track manually
    });

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

  // Check if there are active filters with meaningful values
  const hasActiveFilters = useMemo(() => {
    const hasMeaningfulValue = (value: any): boolean => {
      if (typeof value === "boolean") return value === true;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "string") return value.trim().length > 0;
      if (typeof value === "number") return !Number.isNaN(value);
      return false;
    };
    return (
      Array.isArray(filters) &&
      filters.some((f) => f.enabled && hasMeaningfulValue(f.value))
    );
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

  // Computed values
  const isLoading = isPlacesLoading && cards.length === 0;
  const hasLocation = Boolean(location);
  const usingLiveData = defaultFeatureFlags.useGooglePlacesApi && hasLocation;
  const currentCard = cards.length > 0 ? cards[0] : null;
  const canSwipe = cards.length > 0;

  const cardsRef = useRef<RestaurantCard[]>([]);

  // Update the ref whenever cards change
  useEffect(() => {
    cardsRef.current = cards;

    if (isPrefetchingEnabled && cards.length > 0) {
      if (cards[0].photos?.length > 0 && !cards[0].photos[0].url) {
        requestImmediateFetch(
          cardsRef.current[0],
          ImmediateFetchRequest.Photos
        );
      }
    }
  }, [cards]);

  // If live data is disabled, do not populate with mocks; leave empty and show error states
  useEffect(() => {
    if (!defaultFeatureFlags.useGooglePlacesApi && autoStart) {
      setBaseCards([]);
      setCards([]);
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
      });

      // Keep a snapshot of the full, unfiltered list for future re-filtering
      setBaseCards(transformedCards);

      // Apply filters if enabled and active
      let newCards: RestaurantCard[] = [];
      if (enableFiltering && hasActiveFilters) {
        const result = await applyFiltersToCards(transformedCards);
        newCards = result.filteredCards as RestaurantCard[];
        setFilterResult(result);
      } else {
        newCards = transformedCards as RestaurantCard[];
        setFilterResult(null);
      }

      setCards(newCards);
    } catch (err) {
      console.error("Error processing places:", err);
      setError(
        err instanceof Error ? err.message : "Failed to process restaurants"
      );
    }
  };

  // Build interleaved list with ads
  // const buildInterleavedWithAds = useCallback(
  //   async (
  //     realCards: RestaurantCard[],
  //     limit: number
  //   ): Promise<RestaurantCard[]> => {
  //     const hasReal = Array.isArray(realCards) && realCards.length > 0;
  //     if (!isAdsEnabled()) return realCards.slice(0, limit);
  //     // If there are no real cards, return empty (do not show ad-only deck)
  //     if (!hasReal) return [];

  //     const ad = await getNextAdCard();
  //     const output: RestaurantCard[] = realCards.slice(0, limit);
  //     output.unshift(ad);

  //     return output.slice(0, limit);
  //   },
  //   []
  // );

  // Add card view tracking effect
  useEffect(() => {
    if (currentCard && isPrefetchingEnabled) {
      const startTime = Date.now();

      // Return cleanup function to track view duration
      return () => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Track view duration for analytics
        trackCardView(currentCard, duration / 1000);
      };
    }
  }, [currentCard, trackCardView, isPrefetchingEnabled]);

  // Apply filters manually
  const applyFilters = useCallback(
    async (cards: RestaurantCard[]) => {
      if (!enableFiltering) return;

      try {
        // Always filter from the base, unfiltered list to avoid compounding filters
        const currentCards = baseCards.length > 0 ? baseCards : cards;
        const result = await applyFiltersToCards(currentCards);
        setFilterResult(result);

        setCards(result.filteredCards as RestaurantCard[]);
      } catch (err) {
        console.error("Error applying filters:", err);
        setError(
          err instanceof Error ? err.message : "Failed to apply filters"
        );
      }
    },
    [
      enableFiltering,
      applyFiltersToCards,
      baseCards,
      maxCards,
    ]
  );

  useEffect(() => {
    console.log("Filtered cards: ", filterResult);
  }, [filterResult]);

  // Watch for refilter flag and trigger re-filtering from base list
  useEffect(() => {
    if (!shouldRefilter) return;
    console.log("Re-filtering due to filters change...");
    if (enableFiltering && hasActiveFilters) {
      applyFilters(baseCards);
    } else {
      // No active filters: restore unfiltered base list
      const source = baseCards.length > 0 ? baseCards : cards;
      setCards(source);
      setFilterResult(null);
    }
    setShouldRefilter(false);
  }, [
    shouldRefilter,
    baseCards,
    cards,
    applyFilters,
    enableFiltering,
    hasActiveFilters,
    maxCards,
  ]);

  // Swipe card action with behavior tracking and prefetching
  const swipeCard = useCallback(
    (action: SwipeAction) => {
      const card = cards.find((card) => {
        return card.id === action.cardId;
      });
      setCards((prev) => prev.slice(1));
      setSwipeHistory((prev) => [...prev, action]);

      // Track the swipe action for behavior analysis
      trackSwipeAction(action);

      // Trigger intelligent prefetching for remaining cards
      if (isPrefetchingEnabled && cards.length > 1) {
        const remainingCards = cards.slice(1);
        // Create user preferences from current filters
        const userPreferences: UserPreferences = {
          maxDistance: 5000, // 5km default
          preferredPriceRange: [],
          preferredCuisines: [],
          onlyOpenNow: false,
          minRating: 0,
        };

        prefetchCards(remainingCards, 0, userPreferences);
      }

      const openMenu = async (swipedCard: RestaurantCard) => {
        if (swipedCard.website) {
          openUrl(swipedCard.website);
        }

        if (!swipedCard.website) {
          const detailsData = queryClient.getQueryData([
            "places",
            "details",
            swipedCard.id,
          ]) as GooglePlacesApiAdvDetails;

          if (!detailsData) {
            setTimeout(() => {
              openMenu(swipedCard);
            }, 100);
          }
          if (detailsData && detailsData.websiteUri) {
            openUrl(detailsData.websiteUri);
          }
        }
      };
      if (action.action == "menu") {
        handleExpandCard(card);
        openMenu(card);
      }

      numSwipesRef.current++;

      const ad = getAvailableAd();
      console.log("numSwipesRef.current: ", numSwipesRef.current);
      if (numSwipesRef.current > 0 && (numSwipesRef.current + 1) % 3 === 0 && ad) {
        console.log("Inserting ad");
        let output: RestaurantCard[] = cards.slice(1);
        const currentCard = output[0];
        output = output.slice(1);
        output.unshift(ad);
        output.unshift(currentCard);
        setCards(output);
      }
    },
    [trackSwipeAction, isPrefetchingEnabled, cards, prefetchCards, filters]
  );

  const handleExpandCard = (card: RestaurantCard) => {
    if (isPrefetchingEnabled) {
      trackDetailView(card.id);

      if (!card.advDetails) {
        requestImmediateFetch(card, ImmediateFetchRequest.Details);
      }
    }
  };

  const expandCard = useCallback(() => {
    handleExpandCard(cardsRef.current[0]);
  }, []);

  // Refresh cards
  const refreshCards = useCallback(async () => {
    setError(null);
    setCards([]);
    setSwipeHistory([]);
    setFilterResult(null);

    if (usingLiveData) {
      try {
        const result = await refetchPlaces();
        const freshPlaces = Array.isArray(result?.data)
          ? (result.data as any[])
          : Array.isArray(nearbyPlaces)
            ? (nearbyPlaces as any[])
            : [];
        await processPlacesWithFilters(freshPlaces);
      } catch {
        // If refetch fails, at least try to reprocess whatever we had cached
        const fallback = Array.isArray(nearbyPlaces) ? (nearbyPlaces as any[]) : [];
        if (fallback.length > 0) {
          await processPlacesWithFilters(fallback);
        }
      }
    } else {
      // Live data disabled: keep empty state
      setBaseCards([]);
      setCards([]);
    }
  }, [
    usingLiveData,
    enableFiltering,
    hasActiveFilters,
    maxCards,
    applyFilters,
    refetchPlaces,
    nearbyPlaces,
    processPlacesWithFilters,
  ]);

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
    expandCard,
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
    prefetchAnalytics,
    isPrefetchingEnabled,
  };
}
