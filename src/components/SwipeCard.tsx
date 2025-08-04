import {
  motion,
  PanInfo,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { RestaurantCard, SwipeConfig } from "@/types/places";
import {
  Heart,
  X,
  Star,
  Clock,
  MapPin,
  DollarSign,
  ChevronUp,
  Phone,
  Globe,
} from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface SwipeCardProps {
  card: RestaurantCard;
  onSwipe: (cardId: string, direction: "like" | "pass") => void;
  config: SwipeConfig;
  isTop: boolean;
  index: number;
  onCardTap?: (card: RestaurantCard) => void;
  onSwipeDirection?: (direction: "like" | "pass" | null) => void;
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

const DRAG_START_THRESHOLD = 12; // px, movement to become a drag not a tap

export function SwipeCard({
  card,
  onSwipe,
  config,
  isTop,
  index,
  onCardTap,
  onSwipeDirection,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const dragMovedRef = useRef(false); // <--- NEW: track if movement exceeded drag threshold
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null
  );

  const [openMapDialog, setOpenMapDialog] = useState(false);
  const [openMapDialogAddress, setOpenMapDialogAddress] = useState("");
  const [selectedMap, setSelectedMap] = useState<"google" | "apple">("google");

  const handleMapsClick = (resturantAddress: string) => {
    setOpenMapDialogAddress(resturantAddress);
    setOpenMapDialog(true);
  };

  const openMapsApp = (provider: "google" | "apple") => {
    const encoded = encodeURIComponent(openMapDialogAddress);
    let url: string;
    if (provider === "google") {
      url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    } else {
      url = `http://maps.apple.com/?daddr=${encoded}`;
    }
    // Exit the app and open the maps provider
    window.location.href = url;
  };

  // Transform values for animations
  const rotate = useTransform(
    x,
    [-200, 200],
    [-config.maxRotation, config.maxRotation]
  );
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  // Like/pass indicators
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);

  // NEW: replaced handleDragStart, handleDrag to be more robust for mobile
  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    dragMovedRef.current = false;
    setIsDragging(false);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    if (
      !dragMovedRef.current &&
      (deltaX > DRAG_START_THRESHOLD || deltaY > DRAG_START_THRESHOLD)
    ) {
      // Drag just started
      dragMovedRef.current = true;
      setIsDragging(true); // if you want some UI change
      // Let Framer Motion take over drag (via drag prop)
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = event.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Only consider as a tap if not dragging and finger didn't move much
    if (!dragMovedRef.current && deltaX < 7 && deltaY < 7 && deltaTime < 350) {
      setIsExpanded((value) => !value);
    }
    touchStartRef.current = null;
    dragMovedRef.current = false;
    setIsDragging(false);
  };

  // Framer drag: only activate after drag threshold is exceeded
  const handleDragStart = () => {
    setDragStartTime(Date.now());
    setIsDragging(true);
    onSwipeDirection?.(null);
  };
  const handleDrag = (event: any, info: PanInfo) => {
    // Don't need to handle tap/drag here any more!
    if (Math.abs(info.offset.x) > 20) {
      const direction = info.offset.x > 0 ? "like" : "pass";
      onSwipeDirection?.(direction);
    } else {
      onSwipeDirection?.(null);
    }
  };
  // ...handleDragEnd stays the same...

  // onClick should only work for mouse
  const handleCardTap = (event: React.MouseEvent) => {
    // Only trigger on desktop (no touch points), and if not dragging
    if ((window.navigator.maxTouchPoints || 0) === 0 && !isDragging) {
      setIsExpanded((value) => !value);
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeDistance = Math.abs(info.offset.x);
    const swipeDirection = info.offset.x > 0 ? "like" : "pass";
    const dragDuration = Date.now() - dragStartTime;

    // Only trigger swipe if:
    // 1. Distance is greater than threshold
    // 2. Horizontal movement is dominant (ratio > 0.6)
    // 3. Drag duration is reasonable (not too fast, not too slow)
    const horizontalRatio =
      swipeDistance / (Math.abs(info.offset.x) + Math.abs(info.offset.y));

    if (
      swipeDistance > config.threshold &&
      horizontalRatio > 0.6 &&
      dragDuration > 100 &&
      dragDuration < 2000
    ) {
      onSwipe(card.id, swipeDirection);
    } else {
      // Animate card back to center if swipe doesn't meet threshold
      animate(x, 0, {
        duration: config.snapBackDuration,
        ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for smooth snap back
      });
      animate(y, 0, {
        duration: config.snapBackDuration,
        ease: [0.25, 0.46, 0.45, 0.94],
      });
    }

    // Reset drag state after a short delay to prevent tap trigger
    setTimeout(() => {
      setIsDragging(false);
      setDragDistance(0);
      onSwipeDirection?.(null);
    }, 100);
  };

  const renderStars = (rating: number) => {
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
    return priceRange
      .split("")
      .map((_, i) => <DollarSign key={i} className="w-3 h-3 text-green-500" />);
  };

  return (
    <motion.div
      className="absolute inset-4 select-none"
      style={{
        x,
        y,
        rotate,
        opacity,
        zIndex: isTop ? 5 : 5 - index,
      }}
      drag={isTop && !isExpanded}
      dragConstraints={{ left: -200, right: 200, top: -50, bottom: 50 }}
      dragElastic={0.1}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05 }}
      // touch handlers for mobile, must be on outermost div for Framer Motion drag to work
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Card Container */}
      <div
        className="relative w-full h-full bg-card rounded-2xl overflow-hidden shadow-2xl border border-border/20 cursor-pointer"
        onClick={handleCardTap}
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-gray-200"
          style={{ 
            backgroundImage: card.imageUrl ? `url(${card.imageUrl})` : 'none',
            backgroundColor: card.imageUrl ? 'transparent' : '#f3f4f6'
          }}
        >
          {!card.imageUrl && (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 text-center">
                <MapPin className="w-16 h-16 mx-auto mb-2" />
                <p className="text-sm">No image available</p>
              </div>
            </div>
          )}
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        {/* Restaurant Info Badge */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full flex items-center gap-2">
          <span className="text-white font-semibold">{card.cuisine}</span>
          {card.priceRange && (
            <div className="flex items-center">
              {renderPriceRange(card.priceRange)}
            </div>
          )}
        </div>
        {/* Card Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="space-y-3">
            {/* Restaurant Name and Rating */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{card.title}</h2>
                {card.rating && (
                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(card.rating)}
                    <span className="text-sm text-white/80">
                      ({card.rating})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Restaurant Details */}
            <div className="space-y-2">
              {card.distance && (
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <MapPin className="w-4 h-4" />
                  <span>{card.distance}</span>
                </div>
              )}
              {card.openingHours && (
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Clock className="w-4 h-4" />
                  <span>{card.openingHours}</span>
                  {card.isOpenNow !== undefined && (
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                      card.isOpenNow ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
                    }`}>
                      {card.isOpenNow ? 'Open' : 'Closed'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tap to expand indicator */}
            <div className="flex items-center justify-center pt-2">
              <div className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
                <ChevronUp
                  className={`w-4 h-4 text-white transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
                <span className="text-sm text-white">
                  {isExpanded ? "Tap to close" : "Tap for details"}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Expanded Content Overlay */}
        {isExpanded && (
          <motion.div
            className="absolute inset-0 bg-black/95 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="h-full overflow-y-auto p-6 text-white scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{card.title}</h2>
                  {card.cuisine && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm bg-white/20 px-2 py-1 rounded">
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
                      <span className="text-sm text-white/80">
                        ({card.rating})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                {card.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium"
                        onClick={() => {
                          handleMapsClick(card?.address);
                        }}
                      >
                        Open in Maps
                      </Button>
                    </div>
                  </div>
                )}

                {card.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-white/60" />
                    <span>{card.phone}</span>
                  </div>
                )}
                {card.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-white/60" />
                    <span>{card.website}</span>
                  </div>
                )}
                {card.openingHours && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-white/60" />
                    <span>{card.openingHours}</span>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              {card.placeDetails?.editorialSummary && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">About</h3>
                  <div className="bg-white/10 p-3 rounded-lg">
                    <p className="text-sm text-white/80">
                      {card.placeDetails.editorialSummary.text}
                    </p>
                  </div>
                </div>
              )}

              {/* Reviews Preview */}
              {card.reviews && card.reviews.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Customer Reviews
                  </h3>
                  <div className="space-y-3">
                    {card.reviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-white/10 p-3 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{review.author}</span>
                          <div className="flex items-center">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-xs text-white/50 ml-auto">
                            {review.relativeTime || review.date}
                          </span>
                        </div>
                        <p className="text-sm text-white/80">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scroll indicator */}
              <div className="flex justify-center mt-4 pb-2">
                <div className="bg-white/20 px-3 py-1 rounded-full text-xs text-white/70">
                  Scroll for more details
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      <Dialog open={openMapDialog} onOpenChange={setOpenMapDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open in Maps</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Button className="w-full" onClick={() => openMapsApp("google")}>
              Google Maps
            </Button>
            {isIOS() && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => openMapsApp("apple")}
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
    </motion.div>
  );
}
