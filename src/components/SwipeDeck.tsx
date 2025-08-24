import { useState, useEffect, useRef, useCallback } from "react";
import { SwipeCard } from "./SwipeCard";
import {
  RestaurantCard,
  SwipeConfig,
  defaultSwipeConfig,
  androidOptimizedSwipeConfig,
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
import { useQueryClient } from "@tanstack/react-query";
import * as nativeAdsProvider from "@/services/nativeAdsProvider";

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

  const refreshRequestedRef = useRef<boolean>(false);
  const filtersAppliedRef = useRef<boolean>(false);
  const hadRealCardsRef = useRef<boolean>(false);

  const openMenuCardRef = useRef<string>("");

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
    maxCards: 2,
  });

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

  const handleSponsoredSwipe = (cardId: string) => {
    const swipeAction = {
      cardId,
      action: "pass" as const,
      timestamp: Date.now(),
    };
    swipeCard(swipeAction);
    onSwipeAction?.(cardId, "pass");
  };

  const visibleCards = cards.slice(0, maxVisibleCards);

  console.log("visibleCards", JSON.stringify(visibleCards));

  const handleMenuOpen = () => {
    console.log("Open menu clicked");
    handleExpand(currentCard.id);

    const pollForDetails = () => {
      const queryClient = useQueryClient();

      const detailsData = queryClient.getQueryData([
        "places",
        "details",
        currentCard.id,
      ]);

      if (!detailsData) {
        setTimeout(() => {
          pollForDetails();
        }, 100);
      }
    };

    if (!currentCard.website) {
      openMenuCardRef.current = currentCard.id;
      pollForDetails();
    } else {
      openUrl(currentCard.website);
    }
  };

  useEffect(() => {
    if (currentCard && currentCard.id === openMenuCardRef.current) {
      console.log("User wants to open menu");
      handleMenuOpen();
    }
  }, [currentCard]);

  const handleCardTap = (card: RestaurantCard) => {
    if (card.adData) {
      if (
        (import.meta as any)?.env?.VITE_ADS_DEBUG === "true" ||
        import.meta.env.DEV
      ) {
        console.log("[Ads] Sponsored card tapped", {
          cardId: card.id,
          nativeId: (nativeAdsProvider as any)?.getNativeAdIdForCard?.(card.id),
        });
      }
      nativeAdsProvider.handleClick(card.id);
      return;
    }
    onCardTap?.(card);
  };

  const handleSwipeDirection = (direction: "menu" | "pass" | null) => {
    setSwipeDirection(direction);
  };

  const hasActiveFilters = Array.isArray(allFilters)
    ? allFilters.some((f: any) => f?.enabled)
    : false;

  const handleRefreshClick = () => {
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
          <div className="flex flex-col gap-2 w-full">
            <ToastAction
              altText="Expand Filters"
              className="w-full"
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
              className="w-full bg-green-600 text-white hover:bg-green-700 border-green-700"
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
      refreshRequestedRef.current = false;
      filtersAppliedRef.current = false;
    }
  }, [cards]);

  // Loading state
  const LoadingState = () => {
    return (
      isLoading &&
      (isFilterLoading || cards.length === 0) && (
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
      )
    );
  };

  const ErrorState = () => {
    return (
      error && (
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
              <Button
                onClick={refreshCards}
                variant="default"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )
    );
  };

  // No location permission state
  const LocationState = () => {
    return (
      !hasLocation &&
      !isLocationLoading &&
      usingLiveData && (
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
      )
    );
  };

  const NoCardsAvailable = () => {
    return (
      cards.length === 0 &&
      !isLoading && (
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
      )
    );
  };

  return (
    <>
      <LoadingState />
      <ErrorState />
      <LocationState />
      <NoCardsAvailable />
      {cards.length > 0 && (
        <div className="flex-1 flex flex-col">
          {/* Card Stack - Full height with padding for controls */}
          <div className="flex-1 relative p-4 md:flex md:items-center md:justify-center md:p-0 md:overflow-hidden">
            {visibleCards.map((card, index) => {
              if (card.adData) {
                return (
                  <SwipeCard
                    key={card.id}
                    card={card}
                    onSwipe={() => handleSponsoredSwipe(card.id)}
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
            onMenuOpen={currentCard?.adData ? undefined : handleMenuOpen}
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
      )}
    </>
  );
}
