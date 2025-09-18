// Places service for React Native
// This service handles fetching nearby restaurants and place details through your backend
import { GooglePlacesApiBasicDetails, GooglePlacesApiAdvDetails } from "../types/Types";

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

export interface NearbySearchResponse extends ApiResponse<GooglePlacesApiBasicDetails[]> {
  count: number;
}

export interface GooglePlaceDetailsResponse extends ApiResponse<GooglePlacesApiAdvDetails> { }

export interface GooglePhotoResponse
  extends ApiResponse<{
    photoUrl: string;
    photoReference: string;
  }> { }

export interface ApiError {
  error: string;
  details?: string;
}

// Custom error class for API errors
export class GooglePlacesApiError extends Error {
  public statusCode: number;
  public details?: string;

  constructor(message: string, statusCode: number = 500, details?: string) {
    super(message);
    this.name = "PlacesApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

import { API_CONFIG, buildApiUrl } from "../config/api";

export class PlacesApiClient {
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || API_CONFIG.BACKEND_URL;

    if (!this.baseURL) {
      throw new Error('Backend URL is not set');
    }

    console.log("🔧 PlacesApiClient Configuration:", {
      baseURL: this.baseURL,
      mode: __DEV__ ? 'development' : 'production',
    });
  }

  /**
   * Search for nearby places
   */
  async searchNearby(params: NearbySearchParams): Promise<GooglePlacesApiBasicDetails[]> {
    try {
      console.log("🔍 Searching nearby places:", params);

      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PLACES.NEARBY) + `?${new URLSearchParams({
        lat: params.lat.toString(),
        lng: params.lng.toString(),
        radius: (params.radius || 5000).toString(),
        keyword: params.keyword || '',
        type: params.type || 'restaurant',
      })}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new GooglePlacesApiError(
          `Failed to fetch nearby places: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json() as NearbySearchResponse;
      console.log("🎯 Found places:", data.data?.length || 0);

      if (!data.success) {
        throw new GooglePlacesApiError('Backend returned unsuccessful response');
      }

      return data.data || [];
    } catch (error) {
      console.error("❌ Error searching nearby places:", error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific place
   */
  async getPlaceDetails(placeId: string): Promise<GooglePlacesApiAdvDetails> {
    try {
      console.log("🔍 Getting place details for:", placeId);

      const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.PLACES.DETAILS}/${placeId}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new GooglePlacesApiError(
          `Failed to fetch place details: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json() as GooglePlaceDetailsResponse;

      if (!data.success) {
        throw new GooglePlacesApiError('Backend returned unsuccessful response');
      }

      return data.data;
    } catch (error) {
      console.error("❌ Error getting place details:", error);
      throw error;
    }
  }

  /**
   * Get a photo URL for a place photo reference
   */
  async getPhotoUrl(
    placeId: string,
    photoReference: string,
    maxWidth: number = 400,
    maxHeight: number = 400
  ): Promise<{ placeId: string; photoUrl: string }> {
    try {
      console.log("🖼️ Getting photo URL for place:", placeId);

      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PLACES.PHOTO) + `?${new URLSearchParams({
        photoReference,
        maxWidth: maxWidth.toString(),
        maxHeight: maxHeight.toString(),
      })}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new GooglePlacesApiError(
          `Failed to fetch photo URL: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json() as GooglePhotoResponse;

      if (!data.success) {
        throw new GooglePlacesApiError('Backend returned unsuccessful response');
      }

      return { placeId, photoUrl: data.data.photoUrl };
    } catch (error) {
      console.error("❌ Error getting photo URL:", error);
      throw error;
    }
  }

  /**
   * Check if the API server is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.HEALTH));
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      return data.status === "ok";
    } catch (error) {
      console.error("❌ Health check failed:", error);
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
// Distance calculation utility
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
