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
  const inDeckSponsoredRef = useRef<RestaurantCard | null>(null);
  const [dismissedSponsoredIds, setDismissedSponsoredIds] = useState<Set<string>>(new Set());

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
    if (!shouldInjectSponsored || cards.length === 0) return cards;

    const clone = [...cards];
    // Insert a sponsored placeholder between 5th and 7th position when available
    const insertIndex = Math.min(Math.max(4, Math.floor(clone.length / 2)), 6);
    const alreadyHasSponsored = clone.some((c) => c.isSponsored);
    if (!alreadyHasSponsored && clone.length > insertIndex) {
      if (!inDeckSponsoredRef.current) {
        inDeckSponsoredRef.current = {
          id: `sponsored-${Math.random().toString(36).slice(2)}`,
          imageUrl: null,
          title: "Sponsored",
          subtitle: "",
          isSponsored: true,
          photoUrls: [
            'https://via.placeholder.com/800x1200.png?text=Sponsored+Ad',
          ],
          adClickUrl: 'https://www.google.com',
        } as unknown as RestaurantCard;
      }
      const sponsoredCard = inDeckSponsoredRef.current!;
      if (!dismissedSponsoredIds.has(sponsoredCard.id)) {
        console.log('[Sponsored] Injecting sponsored card into deck', { insertIndex, cardId: sponsoredCard.id });
        clone.splice(insertIndex, 0, sponsoredCard);
      }
    }
    return clone;
  })();

  const dismissSponsored = useCallback(() => {
    const sponsored = inDeckSponsoredRef.current;
    if (!sponsored) return;
    setDismissedSponsoredIds((prev) => new Set(prev).add(sponsored.id));
  }, []);

  // Interstitial ads removed per requirement; sponsored cards now reserved for native ads overlay only

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
              style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.9)' }}
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
      console.log('Applying initial filters from voice input:', initialFilters);
      
      // Apply each filter from the voice input
      initialFilters.forEach(filter => {
        addFilter(filter.filterId, filter.value);
      });
      
      // Trigger filters applied callback to refresh results
      onNewFiltersApplied();
    }
  }, []);  // Empty dependency array ensures this runs only once on mount

  // When filters set changes, re-allow sponsored insertion
  useEffect(() => {
    resetSponsored();
  }, [JSON.stringify(allFilters)]);

  const handleSwipe = (cardId: string, action: "menu" | "pass") => {
    const swipeAction = {
      cardId,
      action,
      timestamp: Date.now(),
    };
    swipeCard(swipeAction);
    onSwipeAction?.(cardId, action);
  };

  const handleControlAction = (action: "pass") => {
    if (currentCard) {
      handleSwipe(currentCard.id, action);
    }
  };

  const handleMenuOpen = () => {
    // TODO: Implement menu opening logic
    console.log("Open menu clicked");
  };

  const handleCardTap = (card: RestaurantCard) => {
    if (card.isSponsored) {
      const url = (card as any).adClickUrl as string | undefined;
      if (url) {
        console.log('[Sponsored] Opening sponsored click URL', { url });
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        console.log('[Sponsored] Tap ignored (no click URL)');
      }
      return;
    }
    onCardTap?.(card);
  };

  const handleSwipeDirection = (direction: "menu" | "pass" | null) => {
    setSwipeDirection(direction);
  };

  const visibleCards = injectedCards.slice(0, maxVisibleCards);

  const hasActiveFilters = Array.isArray(allFilters)
    ? allFilters.some((f: any) => f?.enabled)
    : false;

  const handleRefreshClick = () => {
    // Ensure sponsored card can reappear after refresh
    resetSponsored();
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

  // Loading state
  if ((isLoading || isFilterLoading) && cards.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20 shadow-lg">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-white drop-shadow-lg" />
          <div>
            <h2 className="text-xl font-semibold text-white mb-2" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
              {isLocationLoading
                ? "Getting your location..."
                : isFilterLoading
                ? "Applying filters..."
                : "Finding restaurants..."}
            </h2>
            <p className="text-white/80" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>
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
            <span className="text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{error}</span>
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

  // No cards available state
  if (cards.length === 0 && !isLoading) {
    const sponsoredCard = shouldInjectSponsored
      ? (inDeckSponsoredRef.current ||= {
          id: `sponsored-${Math.random().toString(36).slice(2)}`,
          imageUrl: null,
          title: "Sponsored",
          subtitle: "",
          isSponsored: true,
          photoUrls: [
            'https://via.placeholder.com/800x1200.png?text=Sponsored+Ad',
          ],
          adClickUrl: 'https://www.google.com',
        } as unknown as RestaurantCard)
      : null;
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4 w-full max-w-md">
          {shouldInjectSponsored && sponsoredCard && !dismissedSponsoredIds.has(sponsoredCard.id) && (
            <div className="relative h-[480px]">
              <SwipeCard
                key={sponsoredCard.id}
                card={sponsoredCard}
                onSwipe={() => {
                  dismissSponsored();
                }}
                config={swipeConfig}
                isTop={true}
                index={0}
                onCardTap={handleCardTap}
                onSwipeDirection={setSwipeDirection as any}
              />
            </div>
          )}

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
                  dismissSponsored();
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
              onSwipeDirection={handleSwipeDirection}
            />
          );
        })}
      </div>



      {/* Swipe Controls - Fixed footer */}
      <SwipeControls
        onAction={handleControlAction}
        onMenuOpen={currentCard?.isSponsored ? undefined : handleMenuOpen}
        onVoiceFiltersApplied={enableFiltering ? (filters) => {
          // Apply each filter from the voice result
          filters.forEach(filter => {
            addFilter(filter.filterId, filter.value);
          });
          // Trigger new filters applied callback
          onNewFiltersApplied();
        } : undefined}
        swipeDirection={swipeDirection}
      />
    </div>
  );
}
