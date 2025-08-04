import { useState } from "react";
import { SwipeCard } from "./SwipeCard";
import {
  RestaurantCard,
  SwipeConfig,
  defaultSwipeConfig,
  androidOptimizedSwipeConfig,
} from "@/types/Types";
import { SwipeControls } from "./SwipeControls";
import {
  useRestaurantSwipe,
  UseRestaurantSwipeOptions,
} from "@/hooks/useRestaurantSwipe";
import { Button } from "./ui/button";
import { RefreshCw, MapPin, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { isAndroid } from "@/lib/utils";

interface SwipeDeckProps {
  config?: Partial<SwipeConfig>;
  onSwipeAction?: (cardId: string, action: "like" | "pass") => void;
  maxVisibleCards?: number;
  onCardTap?: (card: RestaurantCard) => void;
  swipeOptions?: UseRestaurantSwipeOptions;
}

export function SwipeDeck({
  config = {},
  onSwipeAction,
  maxVisibleCards = 3,
  onCardTap,
  swipeOptions = {},
}: SwipeDeckProps) {
  const [swipeDirection, setSwipeDirection] = useState<"like" | "pass" | null>(
    null
  );

  // Use optimized config for Android devices
  const baseConfig = isAndroid() ? androidOptimizedSwipeConfig : defaultSwipeConfig;
  const swipeConfig = { ...baseConfig, ...config };
  // Use the comprehensive restaurant swipe hook
  const {
    cards,
    currentCard,
    isLoading,
    isLocationLoading,
    error,
    hasLocation,
    location,
    swipeCard,
    refreshCards,
    requestLocation,
    canSwipe,
    totalCards,
    usingLiveData,
  } = useRestaurantSwipe(swipeOptions);

  const handleSwipe = (cardId: string, action: "like" | "pass") => {
    swipeCard(cardId, action);
    onSwipeAction?.(cardId, action);
  };

  const handleControlAction = (action: "like" | "pass") => {
    if (currentCard) {
      handleSwipe(currentCard.id, action);
    }
  };

  const handleCardTap = (card: RestaurantCard) => {
    onCardTap?.(card);
  };

  const handleSwipeDirection = (direction: "like" | "pass" | null) => {
    setSwipeDirection(direction);
  };
  
  const visibleCards = cards.slice(0, maxVisibleCards);

  // Loading state
  if (isLoading && cards.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {isLocationLoading
                ? "Getting your location..."
                : "Finding restaurants..."}
            </h2>
            <p className="text-muted-foreground">
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
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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
    <div className="flex-1 relative">
      {/* Card Stack */}
      <div className="relative h-full pb-32">
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

      {/* Swipe Controls */}
      <SwipeControls
        onAction={handleControlAction}
        swipeDirection={swipeDirection}
      />
    </div>
  );
}
