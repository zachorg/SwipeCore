import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { SwipeCard as SwipeCardType, SwipeConfig } from '@/lib/swipe-core';
import { Heart, X, Star } from 'lucide-react';

interface SwipeCardProps {
  card: SwipeCardType;
  onSwipe: (cardId: string, direction: 'like' | 'pass' | 'super') => void;
  config: SwipeConfig;
  isTop: boolean;
  index: number;
}

export function SwipeCard({ card, onSwipe, config, isTop, index }: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Transform values for animations
  const rotate = useTransform(x, [-200, 200], [-config.maxRotation, config.maxRotation]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  // Like/pass indicators
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeDistance = Math.abs(info.offset.x);
    const swipeDirection = info.offset.x > 0 ? 'like' : 'pass';
    
    if (swipeDistance > config.threshold) {
      onSwipe(card.id, swipeDirection);
    }
  };

  return (
    <motion.div
      className="absolute inset-4 select-none"
      style={{
        x,
        y,
        rotate,
        opacity,
        zIndex: isTop ? 10 : 10 - index,
      }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05 }}
      animate={{
        scale: isTop ? 1 : 0.95 - index * 0.05,
        y: index * -10,
      }}
    >
      {/* Card Container */}
      <div className="relative w-full h-full bg-card rounded-2xl overflow-hidden shadow-2xl border border-border/20">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${card.imageUrl})` }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        
        {/* Like Indicator */}
        <motion.div 
          className="absolute top-8 right-8 bg-accent/90 px-4 py-2 rounded-full flex items-center gap-2"
          style={{ opacity: likeOpacity }}
        >
          <Heart className="w-5 h-5 text-accent-foreground" fill="currentColor" />
          <span className="text-accent-foreground font-bold">LIKE</span>
        </motion.div>
        
        {/* Pass Indicator */}
        <motion.div 
          className="absolute top-8 left-8 bg-destructive/90 px-4 py-2 rounded-full flex items-center gap-2"
          style={{ opacity: passOpacity }}
        >
          <X className="w-5 h-5 text-destructive-foreground" />
          <span className="text-destructive-foreground font-bold">PASS</span>
        </motion.div>
        
        {/* Card Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-1">
                {card.title}
                {card.age && <span className="text-2xl font-normal ml-2">{card.age}</span>}
              </h2>
              {card.subtitle && (
                <p className="text-lg text-white/80 mb-2">{card.subtitle}</p>
              )}
              {card.distance && (
                <p className="text-sm text-white/60">{card.distance}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}