// Enhanced Restaurant Hook with Filtering System Integration and Heuristic Prefetching

import React, { useState, useEffect, useCallback, useMemo, useRef, Ref } from "react";
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
import { useFilterContext } from "../contexts/FilterContext";
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

  // Stabilize searchConfig to prevent unnecessary re-renders
  const stableSearchConfig = useMemo(() => searchConfig, [JSON.stringify(searchConfig)]);

  // State
  const [cards, setCards] = useState<RestaurantCard[]>([]);
  // Base, unfiltered cards derived from the latest nearbyPlaces
  const [baseCards, setBaseCards] = useState<RestaurantCard[]>([]);
  const [swipeHistory, setSwipeHistory] = useState<SwipeAction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);

  // Refs for latest values in callbacks
  const baseCardsRef = useRef<RestaurantCard[]>([]);
  const applyFiltersRef = useRef<((cards: RestaurantCard[]) => Promise<void>) | null>(null);

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
      console.log(`🎯 [useFilteredPlaces] Received prefetch event:`, event.type, event.cardId);
      if (event.type === "prefetch_completed") {
        console.log(`🎉 [useFilteredPlaces] Processing prefetch_completed for ${event.cardId}`);
        setCards((prevCards) => {
          const cardIndex = prevCards.findIndex(
            (card) => card.id === event.cardId
          );
          if (cardIndex === -1) {
            console.log(`❌ [useFilteredPlaces] Card ${event.cardId} not found in cards array`);
            return prevCards;
          }

          let updatedCards = [...prevCards];

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

          console.log(`🔍 [useFilteredPlaces] Details data for ${event.cardId}:`, !!detailsData);
          console.log(`🔍 [useFilteredPlaces] Photo data for ${event.cardId}:`, !!photoData);

          // Prefetched Details
          let updatedCard = prevCards[cardIndex];
          if (detailsData) {
            console.log(`✅ [useFilteredPlaces] Merging details for ${event.cardId}`);
            updatedCard = mergeCardWithDetails(prevCards[cardIndex], detailsData);
          }
          // Prefetched photos
          if (photoData) {
            console.log(`✅ [useFilteredPlaces] Updating photo for ${event.cardId}`);
            updatedCard.photos[0].url = photoData.photoUrl;
          }
          updatedCards[cardIndex] = updatedCard;

          console.log(`🎯 [useFilteredPlaces] Updated card ${event.cardId} with new data`);
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
  } = useGeolocation({
    enableHighAccuracy: false,
    maximumAge: 300000, // 5 minutes
    timeout: 10000
  });

  // Use FilterProvider as the single source of truth for filters
  const filterContext = useFilterContext();
  const {
    filters,
    isLoading: isFilterLoading,
    applyFilters: applyFiltersToCards,
  } = filterContext;


  // Current location - memoized to prevent unnecessary re-renders
  const location = useMemo(() => {
    if (!position?.coords) return null;
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  }, [position?.coords?.latitude, position?.coords?.longitude]);

  // Check if there are active filters with meaningful values
  const hasActiveFilters = useMemo(() => {
    const hasMeaningfulValue = (value: any): boolean => {
      if (typeof value === "boolean") return value === true;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "string") return value.trim().length > 0;
      if (typeof value === "number") return !Number.isNaN(value);
      return false;
    };

    const result = Array.isArray(filters) && filters.some((f) => f.enabled && hasMeaningfulValue(f.value));
    console.log("🔍 hasActiveFilters check:", {
      filters,
      result,
      enabledFilters: filters?.filter(f => f.enabled),
      meaningfulFilters: filters?.filter(f => f.enabled && hasMeaningfulValue(f.value))
    });

    return result;
  }, [filters]);

  // Create a stable filter signature to prevent unnecessary re-renders
  const filterSignature = useMemo(() => {
    if (!Array.isArray(filters)) return "";
    return filters
      .filter(f => f.enabled)
      .map(f => `${f.id}:${JSON.stringify(f.value)}`)
      .sort()
      .join('|');
  }, [filters]);

  // Enhanced search configuration with filters
  const finalSearchConfig = useMemo(() => {
    const baseConfig = {
      ...defaultSearchConfig,
      ...stableSearchConfig,
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

      // Find distance filter and convert to radius
      const distanceFilter = filters.find(
        (f) => f.id === "distance" && f.enabled
      );
      if (distanceFilter && typeof distanceFilter.value === "number") {
        // Convert distance from km to meters for radius
        const distanceKm = distanceFilter.value;
        const radiusMeters = distanceKm * 1000;
        baseConfig.radius = radiusMeters;
        console.log(`🔍 Distance filter applied: ${distanceKm}km -> ${radiusMeters}m radius`);
      }

      // Add any other relevant filters that can be passed to the Google Places API
      console.log("Enhanced search config with filters:", baseConfig);
    }

    return baseConfig;
  }, [stableSearchConfig, filterSignature, hasActiveFilters]);


  // Memoize query parameters to prevent unnecessary re-renders
  const queryParams = useMemo(() => ({
    lat: location?.latitude || 0,
    lng: location?.longitude || 0,
    radius: finalSearchConfig.radius,
    keyword: finalSearchConfig.keyword,
    type: finalSearchConfig.type,
  }), [location?.latitude, location?.longitude, finalSearchConfig.radius, finalSearchConfig.keyword, finalSearchConfig.type]);

  // Places API integration
  const {
    data: nearbyPlaces,
    isLoading: isPlacesLoading,
    error: placesError,
    refetch: refetchPlaces,
  } = useNearbyPlaces(
    queryParams,
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

  // Track swiped cards as a Set for fast exclusion - optimize with useRef for better performance
  const swipedCardIdsRef = useRef<Set<string>>(new Set());

  // Update swiped card IDs only when swipeHistory changes
  useEffect(() => {
    swipedCardIdsRef.current.clear();
    for (const action of swipeHistory) {
      if (action?.cardId) swipedCardIdsRef.current.add(action.cardId);
    }
  }, [swipeHistory]);

  const excludeSwiped = useCallback(
    (list: RestaurantCard[]): RestaurantCard[] =>
      list.filter((c) => !swipedCardIdsRef.current.has(c.id)),
    []
  );

  // Trigger re-filtering when filters change from FilterProvider
  useEffect(() => {
    console.log("🔄 useFilteredPlaces - Filters changed from FilterProvider:", filters);
    console.log("🔄 useFilteredPlaces - hasActiveFilters:", hasActiveFilters);
    console.log("🔄 useFilteredPlaces - baseCardsRef.current.length:", baseCardsRef.current.length);

    if (baseCardsRef.current.length > 0) {
      console.log("🔄 useFilteredPlaces - Triggering re-filtering with baseCards:", baseCardsRef.current.length);

      // Re-process the base cards with current filters
      const availableCards = excludeSwiped(baseCardsRef.current);
      console.log("🔄 useFilteredPlaces - availableCards after excluding swiped:", availableCards.length);

      if (hasActiveFilters) {
        console.log("🔄 useFilteredPlaces - Applying filters to available cards");
        // Apply filters to available cards
        applyFiltersToCards(availableCards).then((result) => {
          console.log("🔍 Filter result:", {
            totalCount: result.totalCount,
            filteredCount: result.filteredCards.length,
            appliedFilters: result.appliedFilters
          });
          setFilterResult(result);
          setCards(result.filteredCards as RestaurantCard[]);
        }).catch((err) => {
          console.error("Error applying filters:", err);
          setError(err instanceof Error ? err.message : "Failed to apply filters");
        });
      } else {
        // No active filters - show all available cards
        console.log("🔍 No active filters - showing all available cards:", availableCards.length);
        setFilterResult(null);
        setCards(availableCards);
      }
    }
  }, [filters, hasActiveFilters, applyFiltersToCards, excludeSwiped]);

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
      const cards = getRandomRestaurantCards(40);
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

  // Process places with filtering - optimized for performance
  const processPlacesWithFilters = useCallback(async (places: any[]) => {
    try {
      setError(null);

      // Transform places to restaurant cards
      const transformedCards = transformPlacesToCards(places, {
        userLatitude: location?.latitude,
        userLongitude: location?.longitude,
      });

      // Merge new cards with existing baseCards, avoiding duplicates
      console.log(`🔄 Merging ${transformedCards.length} new cards with ${baseCards.length} existing cards`);

      const existingCardIds = new Set(baseCards.map(card => card.id));
      const newUniqueCards = transformedCards.filter(card => !existingCardIds.has(card.id));

      const currentBaseCards = [...baseCards, ...newUniqueCards];
      console.log(`🔄 Merged result: ${currentBaseCards.length} total cards (${newUniqueCards.length} new)`);

      setBaseCards(currentBaseCards);

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
    } catch (err) {
      console.error("Error processing places:", err);
      setError(
        err instanceof Error ? err.message : "Failed to process restaurants"
      );
      setIsRadiusLoading(false);
    } finally {
      setIsRadiusLoading(false);
    }
  }, [baseCards, location?.latitude, location?.longitude, excludeSwiped, hasActiveFilters, applyFiltersToCards]);

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

  // Apply filters manually - optimized for performance
  const applyFilters = useCallback(
    async (cards: RestaurantCard[]) => {
      try {
        // Early return if no cards to process
        if (cards.length === 0) {
          setCards([]);
          setFilterResult(null);
          return;
        }

        // Always filter from the base, unfiltered list to avoid compounding filters
        console.log("🔍 Filtering from cards:", cards.length);
        console.log("🔍 hasActiveFilters:", hasActiveFilters);

        // Check if there are active filters before applying them
        if (hasActiveFilters) {
          const result = await applyFiltersToCards(cards);
          console.log("🔍 Filter result:", {
            totalCount: result.totalCount,
            filteredCount: result.filteredCards.length,
            appliedFilters: result.appliedFilters
          });

          setFilterResult(result);
          const filteredAndExcluded = excludeSwiped(result.filteredCards as RestaurantCard[]);
          console.log("🔍 Setting filtered cards:", filteredAndExcluded.length);
          setCards(filteredAndExcluded);
        } else {
          // No active filters - show all available cards
          console.log("🔍 No active filters - showing all cards");
          setFilterResult(null);
          const allAvailableCards = excludeSwiped(cards);
          console.log("🔍 Setting all available cards:", allAvailableCards.length);
          setCards(allAvailableCards);
        }
      } catch (err) {
        console.error("Error applying filters:", err);
        setError(
          err instanceof Error ? err.message : "Failed to apply filters"
        );
      }
    },
    [
      applyFiltersToCards,
      excludeSwiped,
      hasActiveFilters
    ]
  );

  // Update refs when values change
  useEffect(() => {
    baseCardsRef.current = baseCards;
    console.log("🔧 baseCards changed, length:", baseCards.length);
  }, [baseCards]);

  useEffect(() => {
    applyFiltersRef.current = applyFilters;
  }, [applyFilters]);

  // useEffect(() => {
  //   console.log("Filtered cards: ", filterResult);
  // }, [filterResult]);

  // Swipe card action with behavior tracking and prefetching - OPTIMIZED
  const swipeCard = useCallback(
    async (action: SwipeAction) => {
      console.log("Swiping card: ", action);

      if (showAd) {
        console.log("DEBUG - Dismissing ad, setting showAd to false");
        setShowAd(false);
        return;
      }

      // Use ref to get current cards for better performance
      const currentCards = cardsRef.current;
      const cardIndex = currentCards.findIndex((c) => c.id === action.cardId);

      // If no card found (like when passing an ad), don't proceed
      if (cardIndex === -1) {
        return;
      }

      const card = currentCards[cardIndex];

      // OPTIMIZATION: Use splice for O(1) removal instead of filter O(n)
      const remainingCards = [...currentCards];
      remainingCards.splice(cardIndex, 1);

      // Batch state updates for better performance using React 18 batching
      React.startTransition(() => {
        setCards(remainingCards);
        setSwipeHistory((prev) => [...prev, action]);
      });

      numSwipesRef.current++;

      // Defer expensive operations to prevent blocking the UI
      setTimeout(async () => {
        if (numSwipesRef.current > 0 && await hasPreloadedAds()) {
          console.log("Showing Ad");
          setShowAd(true);
        }

        // Track the swipe action for behavior analysis
        trackSwipeAction(action);

        // Trigger intelligent prefetching for remaining cards (deferred for better performance)
        if (isPrefetchingEnabled && remainingCards.length > 1) {
          // Only prefetch if we have more than 3 cards to avoid over-prefetching
          if (remainingCards.length > 3) {
            // Create user preferences from current filters
            const userPreferences: UserPreferences = {
              maxDistance: 5000, // 5km default
              preferredPriceRange: [],
              preferredCuisines: [],
              onlyOpenNow: false,
              minRating: 0,
            };

            // Defer prefetching to avoid blocking UI
            setTimeout(() => {
              prefetchCards(remainingCards, 0, userPreferences);
            }, 100);
          }
        }
      }, 0);

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
    [isPrefetchingEnabled, trackSwipeAction, prefetchCards, queryClient, showAd]
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

    // Filter management (from FilterProvider)
    addFilter: filterContext.addFilter,
    updateFilter: filterContext.updateFilter,
    removeFilter: filterContext.removeFilter,
    clearFilters: filterContext.clearFilters,
    allFilters: filters,
    onNewFiltersApplied: filterContext.onNewFiltersApplied,

    // Utilities
    canSwipe,
    usingLiveData,
    prefetchAnalytics,
    isPrefetchingEnabled,
  };
}

