import {
  Animated,
  PanResponder,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { RestaurantCard, SwipeConfig } from "@/types/Types";
import {
  Star,
  Clock,
  MapPin,
  DollarSign,
  ChevronUp,
  Phone,
  Globe,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";

import { openUrl } from "@/utils/browser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getDeviceInfo,
  getOptimizedPerformanceConfig,
} from "@/utils/deviceOptimization";
import { isIOS, isAndroid } from "@/lib/utils";
import * as nativeAdsProvider from "@/services/nativeAdsProvider";

interface SwipeCardProps {
  card: RestaurantCard;
  onSwipe: (cardId: string, direction: "menu" | "pass") => void;
  config: SwipeConfig;
  isTop: boolean;
  index: number;
  onCardTap?: (card: RestaurantCard) => void;
  handleOnExpand?: (cardId: string) => void;
  onSwipeDirection?: (direction: "menu" | "pass" | null) => void;
}

export function SwipeCard({
  card,
  onSwipe,
  config,
  isTop,
  index,
  onCardTap,
  handleOnExpand,
  onSwipeDirection,
}: SwipeCardProps) {
  const cardRef = useRef<View | null>(null);
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const dragMovedRef = useRef(false);
  const lastDirectionUpdateRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Get device-optimized settings
  const deviceInfo = getDeviceInfo();
  const performanceConfig = getOptimizedPerformanceConfig(deviceInfo);
  const DRAG_START_THRESHOLD = performanceConfig.optimizedDragThreshold;

  const [openMapDialog, setOpenMapDialog] = useState(false);
  const [openMapDialogAddress, setOpenMapDialogAddress] = useState("");

  // PanResponder for drag gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTop && !isExpanded,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > DRAG_START_THRESHOLD;
      },
      onPanResponderGrant: () => {
        setIsDragging(true);
        setDragStartTime(Date.now());
        pan.setOffset({
          x: (pan.x as any)._value || 0,
          y: (pan.y as any)._value || 0,
        });
        pan.setValue({ x: 0, y: 0 });
        
        // Scale animation on drag start
        if (!deviceInfo.isLowEndDevice) {
          Animated.spring(scale, {
            toValue: 1.01,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx } = gestureState;
        pan.x.setValue(dx);
        
        // Update direction for visual feedback
        if (Math.abs(dx) > 10) {
          const direction = dx > 0 ? "menu" : "pass";
          if (Date.now() - lastDirectionUpdateRef.current > 100) {
            onSwipeDirection?.(direction);
            lastDirectionUpdateRef.current = Date.now();
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        const dragDistance = Math.abs(dx);
        const dragVelocity = Math.abs(vx);
        
        setIsDragging(false);
        pan.flattenOffset();
        
        // Determine if swipe should trigger
        const shouldSwipe = dragDistance > config.threshold || (dragDistance > config.threshold * 0.5 && dragVelocity > 0.5);
        
        if (shouldSwipe) {
          const direction = dx > 0 ? "menu" : "pass";
          onSwipe(card.id, direction);
        } else {
          // Snap back to center
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        }
        
        // Reset scale
        if (!deviceInfo.isLowEndDevice) {
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Fire impression when a sponsored card becomes top
  useEffect(() => {
    if (isTop && card.adData) {
      if (__DEV__) {
        console.log("[Ads] Top sponsored card", {
          cardId: card.id,
          title: card.title,
                  hasPhotos: Array.isArray(card.images) && card.images.length > 0,
        firstPhoto: card.images?.[0],
        });
      }
      nativeAdsProvider.recordImpression(card.id);
    }
  }, [isTop, card.adData, card.id]);

  // Memoize expensive callbacks for better performance
  const handleMapsClick = useCallback((resturantAddress: string) => {
    setOpenMapDialogAddress(resturantAddress);
    setOpenMapDialog(true);
  }, []);

  const openMapsApp = useCallback((app: "google" | "apple") => {
    if (!card.address) return;
    
    const address = encodeURIComponent(card.address);
    let url = "";
    
    if (app === "google") {
      url = `https://maps.google.com/maps?q=${address}`;
    } else if (app === "apple" && isIOS()) {
      url = `http://maps.apple.com/?q=${address}`;
    }
    
    if (url) {
      openUrl(url);
    }
  }, [card.address]);

  const getCurrentImageUrl = useCallback(() => {
    if (!card.images || card.images.length === 0) return null;
    return card.images[currentImageIndex];
  }, [card.images, currentImageIndex]);

  const renderStars = useCallback((rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="w-4 h-4 text-yellow-400 fill-current" />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      );
    }
    
    return stars;
  }, []);

  const renderPriceRange = useCallback((priceRange: string) => {
    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <DollarSign className="w-4 h-4 text-green-600" />
        <Text style={{ fontSize: 14, color: "#6b7280", marginLeft: 4 }}>{priceRange}</Text>
      </View>
    );
  }, []);

  // Image navigation handlers
  const handleImageNavigation = useCallback(
    (direction: "left" | "right") => {
      if (!card.images || card.images.length <= 1) return;

      setCurrentImageIndex((prevIndex) => {
        if (direction === "left") {
          return prevIndex === 0 ? card.images.length - 1 : prevIndex - 1;
        } else {
          return prevIndex === card.images.length - 1 ? 0 : prevIndex + 1;
        }
      });
    },
    [card.images]
  );

  // Touch handlers for mobile
  const handleTouchStart = useCallback(
    (e: any) => {
      touchStartRef.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY, time: Date.now() };
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: any) => {
      if (touchStartRef.current) {
        const touch = e.nativeEvent;
        const deltaX = touch.pageX - touchStartRef.current.x;
        const deltaY = touch.pageY - touchStartRef.current.y;
        
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
          dragMovedRef.current = true;
        }
      }
    },
    []
  );

  const handleTouchEnd = useCallback(
    (e: any) => {
      if (touchStartRef.current && !dragMovedRef.current) {
        const touchDuration = Date.now() - touchStartRef.current.time;
        if (touchDuration < 200) {
          onCardTap?.(card);
        }
      }
      
      touchStartRef.current = null;
      dragMovedRef.current = false;
    },
    [onCardTap, card]
  );

  // AdChoices button component
  const AdChoicesButton = () => {
    if (!card.adData) return null;
    return (
      <View
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            console.log("Opening AdChoices link", card.adData.adChoicesLinkUrl);
            openUrl(card.adData.adChoicesLinkUrl);
          }}
          accessibilityRole="button"
          accessibilityLabel="AdChoices"
        >
          <View
            style={{
              width: 24,
              height: 24,
              minWidth: 16,
              minHeight: 16,
            }}
          >
            <Image
              source={{ uri: card.adData.adChoicesIconUrl }}
              style={{ width: "100%", height: "100%" }}
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Main content overlay component
  const MainContentOverlay = () => {
    const CardNameAndRating = () => {
      return (
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8, color: "#1f2937" }}>
            {card.title}
          </Text>
          {card.rating && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
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
              if (handleOnExpand) {
                handleOnExpand(card.id);
              }
            }
            setIsExpanded((value) => !value);
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.9)",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "rgba(0,0,0,0.1)",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <ChevronUp className="w-5 h-5 text-purple-600" />
        </TouchableOpacity>
      );
    };

    const ResturantDetails = () => {
      if (card.adData) return null;
      return (
        <View style={{ marginTop: 8 }}>
          {card.distance && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <MapPin className="w-4 h-4 text-purple-500" />
              <Text style={{ fontSize: 14, color: "#6b7280", marginLeft: 8 }}>
                {card.distance}
              </Text>
            </View>
          )}
          {card.openingHours && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              {card.openingHours !== "Closed" && (
                <Clock className="w-4 h-4 text-purple-500" />
              )}
              {card.openingHours !== "Closed" && (
                <Text style={{ fontSize: 14, color: "#6b7280", marginLeft: 8 }}>
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

    const AdDetails = () => {
      if (!card.adData) return null;
      return (
        <View style={{ marginTop: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  {card.adData.body}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 14, color: "#16a34a", fontWeight: "bold" }}>
                  {card.adData.cta}
                </Text>
              </View>
            </View>
            {/* Ad Icon */}
            <View
              style={{
                width: 48,
                height: 48,
                minWidth: 16,
                minHeight: 16,
                borderRadius: 999,
                backgroundColor: "white",
                borderWidth: 2,
                borderColor: "rgba(255,255,255,0.5)",
                shadowColor: "rgba(0,0,0,0.2)",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Image
                source={{ uri: card.adData.iconUrl }}
                style={{ width: "100%", height: "100%" }}
              />
            </View>
          </View>
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
          shadowColor: "rgba(0,0,0,0.1)",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <View style={{ marginBottom: 12 }}>
          {/* Restaurant Name and Rating */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
            <CardNameAndRating />

            {/* Expand/Collapse button - Right aligned and bigger */}
            <ExpandButton />
          </View>

          {/* Restaurant Details */}
          <ResturantDetails />

          {/* Ad Content */}
          <AdDetails />
        </View>
      </View>
    );
  };

  // Detailed content container component
  const DetailedContentContainer = () => {
    const Header = () => {
      return (
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 12, color: "white" }}>
              {card.title}
            </Text>
            {card.cuisine && (
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Text
                  style={{
                    fontSize: 14,
                    backgroundColor: "rgba(139,69,19,0.1)",
                    color: "#7c3aed",
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 999,
                    fontWeight: "500",
                  }}
                >
                  {card.cuisine}
                </Text>
                {card.priceRange && (
                  <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 8 }}>
                    {renderPriceRange(card.priceRange)}
                  </View>
                )}
              </View>
            )}
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
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.1)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ChevronUp className="w-5 h-5 text-white rotate-180" />
          </TouchableOpacity>
        </View>
      );
    };

    const AddressSection = () => {
      return (
        <View style={{ flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "rgba(139,69,19,0.05)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(139,69,19,0.1)", marginBottom: 16 }}>
          <MapPin className="w-5 h-5 text-purple-500" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>Address</Text>
            <Text style={{ fontWeight: "500", color: "#1f2937" }}>{card.address}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
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
            <Text style={{ color: "#7c3aed", fontSize: 14, fontWeight: "500" }}>
              Open Maps
            </Text>
          </TouchableOpacity>
        </View>
      );
    };

    const PhoneSection = () => {
      return (
        <View style={{ flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "rgba(59,130,246,0.05)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(59,130,246,0.1)", marginBottom: 16 }}>
          <Phone className="w-5 h-5 text-blue-500" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 14, color: "#6b7280" }}>Phone</Text>
            <Text style={{ fontWeight: "500", color: "#1f2937" }}>{card.phone}</Text>
          </View>
          {(isIOS() || isAndroid()) && (
            <TouchableOpacity
              onPress={() => {
                openUrl(`tel:${card.phone}`);
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
              <Text style={{ color: "#3b82f6", fontSize: 14, fontWeight: "500" }}>
                Call
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    };

    const WebsiteSection = () => {
      return (
        <View style={{ flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "rgba(34,197,94,0.05)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(34,197,94,0.1)", marginBottom: 16 }}>
          <Globe className="w-5 h-5 text-green-500" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 14, color: "#6b7280" }}>Website</Text>
            <Text style={{ fontWeight: "500", color: "#1f2937" }}></Text>
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
            <Text style={{ color: "#16a34a", fontSize: 14, fontWeight: "500" }}>
              Open Website
            </Text>
          </TouchableOpacity>
        </View>
      );
    };

    const OpeningHoursSection = () => {
      return (
        <View style={{ flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "rgba(251,146,60,0.05)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(251,146,60,0.1)", marginBottom: 16 }}>
          <Clock className="w-5 h-5 text-orange-500" />
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 14, color: "#6b7280" }}>Hours</Text>
            <Text style={{ fontWeight: "500", color: "#1f2937" }}>{card.openingHours}</Text>
          </View>
        </View>
      );
    };

    const AdditionalInfoSection = () => {
      return (
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16, color: "white" }}>About</Text>
          <View style={{ backgroundColor: "rgba(139,69,19,0.05)", padding: 24, borderRadius: 16, borderWidth: 1, borderColor: "rgba(139,69,19,0.1)" }}>
            <Text style={{ color: "#374151", lineHeight: 24 }}>
              {card.placeDetails?.editorialSummary?.text}
            </Text>
          </View>
        </View>
      );
    };

    const ReviewsSection = () => {
      return (
        <View>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16, color: "white" }}>
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
                  shadowColor: "rgba(0,0,0,0.05)",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 1,
                  marginBottom: 16,
                  padding: 16,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
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
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        {renderStars(review.rating)}
                      </View>
                      <Text style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>
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
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(255,255,255,0.98)",
          borderWidth: 1,
          borderColor: "rgba(139,69,19,0.05)",
          shadowColor: "rgba(0,0,0,0.2)",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 10,
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 24,
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
      </Animated.View>
    );
  };

  const MapsDialog = () => {
    return (
      <Dialog open={openMapDialog} onOpenChange={setOpenMapDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open in Maps</DialogTitle>
          </DialogHeader>
          <View style={{ marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => {
                openMapsApp("google");
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
                onPress={() => {
                  openMapsApp("apple");
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
                <Text style={{ color: "#7c3aed", fontSize: 16, fontWeight: "500" }}>
                  Apple Maps
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <DialogFooter>
            <TouchableOpacity
              onPress={() => setOpenMapDialog(false)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: "transparent",
              }}
            >
              <Text style={{ color: "#6b7280", fontSize: 14, fontWeight: "500" }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Animated.View
      ref={cardRef}
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        top: 12,
        bottom: 32,
        zIndex: isTop ? 5 : 5 - index,
        transform: [
          { translateX: pan.x },
          { translateY: pan.y },
          { scale: scale },
        ],
      }}
      {...panResponder.panHandlers}
      onTouchStart={!isExpanded ? handleTouchStart : undefined}
      onTouchMove={!isExpanded ? handleTouchMove : undefined}
      onTouchEnd={!isExpanded ? handleTouchEnd : undefined}
    >
      {/* Card Container - Modern vibrant design with responsive styling */}
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
          shadowColor: "rgba(0,0,0,0.1)",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        {/* Background Image Section - Full height */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#f3f4f6",
          }}
        >
          {getCurrentImageUrl() ? (
            <Image
              source={{ uri: getCurrentImageUrl() }}
              style={{
                width: "100%",
                height: "100%",
                resizeMode: card.adData ? "contain" : "cover",
              }}
            />
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f3f4f6",
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
                <MapPin className="w-16 h-16 mx-auto" />
              </View>
              <Text style={{ color: "#9ca3af", fontSize: 14 }}>
                No image available
              </Text>
            </View>
          )}

          {/* Image Navigation Areas - Only show if multiple images and not expanded */}
          {card.images && card.images.length > 1 && !isExpanded && (
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
                {card.images.map((_: string, index: number) => (
                  <View
                    key={index}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor:
                        index === currentImageIndex ? "white" : "rgba(255,255,255,0.5)",
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
            }}
          />
        }
        {/* Info Badge: show "Ad" for ads (top-left per policy), otherwise cuisine/price */}
        {!card.adData && (
          <View
            style={{
              position: "absolute",
              top: 16,
              left: "50%",
              transform: [{ translateX: -40 }], // Center badge
              backgroundColor: "rgba(255,255,255,0.95)",
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 12,
              shadowColor: "rgba(0,0,0,0.1)",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 1,
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
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {renderPriceRange(card.priceRange)}
              </View>
            )}
          </View>
        )}

        {card.adData && (
          <>
            {/* "Ad" badge - Top left */}
            <View
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                backgroundColor: "rgba(255,255,255,0.95)",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 6,
                shadowColor: "rgba(0,0,0,0.1)",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <Text
                style={{
                  color: "#1f2937",
                  fontWeight: "900",
                  fontSize: 14,
                  letterSpacing: 0.5,
                  lineHeight: 1,
                }}
              >
                Ad
              </Text>
            </View>

            {/* Advertiser name - Top center */}
            <View
              style={{
                position: "absolute",
                top: 16,
                left: "50%",
                transform: [{ translateX: -40 }], // Center badge
                backgroundColor: "rgba(255,255,255,0.95)",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 6,
                shadowColor: "rgba(0,0,0,0.1)",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <Text
                style={{
                  color: "#374151",
                  fontWeight: "bold",
                  fontSize: 14,
                }}
              >
                {card.adData.advertiser}
              </Text>
            </View>
          </>
        )}

        {/* AdChoices Attribution - Top right */}
        <AdChoicesButton />

        {/* Content Overlays */}
        {isExpanded ? (
          <DetailedContentContainer />
        ) : (
          <MainContentOverlay />
        )}
      </View>
      {openMapDialog && <MapsDialog />}
    </Animated.View>
  );
}
