import { useEffect, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RestaurantCard } from "@/types/Types";
import {
  PrefetchAnalytics,
  PrefetchEvent,
  BudgetStatus,
  PrefetchDecision,
  CardScore,
} from "@/types/prefetching";
import { prefetchingService } from "@/services/prefetcher";
import { prefetchAnalytics } from "@/services/prefetchAnalytics";
import { PrefetchCandidate } from "@/utils/costOptimizer";
import { GooglePhotoResponse } from "@/services/places";

export interface UsePrefetcherOptions {
  enabled?: boolean;
  debugMode?: boolean;
  onPrefetchEvent?: (event: PrefetchEvent) => void;
}

export enum ImmediateFetchRequest {
  Details,
  Photos,
  Both,
}

export interface UsePrefetcherReturn {
  // Status
  isEnabled: boolean;
  budgetStatus: BudgetStatus;
  analytics: PrefetchAnalytics;

  // Actions
  prefetchCards: (
    cards: RestaurantCard[],
    currentPosition?: number,
    userPreferences?: any
  ) => Promise<void>;
  requestImmediateFetch: (
    card: RestaurantCard,
    req: ImmediateFetchRequest
  ) => Promise<void>;
  enablePrefetching: () => void;
  disablePrefetching: () => void;
  clearPrefetchQueue: () => void;

  // Analytics
  getRecentEvents: (count?: number) => PrefetchEvent[];
  clearAnalytics: () => void;
}

export function usePrefetcher(
  options: UsePrefetcherOptions = {}
): UsePrefetcherReturn {
  const { enabled = true, debugMode = false, onPrefetchEvent } = options;

  const queryClient = useQueryClient();
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus>(
    prefetchingService.getBudgetStatus()
  );
  const [analytics, setAnalytics] = useState<PrefetchAnalytics>(
    prefetchAnalytics.getAnalytics()
  );

  prefetchingService.setQueryClient(queryClient);

  // Set up event listeners
  useEffect(() => {
    const handlePrefetchEvent = async (event: PrefetchEvent) => {
      // Track event in analytics
      await prefetchAnalytics.trackEvent(event);

      // Update analytics state
      setAnalytics(prefetchAnalytics.getAnalytics());

      // Update budget status
      setBudgetStatus(prefetchingService.getBudgetStatus());

      // Call user-provided event handler
      onPrefetchEvent?.(event);

      // if (debugMode) {
      //   console.log("[usePrefetcher] Event:", event);
      // }
    };

    prefetchingService.addEventListener(handlePrefetchEvent);

    return () => {
      prefetchingService.removeEventListener(handlePrefetchEvent);
    };
  }, [onPrefetchEvent, debugMode]);

  // Update service configuration when options change
  useEffect(() => {
    prefetchingService.updateConfig({
      enabled: isEnabled,
      debugMode,
    });
  }, [isEnabled, debugMode]);

  // Periodic analytics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAnalytics(prefetchAnalytics.getAnalytics());
      setBudgetStatus(prefetchingService.getBudgetStatus());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const prefetchCards = useCallback(
    async (
      cards: RestaurantCard[],
      currentPosition: number = 0,
      userPreferences?: any
    ) => {
      if (!isEnabled) return;

      try {
        await prefetchingService.intelligentPrefetch(
          cards,
          currentPosition,
          userPreferences
        );
      } catch (error) {
        console.error("Error in prefetchCards:", error);
      }
    },
    [isEnabled]
  );

  const requestImmediateFetch = useCallback(
    async (card: RestaurantCard, req: ImmediateFetchRequest) => {
      console.log("requestImmediateFetch: ", card.title);
      if (!isEnabled) return;

      try {
        if (
          req === ImmediateFetchRequest.Both ||
          req === ImmediateFetchRequest.Details
        ) {
          await prefetchingService.prefetchPlaceDetails(card.id, queryClient);
        }

        const includePhotos =
          req === ImmediateFetchRequest.Both ||
          req === ImmediateFetchRequest.Photos;
        if (includePhotos) {
          await prefetchingService.prefetchPhotos(card, queryClient);
        }

        // Update budget
        const totalCost = prefetchingService.costOptimizer.calculateCostEstimate(
            card,
            includePhotos
          ).totalCost
        await prefetchingService.updateBudgetSpend(
          totalCost
        );

        // Emit prefetch completed event
        prefetchingService.emitEvent({
          type: "prefetch_completed",
          cardId: card.id,
          timestamp: Date.now(),
          cost: totalCost,
          score: {} as CardScore,
          decision: {} as PrefetchDecision,
          metadata: { success: true },
        });
      } catch (error) {
        console.error("Error in prefetchCards:", error);
      }
    },
    [isEnabled]
  );

  const enablePrefetching = useCallback(() => {
    setIsEnabled(true);
    prefetchingService.resumePrefetching();
  }, []);

  const disablePrefetching = useCallback(() => {
    setIsEnabled(false);
    prefetchingService.pausePrefetching();
  }, []);

  const clearPrefetchQueue = useCallback(() => {
    prefetchingService.clearPrefetchQueue();
  }, []);

  const getRecentEvents = useCallback((count: number = 50) => {
    return prefetchAnalytics.getRecentEvents(count);
  }, []);

  const clearAnalytics = useCallback(async () => {
    await prefetchAnalytics.clearAnalytics();
    setAnalytics(prefetchAnalytics.getAnalytics());
  }, []);

  return {
    isEnabled,
    budgetStatus,
    analytics,
    prefetchCards,
    requestImmediateFetch,
    enablePrefetching,
    disablePrefetching,
    clearPrefetchQueue,
    getRecentEvents,
    clearAnalytics,
  };
}
