import { useQuery } from "@tanstack/react-query";
import {
  placesApi,
  NearbySearchParams,
  PlacesApiError,
} from "../services/places";

// Query keys for React Query
export const PLACES_QUERY_KEYS = {
  all: ["places"] as const,
  nearby: (params: NearbySearchParams) => ["places", "nearby", params] as const,
  details: (placeId: string) => ["places", "details", placeId] as const,
  photo: (
    placeId: string,
    photoReference: string,
    maxWidth?: number,
    maxHeight?: number
  ) => ["places", "photo", placeId, photoReference, maxWidth, maxHeight] as const,

};

// Cache configuration
const CACHE_CONFIG = {
  NEARBY_STALE_TIME: 5 * 60 * 1000, // 5 minutes (matches backend cache)
  DETAILS_STALE_TIME: 30 * 60 * 1000, // 30 minutes (matches backend cache)
  PHOTO_STALE_TIME: 60 * 60 * 1000, // 1 hour (matches backend cache)

  RETRY_COUNT: 3,
  RETRY_DELAY: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000),
};

/**
 * Hook for searching nearby places
 */
export const useNearbyPlaces = (
  params: NearbySearchParams,
  options: {
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
    refetchOnMount?: boolean;
  } = {}
) => {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    refetchOnMount = true,
  } = options;

  return useQuery({
    queryKey: PLACES_QUERY_KEYS.nearby(params),
    queryFn: () => placesApi.searchNearby(params),
    enabled: enabled && Boolean(params.lat && params.lng),
    staleTime: CACHE_CONFIG.NEARBY_STALE_TIME,
    gcTime: CACHE_CONFIG.NEARBY_STALE_TIME * 2, // Keep in cache for double the stale time
    refetchOnWindowFocus,
    refetchOnMount,
    retry: (failureCount, error) => {
      // Don't retry on client errors (4xx)
      if (
        error instanceof PlacesApiError &&
        error.statusCode >= 400 &&
        error.statusCode < 500
      ) {
        return false;
      }
      return failureCount < CACHE_CONFIG.RETRY_COUNT;
    },
    retryDelay: CACHE_CONFIG.RETRY_DELAY,
  });
};

/**
 * Hook for getting place details
 */
export const usePlaceDetails = (
  placeId: string,
  options: {
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
  } = {}
) => {
  const { enabled = true, refetchOnWindowFocus = false } = options;

  return useQuery({
    queryKey: PLACES_QUERY_KEYS.details(placeId),
    queryFn: () => placesApi.getPlaceDetails(placeId),
    enabled: enabled && Boolean(placeId),
    staleTime: CACHE_CONFIG.DETAILS_STALE_TIME,
    gcTime: CACHE_CONFIG.DETAILS_STALE_TIME * 2,
    refetchOnWindowFocus,
    retry: (failureCount, error) => {
      if (
        error instanceof PlacesApiError &&
        error.statusCode >= 400 &&
        error.statusCode < 500
      ) {
        return false;
      }
      return failureCount < CACHE_CONFIG.RETRY_COUNT;
    },
    retryDelay: CACHE_CONFIG.RETRY_DELAY,
  });
};

/**
 * Hook for getting photo URLs
 */
export const usePhotoUrl = (
  placeId,
  photoReference: string,
  maxWidth: number = 400,
  maxHeight: number = 400,
  options: {
    enabled?: boolean;
  } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: PLACES_QUERY_KEYS.photo(
      placeId,
      photoReference,
      maxWidth,
      maxHeight
    ),
    queryFn: () => placesApi.getPhotoUrl(placeId, photoReference, maxWidth, maxHeight),
    enabled: enabled && Boolean(photoReference),
    staleTime: CACHE_CONFIG.PHOTO_STALE_TIME,
    gcTime: CACHE_CONFIG.PHOTO_STALE_TIME * 2,
    // retry: (failureCount, error) => {
    //   if (error instanceof PlacesApiError && error.statusCode >= 400 && error.statusCode < 500) {
    //     return false;
    //   }
    //   return failureCount < CACHE_CONFIG.RETRY_COUNT;
    // },
    // retryDelay: CACHE_CONFIG.RETRY_DELAY,
  });
};

// Type exports for convenience
export type { NearbySearchParams, PlacesApiError } from "../services/places";
export type { PlaceBasic, PlaceDetails } from "../types/places";
