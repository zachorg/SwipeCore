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
  onCardTap?: (card: SwipeCardType) => void; // Add onCardTap prop
}

export function SwipeDeck({ 
  dataProvider, 
  config = {}, 
  onSwipeAction,
  maxVisibleCards = 3,
  cards: propCards,
  onCardTap
}: SwipeDeckProps) {
  const [cards, setCards] = useState<SwipeCardType[]>(propCards || []);
  const [swipeDirection, setSwipeDirection] = useState<'like' | 'pass' | null>(null);
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

  const handleCardTap = (card: SwipeCardType) => {
    onCardTap?.(card);
  };

  const handleSwipeDirection = (direction: 'like' | 'pass' | null) => {
    setSwipeDirection(direction);
  };

  const visibleCards = cards.slice(0, maxVisibleCards);

  if (cards.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">No more restaurants!</h2>
          <p className="text-muted-foreground">Check back later for more options.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      {/* Card Stack */}
      <div className="relative h-full pb-32">
        {visibleCards.map((card, index) => (
          <SwipeCard
            key={card.id}
            card={card}
            onSwipe={handleSwipe}
            config={swipeConfig}
            isTop={index === 0}
            index={index}
            onCardTap={handleCardTap}
            onSwipeDirection={handleSwipeDirection}
          />
        ))}
      </div>

      {/* Swipe Controls */}
      <SwipeControls onAction={handleControlAction} swipeDirection={swipeDirection} />
    </div>
  );
}