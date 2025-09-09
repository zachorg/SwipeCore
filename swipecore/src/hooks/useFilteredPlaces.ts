// Enhanced Restaurant Hook with Filtering System Integration and Heuristic Prefetching

import { useState, useEffect, useCallback, useMemo, useRef, Ref } from "react";
import { useGeolocation } from "./useGeolocation";
import { useNearbyPlaces } from "./usePlaces";
import {
  RestaurantCard,
  SwipeAction,
  PlaceSearchConfig,
  defaultSearchConfig,
  FEATURE_FLAGS,
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
import { hasPreloadedAds, initializeNativeAds } from "@/services/nativeAdsProvider";
import { getRandomRestaurantCards } from "@/utils/mockData";

export interface UseFilteredPlacesOptions {
  searchConfig?: Partial<PlaceSearchConfig>;
  autoStart?: boolean;
  maxCards?: number;
  prefetchDetails?: boolean;
}

export interface UseFilteredPlacesReturn {
  // Core data
  cards: RestaurantCard[];
  totalCards: number;

  showAd: boolean;

  // Loading states
  isLoading: boolean;
  isLocationLoading: boolean;
  isFilterLoading: boolean;
  isRadiusLoading: boolean;

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

  const [showAd, setShowAd] = useState<boolean>(false);

  // Radius change tracking
  const [previousRadius, setPreviousRadius] = useState<number>(searchConfig.radius || 5000);
  const [isRadiusLoading, setIsRadiusLoading] = useState<boolean>(false);

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
    adsInitStartedRef.current = true;
    initializeNativeAds();
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
      console.log("🔄 Setting refilter flag...");
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
    if (hasActiveFilters) {
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
  }, [searchConfig, filters, hasActiveFilters]);


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
      enabled: Boolean(location) && FEATURE_FLAGS.GOOGLE_PLACES_ENABLED,
    }
  );

  // Log when Google Places query is enabled/disabled
  useEffect(() => {
    const isQueryEnabled = Boolean(location) && FEATURE_FLAGS.GOOGLE_PLACES_ENABLED;
    console.log(`🌍 Google Places query ${isQueryEnabled ? 'ENABLED' : 'DISABLED'}`, {
      hasLocation: Boolean(location),
      googlePlacesEnabled: FEATURE_FLAGS.GOOGLE_PLACES_ENABLED,
      location: location ? `${location.latitude}, ${location.longitude}` : 'none',
      radius: finalSearchConfig.radius
    });
  }, [location, finalSearchConfig.radius]);

  // Monitor radius changes and trigger new API calls when radius increases
  useEffect(() => {
    const currentRadius = finalSearchConfig.radius || 5000;

    if (currentRadius !== previousRadius) {
      console.log(`🔄 Radius changed from ${previousRadius}m to ${currentRadius}m`);

      if (currentRadius > previousRadius) {
        // Radius increased - trigger new API call
        console.log("📡 Radius increased, fetching new places...");
        setIsRadiusLoading(true);
        setError(null);

        // Trigger a new API call with the increased radius
        refetchPlaces().then((result) => {
          if (result.data && Array.isArray(result.data)) {
            console.log(`📡 Fetched ${result.data.length} new places with increased radius`);
            // The processPlacesWithFilters will be called automatically when nearbyPlaces changes
          }
          setIsRadiusLoading(false);
        }).catch((err) => {
          console.error("Failed to fetch places with increased radius:", err);
          setError("Failed to load more restaurants. Please try again.");
          setIsRadiusLoading(false);
        });
      } else {
        // Radius decreased - just apply filters to existing data
        console.log("🔍 Radius decreased, applying filters to existing data...");
        setShouldRefilter(true);
      }

      setPreviousRadius(currentRadius);
    }
  }, [finalSearchConfig.radius, previousRadius, refetchPlaces]);

  // Computed values
  const [isLoading, SetIsLoading] = useState<boolean>(true);
  const hasLocation = Boolean(location);
  const usingLiveData = FEATURE_FLAGS.GOOGLE_PLACES_ENABLED && hasLocation;
  const currentCard = cards.length > 0 ? cards[0] : null;
  const canSwipe = cards.length > 0;

  // Combined loading state that includes radius loading
  const isLoadingWithRadius = isLoading || isRadiusLoading;

  const cardsRef = useRef<RestaurantCard[]>([]);

  // Track swiped cards as a Set for fast exclusion
  const swipedCardIds = useMemo(() => {
    const ids = new Set<string>();
    for (const action of swipeHistory) {
      if (action?.cardId) ids.add(action.cardId);
    }
    return ids;
  }, [swipeHistory]);

  const excludeSwiped = useCallback(
    (list: RestaurantCard[]): RestaurantCard[] =>
      list.filter((c) => !swipedCardIds.has(c.id)),
    [swipedCardIds]
  );

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
    SetIsLoading(isPlacesLoading && cards.length === 0);
  }, [cards]);

  // Handle initial data loading based on feature flags
  useEffect(() => {
    if (!FEATURE_FLAGS.GOOGLE_PLACES_ENABLED && autoStart) {
      // Use mock data when Google Places is disabled
      const cards = getRandomRestaurantCards(3);
      console.log("Using mock data - Cards: ", cards.length);
      setBaseCards(cards);
      setCards(cards);
    } else if (FEATURE_FLAGS.GOOGLE_PLACES_ENABLED && autoStart && location) {
      // Google Places is enabled - the query will be triggered automatically by useNearbyPlaces
      console.log("Google Places enabled - query will be triggered automatically");
    }
  }, [autoStart]); // Include location dependency to trigger when location is available

  // Transform and filter places when data changes
  useEffect(() => {
    // Only process if we have places data
    if (nearbyPlaces && nearbyPlaces.length > 0) {
      if (FEATURE_FLAGS.GOOGLE_PLACES_ENABLED && location) {
        console.log("Processing places with filtering system");
        processPlacesWithFilters(nearbyPlaces);
      }
    } else if (FEATURE_FLAGS.GOOGLE_PLACES_ENABLED && location && !isPlacesLoading) {
      // Only show error if we're not loading and have no results
      setError(
        "No restaurants found in your area. Try expanding your search radius or adjusting your filters."
      );
    }
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

      // Check if this is a radius increase (new places being added)
      const isRadiusIncrease = isRadiusLoading && baseCards.length > 0;

      let currentBaseCards: RestaurantCard[];

      if (isRadiusIncrease) {
        // Merge new cards with existing baseCards, avoiding duplicates
        console.log(`🔄 Merging ${transformedCards.length} new cards with ${baseCards.length} existing cards`);

        const existingCardIds = new Set(baseCards.map(card => card.id));
        const newUniqueCards = transformedCards.filter(card => !existingCardIds.has(card.id));

        currentBaseCards = [...baseCards, ...newUniqueCards];
        console.log(`🔄 Merged result: ${currentBaseCards.length} total cards (${newUniqueCards.length} new)`);

        setBaseCards(currentBaseCards);
      } else {
        // Regular processing - replace baseCards
        currentBaseCards = transformedCards;
        setBaseCards(transformedCards);
      }

      // First, exclude any swiped cards from availability
      const availableCards = excludeSwiped(currentBaseCards);

      // Apply filters if enabled and active on the available set
      let newCards: RestaurantCard[] = [];
      if (hasActiveFilters) {
        const result = await applyFiltersToCards(availableCards);
        newCards = result.filteredCards as RestaurantCard[];
        setFilterResult(result);
      } else {
        newCards = availableCards as RestaurantCard[];
        setFilterResult(null);
      }

      setCards(newCards);

      // Clear radius loading state after processing
      if (isRadiusIncrease) {
        setIsRadiusLoading(false);
      }
    } catch (err) {
      console.error("Error processing places:", err);
      setError(
        err instanceof Error ? err.message : "Failed to process restaurants"
      );
      setIsRadiusLoading(false);
    }
  };

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
      try {
        // Always filter from the base, unfiltered list to avoid compounding filters
        console.log("🔍 Filtering from cards:", cards.length);

        const result = await applyFiltersToCards(cards);
        console.log("🔍 Filter result:", {
          totalCount: result.totalCount,
          filteredCount: result.filteredCards.length,
          appliedFilters: result.appliedFilters
        });

        setFilterResult(result);
        setCards(excludeSwiped(result.filteredCards as RestaurantCard[]));
      } catch (err) {
        console.error("Error applying filters:", err);
        setError(
          err instanceof Error ? err.message : "Failed to apply filters"
        );
      }
    },
    [
      applyFiltersToCards,
      baseCards,
      maxCards,
      hasActiveFilters
    ]
  );

  useEffect(() => {
    console.log("Filtered cards: ", filterResult);
  }, [filterResult]);

  // Watch for refilter flag and trigger re-filtering from base list
  useEffect(() => {
    if (!shouldRefilter) return;
    console.log("🔄 Re-filtering due to filters change...");

    applyFilters(baseCards);
    setShouldRefilter(false);
  }, [
    shouldRefilter,
    baseCards,
    cards,
    applyFilters,
    hasActiveFilters,
    maxCards,
    excludeSwiped,
  ]);

  // Swipe card action with behavior tracking and prefetching
  const swipeCard = useCallback(
    async (action: SwipeAction) => {
      console.log("Swiping card: ", action);

      if (showAd) {
        console.log("DEBUG - Dismissing ad, setting showAd to false");
        setShowAd(false);
        return;
      }

      const card = cards.find((c) => c.id === action.cardId);

      // If no card found (like when passing an ad), don't proceed
      if (!card) {
        return;
      }

      console.log("cards: ", JSON.stringify(cards));
      // Remove the specific swiped card instead of always removing the first card
      let remainingCards = cards.filter((c) => c.id !== action.cardId);

      setCards(remainingCards);

      numSwipesRef.current++;
      if (numSwipesRef.current > 0 && await hasPreloadedAds()) {
        console.log("Showing Ad");
        setShowAd(true);
      }

      console.log("remainingCards: ", JSON.stringify(remainingCards));
      setSwipeHistory((prev) => [...prev, action]);

      // Track the swipe action for behavior analysis
      trackSwipeAction(action);

      // Trigger intelligent prefetching for remaining cards
      if (isPrefetchingEnabled && cards.length > 1) {
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

      if (action.action == "menu" && card) {
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

        handleExpandCard(card);
        openMenu(card);
      }
    },
    [cards, isPrefetchingEnabled, trackSwipeAction, prefetchCards, queryClient, showAd]
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
    totalCards: filterResult?.totalCount || cards.length,

    showAd,

    // Loading states
    isLoading: isLoadingWithRadius,
    isLocationLoading,
    isFilterLoading,
    isRadiusLoading,

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

