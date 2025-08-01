import axios, { AxiosInstance } from 'axios';
import NodeCache from 'node-cache';
import { CustomError } from '../middleware/errorHandler';
import {
  NearbySearchParams,
  GooglePlacesNearbyResponse,
  GooglePlacesDetailsResponse,
  PlaceBasic,
  PlaceDetails,
} from '../types/places';

export class GooglePlacesService {
  private client: AxiosInstance;
  private cache: NodeCache;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY!;

    if (!this.apiKey) {
      throw new CustomError('Google Places API key is not configured', 500);
    }

    this.client = axios.create({
      baseURL:
        process.env.PLACES_BASE_URL || 'https://places.googleapis.com/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
      },
    });

    // Initialize cache with TTL values from environment
    this.cache = new NodeCache({
      stdTTL: 300, // Default 5 minutes
      checkperiod: 60, // Check for expired keys every minute
      deleteOnExpire: true,
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(
          `🌐 Google Places API Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(
          `✅ Google Places API Response: ${response.status} ${response.config.url}`
        );
        return response;
      },
      (error) => {
        console.error('Response error:', error.response?.data || error.message);
        return Promise.reject(this.mapGoogleError(error));
      }
    );
  }

  async searchNearby(params: NearbySearchParams): Promise<PlaceBasic[]> {
    const cacheKey = `nearby:${params.lat}:${params.lng}:${params.radius}:${params.keyword || ''}:${params.type || ''}`;

    // Check cache first
    const cached = this.cache.get<PlaceBasic[]>(cacheKey);
    if (cached) {
      console.log('📦 Cache hit for nearby search');
      return cached;
    }

    try {
      const requestBody = {
        includedTypes: params.type ? [params.type] : undefined,
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude: params.lat,
              longitude: params.lng,
            },
            radius: params.radius,
          },
        },
        languageCode: 'en',
      };

      // TEXT QUERY DOES NOT EXIST IN NEW GOOGLE API
      // if (params.keyword) {
      //   (requestBody as any).textQuery = params.keyword;
      // }

      const response = await this.client.post<GooglePlacesNearbyResponse>(
        '/places:searchNearby',
        requestBody,
        {
          headers: {
            'X-Goog-FieldMask':
              'places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.photos,places.types,places.location',
          },
        }
      );

      const places = response.data.places || [];

      // Cache the results
      const ttl = parseInt(process.env.CACHE_TTL_NEARBY || '300');
      this.cache.set(cacheKey, places, ttl);

      return places;
    } catch (error) {
      console.error('Error in searchNearby:', error);
      throw error;
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    const cacheKey = `details:${placeId}`;

    // Check cache first
    const cached = this.cache.get<PlaceDetails>(cacheKey);
    if (cached) {
      console.log('📦 Cache hit for place details');
      return cached;
    }

    try {
      const response = await this.client.get<GooglePlacesDetailsResponse>(
        `/places/${placeId}`,
        {
          headers: {
            'X-Goog-FieldMask':
              'id,displayName,formattedAddress,rating,priceLevel,photos,types,location,nationalPhoneNumber,internationalPhoneNumber,websiteUri,regularOpeningHours,reviews,editorialSummary',
          },
        }
      );

      const place = response.data;

      // Cache the results
      const ttl = parseInt(process.env.CACHE_TTL_DETAILS || '1800');
      this.cache.set(cacheKey, place, ttl);

      return place;
    } catch (error) {
      console.error('Error in getPlaceDetails:', error);
      throw error;
    }
  }

  async getPhotoUrl(
    photoReference: string,
    maxWidth: number = 400,
    maxHeight: number = 400
  ): Promise<string> {
    const cacheKey = `photo:${photoReference}:${maxWidth}:${maxHeight}`;

    // Check cache first
    const cached = this.cache.get<string>(cacheKey);
    if (cached) {
      console.log('📦 Cache hit for photo URL');
      return cached;
    }

    try {
      // For Google Places API (New), photo names are in format: places/{place_id}/photos/{photo_name}
      // We need to make a request to get the actual photo content or signed URL
      const response = await this.client.get(`/${photoReference}/media`, {
        params: {
          maxHeightPx: maxHeight,
          maxWidthPx: maxWidth,
          skipHttpRedirect: true,
        },
      });

      // The response should contain the photoUri
      const photoUrl =
        response.data.photoUri || response.request.res.responseUrl;

      // Cache the URL
      const ttl = parseInt(process.env.CACHE_TTL_PHOTOS || '3600');
      this.cache.set(cacheKey, photoUrl, ttl);

      return photoUrl;
    } catch (error) {
      console.error('Error in getPhotoUrl:', error);
      throw error;
    }
  }

  private mapGoogleError(error: any): CustomError {
    const status = error.response?.status;
    const message = error.response?.data?.error?.message || error.message;

    switch (status) {
      case 400:
        return new CustomError('Invalid request parameters', 400);
      case 403:
        return new CustomError(
          'API access denied. Check your API key and restrictions.',
          403
        );
      case 429:
        return new CustomError(
          'API quota exceeded. Please try again later.',
          429
        );
      case 500:
      case 502:
      case 503:
        return new CustomError(
          'Google Places service temporarily unavailable',
          503
        );
      default:
        return new CustomError(
          `Google Places API error: ${message}`,
          status || 500
        );
    }
  }

  // Method to clear cache (useful for testing)
  clearCache(): void {
    this.cache.flushAll();
  }

  // Method to get cache statistics
  getCacheStats(): { keys: number; hits: number; misses: number } {
    const stats = this.cache.getStats();
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
    };
  }
}
