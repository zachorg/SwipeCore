import { motion, PanInfo, useMotionValue, useTransform, animate } from 'framer-motion';
import { SwipeCard as SwipeCardType, SwipeConfig } from '@/lib/swipe-core';
import { Heart, X, Star, Clock, MapPin, DollarSign, ChevronUp, Phone, Globe } from 'lucide-react';
import { useState, useRef } from 'react';

interface SwipeCardProps {
  card: SwipeCardType;
  onSwipe: (cardId: string, direction: 'like' | 'pass' | 'super') => void;
  config: SwipeConfig;
  isTop: boolean;
  index: number;
  onCardTap?: (card: SwipeCardType) => void;
  onSwipeDirection?: (direction: 'like' | 'pass' | null) => void;
}

export function SwipeCard({ card, onSwipe, config, isTop, index, onCardTap, onSwipeDirection }: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  
  // Transform values for animations
  const rotate = useTransform(x, [-200, 200], [-config.maxRotation, config.maxRotation]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  // Like/pass indicators
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragStart = () => {
    setIsDragging(true);
    setDragStartTime(Date.now());
    setDragDistance(0);
    onSwipeDirection?.(null);
  };

  const handleDrag = (event: any, info: PanInfo) => {
    setDragDistance(Math.abs(info.offset.x) + Math.abs(info.offset.y));
    
    // Update swipe direction for button animations
    if (Math.abs(info.offset.x) > 20) {
      const direction = info.offset.x > 0 ? 'like' : 'pass';
      onSwipeDirection?.(direction);
    } else {
      onSwipeDirection?.(null);
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeDistance = Math.abs(info.offset.x);
    const swipeDirection = info.offset.x > 0 ? 'like' : 'pass';
    const dragDuration = Date.now() - dragStartTime;
    
    // Only trigger swipe if:
    // 1. Distance is greater than threshold
    // 2. Horizontal movement is dominant (ratio > 0.6)
    // 3. Drag duration is reasonable (not too fast, not too slow)
    const horizontalRatio = swipeDistance / (Math.abs(info.offset.x) + Math.abs(info.offset.y));
    
    if (swipeDistance > config.threshold && 
        horizontalRatio > 0.6 && 
        dragDuration > 100 && 
        dragDuration < 2000) {
      onSwipe(card.id, swipeDirection);
    } else {
      // Animate card back to center if swipe doesn't meet threshold
      animate(x, 0, { 
        duration: config.snapBackDuration, 
        ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth snap back
      });
      animate(y, 0, { 
        duration: config.snapBackDuration, 
        ease: [0.25, 0.46, 0.45, 0.94]
      });
    }
    
    // Reset drag state after a short delay to prevent tap trigger
    setTimeout(() => {
      setIsDragging(false);
      setDragDistance(0);
      onSwipeDirection?.(null);
    }, 100);
  };

  const handleCardTap = () => {
    // Only trigger tap if not dragging and minimal movement
    if (!isDragging && dragDistance < 5) {
      // Toggle expanded state instead of calling onCardTap
      setIsExpanded(!isExpanded);
    }
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = event.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const deltaTime = Date.now() - touchStartRef.current.time;
    
    // If it's a quick tap with minimal movement, toggle expanded state
    if (deltaX < 5 && deltaY < 5 && deltaTime < 300 && !isDragging) {
      setIsExpanded(!isExpanded);
    }
    
    touchStartRef.current = null;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const renderPriceRange = (priceRange: string) => {
    return priceRange.split('').map((_, i) => (
      <DollarSign key={i} className="w-3 h-3 text-green-500" />
    ));
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
      dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
      dragElastic={0.1}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05 }}
      animate={{
        scale: isTop ? 1 : 0.95 - index * 0.05,
        y: index * -10,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Card Container */}
      <div 
        className="relative w-full h-full bg-card rounded-2xl overflow-hidden shadow-2xl border border-border/20 cursor-pointer"
        onClick={handleCardTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${card.imageUrl})` }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Like Indicator */}
        <motion.div 
          className="absolute top-8 right-8 bg-green-500/90 px-4 py-2 rounded-full flex items-center gap-2"
          style={{ opacity: likeOpacity }}
        >
          <Heart className="w-5 h-5 text-white" fill="currentColor" />
          <span className="text-white font-bold">WANT TO TRY</span>
        </motion.div>
        
        {/* Pass Indicator */}
        <motion.div 
          className="absolute top-8 left-8 bg-red-500/90 px-4 py-2 rounded-full flex items-center gap-2"
          style={{ opacity: passOpacity }}
        >
          <X className="w-5 h-5 text-white" />
          <span className="text-white font-bold">PASS</span>
        </motion.div>
        
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
                    <span className="text-sm text-white/80">({card.rating})</span>
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
              {card.deliveryTime && (
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Clock className="w-4 h-4" />
                  <span>{card.deliveryTime}</span>
                </div>
              )}
            </div>
            
            {/* Tap to expand indicator */}
            <div className="flex items-center justify-center pt-2">
              <div className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
                <ChevronUp className={`w-4 h-4 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                <span className="text-sm text-white">{isExpanded ? 'Tap to close' : 'Tap for details'}</span>
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
                      <span className="text-sm bg-white/20 px-2 py-1 rounded">{card.cuisine}</span>
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
                      <span className="text-sm text-white/80">({card.rating})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                {card.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-white/60" />
                    <span>{card.address}</span>
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

              {/* Menu Preview */}
              {card.menu && card.menu.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Menu Items</h3>
                  <div className="space-y-2">
                    {card.menu.map((item) => (
                      <div key={item.id} className="flex justify-between items-center bg-white/10 p-3 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          {item.description && (
                            <p className="text-sm text-white/70">{item.description}</p>
                          )}
                          <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded mt-1 inline-block">
                            {item.category}
                          </span>
                        </div>
                        <span className="font-semibold ml-3">${item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Preview */}
              {card.reviews && card.reviews.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Customer Reviews</h3>
                  <div className="space-y-3">
                    {card.reviews.map((review) => (
                      <div key={review.id} className="bg-white/10 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{review.author}</span>
                          <div className="flex items-center">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-xs text-white/50 ml-auto">{review.date}</span>
                        </div>
                        <p className="text-sm text-white/80">{review.comment}</p>
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
    </motion.div>
  );
}