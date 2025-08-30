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
} from "../types/Types";
import {
  useFilteredPlaces,
  UseFilteredPlacesOptions,
} from "../hooks/useFilteredPlaces";
import { Platform } from "react-native";

interface SwipeDeckProps {
  config?: Partial<SwipeConfig>;
  onSwipeAction?: (cardId: string, action: "menu" | "pass") => void;
  statusBarHeight?: number;
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
  statusBarHeight = 0,
  onCardTap,
  swipeOptions = {},
  enableFiltering = true,
  onFilterButtonReady,
  initialFilters = [],
}: SwipeDeckProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [expandedCard, setExpandedCard] = useState<RestaurantCard | null>(null);
  const swiperRef = useRef<Swiper<RestaurantCard>>(null);

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
  });

  const handleSwipe = useCallback((cardId: string, action: "menu" | "pass") => {
    // Don't call swipeCard here - it will remove the wrong card
    // Instead, handle the swipe action manually
    onSwipeAction?.(cardId, action);
  }, []);

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
      if (cards.length > 0) {
        // Call the parent callback
        onSwipeAction?.(cards[0].id, action);
      }
    },
    [cards, onSwipeAction]
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

  const swiperProps = {
    cards: cards,
    renderCard: (card: RestaurantCard) => (
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
    backgroundColor: "transparent",
    stackSize: cards.length,
    infinite: false,
    animateOverlayLabelsOpacity: true,
    onSwipedLeft: (cardIndex: number) => {
      // Handle the swipe action after the animation completes
      const card = cards[0];
      if (card) {
        // Call the parent callback
        handleSwipe(card.id, "pass");

        if (__DEV__) {
          console.log("🎴 SWIPED LEFT:", {
            cardIndex,
            cardId: card.id,
          });
        }
      }
    },
    onSwipedRight: (cardIndex: number) => {
      // Handle the swipe action after the animation completes
      const card = cards[0];
      if (card) {
        // Call the parent callback
        handleSwipe(card.id, "menu");

        if (__DEV__) {
          console.log("🎴 SWIPED RIGHT:", {
            cardIndex,
            cardId: card.id,
          });
        }
      }
    },
    overlayLabels: {
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
    },
    swipeAnimationDuration: 300,
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
  };

  useEffect(() => {
    swiperRef.current?.jumpToCardIndex(0);
  }, [cards]);

  const handleMenuOpen = useCallback(() => {
    if (!currentCard) return;
    expandCard?.({ cardId: currentCard.id, timestamp: Date.now() });

    const queryClient = useQueryClient();
    const poll = () => {
      const detailsData = queryClient.getQueryData([
        "places",
        "details",
        currentCard.id,
      ]);
      if (!detailsData) {
        setTimeout(poll, 100);
      }
    };

    if (!currentCard.website) {
      poll();
    } else {
      openUrl(currentCard.website);
    }
  }, [currentCard, expandCard]);

  const showLoading = isLoading && (isFilterLoading || cards.length === 0);
  const showError = Boolean(error);
  const showLocationNeeded =
    !hasLocation && !isLocationLoading && usingLiveData;
  const showNoCards = cards.length === 0 && !isLoading && !error;

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      {showLoading && (
        <View style={styles.statusBar}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.statusText}>
            {isLocationLoading
              ? "Getting your location..."
              : isFilterLoading
              ? "Applying filters..."
              : "Finding restaurants..."}
          </Text>
        </View>
      )}

      {showError && (
        <View style={[styles.statusBar, { paddingTop: statusBarHeight }]}>
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <Text style={styles.statusText}>Error: {String(error)}</Text>
        </View>
      )}

      {/* Main Content */}
      {showLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>
            {isLocationLoading
              ? "Getting your location..."
              : isFilterLoading
              ? "Applying filters..."
              : "Finding restaurants..."}
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

      {showNoCards && (
        <View style={styles.centerPadding}>
          <Text style={styles.title}>No more restaurants!</Text>
          <Text style={styles.muted}>
            {usingLiveData
              ? "You've seen all nearby restaurants. Try refreshing or expanding your search area."
              : "Check back later for more options."}
          </Text>
          {usingLiveData && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={refreshCards}
            >
              <Text style={styles.secondaryButtonText}>Refresh Results</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {cards && cards.length > 0 && (
        <View
          style={[styles.stackContainer, { paddingTop: statusBarHeight - 16 }]}
        >
          <View
            style={[
              styles.cardsArea,
              { marginBottom: statusBarHeight - 16 },
              { marginHorizontal: statusBarHeight - 16 },
            ]}
          >
            {!expandedCard && <Swiper ref={swiperRef} {...swiperProps} />}
            {expandedCard && (
              <SwipeCard
                card={expandedCard}
                isExpanded={true}
                unExpandCard={handleCloseExpandedCard}
              />
            )}
          </View>

          <SwipeControls
            onAction={handleControlAction}
            onMenuOpen={currentCard?.adData ? undefined : handleMenuOpen}
            onVoiceFiltersApplied={
              enableFiltering
                ? (filters) => {
                    filters.forEach((f) => addFilter(f.filterId, f.value));
                    onNewFiltersApplied();
                  }
                : undefined
            }
          />
        </View>
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
});
