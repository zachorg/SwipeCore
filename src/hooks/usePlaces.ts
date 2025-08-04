import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  placesApi,
  PlaceBasic,
  PlaceDetails,
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
  health: () => ["places", "health"] as const,
};

// Cache configuration
const CACHE_CONFIG = {
  NEARBY_STALE_TIME: 5 * 60 * 1000, // 5 minutes (matches backend cache)
  DETAILS_STALE_TIME: 30 * 60 * 1000, // 30 minutes (matches backend cache)
  PHOTO_STALE_TIME: 60 * 60 * 1000, // 1 hour (matches backend cache)
  HEALTH_STALE_TIME: 30 * 1000, // 30 seconds
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

/**
 * Hook for checking API health status
 */
export const useApiHealth = () => {
  return useQuery({
    queryKey: PLACES_QUERY_KEYS.health(),
    queryFn: () => placesApi.healthCheck(),
    staleTime: CACHE_CONFIG.HEALTH_STALE_TIME,
    gcTime: CACHE_CONFIG.HEALTH_STALE_TIME * 2,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
    retry: false, // Don't retry health checks
  });
};

/**
 * Mutation hook for refreshing nearby places (useful for pull-to-refresh)
 */
export const useRefreshNearbyPlaces = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: NearbySearchParams) => {
      // Invalidate the specific query to force a fresh fetch
      await queryClient.invalidateQueries({
        queryKey: PLACES_QUERY_KEYS.nearby(params),
      });

      // Fetch fresh data
      return placesApi.searchNearby(params);
    },
    onSuccess: (data, params) => {
      // Update the cache with fresh data
      queryClient.setQueryData(PLACES_QUERY_KEYS.nearby(params), data);
    },
  });
};

/**
 * Mutation hook for prefetching place details (useful for preloading swipe queue)
 */
export const usePrefetchPlaceDetails = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (placeIds: string[]) => {
      const prefetchPromises = placeIds.map((placeId) =>
        queryClient.prefetchQuery({
          queryKey: PLACES_QUERY_KEYS.details(placeId),
          queryFn: () => placesApi.getPlaceDetails(placeId),
          staleTime: CACHE_CONFIG.DETAILS_STALE_TIME,
        })
      );

      await Promise.allSettled(prefetchPromises);
      return placeIds;
    },
  });
};

/**
 * Custom hook that combines geolocation and nearby places search
 */
export const useNearbyPlacesWithLocation = (
  searchOptions: Omit<NearbySearchParams, "lat" | "lng"> = {},
  queryOptions: {
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
  } = {}
) => {
  // This would use the geolocation hook we created earlier
  // For now, we'll accept lat/lng as parameters
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const nearbyQuery = useNearbyPlaces(
    {
      ...searchOptions,
      lat: location?.lat || 0,
      lng: location?.lng || 0,
    },
    {
      ...queryOptions,
      enabled: queryOptions.enabled !== false && Boolean(location),
    }
  );

  return {
    ...nearbyQuery,
    setLocation,
    hasLocation: Boolean(location),
  };
};

/**
 * Utility hook for managing query states across multiple places queries
 */
export const usePlacesQueryStates = () => {
  const queryClient = useQueryClient();

  const invalidateAllNearbyQueries = () => {
    queryClient.invalidateQueries({
      queryKey: ["places", "nearby"],
    });
  };

  const invalidateAllDetailsQueries = () => {
    queryClient.invalidateQueries({
      queryKey: ["places", "details"],
    });
  };

  const clearAllPlacesCache = () => {
    queryClient.removeQueries({
      queryKey: ["places"],
    });
  };

  const getCacheStats = () => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();
    const placesQueries = queries.filter(
      (query) => query.queryKey[0] === "places"
    );

    return {
      total: placesQueries.length,
      nearby: placesQueries.filter((q) => q.queryKey[1] === "nearby").length,
      details: placesQueries.filter((q) => q.queryKey[1] === "details").length,
      photos: placesQueries.filter((q) => q.queryKey[1] === "photo").length,
    };
  };

  return {
    invalidateAllNearbyQueries,
    invalidateAllDetailsQueries,
    clearAllPlacesCache,
    getCacheStats,
  };
};

// Type exports for convenience
export type { PlaceBasic, PlaceDetails, NearbySearchParams, PlacesApiError };
