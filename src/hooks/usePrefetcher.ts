import { useEffect, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RestaurantCard } from "@/types/Types";
import {
  PrefetchAnalytics,
  PrefetchEvent,
  BudgetStatus,
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
  requestImmediateFetch: (card: RestaurantCard) => Promise<void>;
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
    const handlePrefetchEvent = (event: PrefetchEvent) => {
      // Track event in analytics
      prefetchAnalytics.trackEvent(event);

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
    async (card: RestaurantCard) => {
      console.log("requestImmediateFetch: ", card.title);
      if (!isEnabled) return;

      try {
        const candidate: PrefetchCandidate = {
          card: card,
          score: {
            // Individual factor scores (0-100)
            positionScore: 100, // based on queue position
            contentRelevanceScore: 100, // matches user preferences
            ratingScore: 100, // restaurant rating influence
            popularityScore: 100, // general popularity
            userPatternScore: 100, // matches user's historical preferences
            timeContextScore: 100, // relevant to current time
            sessionContextScore: 100, // fits current session pattern
            engagementPrediction: 100, // likelihood of user engagement

            // Computed values
            baseScore: 100, // weighted combination
            finalScore: 100, // adjusted for context
            confidence: 100, // confidence in prediction (0-1)

            // Metadata
            calculatedAt: 0, // timestamp
            factors: {}, // detailed factor breakdown
          },
          position: 0,
          estimatedCost: 0,
          expectedValue: 0,
          valuePerDollar: 0,
        };
        await prefetchingService.executePrefetchDecisions([candidate]);
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

  const clearAnalytics = useCallback(() => {
    prefetchAnalytics.clearAnalytics();
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
