import {
  motion,
  PanInfo,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
} from "framer-motion";
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
import { Button } from "./ui/button";
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
  const cardRef = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const shouldAnimateRef = useRef(true);

  const [isDragging, setIsDragging] = useState(false);
  const [isPerformanceMode, setIsPerformanceMode] = useState(false);
  const dragMovedRef = useRef(false);
  const lastDirectionUpdateRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null
  );
  // Ads handled via Capacitor AdMob plugin externally; no native overlay here

  // Get device-optimized settings (moved outside useMemo to avoid hook rules violation)
  const deviceInfo = getDeviceInfo();
  const performanceConfig = getOptimizedPerformanceConfig(deviceInfo);
  const DRAG_START_THRESHOLD = performanceConfig.optimizedDragThreshold;

  const [openMapDialog, setOpenMapDialog] = useState(false);
  const [openMapDialogAddress, setOpenMapDialogAddress] = useState("");

  // Memoize expensive callbacks for better performance
  const handleMapsClick = useCallback((resturantAddress: string) => {
    setOpenMapDialogAddress(resturantAddress);
    setOpenMapDialog(true);
  }, []);

  const openMapsApp = useCallback(
    (provider: "google" | "apple") => {
      const encoded = encodeURIComponent(openMapDialogAddress);
      let url: string;
      if (provider === "google") {
        url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
      } else {
        url = `http://maps.apple.com/?daddr=${encoded}`;
      }

      // Close the dialog first for smooth UX
      setOpenMapDialog(false);

      // Small delay to ensure dialog closes smoothly
      setTimeout(() => {
        openUrl(url);
      }, 150); // Small delay for smooth animation
    },
    [openMapDialogAddress]
  );

  // Image navigation handlers
  const handleImageNavigation = useCallback(
    (event: React.MouseEvent, direction: "left" | "right") => {
      event.stopPropagation();
      if (!card.images || card.images.length <= 1) return;

      if (direction === "left") {
        setCurrentImageIndex((prev) =>
          prev > 0 ? prev - 1 : card.images!.length - 1
        );
      } else {
        setCurrentImageIndex((prev) =>
          prev < card.images!.length - 1 ? prev + 1 : 0
        );
      }
    },
    [card.images]
  );

  // Get current image URL
  const getCurrentImageUrl = useCallback(() => {
    if (card.photos && card.photos.length > 0) {
      return card.photos[currentImageIndex].url;
    }
    return null;
  }, [card.photos, currentImageIndex]);

  // Transform values for animations (fixed - removed useMemo around hooks)
  const rotate = useTransform(
    x,
    [-200, 200],
    [-config.maxRotation, config.maxRotation]
  );

  // Conditional opacity transform - only for high-end devices
  const opacity = deviceInfo.isLowEndDevice
    ? undefined
    : useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  // Optimized touch handlers for better Android performance
  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      // Allow scrolling when card is expanded, prevent default only when not expanded
      if (!isExpanded) {
        event.preventDefault();
      }
      const touch = event.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      dragMovedRef.current = false;
      setIsDragging(false);
    },
    [isExpanded]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      // Allow scrolling when card is expanded
      if (isExpanded) return;

      const touch = event.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      if (
        !dragMovedRef.current &&
        (deltaX > DRAG_START_THRESHOLD || deltaY > DRAG_START_THRESHOLD)
      ) {
        dragMovedRef.current = true;
        setIsDragging(true);
        // Prevent scrolling when dragging starts (but only when not expanded)
        event.preventDefault();
      }
    },
    [isExpanded]
  );

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = event.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Only consider as a tap if not dragging and finger didn't move much
    if (!dragMovedRef.current && deltaX < 7 && deltaY < 7 && deltaTime < 350) {
      // Sponsored cards: tap opens link via onCardTap
      if ((card as any).isSponsored) {
        console.log("[Sponsored] Sponsored card tapped", { cardId: card.id });
        onCardTap?.(card);
      } else {
        if(!isExpanded)
        {
          handleOnExpand(card.id);
        }
        setIsExpanded((value) => !value);
      }
    }

    touchStartRef.current = null;
    dragMovedRef.current = false;
    setIsDragging(false);
  }, []);

  // Optimized drag handlers
  const handleDragStart = useCallback(() => {
    setDragStartTime(Date.now());
    setIsDragging(true);
    setIsPerformanceMode(true); // Enable performance mode during drag
    onSwipeDirection?.(null);
  }, [onSwipeDirection]);

  const handleDrag = useCallback(
    (_: any, info: PanInfo) => {
      // Throttle direction updates to reduce re-renders
      const now = Date.now();
      const throttleDelay = deviceInfo.isLowEndDevice ? 50 : 16; // ~60fps for high-end, ~20fps for low-end

      if (now - lastDirectionUpdateRef.current < throttleDelay) {
        return; // Skip this update
      }

      lastDirectionUpdateRef.current = now;
      const threshold = deviceInfo.isLowEndDevice ? 30 : 20;

      if (Math.abs(info.offset.x) > threshold) {
        const direction = info.offset.x > 0 ? "menu" : "pass";
        onSwipeDirection?.(direction);
      } else {
        onSwipeDirection?.(null);
      }
      // No native overlay syncing needed
    },
    [onSwipeDirection, deviceInfo.isLowEndDevice, isTop, card]
  );

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      const swipeDistance = Math.abs(info.offset.x);
      const swipeDirection = info.offset.x > 0 ? "menu" : "pass";
      const dragDuration = Date.now() - dragStartTime;

      // Only trigger swipe if:
      // 1. Distance is greater than threshold
      // 2. Drag duration is reasonable (not too fast, not too slow)
      // Note: No need to check horizontal ratio since we only allow horizontal movement
      if (
        swipeDistance > config.threshold &&
        dragDuration > 100 &&
        dragDuration < 2000
      ) {
        // Map menu direction back to like for the actual swipe action
        const actualDirection = swipeDirection === "menu" ? "menu" : "pass";
        if ((card as any).isSponsored) {
          console.log("[Sponsored] Sponsored card swiped", {
            cardId: card.id,
            direction: actualDirection,
          });
        }
        onSwipe(card.id, actualDirection);
      } else {
        // Animate card back to center with device-optimized settings
        const snapDuration = performanceConfig.fastSnapBack
          ? config.snapBackDuration * 0.7
          : config.snapBackDuration;
        const animationConfig = deviceInfo.isLowEndDevice
          ? {
              duration: snapDuration,
              ease: [0.25, 0.46, 0.45, 0.94],
            }
          : {
              duration: snapDuration,
              ease: [0.25, 0.46, 0.45, 0.94],
              type: "spring" as const,
              damping: deviceInfo.isAndroid ? 25 : 20,
              stiffness: deviceInfo.isAndroid ? 400 : 300,
            };

        animate(x, 0, animationConfig as any);
        animate(y, 0, animationConfig as any);
      }

      // Reset drag state after a short delay to prevent tap trigger
      setTimeout(() => {
        setIsDragging(false);
        setIsPerformanceMode(false); // Disable performance mode after drag
        onSwipeDirection?.(null);
      }, 100);
    },
    [
      card.id,
      config.threshold,
      config.snapBackDuration,
      dragStartTime,
      onSwipe,
      onSwipeDirection,
      x,
      y,
    ]
  );

  // Native ads overlay removed; Capacitor AdMob handles ad rendering separately

  const renderStars = (rating: number) => {
    if (!rating || isNaN(rating)) return null;
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const renderPriceRange = (priceRange: string) => {
    if (!priceRange) return null;
    return priceRange
      .split("")
      .map((_, i) => <DollarSign key={i} className="w-3 h-3 text-green-500" />);
  };

  const MainContentOverlay = () => {
    const CardNameAndRating = () => {
      return (
        <div className="flex-1">
          <h2 className="text-3xl font-bold mb-2">{card.title}</h2>
          {card.rating && (
            <div className="flex items-center gap-2 mb-2">
              {renderStars(card.rating)}
              <span className="text-sm text-gray-600">({card.rating})</span>
            </div>
          )}
        </div>
      );
    };

    const ExpandButton = () => {
      return (
        <button
          onClick={() => {
            if (!isExpanded) {
              shouldAnimateRef.current = true;
              handleOnExpand(card.id);
            } else {
              shouldAnimateRef.current = false;
            }
            setIsExpanded(!isExpanded);
          }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 p-3 rounded-2xl transition-all duration-300 ml-4 flex-shrink-0 shadow-lg hover:shadow-xl hover:scale-105"
          aria-label={isExpanded ? "Close details" : "View details"}
        >
          <ChevronUp
            className={`w-5 h-5 text-white transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      );
    };

    const ResturantDetails = () => {
      return (
        <div className="space-y-2">
          {card.distance && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-purple-500" />
              <span>{card.distance}</span>
            </div>
          )}
          {card.openingHours && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {card.openingHours !== "Closed" && (
                <Clock className="w-4 h-4 text-purple-500" />
              )}
              {card.openingHours !== "Closed" && (
                <span>{card.openingHours}</span>
              )}
              {card.isOpenNow !== undefined && (
                <span
                  className={`ml-2 px-2 py-0.5 rounded text-xs text-white font-medium ${
                    card.isOpenNow
                      ? "bg-green-500/90 shadow-lg"
                      : "bg-red-500/90 shadow-lg"
                  }`}
                  style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
                >
                  {card.isOpenNow ? "Open" : "Closed"}
                </span>
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md p-6 text-gray-800 border-t border-purple-200/50 shadow-lg">
        <div className="space-y-3">
          {/* Restaurant Name and Rating */}
          <div className="flex items-start justify-between">
            <CardNameAndRating />

            {/* Expand/Collapse button - Right aligned and bigger */}
            <ExpandButton />
          </div>

          {/* Restaurant Details */}
          {!(card as any).isSponsored && <ResturantDetails />}
        </div>
      </div>
    );
  };

  const DetailedContentContainer = () => {
    const Header = () => {
      return (
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white-600 to-pink-600 bg-clip-text text-transparent">
              {card.title}
            </h2>
            {card.cuisine && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                  {card.cuisine}
                </span>
                {card.priceRange && (
                  <div className="flex items-center">
                    {renderPriceRange(card.priceRange)}
                  </div>
                )}
              </div>
            )}
            {card.rating && (
              <div className="flex items-center gap-2">
                {renderStars(card.rating)}
                <span className="text-sm text-gray-600">({card.rating})</span>
              </div>
            )}
          </div>
          {/* Close button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              setIsExpanded(false);
            }}
            className="ml-4 p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            aria-label="Close details"
          >
            <ChevronUp className="w-5 h-5 text-white rotate-180" />
          </button>
        </div>
      );
    };

    const AddressSection = () => {
      return (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200/50">
          <MapPin className="w-5 h-5 text-purple-500" />
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">Address</p>
            <p className="font-medium text-gray-800">{card.address}</p>
          </div>
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="isolate"
          >
            <Button
              variant="outline"
              size="sm"
              className="bg-white hover:bg-purple-50 border-purple-200 text-purple-600 hover:text-purple-700"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                handleMapsClick(card?.address);
              }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              Open Maps
            </Button>
          </div>
        </div>
      );
    };

    const PhoneSection = () => {
      return (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200/50">
          <Phone className="w-5 h-5 text-blue-500" />
          <div className="flex-1">
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-medium text-gray-800">{card.phone}</p>
          </div>
          {(isIOS() || isAndroid()) && (
            <Button
              variant="outline"
              size="sm"
              className="bg-white hover:bg-blue-50 border-blue-200 text-blue-600 hover:text-blue-700"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                window.location.href = `tel:${card.phone}`;
              }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              Call
            </Button>
          )}
        </div>
      );
    };

    const WebsiteSection = () => {
      return (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200/50">
          <Globe className="w-5 h-5 text-green-500" />
          <div className="flex-1">
            <p className="text-sm text-gray-600">Website</p>
            <p className="font-medium text-gray-800"></p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-white hover:bg-green-50 border-green-200 text-green-600 hover:text-green-700"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              openUrl(card.website);
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            Open Website
          </Button>
        </div>
      );
    };

    const OpeningHoursSection = () => {
      return (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl border border-orange-200/50">
          <Clock className="w-5 h-5 text-orange-500" />
          <div>
            <p className="text-sm text-gray-600">Hours</p>
            <p className="font-medium text-gray-800">{card.openingHours}</p>
          </div>
        </div>
      );
    };

    const AdditionalInfoSection = () => {
      return (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4 text-white">About</h3>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200/50">
            <p className="text-gray-700 leading-relaxed">
              {card.placeDetails.editorialSummary.text}
            </p>
          </div>
        </div>
      );
    };

    const ReviewsSection = () => {
      return (
        <div>
          <h3 className="text-xl font-bold mb-4 text-white">
            Customer Reviews
          </h3>
          <div className="space-y-4">
            {card.reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {review.author.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-800">
                      {review.author}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center">
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-xs text-gray-500">
                        {review.relativeTime || review.date}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <motion.div
        className="absolute inset-0 bg-white/98 backdrop-blur-md border border-purple-200/50 shadow-2xl"
        initial={shouldAnimateRef.current ? { opacity: 0, scale: 0.95 } : false}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
          duration: shouldAnimateRef.current ? 0.3 : 0,
          ease: "easeOut",
        }}
        style={{ touchAction: "auto" }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onAnimationComplete={() => {
          shouldAnimateRef.current = false; // Disable animation after first render
        }}
      >
        <div
          className="h-full overflow-y-auto p-6 text-gray-800 scrollbar-thin scrollbar-thumb-purple-300/50 scrollbar-track-transparent"
          style={{ touchAction: "pan-y" }}
        >
          {/* Header */}
          <Header />

          {/* Contact Info */}
          <div className="space-y-4 mb-8">
            {card.address && <AddressSection />}
            {card.phone && <PhoneSection />}
            {card.website && <WebsiteSection />}
            {card.openingHours && <OpeningHoursSection />}
          </div>

          {/* Additional Info */}
          {card.placeDetails?.editorialSummary && <AdditionalInfoSection />}

          {/* Reviews Preview */}
          {card.reviews && card.reviews.length > 0 && <ReviewsSection />}
        </div>
      </motion.div>
    );
  };

  const MapsDialog = () => {
    return (
      <Dialog open={openMapDialog} onOpenChange={setOpenMapDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open in Maps</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Button
              className="w-full"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openMapsApp("google");
              }}
            >
              Google Maps
            </Button>
            {isIOS() && (
              <Button
                variant="outline"
                className="w-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openMapsApp("apple");
                }}
              >
                Apple Maps
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenMapDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <motion.div
      ref={cardRef}
      className="absolute inset-4 select-none md:desktop-centered-card"
      data-swipe-card="true"
      style={{
        x,
        y: 0, // Lock vertical movement
        rotate,
        ...(opacity && { opacity }), // Only add opacity for high-end devices
        zIndex: isTop ? 5 : 5 - index,
        // Minimal hardware acceleration - only for the main draggable element
        willChange: isTop ? "transform" : "auto",
        // Use transform3d only when actively dragging to reduce WebGL contexts
        transform: isTop && isDragging ? "translate3d(0,0,0)" : undefined,
      }}
      drag={isTop && !isExpanded ? "x" : false}
      dragConstraints={{ left: -200, right: 200, top: 0, bottom: 0 }}
      dragElastic={
        deviceInfo.isLowEndDevice ? 0.3 : deviceInfo.isAndroid ? 0.4 : 0.5
      } // Reduced elastic for better performance
      dragMomentum={false} // Disable momentum for more responsive feel
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }} // Optimized drag physics
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileDrag={
        deviceInfo.isLowEndDevice
          ? undefined // No scale animation on low-end devices
          : {
              scale: 1.01,
              transition: { duration: 0.05, ease: "linear" },
            }
      }
      // Optimized touch handlers for mobile devices
      onTouchStart={!isExpanded ? handleTouchStart : undefined}
      onTouchMove={!isExpanded ? handleTouchMove : undefined}
      onTouchEnd={!isExpanded ? handleTouchEnd : undefined}
      onClick={() => {
        // Desktop click support for sponsored cards
        if (!isDragging && (card as any).isSponsored) {
          onCardTap?.(card);
        }
      }}
      // Performance optimizations
      layout={false}
      layoutId={undefined}
      // Reduce animation complexity on low-end devices
      animate={performanceConfig.reducedAnimations ? false : undefined}
      // Use 2D transforms to reduce GPU load and WebGL contexts
      transformTemplate={({ x, y, rotate }) =>
        `translateX(${x}) translateY(${y}) rotate(${rotate})`
      }
    >
      {/* Card Container - Modern vibrant design with responsive styling */}
      <div
        className="relative w-full h-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-purple-200/30 ring-1 ring-purple-100/50
                   md:shadow-3xl md:border-purple-300/40 md:ring-2 md:ring-purple-200/30"
        style={{
          // Minimal styling - let parent handle GPU acceleration
          contain: "layout style",
        }}
      >
        {/* Background Image Section - Full height */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-gray-200"
          style={{
            backgroundImage: getCurrentImageUrl()
              ? `url(${getCurrentImageUrl()})`
              : "none",
            backgroundColor: getCurrentImageUrl() ? "transparent" : "#f3f4f6",
            // Optimize image rendering without GPU acceleration
            imageRendering: "auto" as const,
          }}
        >
          {!getCurrentImageUrl() && (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 text-center">
                <MapPin className="w-16 h-16 mx-auto mb-2" />
                <p className="text-sm">No image available</p>
              </div>
            </div>
          )}

          {/* Image Navigation Areas - Only show if multiple images and not expanded */}
          {card.images && card.images.length > 1 && !isExpanded && (
            <>
              {/* Left navigation area */}
              <div
                className="absolute left-0 top-0 w-1/3 h-full z-10 cursor-pointer"
                onClick={(e) => handleImageNavigation(e, "left")}
              />
              {/* Right navigation area */}
              <div
                className="absolute right-0 top-0 w-1/3 h-full z-10 cursor-pointer"
                onClick={(e) => handleImageNavigation(e, "right")}
              />
              {/* Image indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {card.images.map((_: string, index: number) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentImageIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        {/* Gradient Overlay - Simplified during drag for performance */}
        {/* Gradient overlay */}
        {
          <div
            className={`absolute inset-0 ${
              isPerformanceMode || deviceInfo.isLowEndDevice
                ? "bg-black/40"
                : "bg-gradient-to-t from-black/80 via-black/20 to-transparent"
            }`}
          />
        }
        {/* Info Badge: show "Sponsored" label for ads */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-6 py-3 rounded-2xl flex items-center gap-3 shadow-lg border border-white/50">
          <>
            <span className="text-gray-800 font-bold text-sm">
              {card.cuisine}
            </span>
            {card.priceRange && (
              <div className="flex items-center">
                {renderPriceRange(card.priceRange)}
              </div>
            )}
          </>
        </div>

        {/* Content Overlays with AnimatePresence */}
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <DetailedContentContainer key="detailed-content" />
          ) : (
            <MainContentOverlay key="main-content" />
          )}
        </AnimatePresence>
      </div>
      {openMapDialog && <MapsDialog />}
    </motion.div>
  );
}
