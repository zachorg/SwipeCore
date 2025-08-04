import { SwipeDeck } from '@/components/SwipeDeck';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { RestaurantCard } from '@/types/places';

const Index = () => {
  const navigate = useNavigate();
  const [swipeStats, setSwipeStats] = useState({ likes: 0, passes: 0});

  const handleSwipeAction = (cardId: string, action: 'like' | 'pass') => {
    console.log(`Swiped ${action} on restaurant:`, cardId);
    
    // Update stats
    setSwipeStats(prev => ({
      ...prev,
      [action === 'like' ? 'likes' : 'passes']: 
        prev[action === 'like' ? 'likes' : 'passes'] + 1
    }));
  };

  const handleCardTap = (card: RestaurantCard) => {
    console.log('Tapped on restaurant:', card.title);
    // Navigate to restaurant detail page
    navigate(`/restaurant/${card.id}`);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">🍕</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">FoodSwipe</h1>
        </div>
      </div>

      {/* Swipe Deck with Live Data */}
      <SwipeDeck 
        onSwipeAction={handleSwipeAction}
        onCardTap={handleCardTap}
        swipeOptions={{
          searchConfig: {
            radius: 5000, // 5km radius
            type: 'restaurant',
            minRating: 3.0,
          },
          autoStart: true,
          maxCards: 20,
          prefetchDetails: true,
        }}
      />
      
      {/* Debug Stats */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs">
          👍 {swipeStats.likes} | 👎 {swipeStats.passes}
        </div>
      )}
    </div>
  );
};

export default Index;
