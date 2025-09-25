import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import Swiper from "react-native-deck-swiper";
import { SwipeCard } from "./SwipeCard";
import { SwipeControls } from "./SwipeControls";
import { openUrl } from "../utils/browser";
import {
  RestaurantCard,
  SwipeConfig,
  defaultSwipeConfig,
  androidOptimizedSwipeConfig,
  SwipeAction,
} from "../types/Types";
import {
  useFilteredPlaces,
  UseFilteredPlacesOptions,
} from "../hooks/useFilteredPlaces";
import { Platform } from "react-native";
import AdView from "./ads/AdView";
import { useFilterContext } from "../contexts/FilterContext";
import { isIOS } from "../lib/utils";

interface SwipeDeckProps {
  config?: Partial<SwipeConfig>;
  onSwipeAction?: (cardId: string, action: "menu" | "pass") => void;
  statusBarHeight?: number;
  maxVisibleCards?: number;
  onCardTap?: (card: RestaurantCard) => void;
  swipeOptions?: UseFilteredPlacesOptions;
  enableFiltering?: boolean;
  onFilterButtonReady?: (filterButton: React.ReactNode) => void;
  onFilterFunctionsReady?: (filterFunctions: {
    addFilter: (filterId: string, value: any) => void;
    onNewFiltersApplied: () => void;
    clearFilters: () => void;
  }) => void;
  initialFilters?: Array<{ filterId: string; value: any }>;
}

export function SwipeDeck({
  config = {},
  onSwipeAction,
  maxVisibleCards = 3,
  statusBarHeight = 0,
  onCardTap,
  swipeOptions = {},
  enableFiltering = true,
  onFilterButtonReady,
  onFilterFunctionsReady,
  initialFilters = [],
}: SwipeDeckProps) {
  // Don't use status bar height on iOS since SwipeCard handles it internally
  const effectiveStatusBarHeight = isIOS() ? 44 : statusBarHeight;
  const [expandedCard, setExpandedCard] = useState<RestaurantCard | null>(null);
  const swiperRef = useRef<Swiper<RestaurantCard>>(null);
  const cardsRef = useRef<RestaurantCard[]>([]);

  const {
    cards,
    showAd,
    isLoading,
    isLocationLoading,
    isFilterLoading,
    isRadiusLoading,
    isPlacesLoading,
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
  });

  const handleSwipe = useCallback(
    (card: RestaurantCard, action: "menu" | "pass") => {
      swipeCard({
        cardId: card.id,
        action: action,
        timestamp: 0,
      });
    },
    [swipeCard]
  );

  const handleCardTapInternal = useCallback(
    (card: RestaurantCard) => {
      if (card.adData) {
        // Native ad click tracking would go here if implemented
        return;
      }
      onCardTap?.(card);
    },
    [onCardTap]
  );

  const handleControlAction = useCallback(
    (action: "pass") => {
      console.log("handleControlAction", action);
      if (showAd) {
        // When no cards but ad is showing, pass the ad to dismiss it
        swipeCard({ cardId: "ad", action: "pass", timestamp: 0 });
      } else if (cards.length > 0) {
        handleSwipe(cards[0], action);
      }
    },
    [showAd, swipeCard, cards, handleSwipe]
  );

  const handleExpandCard = useCallback(
    (params: { cardId: string; timestamp: number }) => {
      const card = cards.find((c) => c.id === params.cardId);
      if (card) {
        setExpandedCard(card);
        expandCard?.(params);
      }
    },
    [expandCard, cards]
  );

  const handleCloseExpandedCard = useCallback(() => {
    setExpandedCard(null);
  }, []);

  // Memoize the renderCard function to prevent unnecessary re-renders
  const renderCard = useCallback(
    (card: RestaurantCard) => (
      <View style={styles.cardContainer}>
        <View style={styles.cardWrapper}>
          <SwipeCard
            card={card}
            onCardTap={handleCardTapInternal}
            expandCard={handleExpandCard}
          />
        </View>
      </View>
    ),
    [handleCardTapInternal, handleExpandCard]
  );

  // Memoize swipe handlers to prevent unnecessary re-renders - OPTIMIZED
  const handleSwipedLeft = useCallback(
    (cardIndex: number) => {
      // Use ref to get current cards for better performance
      const currentCards = cardsRef.current;
      const swipedCard = currentCards[cardIndex];
      if (swipedCard) {
        handleSwipe(swipedCard, "pass");
        if (__DEV__) {
          console.log("🎴 SWIPED LEFT:", {
            cardIndex,
            cardId: swipedCard.id,
          });
        }
      }
    },
    [handleSwipe] // Removed cards dependency for better performance
  );

  const handleSwipedRight = useCallback(
    (cardIndex: number) => {
      // Use ref to get current cards for better performance
      const currentCards = cardsRef.current;
      const swipedCard = currentCards[cardIndex];
      if (swipedCard) {
        handleSwipe(swipedCard, "menu");
        if (__DEV__) {
          console.log("🎴 SWIPED RIGHT:", {
            cardIndex,
            cardId: swipedCard.id,
          });
        }
      }
    },
    [handleSwipe] // Removed cards dependency for better performance
  );

  // Memoize overlay labels to prevent recreation
  const overlayLabels = useMemo(
    () => ({
      left: {
        title: "PASS",
        style: {
          label: {
            backgroundColor: "transparent",
            color: "red",
            fontSize: 24,
          },
          wrapper: {
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "flex-start",
            marginTop: 30,
            marginLeft: -30,
          },
        },
      },
      right: {
        title: "MENU",
        style: {
          label: {
            backgroundColor: "transparent",
            color: "green",
            fontSize: 24,
          },
          wrapper: {
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            marginTop: 30,
            marginLeft: 30,
          },
        },
      },
    }),
    []
  );

  // Memoize swiper props to prevent unnecessary re-renders
  // Optimize stack size for better performance with many cards
  const optimizedStackSize = useMemo(() => {
    // Limit stack size to improve performance with many cards
    return Math.min(cards.length, maxVisibleCards || 5);
  }, [cards.length, maxVisibleCards]);

  const swiperProps = useMemo(
    () => ({
      cards: cards,
      renderCard: renderCard,
      backgroundColor: "transparent",
      stackSize: optimizedStackSize,
      infinite: false,
      animateOverlayLabelsOpacity: true,
      onSwipedLeft: handleSwipedLeft,
      onSwipedRight: handleSwipedRight,
      overlayLabels: overlayLabels,
      swipeAnimationDuration: 200, // Reduced from 300ms for snappier feel
      disableTopSwipe: true,
      disableBottomSwipe: true,
      disableLeftSwipe: false,
      disableRightSwipe: false,
      stackSeparation: 0,
      stackScale: 0.95,
      cardVerticalMargin: 0,
      cardHorizontalMargin: 0,
      goBackToPreviousCardOnSwipeLeft: false,
      goBackToPreviousCardOnSwipeRight: false,
      goBackToPreviousCardOnSwipeTop: false,
      goBackToPreviousCardOnSwipeBottom: false,
      useViewOverflow: false,
      outputRotationRange: ["-0.3rad", "0rad", "0.3rad"] as [
        string,
        string,
        string
      ],
      cardStyle: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
      },
    }),
    [
      cards,
      renderCard,
      handleSwipedLeft,
      handleSwipedRight,
      overlayLabels,
      optimizedStackSize,
    ]
  );

  const handleMenuOpen = useCallback(() => {
    if (cards.length === 0) return;
    const topCard = cards[0];
    expandCard?.({ cardId: topCard.id, timestamp: Date.now() });

    const queryClient = useQueryClient();
    const poll = () => {
      const detailsData = queryClient.getQueryData([
        "places",
        "details",
        topCard.id,
      ]);
      if (!detailsData) {
        setTimeout(poll, 100);
      }
    };

    if (!topCard.website) {
      poll();
    } else {
      openUrl(topCard.website);
    }
  }, [cards, expandCard]);

  // Use FilterProvider as the single source of truth
  const filterContext = useFilterContext();

  const handleVoiceFiltersApplied = useCallback(
    (filters: Array<{ filterId: string; value: any }>) => {
      console.log(
        "🎴 SwipeDeck - Applying voice filters via FilterProvider:",
        filters
      );

      // Apply voice filters through FilterProvider (single source of truth)
      filterContext.applyVoiceFilters(filters);
    },
    [filterContext]
  );

  const memoizedOnMenuOpen = useMemo(() => {
    return cards.length > 0 && cards[0]?.adData ? undefined : handleMenuOpen;
  }, [cards, handleMenuOpen]);

  const showLoading = isLoading || isFilterLoading || isRadiusLoading;
  const showPlacesLoading = isPlacesLoading && cards.length === 0;
  const showError = Boolean(error);
  const showLocationNeeded =
    !hasLocation && !isLocationLoading && usingLiveData;
  const showNoCards =
    cards.length === 0 && !isLoading && !isPlacesLoading && !error && !showAd;

  const UseSwipeControls = useMemo(() => {
    return (
      <SwipeControls
        onAction={handleControlAction}
        onMenuOpen={memoizedOnMenuOpen}
        onVoiceFiltersApplied={
          enableFiltering ? handleVoiceFiltersApplied : undefined
        }
      />
    );
  }, [
    handleControlAction,
    memoizedOnMenuOpen,
    enableFiltering,
    handleVoiceFiltersApplied,
  ]);

  // Update cardsRef when cards change for better performance
  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  // Pass filter functions to parent component
  useEffect(() => {
    if (onFilterFunctionsReady) {
      onFilterFunctionsReady({
        addFilter,
        onNewFiltersApplied,
        clearFilters,
      });
    }
  }, [onFilterFunctionsReady, addFilter, onNewFiltersApplied, clearFilters]);

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      {showLoading && (
        <View style={styles.statusBar}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.statusText}>
            {isLocationLoading
              ? "Getting your location..."
              : isRadiusLoading
              ? "Expanding search area..."
              : isFilterLoading
              ? "Applying filters..."
              : "Finding restaurants..."}
          </Text>
        </View>
      )}

      {showError && (
        <View
          style={[styles.statusBar, { paddingTop: effectiveStatusBarHeight }]}
        >
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <Text style={styles.statusText}>Error: {String(error)}</Text>
        </View>
      )}

      {/* Main Content */}
      {showLoading && !showPlacesLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>
            {isLocationLoading
              ? "Getting your location..."
              : isRadiusLoading
              ? "Expanding search area..."
              : isFilterLoading
              ? "Applying filters..."
              : "Loading..."}
          </Text>
          <Text style={styles.loadingSubtext}>
            {usingLiveData
              ? "Loading restaurants near you"
              : "Preparing your restaurant deck"}
          </Text>
        </View>
      )}

      {showLocationNeeded && (
        <View style={styles.centerPadding}>
          <Text style={styles.title}>Location Access Needed</Text>
          <Text style={styles.muted}>
            We need your location to find restaurants near you.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={requestLocation}
          >
            <Text style={styles.primaryButtonText}>
              Enable Location Services
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {(() => {
        return cards && cards.length === 0 && !showAd ? (
          <View style={styles.noMoreCardsContainer}>
            <View style={styles.noMoreCardsContent}>
              <View style={styles.noMoreCardsIcon}>
                <Ionicons name="restaurant-outline" size={48} color="#6B7280" />
              </View>
              <Text style={styles.noMoreCardsTitle}>No more restaurants!</Text>
              <Text style={styles.noMoreCardsSubtitle}>
                {usingLiveData
                  ? "You've seen all nearby restaurants. Try refreshing or expanding your search area."
                  : "Check back later for more options."}
              </Text>
              {usingLiveData && (
                <TouchableOpacity
                  style={styles.noMoreCardsButton}
                  onPress={refreshCards}
                >
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                  <Text style={styles.noMoreCardsButtonText}>
                    Refresh Results
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : null;
      })()}

      {showPlacesLoading && (
        <View style={styles.stackContainer}>
          <View style={styles.cardsArea}>
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
          </View>
        </View>
      )}

      {((cards && cards.length > 0) || showAd) && !showPlacesLoading && (
        <>
          <View
            style={[
              styles.stackContainer,
              { paddingTop: effectiveStatusBarHeight - 16 },
            ]}
          >
            <View
              style={[
                styles.cardsArea,
                { marginBottom: effectiveStatusBarHeight - 16 },
                { marginHorizontal: effectiveStatusBarHeight - 16 },
              ]}
            >
              {cards && cards.length > 0 && !showAd && (
                <>
                  {!expandedCard && (
                    <Swiper
                      key={`swiper-${cards.length}`}
                      ref={swiperRef}
                      {...swiperProps}
                    />
                  )}
                  {expandedCard && (
                    <SwipeCard
                      card={
                        cards.find((c) => c.id === expandedCard.id) ||
                        expandedCard
                      }
                      isExpanded={true}
                      unExpandCard={handleCloseExpandedCard}
                    />
                  )}
                </>
              )}
              {showAd && <AdView />}
            </View>
          </View>
          {UseSwipeControls}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  statusBarContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusBarActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  centerPadding: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  loadingText: {
    marginTop: 12,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingSubtext: {
    color: "#FFFFFFAA",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
  errorTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  errorText: {
    color: "#FFFFFFCC",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  muted: {
    color: "#FFFFFFAA",
    textAlign: "center",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  stackContainer: {
    flex: 1,
  },
  cardsArea: {
    flex: 1,
    position: "relative",
  },
  filterButton: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  filterButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  cardContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  cardWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    overflow: "hidden",
  },
  // Expanded card styles
  expandedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  expandedTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  expandedContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  expandedCardWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    overflow: "hidden",
  },
  // No more cards styles
  noMoreCardsContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  noMoreCardsContent: {
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 300,
    gap: 16,
  },
  noMoreCardsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  noMoreCardsTitle: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  noMoreCardsSubtitle: {
    color: "#6B7280",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  noMoreCardsButton: {
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noMoreCardsButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
