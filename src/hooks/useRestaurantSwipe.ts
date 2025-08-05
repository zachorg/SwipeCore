import { useState, useEffect, useCallback } from "react";
import { useGeolocation } from "./useGeolocation";
import {
  useNearbyPlaces,
  usePhotoUrl,
  usePlaceDetails,
} from "./usePlaces";
import {
  RestaurantCard,
  SwipeAction,
  PlaceSearchConfig,
  defaultSearchConfig,
  defaultFeatureFlags,
} from "../types/Types";
import {
  transformPlacesToCards,
  filterCardsByPreferences,
  sortCards,
  getDefaultRestaurantImage,
  mergeCardWithDetails,
} from "../utils/placeTransformers";
import { generateMockCards } from "@/lib/swipe-core";

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
  swipeCard: (cardId: string, action: "like" | "pass") => void;
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
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    requestOnMount: autoStart,
  });

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

  const {
    data: placeDetails,
  } = usePlaceDetails(selectedPlaceId || "", {
    // Only enable the query when a place is selected
    enabled: Boolean(selectedPlaceId),
  });

  // Handle selecting a place
  const handleSelectPlace = (placeId: string) => {
    setSelectedPlaceId(placeId);
  };

  interface PhotoReference {
    id: string;
    widthPx: number;
    heightPx: number;
  }

  const [selectedPhotoReference, setSelectedPhotoReference] =
    useState<PhotoReference | null>(null);

  const {
    data: placePhotoUrls,
    error: photosError,
  } = usePhotoUrl(
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

  if (
    (!defaultFeatureFlags.useGooglePlacesApi || !location) &&
    cards &&
    setCards &&
    cards?.length == 0
  ) {
    console.log("SetCards with mock data");
    const mockCards: RestaurantCard[] = generateMockCards();
    setCards(mockCards);
  }

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
      if (!defaultFeatureFlags.useGooglePlacesApi || !location) {
        return;
      }

      console.log("SetCards with live data");
      if (nearbyPlaces?.length <= 0) {
        return;
      }
      //   // Transform places to restaurant cards
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
      handleSelectPlace(limitedCards[0].id);
      setError(null);
    } catch (err) {
      console.error("Error transforming places data:", err);
      setError("Failed to process restaurant data.");
    }
  }, [nearbyPlaces]);

  useEffect(() => {
    if (placeDetails) {
      const currentCard = cards[0];
      if (placeDetails.photos) {
        const { name, widthPx, heightPx } = placeDetails.photos[0];
        console.log(`fetching photos for ${currentCard.title}:${name} ..`);
        handleSelectPhotoReference(name, widthPx, heightPx);
      } else {
        console.log(`${currentCard.title} does not have any photos..`);
      }
      
      // mergeCardWithDetails returns a new card object
      const updatedCard = mergeCardWithDetails(currentCard, placeDetails);
      const updatedCards = [...cards];
      updatedCards[0] = updatedCard;
      setCards(updatedCards);
      console.log("Place details for current card fetched!");
    }
  }, [placeDetails]);

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

  // Handle location errors
  useEffect(() => {
    if (locationError) {
      setError(`Location error: ${locationError}`);
    }
  }, [locationError]);

  // Handle Photo errors
  useEffect(() => {
    if (photosError) {
      setError(`Photos error: ${photosError}`);
    }
  }, [photosError]);

  // Handle places API errors
  useEffect(() => {
    if (placesError) {
      setError(`Failed to load restaurants: ${placesError.message}`);
    }
  }, [placesError]);

  // Swipe card action
  const swipeCard = useCallback(
    (cardId: string, action: "like" | "pass") => {
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
      if (action === "like") {
        setLikedCards((prev) => [...prev, swipedCard]);
      }

      // Log action for analytics (in a real app, send to analytics service)
      console.log("Swipe action:", {
        cardId,
        action,
        restaurant: swipedCard.title,
      });

      const remainingCards = cards.filter((card) => card.id !== cardId);
      const currentCard = remainingCards.length > 0 ? remainingCards[0] : null;
      if (currentCard) {
        handleSelectPlace(currentCard.id);
      }
    },
    [cards]
  );

  // Refresh cards (reload from API)
  const refreshCards = useCallback(async () => {}, [location]);

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
