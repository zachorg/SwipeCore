import { useState, useEffect } from "react";
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

interface SwipeDeckProps {
  config?: Partial<SwipeConfig>;
  onSwipeAction?: (cardId: string, action: "menu" | "pass") => void;
  maxVisibleCards?: number;
  onCardTap?: (card: RestaurantCard) => void;
  swipeOptions?: UseFilteredPlacesOptions;
  enableFiltering?: boolean;
  onFilterButtonReady?: (filterButton: React.ReactNode) => void;
}

export function SwipeDeck({
  config = {},
  onSwipeAction,
  maxVisibleCards = 3,
  onCardTap,
  swipeOptions = {},
  enableFiltering = true,
  onFilterButtonReady,
}: SwipeDeckProps) {
  const [swipeDirection, setSwipeDirection] = useState<"menu" | "pass" | null>(
    null
  );

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
  }, [enableFiltering, allFilters]);

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
    onCardTap?.(card);
  };

  const handleSwipeDirection = (direction: "menu" | "pass" | null) => {
    setSwipeDirection(direction);
  };

  const visibleCards = cards.slice(0, maxVisibleCards);

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
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="text-6xl">🍽️</div>
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
            <Button onClick={refreshCards} variant="outline">
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
        {visibleCards.map((card, index) => (
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
        ))}
      </div>



      {/* Swipe Controls - Fixed footer */}
      <SwipeControls
        onAction={handleControlAction}
        onMenuOpen={handleMenuOpen}
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
