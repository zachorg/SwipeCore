// Domain models for the SwipeCore app - integrating Google Places API data

export interface PlaceBasic {
  id: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  formattedAddress?: string;
  rating?: number;
  priceLevel?: 'PRICE_LEVEL_FREE' | 'PRICE_LEVEL_INEXPENSIVE' | 'PRICE_LEVEL_MODERATE' | 'PRICE_LEVEL_EXPENSIVE' | 'PRICE_LEVEL_VERY_EXPENSIVE';
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
}

export interface PlaceDetails extends PlaceBasic {
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

// Unified SwipeCard interface that works with Google Places data
export interface RestaurantCard {
  // Core identification
  id: string;
  
  // Display data (computed from PlaceBasic/PlaceDetails)
  imageUrl: string | null;
  title: string;
  subtitle?: string;
  
  // Restaurant-specific fields (transformed from Google Places data)
  cuisine?: string;
  rating?: number;
  priceRange?: '$' | '$$' | '$$$' | '$$$$';
  distance?: string;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  isOpenNow?: boolean;
  
  // Photo data
  photos?: string[];
  photoReferences?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
  }>;
  
  // Reviews (transformed from Google Places reviews)
  reviews?: AppReview[];
  
  // Location data
  location?: {
    latitude: number;
    longitude: number;
  };
  
  // Google Places raw data (for detail view)
  placeDetails?: PlaceDetails;
  
  // Additional computed fields
  distanceInMeters?: number;
  
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
  priceLevel?: Array<'PRICE_LEVEL_FREE' | 'PRICE_LEVEL_INEXPENSIVE' | 'PRICE_LEVEL_MODERATE' | 'PRICE_LEVEL_EXPENSIVE' | 'PRICE_LEVEL_VERY_EXPENSIVE'>;
  isOpenNow?: boolean;
}

// Default search configuration
export const defaultSearchConfig: PlaceSearchConfig = {
  radius: 5000, // 5km
  type: 'restaurant',
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
  preferredPriceRange: Array<'$' | '$$' | '$$$' | '$$$$'>;
  preferredCuisines: string[];
  onlyOpenNow: boolean;
  minRating: number;
}

// Swipe-related interfaces (updated)
export interface SwipeAction {
  cardId: string;
  action: 'like' | 'pass';
  timestamp: number;
  place?: PlaceBasic;
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

// Data transformation utilities
export interface PlaceTransformOptions {
  userLatitude?: number;
  userLongitude?: number;
  defaultImageUrl?: string;
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
  code: 'LOCATION_DENIED' | 'API_ERROR' | 'NO_RESULTS' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
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
}

export const defaultFeatureFlags: FeatureFlags = {
  useGooglePlacesApi: import.meta.env.VITE_USE_LIVE_DATA === 'true',
  enableLocationServices: import.meta.env.VITE_ENABLE_LOCATION_SERVICES === 'true',
  enablePhotoPreloading: true,
  enableSwipeAnalytics: import.meta.env.VITE_DEBUG_MODE === 'true',
  enableOfflineMode: false,
};