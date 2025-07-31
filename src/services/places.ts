import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Type definitions matching the backend API responses
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

// API Request/Response types
export interface NearbySearchParams {
  lat: number;
  lng: number;
  radius?: number;
  keyword?: string;
  type?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  count?: number;
}

export interface NearbySearchResponse extends ApiResponse<PlaceBasic[]> {
  count: number;
}

export interface PlaceDetailsResponse extends ApiResponse<PlaceDetails> {}

export interface PhotoResponse extends ApiResponse<{
  photoUrl: string;
  photoReference: string;
}> {}

export interface ApiError {
  error: string;
  details?: string;
}

// Custom error class for API errors
export class PlacesApiError extends Error {
  public statusCode: number;
  public details?: string;

  constructor(message: string, statusCode: number = 500, details?: string) {
    super(message);
    this.name = 'PlacesApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class PlacesApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string) {
    // Temporary: Use network IP for Android development
    const defaultBackendUrl = 'http://192.168.1.152:4000';
    this.baseURL = baseURL || import.meta.env.VITE_BACKEND_URL || defaultBackendUrl;
    
    // Debug logging
    console.log('🔧 PlacesApiClient Configuration:', {
      baseURL: this.baseURL,
      envViteBackendUrl: import.meta.env.VITE_BACKEND_URL,
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV
    });
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log('🚀 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          fullUrl: `${config.baseURL}${config.url}`,
          params: config.params
        });
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        console.log('✅ API Response:', {
          status: response.status,
          url: response.config.url,
          dataLength: response.data ? JSON.stringify(response.data).length : 0
        });
        return response;
      },
      (error) => {
        console.error('❌ API Error:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          url: error.config?.url,
          baseURL: error.config?.baseURL
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Search for nearby places
   */
  async searchNearby(params: NearbySearchParams): Promise<PlaceBasic[]> {
    try {
      console.log('🔍 Searching nearby places:', params);
      const response = await this.client.get<NearbySearchResponse>('/api/places/nearby', {
        params,
      });
      console.log('🎯 Found places:', response.data.data?.length || 0);
      
      return response.data.data;
    } catch (error) {
      throw error; // Re-throw the PlacesApiError from interceptor
    }
  }

  /**
   * Get detailed information about a specific place
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    try {
      const response = await this.client.get<PlaceDetailsResponse>(`/api/places/${placeId}`);
      
      return response.data.data;
    } catch (error) {
      throw error; // Re-throw the PlacesApiError from interceptor
    }
  }

  /**
   * Get a photo URL for a place photo reference
   */
  async getPhotoUrl(
    photoReference: string,
    maxWidth: number = 400,
    maxHeight: number = 400
  ): Promise<string> {
    try {
      const response = await this.client.get<PhotoResponse>(
        `/api/places/photo/${photoReference}`,
        {
          params: { maxWidth, maxHeight },
        }
      );
      
      return response.data.data.photoUrl;
    } catch (error) {
      throw error; // Re-throw the PlacesApiError from interceptor
    }
  }

  /**
   * Check if the API server is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'ok';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the base URL being used by the client
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}

// Export a default instance
export const placesApi = new PlacesApiClient();

// Utility functions for data transformation
export const formatPriceLevel = (priceLevel?: string): string => {
  if (!priceLevel) return '';
  
  switch (priceLevel) {
    case 'PRICE_LEVEL_FREE':
      return 'Free';
    case 'PRICE_LEVEL_INEXPENSIVE':
      return '$';
    case 'PRICE_LEVEL_MODERATE':
      return '$$';
    case 'PRICE_LEVEL_EXPENSIVE':
      return '$$$';
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return '$$$$';
    default:
      return '';
  }
};

export const formatOpeningHours = (hours?: PlaceDetails['regularOpeningHours']): string => {
  if (!hours) return '';
  
  if (hours.openNow) {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Find today's closing time
    const todayPeriods = hours.periods.filter(period => period.open.day === currentDay);
    
    if (todayPeriods.length > 0) {
      const period = todayPeriods[0];
      if (period.close) {
        const closeHour = period.close.hour;
        const closeMinute = period.close.minute;
        const closeTime = `${closeHour > 12 ? closeHour - 12 : closeHour || 12}:${closeMinute.toString().padStart(2, '0')} ${closeHour >= 12 ? 'PM' : 'AM'}`;
        return `Open now · Closes ${closeTime}`;
      } else {
        return 'Open 24 hours';
      }
    }
  }
  
  return 'Closed';
};

export const getFirstPhotoUrl = (place: PlaceBasic | PlaceDetails): string | null => {
  if (!place.photos || place.photos.length === 0) return null;
  
  // For now, return the photo name - in a real implementation,
  // you would call getPhotoUrl with this reference
  return place.photos[0].name;
};

export const formatRating = (rating?: number): string => {
  if (!rating) return '';
  return `${rating.toFixed(1)} ⭐`;
};

// Distance calculation utility (reused from geolocation hook)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): string => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else {
    return `${distance.toFixed(1)}km`;
  }
};