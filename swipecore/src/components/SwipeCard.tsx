import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Linking,
  Animated,
  ActivityIndicator,
} from "react-native";
import Swiper from "react-native-deck-swiper";

import { RestaurantCard, SwipeConfig } from "@/types/Types";
import { Ionicons } from "@expo/vector-icons";
import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";

import { openUrl, getDomainFromUrl } from "@/utils/browser";
import { ReactNativeModal } from "@/components/ui/modal";
import {
  getDeviceInfo,
  getOptimizedPerformanceConfig,
} from "@/utils/deviceOptimization";
import { isIOS, isAndroid } from "@/lib/utils";
import * as nativeAdsProvider from "@/services/nativeAdsProvider";
import { useQueryClient } from "@tanstack/react-query";

interface SwipeCardProps {
  card: RestaurantCard;
  //onSwipe: (cardId: string, direction: "menu" | "pass") => void;
  onCardTap?: (card: RestaurantCard) => void;
  expandCard?: (params: { cardId: string; timestamp: number }) => void;
  unExpandCard?: (params: { cardId: string; timestamp: number }) => void;
  isExpanded?: boolean;
  forceNormalView?: boolean; // Force normal card view even when expanded
  //onSwipeDirection?: (direction: "menu" | "pass" | null) => void;
}

export const SwipeCard = React.memo(
  function SwipeCard({
    card,
    onCardTap,
    expandCard,
    unExpandCard,
    isExpanded: initialIsExpanded = false,
    forceNormalView = false,
  }: SwipeCardProps) {
    // Debug logging for component renders
    if (__DEV__) {
      console.log(`🎨 [SwipeCard] Rendering card ${card.id}`, {
        hasAdvDetails: !!card.advDetails,
        hasPhone: !!card.phone,
        hasWebsite: !!card.website,
        hasReviews: !!card.reviews,
        reviewCount: card.reviews?.length || 0,
        isExpanded: initialIsExpanded,
      });
    }

    const [isExpanded, setIsExpanded] = useState(initialIsExpanded);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const [openMapDialog, setOpenMapDialog] = useState(false);
    const [openMapDialogAddress, setOpenMapDialogAddress] = useState("");

    const queryClient = useQueryClient();

    // Check if details are available and handle loading state
    useEffect(() => {
      let pollTimeout: NodeJS.Timeout;

      if (isExpanded) {
        // Check if details are already available in the card
        if (card.advDetails) {
          setIsLoadingDetails(false);
          return;
        }

        // Check if details are cached in query client
        const detailsData = queryClient.getQueryData([
          "places",
          "details",
          card.id,
        ]);

        if (detailsData) {
          setIsLoadingDetails(false);
        } else {
          setIsLoadingDetails(true);

          // Poll for details to become available
          const pollForDetails = () => {
            const cachedDetails = queryClient.getQueryData([
              "places",
              "details",
              card.id,
            ]);

            if (cachedDetails) {
              setIsLoadingDetails(false);
            } else {
              // Continue polling every 100ms
              pollTimeout = setTimeout(pollForDetails, 100);
            }
          };

          // Start polling after a short delay
          pollTimeout = setTimeout(pollForDetails, 100);
        }
      } else {
        // Not expanded, ensure loading state is false
        setIsLoadingDetails(false);
      }

      // Cleanup function to clear timeout
      return () => {
        if (pollTimeout) {
          clearTimeout(pollTimeout);
        }
      };
    }, [isExpanded, card.id, card.advDetails, queryClient]);

    // Debug logging for card data changes (only log when key data changes)
    useEffect(() => {
      if (__DEV__) {
        console.log(`[SwipeCard] Card ${card.id} data changed:`, {
          hasAdvDetails: !!card.advDetails,
          hasPhone: !!card.phone,
          hasWebsite: !!card.website,
          hasReviews: !!card.reviews,
          reviewCount: card.reviews?.length || 0,
          isLoadingDetails,
          isExpanded,
        });
      }
    }, [card.advDetails, card.phone, card.website, card.reviews, card.id]);

    // Memoize dialog state setters to prevent unnecessary re-renders
    const closeMapDialog = useCallback(() => setOpenMapDialog(false), []);

    // Memoize expensive callbacks for better performance
    const handleMapsClick = useCallback((resturantAddress: string) => {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.log("handleMapsClick called with address:", resturantAddress);
        console.log("Setting dialog state:", {
          address: resturantAddress,
          hasAddress: !!resturantAddress,
        });
      }
      setOpenMapDialogAddress(resturantAddress);
      setOpenMapDialog(true);
    }, []);

    const handlePhoneCall = useCallback(async (phoneNumber: string) => {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.log("handlePhoneCall called with number:", phoneNumber);
      }

      try {
        // Use expo-linking for phone calls
        if (isIOS() || isAndroid()) {
          try {
            const phoneUrl = `tel:${phoneNumber}`;
            await Linking.openURL(phoneUrl);
            if (typeof __DEV__ !== "undefined" && __DEV__) {
              console.log(
                "Phone call initiated successfully via React Native Linking:",
                phoneNumber
              );
            }
            return; // Success, exit early
          } catch (phoneCallError) {
            if (typeof __DEV__ !== "undefined" && __DEV__) {
              console.log(
                "Phone call via React Native Linking failed, trying fallback:",
                phoneCallError
              );
            }
          }
        }

        // Fallback: Try to open the phone app with the number
        const phoneUrl = `tel:${phoneNumber}`;
        if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.log("Attempting to open phone URL:", phoneUrl);
        }

        // For React Native, we need to use Linking instead of openUrl for tel: protocol
        if (isIOS() || isAndroid()) {
          try {
            // First try to open directly without checking canOpenURL
            await Linking.openURL(phoneUrl);
            if (typeof __DEV__ !== "undefined" && __DEV__) {
              console.log(
                "Phone URL opened successfully via Linking:",
                phoneUrl
              );
            }
          } catch (linkingError) {
            if (typeof __DEV__ !== "undefined" && __DEV__) {
              console.log(
                "Direct Linking failed, trying canOpenURL check:",
                linkingError
              );
            }

            // Fallback: check if URL can be opened
            try {
              const canOpen = await Linking.canOpenURL(phoneUrl);
              if (canOpen) {
                await Linking.openURL(phoneUrl);
                if (typeof __DEV__ !== "undefined" && __DEV__) {
                  console.log(
                    "Phone URL opened successfully after canOpenURL check:",
                    phoneUrl
                  );
                }
              } else {
                throw new Error("Device cannot handle phone URLs");
              }
            } catch (canOpenError) {
              if (typeof __DEV__ !== "undefined" && __DEV__) {
                console.log("canOpenURL also failed:", canOpenError);
              }
              throw canOpenError;
            }
          }
        } else {
          // Fallback to openUrl for web
          await openUrl(phoneUrl);
          if (typeof __DEV__ !== "undefined" && __DEV__) {
            console.log("Phone URL opened successfully via openUrl:", phoneUrl);
          }
        }
      } catch (error) {
        if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.error("Failed to open phone URL:", error);
        }

        // Enhanced fallback: try different phone number formats
        try {
          // Try without tel: prefix
          const cleanNumber = phoneNumber.replace(/[^\d+]/g, "");
          const alternativeUrl = `tel:${cleanNumber}`;

          if (typeof __DEV__ !== "undefined" && __DEV__) {
            console.log("Trying alternative phone URL format:", alternativeUrl);
          }

          await Linking.openURL(alternativeUrl);
          if (typeof __DEV__ !== "undefined" && __DEV__) {
            console.log(
              "Alternative phone URL opened successfully:",
              alternativeUrl
            );
          }
          return;
        } catch (fallbackError) {
          if (typeof __DEV__ !== "undefined" && __DEV__) {
            console.log("Alternative phone URL also failed:", fallbackError);
          }
        }

        // Final fallback: show alert with the phone number
        alert(
          `Call ${phoneNumber}\n\nIf the call doesn't start automatically, please manually dial this number.`
        );
      }
    }, []);

    const openMapsApp = useCallback(
      async (app: "google" | "apple") => {
        if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.log("openMapsApp called with card:", {
            cardId: card.id,
            cardTitle: card.title,
            cardAddress: card.address,
            hasAddress: !!card.address,
          });
        }

        if (!card.address) {
          alert("No address available for this location.");
          return;
        }

        const address = encodeURIComponent(card.address);
        let url = "";

        if (app === "google") {
          // Use a more reliable Google Maps URL format
          url = `https://www.google.com/maps/search/?api=1&query=${address}`;
        } else if (app === "apple" && isIOS()) {
          // Use a more reliable Apple Maps URL format
          url = `https://maps.apple.com/?q=${address}`;
        }

        if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.log("openMapsApp called:", {
            app,
            address,
            url,
            cardAddress: card.address,
          });
        }

        if (url) {
          try {
            if (typeof __DEV__ !== "undefined" && __DEV__) {
              console.log("Attempting to open URL:", url);
            }
            await openUrl(url);
            if (typeof __DEV__ !== "undefined" && __DEV__) {
              console.log("URL opened successfully");
            }
          } catch (e) {
            if (typeof __DEV__ !== "undefined" && __DEV__) {
              console.error("Failed to open maps URL:", url, e);
            }

            // Fallback: try to open maps app directly
            try {
              if (app === "google") {
                // Try to open Google Maps app directly
                const googleMapsUrl = `https://maps.google.com/maps?q=${address}`;
                await openUrl(googleMapsUrl);
              } else if (app === "apple") {
                // Try to open Apple Maps app directly
                const appleMapsUrl = `http://maps.apple.com/?q=${address}`;
                await openUrl(appleMapsUrl);
              }
            } catch (fallbackError) {
              if (typeof __DEV__ !== "undefined" && __DEV__) {
                console.error(
                  "Fallback maps opening also failed:",
                  fallbackError
                );
              }
              alert("Unable to open maps. Please try again.");
            }
          }
        } else {
          alert("Unable to generate maps link for this address.");
        }
      },
      [card.address]
    );

    // Memoize current image URL to prevent unnecessary recalculations
    const currentImageUrl = useMemo(() => {
      if (!card.photos || card.photos.length === 0) return null;
      return card.photos[currentImageIndex]?.url;
    }, [card.photos, currentImageIndex]);

    // Memoize star rendering for better performance
    const renderStars = useCallback((rating: number) => {
      const stars = [];
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 !== 0;
      const emptyStars = 5 - Math.ceil(rating);

      // Pre-allocate array for better performance
      stars.length = 5;

      for (let i = 0; i < fullStars; i++) {
        stars[i] = <Ionicons key={i} name="star" size={20} color="#FFD700" />;
      }

      if (hasHalfStar) {
        stars[fullStars] = (
          <Ionicons key="half" name="star-half" size={20} color="#FFD700" />
        );
      }

      for (let i = Math.ceil(rating); i < 5; i++) {
        stars[i] = (
          <Ionicons
            key={`empty-${i}`}
            name="star-outline"
            size={20}
            color="#E0E0E0"
          />
        );
      }

      return stars;
    }, []);

    const renderPriceRange = useCallback((priceRange: string) => {
      return (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 14, color: "#6b7280", marginLeft: 4 }}>
            {priceRange}
          </Text>
        </View>
      );
    }, []);

    // Image navigation handlers
    const handleImageNavigation = useCallback(
      (direction: "left" | "right") => {
        if (!card.photos || card.photos.length <= 1) return;

        setCurrentImageIndex((prevIndex) => {
          if (direction === "left") {
            return prevIndex === 0 ? card.photos.length - 1 : prevIndex - 1;
          } else {
            return prevIndex === card.photos.length - 1 ? 0 : prevIndex + 1;
          }
        });
      },
      [card.photos]
    );

    // Main content overlay component
    const MainContentOverlay = () => {
      const CardNameAndRating = () => {
        return (
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                marginBottom: 8,
                color: "#1f2937",
              }}
            >
              {card.title}
            </Text>
            {card.rating && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                {renderStars(card.rating)}
                <Text style={{ fontSize: 14, color: "#6b7280", marginLeft: 8 }}>
                  ({card.rating})
                </Text>
              </View>
            )}
          </View>
        );
      };

      const ExpandButton = () => {
        if (card.adData) return null;
        return (
          <TouchableOpacity
            onPress={() => {
              if (!isExpanded) {
                if (expandCard) {
                  expandCard({ cardId: card.id, timestamp: Date.now() });
                }
                setIsExpanded(true);
              } else {
                setIsExpanded(false);
                unExpandCard?.({ cardId: card.id, timestamp: Date.now() });
              }
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "rgba(255,255,255,0.95)",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.3)",
            }}
          >
            <Ionicons
              name={isExpanded ? "chevron-down" : "chevron-up"}
              size={24}
              color={isExpanded ? "#EF4444" : "#3B82F6"}
            />
          </TouchableOpacity>
        );
      };

      const ResturantDetails = () => {
        if (card.adData) return null;
        return (
          <View style={{ marginTop: 8 }}>
            {card.distance && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Ionicons name="location" size={16} color="#60A5FA" />
                <Text style={{ fontSize: 14, color: "#6b7280", marginLeft: 8 }}>
                  {card.distance}
                </Text>
              </View>
            )}
            {card.openingHours && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                {card.openingHours !== "Closed" && (
                  <Ionicons name="time" size={16} color="#60A5FA" />
                )}
                {card.openingHours !== "Closed" && (
                  <Text
                    style={{ fontSize: 14, color: "#6b7280", marginLeft: 8 }}
                  >
                    {card.openingHours}
                  </Text>
                )}
                {card.isOpenNow !== undefined && (
                  <Text
                    style={{
                      marginLeft: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: card.isOpenNow ? "#4CAF50" : "#F44336",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: 12,
                    }}
                  >
                    {card.isOpenNow ? "Open" : "Closed"}
                  </Text>
                )}
              </View>
            )}
          </View>
        );
      };

      return (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(255,255,255,0.95)",
            padding: 24,
            borderTopWidth: 1,
            borderTopColor: "rgba(139,69,19,0.1)",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <View style={{ marginBottom: 12 }}>
            {/* Restaurant Name and Rating */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <CardNameAndRating />

              {/* Expand/Collapse button - Right aligned and bigger */}
              <ExpandButton />
            </View>

            {/* Restaurant Details */}
            <ResturantDetails />
          </View>
        </View>
      );
    };

    // Loading component for when details are being fetched
    const LoadingDetailsComponent = () => {
      return (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "white",
            borderWidth: 1,
            borderColor: "rgba(139,69,19,0.05)",
            borderRadius: 20,
            overflow: "hidden",
            zIndex: 3,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View style={{ alignItems: "center", padding: 24 }}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text
              style={{
                marginTop: 16,
                fontSize: 18,
                fontWeight: "600",
                color: "#1f2937",
                textAlign: "center",
              }}
            >
              Loading Details...
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 14,
                color: "#6b7280",
                textAlign: "center",
                maxWidth: 250,
              }}
            >
              Fetching restaurant information and reviews
            </Text>
          </View>
        </View>
      );
    };

    // Detailed content container component
    const DetailedContentContainer = () => {
      const Header = () => {
        return (
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  marginBottom: 12,
                  color: "black",
                }}
              >
                {card.title}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    color: "black",
                    fontWeight: "bold",
                    fontSize: 14,
                  }}
                >
                  {card.cuisine}
                </Text>
                {card.priceRange && (
                  <Text style={{ fontSize: 14, color: "green", marginLeft: 8 }}>
                    {card.priceRange}
                  </Text>
                )}
              </View>
              {card.rating && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {renderStars(card.rating)}
                  <Text style={{ fontSize: 14, color: "white", marginLeft: 8 }}>
                    ({card.rating})
                  </Text>
                </View>
              )}
            </View>
            {/* Close button */}
            <TouchableOpacity
              onPress={() => {
                setIsExpanded(false);
                unExpandCard?.({ cardId: card.id, timestamp: Date.now() });
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.95)",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.3)",
              }}
            >
              <Ionicons name="chevron-down" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        );
      };

      const AddressSection = () => {
        return (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              backgroundColor: "rgba(139,69,19,0.05)",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(139,69,19,0.1)",
              marginBottom: 16,
            }}
          >
            <Ionicons name="location" size={20} color="#7C3AED" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
                Address
              </Text>
              {/* <Text style={{ fontWeight: "500", color: "#1f2937" }}>
                {card.address}
              </Text> */}
            </View>
            <TouchableOpacity
              onPress={() => {
                if (typeof __DEV__ !== "undefined" && __DEV__) {
                  console.log("Open Maps button pressed");
                  console.log("Card address:", card?.address);
                  console.log(
                    "Calling handleMapsClick with:",
                    card?.address || ""
                  );
                }
                handleMapsClick(card?.address || "");
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#7c3aed",
                backgroundColor: "white",
              }}
            >
              <Text
                style={{ color: "#7c3aed", fontSize: 14, fontWeight: "500" }}
              >
                Open Maps
              </Text>
            </TouchableOpacity>
          </View>
        );
      };

      const PhoneSection = () => {
        if (!card.phone) return null;

        return (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              backgroundColor: "rgba(59,130,246,0.05)",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(59,130,246,0.1)",
              marginBottom: 16,
            }}
          >
            <Ionicons name="call" size={20} color="#3B82F6" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 14, color: "#6b7280" }}>Phone</Text>
              <Text style={{ fontWeight: "500", color: "#1f2937" }}>
                {card.phone}
              </Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                if (typeof __DEV__ !== "undefined" && __DEV__) {
                  console.log("Call button pressed for:", card.phone);
                }
                try {
                  if (card.phone) {
                    await handlePhoneCall(card.phone);
                  }
                } catch (error) {
                  if (typeof __DEV__ !== "undefined" && __DEV__) {
                    console.error("Error making phone call:", error);
                  }
                }
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#3b82f6",
                backgroundColor: "white",
              }}
            >
              <Text
                style={{ color: "#3b82f6", fontSize: 14, fontWeight: "500" }}
              >
                Call Now
              </Text>
            </TouchableOpacity>
          </View>
        );
      };

      const WebsiteSection = () => {
        if (!card.website) return null;

        return (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              backgroundColor: "rgba(34,197,94,0.05)",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(34,197,94,0.1)",
              marginBottom: 16,
            }}
          >
            <Ionicons name="link" size={20} color="#16A34A" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 14, color: "#6b7280" }}>Website</Text>
              {/* <Text style={{ fontWeight: "500", color: "#1f2937" }}>
                {card.website}
              </Text> */}
            </View>
            <TouchableOpacity
              onPress={() => {
                if (card.website) {
                  openUrl(card.website);
                }
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#16a34a",
                backgroundColor: "white",
              }}
            >
              <Text
                style={{ color: "#16a34a", fontSize: 14, fontWeight: "500" }}
              >
                Open Website
              </Text>
            </TouchableOpacity>
          </View>
        );
      };

      const OpeningHoursSection = () => {
        if (!card.openingHours) return null;

        return (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              backgroundColor: "rgba(251,146,60,0.05)",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(251,146,60,0.1)",
              marginBottom: 16,
            }}
          >
            <Ionicons name="time" size={20} color="#F59E0B" />
            <View style={{ marginLeft: 12 }}>
              <Text style={{ fontSize: 14, color: "#6b7280" }}>Hours</Text>
              <Text style={{ fontWeight: "500", color: "#1f2937" }}>
                {card.openingHours}
              </Text>
            </View>
          </View>
        );
      };

      const AdditionalInfoSection = () => {
        if (!card.placeDetails?.editorialSummary?.text) return null;

        return (
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 16,
                color: "white",
              }}
            >
              About
            </Text>
            <View
              style={{
                backgroundColor: "rgba(139,69,19,0.05)",
                padding: 24,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(139,69,19,0.1)",
              }}
            >
              <Text style={{ color: "#374151", lineHeight: 24 }}>
                {card.placeDetails?.editorialSummary?.text}
              </Text>
            </View>
          </View>
        );
      };

      const ReviewsSection = () => {
        if (!card.reviews || card.reviews.length === 0) return null;

        return (
          <View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 16,
                color: "white",
              }}
            >
              Customer Reviews
            </Text>
            <ScrollView
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {card.reviews?.map((review) => (
                <View
                  key={review.id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.1)",
                    marginBottom: 16,
                    padding: 16,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        backgroundColor: "rgba(102,51,153,0.9)",
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "bold",
                          fontSize: 16,
                        }}
                      >
                        {review.author.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontWeight: "600", color: "#1f2937" }}>
                        {review.author}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 4,
                        }}
                      >
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          {renderStars(review.rating)}
                        </View>
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            marginLeft: 8,
                          }}
                        >
                          {review.relativeTime || review.date}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={{ color: "#374151", lineHeight: 20 }}>
                    {review.comment}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        );
      };

      return (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "white",
            borderWidth: 1,
            borderColor: "rgba(139,69,19,0.05)",
            borderRadius: 20,
            overflow: "hidden",
            zIndex: 3,
          }}
        >
          {/* Tap to close area at the very top - smaller to allow scrolling */}
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 20,
              zIndex: 4,
            }}
            onPress={() => setIsExpanded(false)}
          />
          {/* Ensure the ScrollView also has rounded corners */}
          <View
            style={{
              flex: 1,
              borderRadius: 20,
              overflow: "hidden",
              backgroundColor: "white",
            }}
          >
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                padding: 24,
                paddingTop: 44, // Add extra top padding to account for tap area
                backgroundColor: "transparent",
              }}
              showsVerticalScrollIndicator={false}
              style={{
                flex: 1,
                backgroundColor: "transparent",
              }}
            >
              {/* Header */}
              <Header />

              {/* Contact Info */}
              <View style={{ marginBottom: 32 }}>
                {card.address && <AddressSection />}
                {card.phone && <PhoneSection />}
                {card.website && <WebsiteSection />}
                {card.openingHours && <OpeningHoursSection />}
              </View>

              {/* Additional Info */}
              {card.placeDetails?.editorialSummary && <AdditionalInfoSection />}

              {/* Reviews Preview */}
              {card.reviews && card.reviews.length > 0 && <ReviewsSection />}
            </ScrollView>
          </View>
        </View>
      );
    };

    const MapsDialog = useCallback(() => {
      return (
        <ReactNativeModal
          visible={openMapDialog}
          onClose={closeMapDialog}
          title="Open in Maps"
        >
          <View style={{ width: "100%" }}>
            <TouchableOpacity
              onPress={async () => {
                if (typeof __DEV__ !== "undefined" && __DEV__) {
                  console.log("Google Maps button pressed");
                }
                try {
                  await openMapsApp("google");
                  // Close the dialog after opening maps
                  setOpenMapDialog(false);
                } catch (error) {
                  if (typeof __DEV__ !== "undefined" && __DEV__) {
                    console.error("Error opening Google Maps:", error);
                  }
                }
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: "#7c3aed",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "500" }}>
                Google Maps
              </Text>
            </TouchableOpacity>
            {isIOS() && (
              <TouchableOpacity
                onPress={async () => {
                  if (typeof __DEV__ !== "undefined" && __DEV__) {
                    console.log("Apple Maps button pressed");
                  }
                  try {
                    await openMapsApp("apple");
                    // Close the dialog after opening maps
                    setOpenMapDialog(false);
                  } catch (error) {
                    if (typeof __DEV__ !== "undefined" && __DEV__) {
                      console.error("Error opening Apple Maps:", error);
                    }
                  }
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#7c3aed",
                  backgroundColor: "white",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{ color: "#7c3aed", fontSize: 16, fontWeight: "500" }}
                >
                  Apple Maps
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ReactNativeModal>
      );
    }, [openMapDialog, openMapsApp, isIOS]);

    // Single card renderer
    const renderCard = () => (
      <View
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          backgroundColor: "white",
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(139,69,19,0.05)",
        }}
      >
        {/* Background Image Section - Full height with rounded corners */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#f3f4f6",
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          {currentImageUrl ? (
            <Image
              source={{ uri: currentImageUrl }}
              style={{
                width: "100%",
                height: "100%",
                resizeMode: card.adData ? "contain" : "cover",
                borderRadius: 20,
              }}
              // Performance optimizations
              fadeDuration={200}
              resizeMethod="resize"
              progressiveRenderingEnabled={true}
            />
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f3f4f6",
                borderRadius: 20,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  marginBottom: 8,
                  alignSelf: "center",
                }}
              >
                <Ionicons name="location" size={64} color="#9CA3AF" />
              </View>
              <Text style={{ color: "#9CA3AF", fontSize: 14 }}>
                No image available
              </Text>
            </View>
          )}

          {/* Image Navigation Areas - Only show if multiple photos and not expanded */}
          {card.photos && card.photos.length > 1 && !isExpanded && (
            <>
              {/* Left navigation area */}
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "33%",
                  height: "100%",
                  zIndex: 10,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onPress={() => handleImageNavigation("left")}
              />
              {/* Right navigation area */}
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "33%",
                  height: "100%",
                  zIndex: 10,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onPress={() => handleImageNavigation("right")}
              />
              {/* Image indicators */}
              <View
                style={{
                  position: "absolute",
                  bottom: 16,
                  left: "50%",
                  transform: [{ translateX: -20 }], // Center indicators
                  flexDirection: "row",
                  gap: 4,
                  zIndex: 10,
                }}
              >
                {card.photos.map((_: any, index: number) => (
                  <View
                    key={index}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor:
                        index === currentImageIndex
                          ? "white"
                          : "rgba(255,255,255,0.5)",
                    }}
                  />
                ))}
              </View>
            </>
          )}
        </View>
        {/* Gradient Overlay - Simplified during drag for performance */}
        {
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              borderRadius: 20,
            }}
          />
        }

        <View
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: [{ translateX: -60 }], // Center badge using fixed pixel value
            backgroundColor: "rgba(255,255,255,1)",
            borderRadius: 12,
            paddingHorizontal: 40, // Increased horizontal padding for wider badge
            paddingVertical: 12,
            minWidth: 120, // Ensure minimum width for better appearance
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: "#374151",
                fontWeight: "bold",
                fontSize: 14,
              }}
            >
              {card.cuisine}
            </Text>
            {card.priceRange && (
              <Text style={{ fontSize: 14, color: "#00ff00", marginLeft: 8 }}>
                {card.priceRange}
              </Text>
            )}
          </View>
        </View>

        {/* Content Overlays */}
        {!forceNormalView && isExpanded ? (
          isLoadingDetails ? (
            <LoadingDetailsComponent />
          ) : (
            <DetailedContentContainer />
          )
        ) : (
          <MainContentOverlay />
        )}
      </View>
    );

    return (
      <>
        {(!card.adData || forceNormalView) && (
          <>
            <View
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 20,
                overflow: "hidden",
              }}
            >
              {renderCard()}
            </View>

            {openMapDialog && <MapsDialog />}
          </>
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for better performance
    const prevCard = prevProps.card;
    const nextCard = nextProps.card;

    // Always re-render if basic properties change
    if (
      prevCard.id !== nextCard.id ||
      prevProps.isExpanded !== nextProps.isExpanded ||
      prevProps.forceNormalView !== nextProps.forceNormalView ||
      prevCard.photos?.[0]?.url !== nextCard.photos?.[0]?.url ||
      prevCard.rating !== nextCard.rating ||
      prevCard.title !== nextCard.title
    ) {
      return false; // Props changed, should re-render
    }

    // Always re-render if advDetails presence changes (null to object or vice versa)
    const prevHasAdvDetails = !!prevCard.advDetails;
    const nextHasAdvDetails = !!nextCard.advDetails;
    if (prevHasAdvDetails !== nextHasAdvDetails) {
      return false; // advDetails presence changed, should re-render
    }

    // Always re-render if key detail properties change
    if (
      prevCard.phone !== nextCard.phone ||
      prevCard.website !== nextCard.website ||
      prevCard.openingHours !== nextCard.openingHours ||
      prevCard.reviews?.length !== nextCard.reviews?.length
    ) {
      return false; // Key detail properties changed, should re-render
    }

    // For performance, only check advDetails reference if both exist
    if (prevHasAdvDetails && nextHasAdvDetails) {
      return prevCard.advDetails === nextCard.advDetails;
    }

    return true; // No changes detected, skip re-render
  }
);
