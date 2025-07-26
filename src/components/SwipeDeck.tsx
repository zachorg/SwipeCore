import { useState, useEffect } from 'react';
import { SwipeCard } from './SwipeCard';
import { SwipeCard as SwipeCardType, SwipeConfig, defaultSwipeConfig, SwipeDataProvider } from '@/lib/swipe-core';
import { SwipeControls } from './SwipeControls';

interface SwipeDeckProps {
  dataProvider: SwipeDataProvider;
  config?: Partial<SwipeConfig>;
  onSwipeAction?: (cardId: string, action: 'like' | 'pass' | 'super') => void;
  maxVisibleCards?: number;
  cards?: SwipeCardType[]; // Add cards prop for reactive updates
}

export function SwipeDeck({ 
  dataProvider, 
  config = {}, 
  onSwipeAction,
  maxVisibleCards = 3,
  cards: propCards
}: SwipeDeckProps) {
  const [cards, setCards] = useState<SwipeCardType[]>(propCards || []);
  const swipeConfig = { ...defaultSwipeConfig, ...config };

  useEffect(() => {
    // Use prop cards if provided, otherwise get from data provider
    if (propCards) {
      setCards(propCards);
    } else {
      setCards(dataProvider.getCards());
    }
  }, [dataProvider, propCards]);

  const handleSwipe = (cardId: string, action: 'like' | 'pass' | 'super') => {
    // Save action
    dataProvider.saveAction({
      cardId,
      action,
      timestamp: Date.now(),
    });

    // Remove card from stack
    dataProvider.removeCard(cardId);
    setCards(prev => prev.filter(card => card.id !== cardId));

    // Trigger callback
    onSwipeAction?.(cardId, action);
  };

  const handleControlAction = (action: 'like' | 'pass' | 'super') => {
    if (cards.length > 0) {
      handleSwipe(cards[0].id, action);
    }
  };

  const visibleCards = cards.slice(0, maxVisibleCards);

  if (cards.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">No more cards!</h2>
          <p className="text-muted-foreground">Check back later for more.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      {/* Card Stack */}
      <div className="relative h-full">
        {visibleCards.map((card, index) => (
          <SwipeCard
            key={card.id}
            card={card}
            onSwipe={handleSwipe}
            config={swipeConfig}
            isTop={index === 0}
            index={index}
          />
        ))}
      </div>

      {/* Swipe Controls */}
      <SwipeControls onAction={handleControlAction} />
    </div>
  );
}