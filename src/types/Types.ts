// Domain models for the SwipeCore app - integrating Google Places API data

import { NativeAdData } from "@/utils/ads";

export interface GooglePlacesApiBasicDetails {
  id: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  formattedAddress?: string;
  rating?: number;
  priceLevel?:
  | "PRICE_LEVEL_FREE"
  | "PRICE_LEVEL_INEXPENSIVE"
  | "PRICE_LEVEL_MODERATE"
  | "PRICE_LEVEL_EXPENSIVE"
  | "PRICE_LEVEL_VERY_EXPENSIVE";
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
    authorAttributions: Array<{
      displayName: string;
      uri: string;
      photoUri: string;
    }>;
  }>;
  types?: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  // Minimal opening hours info available on basic search responses
  regularOpeningHours?: {
    openNow: boolean;
  };
}

export interface GooglePlacesApiAdvDetails {
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: {
    openNow: boolean;
    periods: Array<{
      open: {
        day: number;
        hour: number;
        minute: number;
      };
      close?: {
        day: number;
        hour: number;
        minute: number;
      };
    }>;
    weekdayDescriptions: string[];
  };
  reviews?: Array<{
    name: string;
    relativePublishTimeDescription: string;
    rating: number;
    text: {
      text: string;
      languageCode: string;
    };
    originalText: {
      text: string;
      languageCode: string;
    };
    authorAttribution: {
      displayName: string;
      uri: string;
      photoUri: string;
    };
  }>;
  editorialSummary?: {
    text: string;
    languageCode: string;
  };
}

export interface PhotoReference {
  googleUrl?: string;
  url?: string;
  name?: string;
  widthPx: number;
  heightPx: number;
}

// Unified SwipeCard interface that works with Google Places data
export interface RestaurantCard {
  // Core identification
  id: string;

  // Basic Details 
  basicDetails: GooglePlacesApiBasicDetails;

  title: string;
  subtitle?: string;

  // Ads
  adData?: NativeAdData;

  // Restaurant-specific fields 
  cuisine?: string;
  rating?: number;
  priceRange?: "$" | "$$" | "$$$" | "$$$$";
  distance?: string;
  address?: string;
  isOpenNow?: boolean;

  // Photo data
  photos: PhotoReference[];

  // Location data
  location?: {
    latitude: number;
    longitude: number;
  };

  distanceInMeters?: number;

  // Adv Details
  advDetails?: GooglePlacesApiAdvDetails;

  // Restaurant-specific fields 
  phone?: string;
  website?: string;
  openingHours?: string;

  reviews?: AppReview[];

  // Legacy fields for backward compatibility
  [key: string]: any;
}

// Simplified review interface for the app
export interface AppReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  relativeTime?: string;
}

// Search configuration
export interface PlaceSearchConfig {
  radius: number;
  keyword?: string;
  type?: string;
  minRating?: number;
  priceLevel?: Array<
    | "PRICE_LEVEL_FREE"
    | "PRICE_LEVEL_INEXPENSIVE"
    | "PRICE_LEVEL_MODERATE"
    | "PRICE_LEVEL_EXPENSIVE"
    | "PRICE_LEVEL_VERY_EXPENSIVE"
  >;
  isOpenNow?: boolean;
}

// Default search configuration
export const defaultSearchConfig: PlaceSearchConfig = {
  radius: 20000, // 5km
  type: "restaurant",
  minRating: 0.0,
};

// Location context
export interface LocationContext {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
  city?: string;
}

// User preferences
export interface UserPreferences {
  maxDistance: number; // in meters
  preferredPriceRange: Array<"$" | "$$" | "$$$" | "$$$$">;
  preferredCuisines: string[];
  onlyOpenNow: boolean;
  minRating: number;
}

// Swipe-related interfaces (updated)
export interface SwipeAction {
  cardId: string;
  action: "menu" | "pass";
  timestamp: number;
}

export interface ExpandAction {
  cardId: string;
  timestamp: number;
}

export interface SwipeConfig {
  threshold: number; // Minimum distance to trigger swipe
  snapBackDuration: number; // Animation duration for snap back
  swipeOutDuration: number; // Animation duration for swipe out
  maxRotation: number; // Maximum rotation angle in degrees
}

export const defaultSwipeConfig: SwipeConfig = {
  threshold: 100,
  snapBackDuration: 0.3,
  swipeOutDuration: 0.3,
  maxRotation: 15,
};

// Optimized config for Android devices
export const androidOptimizedSwipeConfig: SwipeConfig = {
  threshold: 80, // Lower threshold for more responsive feel
  snapBackDuration: 0.2, // Faster snap back
  swipeOutDuration: 0.25, // Slightly faster swipe out
  maxRotation: 12, // Reduced rotation for smoother animation
};

// Data transformation utilities
export interface PlaceTransformOptions {
  userLatitude?: number;
  userLongitude?: number;
}

// App state interfaces
export interface AppState {
  location: LocationContext | null;
  searchConfig: PlaceSearchConfig;
  userPreferences: UserPreferences;
  currentCards: RestaurantCard[];
  swipeHistory: SwipeAction[];
  likedPlaces: RestaurantCard[];
}

// Error handling
export interface PlaceError {
  code:
  | "LOCATION_DENIED"
  | "API_ERROR"
  | "NO_RESULTS"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";
  message: string;
  details?: any;
}

// Analytics/tracking
export interface SwipeAnalytics {
  sessionId: string;
  userId?: string;
  totalSwipes: number;
  likesCount: number;
  passesCount: number;
  averageDecisionTime: number;
  searchParameters: PlaceSearchConfig;
  locationContext: LocationContext;
}

// Feature flags
export interface FeatureFlags {
  useGooglePlacesApi: boolean;
  enableLocationServices: boolean;
  enablePhotoPreloading: boolean;
  enableSwipeAnalytics: boolean;
  enableOfflineMode: boolean;
  // Ads
  adsEnabled: boolean;
  adsNativeInDeck: boolean;
}

export const defaultFeatureFlags: FeatureFlags = {
  useGooglePlacesApi: import.meta.env.VITE_USE_LIVE_DATA === "true",
  enableLocationServices:
    import.meta.env.VITE_ENABLE_LOCATION_SERVICES === "true",
  enablePhotoPreloading: true,
  enableSwipeAnalytics: import.meta.env.VITE_DEBUG_MODE === "true",
  enableOfflineMode: false,
  adsEnabled: import.meta.env.VITE_ADS_ENABLED === 'true',
  adsNativeInDeck: import.meta.env.VITE_ADS_NATIVE_IN_DECK === 'true',
};
