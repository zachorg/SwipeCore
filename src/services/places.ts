import { GooglePlacesApiBasicDetails, GooglePlacesApiAdvDetails } from "@/types/Types";
import axios, { AxiosInstance } from "axios";

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

export interface GooglePlaceDetailsResponse extends ApiResponse<GooglePlacesApiAdvDetails> {}

export interface GooglePhotoResponse
  extends ApiResponse<{
    photoUrl: string;
    photoReference: string;
  }> {}

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

export class PlacesApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string) {
    // Choose sensible defaults per platform (Android emulator cannot reach host via localhost)
    const isAndroid =
      typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
    const emulatorHost = "10.0.2.2"; // Android emulator host loopback
    const defaultBackendUrl = isAndroid
      ? `http://${emulatorHost}:4000`
      : "http://localhost:4000";

    const envUrl = import.meta.env.VITE_BACKEND_URL as string | undefined;

    let resolvedUrl = baseURL || envUrl || defaultBackendUrl;

    // If env or provided URL points to localhost but we're on Android, rewrite to 10.0.2.2
    if (isAndroid && /^(http:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i.test(resolvedUrl)) {
      try {
        const url = new URL(resolvedUrl);
        url.hostname = emulatorHost;
        resolvedUrl = url.toString();
        console.warn(
          "⚠️ Overriding localhost backend URL for Android emulator:",
          resolvedUrl
        );
      } catch {
        // Fallback simple replace if URL constructor fails
        resolvedUrl = resolvedUrl.replace("localhost", emulatorHost).replace("127.0.0.1", emulatorHost);
      }
    }

    this.baseURL = resolvedUrl;

    // Debug logging
    console.log("🔧 PlacesApiClient Configuration:", {
      baseURL: this.baseURL,
      envViteBackendUrl: import.meta.env.VITE_BACKEND_URL,
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
    });

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 55000,// render server can take up to 50s to spin up..
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log("🚀 API Request:", {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          fullUrl: `${config.baseURL}${config.url}`,
          params: config.params,
        });
        return config;
      },
      (error) => {
        console.error("❌ Request Error:", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        console.log("✅ API Response:", {
          status: response.status,
          url: response.config.url,
          dataLength: response.data ? JSON.stringify(response.data).length : 0,
        });
        return response;
      },
      (error) => {
        console.error("❌ API Error:", {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Search for nearby places
   */
  async searchNearby(params: NearbySearchParams): Promise<GooglePlacesApiBasicDetails[]> {
    try {
      console.log("🔍 Searching nearby places:", params);
      const response = await this.client.get<NearbySearchResponse>(
        "/api/places/nearby",
        {
          params,
        }
      );
      console.log("🎯 Found places:", response.data.data?.length || 0);

      return response.data.data;
    } catch (error) {
      throw error; // Re-throw the PlacesApiError from interceptor
    }
  }

  /**
   * Get detailed information about a specific place
   */
  async getPlaceDetails(placeId: string): Promise<GooglePlacesApiAdvDetails> {
    try {
      const response = await this.client.get<GooglePlaceDetailsResponse>(
        `/api/places/${placeId}`
      );

      return response.data.data;
    } catch (error) {
      throw error; // Re-throw the PlacesApiError from interceptor
    }
  }

  /**
   * Get a photo URL for a place photo reference
   */
  async getPhotoUrl(
    _placeId: string,
    photoReference: string,
    maxWidth: number = 400,
    maxHeight: number = 400
  ): Promise<any> {
    try {
      const response = await this.client.get<GooglePhotoResponse>(
        `/api/places/photo/givememyphoto`,
        {
          params: { photoReference, maxWidth, maxHeight },
        }
      );

      return {placeId: _placeId, photoUrl: response.data.data.photoUrl};
    } catch (error) {
      throw error; // Re-throw the PlacesApiError from interceptor
    }
  }

  /**
   * Check if the API server is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get("/health");
      return response.data.status === "ok";
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
