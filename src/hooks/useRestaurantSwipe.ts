import { useState, useEffect, useCallback } from "react";
import { useGeolocation } from "./useGeolocation";
import {
  useNearbyPlaces,
  useNearbyPlacesWithLocation,
  usePrefetchPlaceDetails,
} from "./usePlaces";
import {
  RestaurantCard,
  SwipeAction,
  PlaceSearchConfig,
  defaultSearchConfig,
  defaultFeatureFlags,
} from "../types/places";
import {
  transformPlacesToCards,
  filterCardsByPreferences,
  sortCards,
  getDefaultRestaurantImage,
} from "../utils/placeTransformers";

export interface UseRestaurantSwipeOptions {
  searchConfig?: Partial<PlaceSearchConfig>;
  autoStart?: boolean;
  maxCards?: number;
  prefetchDetails?: boolean;
}

export interface UseRestaurantSwipeReturn {
  // Cards and state
  cards: RestaurantCard[];
  currentCard: RestaurantCard | null;

  // Loading and error states
  isLoading: boolean;
  isLocationLoading: boolean;
  error: string | null;

  // Location data
  hasLocation: boolean;
  location: { latitude: number; longitude: number } | null;

  // Actions
  swipeCard: (cardId: string, action: "like" | "pass" | "super") => void;
  refreshCards: () => void;
  requestLocation: () => void;

  // Swipe history
  swipeHistory: SwipeAction[];
  likedCards: RestaurantCard[];

  // Configuration
  canSwipe: boolean;
  totalCards: number;

  // Feature flags
  usingLiveData: boolean;
}

export const useRestaurantSwipe = (
  options: UseRestaurantSwipeOptions = {}
): UseRestaurantSwipeReturn => {
  const {
    searchConfig = {},
    autoStart = true,
    maxCards = 20,
    prefetchDetails = true,
  } = options;

  // State management
  const [cards, setCards] = useState<RestaurantCard[]>([]);
  const [swipeHistory, setSwipeHistory] = useState<SwipeAction[]>([]);
  const [likedCards, setLikedCards] = useState<RestaurantCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Location services
  const {
    position,
    loading: isLocationLoading,
    error: locationError,
    getCurrentPosition,
    isSupported: isLocationSupported,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    requestOnMount: autoStart,
  });

  const {
    data: places,
    setLocation,
    refetch,
  } = useNearbyPlacesWithLocation(
    {
      // Optional search parameters
      radius: 1500, // 1.5km radius
      type: "restaurant", // Type of places to search for
      keyword: "pizza", // Optional keyword search
    },
    {
      enabled: true, // Enable the query
      refetchOnWindowFocus: false, // Don't refetch when window gains focus
    }
  );

  // Current location
  const location = position?.coords
    ? {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }
    : null;

  // Search configuration
  const finalSearchConfig = {
    ...defaultSearchConfig,
    ...searchConfig,
  };

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

  // Prefetch place details for top cards
  const { mutate: prefetchDetailsAction } = usePrefetchPlaceDetails();

  // Transform places to cards when data changes
  useEffect(() => {
    if (!nearbyPlaces || nearbyPlaces.length === 0) {
      if (defaultFeatureFlags.useGooglePlacesApi && location) {
        // Only show error if we're using live data and have location
        setError(
          "No restaurants found in your area. Try expanding your search radius."
        );
      }
      return;
    }

    try {
      // Transform places to restaurant cards
      const transformedCards = transformPlacesToCards(nearbyPlaces, {
        userLatitude: location?.latitude,
        userLongitude: location?.longitude,
        defaultImageUrl: getDefaultRestaurantImage(),
      });

      // Apply filters based on search config
      const filteredCards = filterCardsByPreferences(transformedCards, {
        maxDistance: finalSearchConfig.radius,
        minRating: finalSearchConfig.minRating,
        onlyOpenNow: finalSearchConfig.isOpenNow,
      });

      // Sort cards (closest first by default)
      const sortedCards = sortCards(filteredCards, "distance");

      // Limit to max cards
      const limitedCards = sortedCards.slice(0, maxCards);

      setCards(limitedCards);
      setError(null);

      // Prefetch details for top 3 cards
      if (prefetchDetails && limitedCards.length > 0) {
        const topCardIds = limitedCards.slice(0, 3).map((card) => card.id);
        prefetchDetailsAction(topCardIds);
      }
    } catch (err) {
      console.error("Error transforming places data:", err);
      setError("Failed to process restaurant data.");
    }
  }, [nearbyPlaces, location, finalSearchConfig, maxCards, prefetchDetails]);

  // Handle location errors
  useEffect(() => {
    if (locationError) {
      setError(`Location error: ${locationError}`);
    }
  }, [locationError]);

  // Handle places API errors
  useEffect(() => {
    if (placesError) {
      setError(`Failed to load restaurants: ${placesError.message}`);
    }
  }, [placesError]);

  // Swipe card action
  const swipeCard = useCallback(
    (cardId: string, action: "like" | "pass" | "super") => {
      const swipedCard = cards.find((card) => card.id === cardId);
      if (!swipedCard) return;

      // Create swipe action record
      const swipeAction: SwipeAction = {
        cardId,
        action,
        timestamp: Date.now(),
        place: swipedCard.placeDetails || {
          id: swipedCard.id,
          displayName: { text: swipedCard.title, languageCode: "en" },
          formattedAddress: swipedCard.address,
          rating: swipedCard.rating,
          location: swipedCard.location,
        },
      };

      // Update state
      setSwipeHistory((prev) => [...prev, swipeAction]);
      setCards((prev) => prev.filter((card) => card.id !== cardId));

      // If user liked the card, add to liked cards
      if (action === "like" || action === "super") {
        setLikedCards((prev) => [...prev, swipedCard]);
      }

      // Log action for analytics (in a real app, send to analytics service)
      console.log("Swipe action:", {
        cardId,
        action,
        restaurant: swipedCard.title,
      });

      // Prefetch details for next cards if running low
      const remainingCards = cards.filter((card) => card.id !== cardId);
      if (remainingCards.length <= 3 && remainingCards.length > 0) {
        const nextCardIds = remainingCards.slice(0, 2).map((card) => card.id);
        prefetchDetailsAction(nextCardIds);
      }
    },
    [cards, prefetchDetailsAction]
  );

  // Refresh cards (reload from API)
  const refreshCards = useCallback(async () => {
    if (location) {
      refetchPlaces();
    } else {
      const position = await getCurrentPosition();
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    }
  }, [location, refetchPlaces, getCurrentPosition]);

  // Request location permission
  const requestLocation = useCallback(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  // Computed values
  const currentCard = cards.length > 0 ? cards[0] : null;
  const isLoading = isLocationLoading || isPlacesLoading;
  const hasLocation = Boolean(location);
  const canSwipe = cards.length > 0 && !isLoading;
  const usingLiveData = defaultFeatureFlags.useGooglePlacesApi;

  // Use mock data if live data is disabled or no location
  useEffect(() => {
    if (
      !defaultFeatureFlags.useGooglePlacesApi ||
      (!location && !isLocationLoading)
    ) {
      // Fallback to mock data (you could import your existing mock data here)
      const mockCards: RestaurantCard[] = [
        {
          id: "mock-1",
          title: "Demo Restaurant",
          subtitle: "Italian",
          cuisine: "Italian",
          rating: 4.5,
          priceRange: "$$",
          distance: "0.5km",
          address: "Demo Address",
          imageUrl: getDefaultRestaurantImage("Italian"),
          reviews: [],
        },
      ];
      setCards(mockCards);
    } else {
      console.log("SetCards with live data");
      if (places?.length > 0) {
        const transformedCards = transformPlacesToCards(places, {
          userLatitude: location.latitude,
          userLongitude: location.longitude,
          defaultImageUrl: getDefaultRestaurantImage(),
        });
        setCards(transformedCards);
      }
    }
  }, [location, isLocationLoading]);

  return {
    // Cards and state
    cards,
    currentCard,

    // Loading and error states
    isLoading,
    isLocationLoading,
    error,

    // Location data
    hasLocation,
    location,

    // Actions
    swipeCard,
    refreshCards,
    requestLocation,

    // Swipe history
    swipeHistory,
    likedCards,

    // Configuration
    canSwipe,
    totalCards: cards.length,

    // Feature flags
    usingLiveData,
  };
};
