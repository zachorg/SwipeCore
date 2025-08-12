import { useState, useEffect, useRef, useCallback } from "react";
import { SwipeCard } from "./SwipeCard";
import {
  RestaurantCard,
  SwipeConfig,
  defaultSwipeConfig,
  androidOptimizedSwipeConfig,
  defaultFeatureFlags,
} from "@/types/Types";
import { SwipeControls } from "./SwipeControls";
import {
  useFilteredPlaces,
  UseFilteredPlacesOptions,
} from "@/hooks/useFilteredPlaces";
import { Button } from "./ui/button";
import { RefreshCw, MapPin, AlertCircle, Settings } from "lucide-react";
import { isAndroid } from "@/lib/utils";
import { FilterPanel } from "./filters/FilterPanel";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "./ui/toast";
import { useNavigate } from "react-router-dom";
import { openUrl } from "@/utils/browser";
// SponsoredCard is rendered via SwipeCard; keep import only if needed elsewhere

interface SwipeDeckProps {
  config?: Partial<SwipeConfig>;
  onSwipeAction?: (cardId: string, action: "menu" | "pass") => void;
  maxVisibleCards?: number;
  onCardTap?: (card: RestaurantCard) => void;
  swipeOptions?: UseFilteredPlacesOptions;
  enableFiltering?: boolean;
  onFilterButtonReady?: (filterButton: React.ReactNode) => void;
  initialFilters?: Array<{ filterId: string; value: any }>;
}

export function SwipeDeck({
  config = {},
  onSwipeAction,
  maxVisibleCards = 3,
  onCardTap,
  swipeOptions = {},
  enableFiltering = true,
  onFilterButtonReady,
  initialFilters = [],
}: SwipeDeckProps) {
  const [swipeDirection, setSwipeDirection] = useState<"menu" | "pass" | null>(
    null
  );
  const { toast, toasts } = useToast();
  const navigate = useNavigate();
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const exhaustedToastGuardRef = useRef(false);
  const guardTimerRef = useRef<number | null>(null);
  const lastExhaustedToastIdRef = useRef<string | null>(null);
  const inDeckSponsoredMidRef = useRef<RestaurantCard | null>(null);
  const inDeckSponsoredEndRef = useRef<RestaurantCard | null>(null);
  const [dismissedSponsoredIds, setDismissedSponsoredIds] = useState<
    Set<string>
  >(new Set());
  const suppressSponsoredRef = useRef<boolean>(false);
  const refreshRequestedRef = useRef<boolean>(false);
  const filtersAppliedRef = useRef<boolean>(false);
  const hadRealCardsRef = useRef<boolean>(false);

  const resetSponsored = useCallback(() => {
    setDismissedSponsoredIds(new Set());
  }, []);

  const releaseExhaustedGuard = useCallback(() => {
    exhaustedToastGuardRef.current = false;
    if (guardTimerRef.current) {
      clearTimeout(guardTimerRef.current);
      guardTimerRef.current = null;
    }
    lastExhaustedToastIdRef.current = null;
  }, []);

  // Use optimized config for Android devices
  const baseConfig = isAndroid()
    ? androidOptimizedSwipeConfig
    : defaultSwipeConfig;
  const swipeConfig = { ...baseConfig, ...config };

  // Use the enhanced filtering hook
  const {
    cards,
    currentCard,
    isLoading,
    isLocationLoading,
    isFilterLoading,
    error,
    hasLocation,
    swipeCard,
    expandCard,
    refreshCards,
    requestLocation,
    usingLiveData,
    // Filter management
    addFilter,
    updateFilter,
    removeFilter,
    clearFilters,
    onNewFiltersApplied,
    allFilters,
  } = useFilteredPlaces({
    ...swipeOptions,
    enableFiltering,
    maxCards: 20,
  });

  // Sponsored card injection logic
  const shouldInjectSponsored =
    defaultFeatureFlags.adsEnabled && defaultFeatureFlags.adsNativeInDeck;

  const injectedCards = (() => {
    const clone = [...cards];
    if (!shouldInjectSponsored) return clone;

    // Ensure two sponsored placeholder instances (mid and end)
    if (!inDeckSponsoredMidRef.current) {
      inDeckSponsoredMidRef.current = {
        id: `sponsored-mid-${Math.random().toString(36).slice(2)}`,
        imageUrl: null,
        title: "Sponsored",
        subtitle: "",
        isSponsored: true,
        photoUrls: [
          "https://via.placeholder.com/800x1200.png?text=Sponsored+Ad",
        ],
        adClickUrl: "https://www.google.com",
      } as unknown as RestaurantCard;
    }
    if (!inDeckSponsoredEndRef.current) {
      inDeckSponsoredEndRef.current = {
        id: `sponsored-end-${Math.random().toString(36).slice(2)}`,
        imageUrl: null,
        title: "Sponsored",
        subtitle: "",
        isSponsored: true,
        photoUrls: [
          "https://via.placeholder.com/800x1200.png?text=Sponsored+Ad",
        ],
        adClickUrl: "https://www.google.com",
      } as unknown as RestaurantCard;
    }

    const midAd = inDeckSponsoredMidRef.current!;
    const endAd = inDeckSponsoredEndRef.current!;

    // Only inject when there are actual cards
    if (clone.length > 0) {
      // Insert mid-stream ad between 5th and 7th if there are more than 15 cards
      // Choose the 6th position (index 5) deterministically
      if (
        clone.length > 15 &&
        !suppressSponsoredRef.current &&
        !dismissedSponsoredIds.has(midAd.id) &&
        !clone.some((c) => c.id === midAd.id)
      ) {
        const insertIndex = 5; // 6th position (within 5th-7th range)
        if (clone.length > insertIndex) {
          console.log("[Sponsored] Injecting mid-stream sponsored card", {
            insertIndex,
            cardId: midAd.id,
          });
          clone.splice(insertIndex, 0, midAd);
        }
      }

      // Always add one to the end if there is at least 1 card
      if (
        !suppressSponsoredRef.current &&
        !dismissedSponsoredIds.has(endAd.id) &&
        !clone.some((c) => c.id === endAd.id)
      ) {
        console.log("[Sponsored] Injecting end-of-list sponsored card", {
          cardId: endAd.id,
        });
        clone.push(endAd);
      }
      return clone;
    }

    // If we just exhausted the real cards but had some before, keep a single end ad visible
    if (
      hadRealCardsRef.current &&
      !suppressSponsoredRef.current &&
      !dismissedSponsoredIds.has(endAd.id)
    ) {
      return [endAd];
    }
    return clone;
  })();

  const dismissSponsored = useCallback((sponsoredId: string) => {
    if (!sponsoredId) return;
    setDismissedSponsoredIds((prev) => new Set(prev).add(sponsoredId));
  }, []);

  // Create and pass filter button to parent
  useEffect(() => {
    if (onFilterButtonReady && enableFiltering) {
      const filterButton = (
        <FilterPanel
          allFilters={allFilters}
          addFilter={addFilter}
          updateFilter={updateFilter}
          removeFilter={removeFilter}
          clearFilters={clearFilters}
          onNewFiltersApplied={onNewFiltersApplied}
          isOpen={isFilterPanelOpen}
          onOpenChange={setIsFilterPanelOpen}
          trigger={
            <Button
              variant="outline"
              size="lg"
              className="bg-black/40 backdrop-blur-sm hover:bg-black/60 border-white/40 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 rounded-2xl p-4"
              style={{ textShadow: "2px 2px 6px rgba(0,0,0,0.9)" }}
            >
              <Settings className="w-7 h-7" />
            </Button>
          }
        />
      );
      onFilterButtonReady(filterButton);
    }
  }, [enableFiltering, allFilters, isFilterPanelOpen]);

  // Listen for global request to open filters panel (from toast action)
  useEffect(() => {
    const handler = () => setIsFilterPanelOpen(true);
    // @ts-ignore - custom event for simple cross-component signal
    document.addEventListener("openFiltersPanel", handler);
    return () => {
      // @ts-ignore
      document.removeEventListener("openFiltersPanel", handler);
    };
  }, []);

  // If the user closes the toast via the X button, release the guard (detect open=false)
  useEffect(() => {
    if (!exhaustedToastGuardRef.current) return;
    const currentId = lastExhaustedToastIdRef.current;
    if (!currentId) return;
    const entry = (toasts as any[]).find((t: any) => t.id === currentId);
    if (entry && entry.open === false) releaseExhaustedGuard();
  }, [toasts, releaseExhaustedGuard]);

  // Apply initial filters when component mounts
  useEffect(() => {
    if (initialFilters.length > 0 && enableFiltering) {
      console.log("Applying initial filters from voice input:", initialFilters);

      // Apply each filter from the voice input
      initialFilters.forEach((filter) => {
        addFilter(filter.filterId, filter.value);
      });

      // Trigger filters applied callback to refresh results
      onNewFiltersApplied();
      // Mark that a filter change was applied, used to suppress sponsored when no real results return
      filtersAppliedRef.current = true;
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // When filters set changes, re-allow sponsored insertion
  useEffect(() => {
    resetSponsored();
  }, [JSON.stringify(allFilters)]);

  // Track whether we have ever had real cards in this session
  useEffect(() => {
    if (cards.length > 0) hadRealCardsRef.current = true;
  }, [cards.length]);

  const handleSwipe = (cardId: string, action: "menu" | "pass") => {
    const swipeAction = {
      cardId,
      action,
      timestamp: Date.now(),
    };
    swipeCard(swipeAction);
    onSwipeAction?.(cardId, action);
  };

  const handleExpand = (cardId: string) => {
    const expandAction = {
      cardId,
      timestamp: Date.now(),
    };
    expandCard?.(expandAction);
  };

  const handleControlAction = (action: "pass") => {
    if (currentCard) {
      handleSwipe(currentCard.id, action);
    }
  };

  const handleMenuOpen = () => {
    console.log("Open menu clicked");
  };

  const handleCardTap = (card: RestaurantCard) => {
    if (card.isSponsored) {
      const url = (card as any).adClickUrl as string | undefined;
      if (url) {
        console.log("[Sponsored] Opening sponsored click URL", { url });
        openUrl(url);
      } else {
        console.log("[Sponsored] Tap ignored (no click URL)");
      }
      return;
    }
    onCardTap?.(card);
  };

  const handleSwipeDirection = (direction: "menu" | "pass" | null) => {
    setSwipeDirection(direction);
  };

  const visibleCards = injectedCards.slice(0, maxVisibleCards);
  const topCard = visibleCards[0];

  const hasActiveFilters = Array.isArray(allFilters)
    ? allFilters.some((f: any) => f?.enabled)
    : false;

  const handleRefreshClick = () => {
    // Ensure sponsored card can reappear after refresh
    resetSponsored();
    refreshRequestedRef.current = true;
    if (cards.length === 0 && hasActiveFilters) {
      // Guard against repeated clicks while the toast is visible
      if (exhaustedToastGuardRef.current) {
        return;
      }
      exhaustedToastGuardRef.current = true;
      guardTimerRef.current = window.setTimeout(releaseExhaustedGuard, 5000);

      let dismissToast: (() => void) | null = null;

      const created = toast({
        title: "No more matches for your filters",
        description: "Please update your filters for a wider search.",
        action: (
          <div className="flex gap-2">
            <ToastAction
              altText="Expand Filters"
              onClick={() => {
                navigate("/"); // ensure we are on home
                // Open the filter panel by triggering a custom event the panel listens for
                document.dispatchEvent(new CustomEvent("openFiltersPanel"));
                releaseExhaustedGuard();
                dismissToast && dismissToast();
              }}
            >
              Expand Filters
            </ToastAction>
            <ToastAction
              altText="Ok"
              onClick={() => {
                releaseExhaustedGuard();
                dismissToast && dismissToast();
              }}
            >
              OK
            </ToastAction>
          </div>
        ),
      });
      dismissToast = created.dismiss;
      lastExhaustedToastIdRef.current = created.id;
      // Do not trigger a refresh when exhausted with active filters; wait for user action
      return;
    }
    refreshCards();
  };

  // No special handling needed for native overlay now that we use community AdMob plugin

  // Track results after refresh or filters applied; suppress sponsored if no new real cards
  useEffect(() => {
    if (refreshRequestedRef.current || filtersAppliedRef.current) {
      const hasRealCards = cards.length > 0;
      suppressSponsoredRef.current = !hasRealCards;
      console.log(
        "[Sponsored] Post-update suppression set to",
        suppressSponsoredRef.current,
        {
          reason: refreshRequestedRef.current ? "refresh" : "filters",
          cardsCount: cards.length,
        }
      );
      refreshRequestedRef.current = false;
      filtersAppliedRef.current = false;
    }
  }, [cards]);

  // Loading state
  if ((isLoading || isFilterLoading) && cards.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20 shadow-lg">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-white drop-shadow-lg" />
          <div>
            <h2
              className="text-xl font-semibold text-white mb-2"
              style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.8)" }}
            >
              {isLocationLoading
                ? "Getting your location..."
                : isFilterLoading
                ? "Applying filters..."
                : "Finding restaurants..."}
            </h2>
            <p
              className="text-white/80"
              style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.6)" }}
            >
              {usingLiveData
                ? "Loading restaurants near you"
                : "Preparing your restaurant deck"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20 shadow-lg">
          <AlertCircle className="w-12 h-12 mx-auto text-white drop-shadow-lg" />
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl border border-white/30">
            <AlertCircle className="h-4 w-4 text-white inline mr-2" />
            <span
              className="text-white"
              style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
            >
              {error}
            </span>
          </div>
          <div className="space-y-2">
            {!hasLocation && (
              <Button
                onClick={requestLocation}
                variant="outline"
                className="w-full"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Enable Location Services
              </Button>
            )}
            <Button onClick={refreshCards} variant="default" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No location permission state
  if (!hasLocation && !isLocationLoading && usingLiveData) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Location Access Needed
            </h2>
            <p className="text-muted-foreground mb-4">
              We need your location to find restaurants near you. Don't worry,
              we only use it to show nearby options.
            </p>
          </div>
          <Button onClick={requestLocation} className="w-full">
            <MapPin className="w-4 h-4 mr-2" />
            Enable Location Services
          </Button>
        </div>
      </div>
    );
  }

  // No cards available state (consider injected sponsored)
  if (injectedCards.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4 w-full max-w-md">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              No more restaurants!
            </h2>
            <p className="text-muted-foreground mb-4">
              {usingLiveData
                ? "You've seen all nearby restaurants. Try refreshing or expanding your search area."
                : "Check back later for more options."}
            </p>
          </div>
          {usingLiveData && (
            <Button onClick={handleRefreshClick} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Results
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Card Stack - Full height with padding for controls */}
      <div className="flex-1 relative p-4 md:flex md:items-center md:justify-center md:p-0 md:overflow-hidden">
        {visibleCards.map((card, index) => {
          if (card.isSponsored) {
            return (
              <SwipeCard
                key={card.id}
                card={card}
                onSwipe={() => {
                  dismissSponsored(card.id);
                  onSwipeAction?.(card.id, "pass");
                }}
                config={swipeConfig}
                isTop={index === 0}
                index={index}
                onCardTap={handleCardTap}
                onSwipeDirection={handleSwipeDirection}
              />
            );
          }
          return (
            <SwipeCard
              key={card.id}
              card={card}
              onSwipe={handleSwipe}
              config={swipeConfig}
              isTop={index === 0}
              index={index}
              onCardTap={handleCardTap}
              handleOnExpand={handleExpand}
              onSwipeDirection={handleSwipeDirection}
            />
          );
        })}
      </div>

      {/* Swipe Controls - Fixed footer */}
      <SwipeControls
        onAction={handleControlAction}
        onMenuOpen={topCard?.isSponsored ? undefined : handleMenuOpen}
        onVoiceFiltersApplied={
          enableFiltering
            ? (filters) => {
                // Apply each filter from the voice result
                filters.forEach((filter) => {
                  addFilter(filter.filterId, filter.value);
                });
                // Trigger new filters applied callback
                onNewFiltersApplied();
              }
            : undefined
        }
        swipeDirection={swipeDirection}
      />
    </div>
  );
}
