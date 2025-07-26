import { SwipeDeck } from '@/components/SwipeDeck';
import { useSwipeDeck } from '@/hooks/useSwipeDeck';
import { generateMockCards } from '@/lib/swipe-core';
import { useEffect } from 'react';

const Index = () => {
  const { dataProvider, cards, handleSwipeAction, getStats, addCards } = useSwipeDeck();

  useEffect(() => {
    // Load initial mock cards
    const mockCards = generateMockCards(20);
    addCards(mockCards);
    console.log('Loaded', mockCards.length, 'mock cards');
    console.log('Cards state:', cards.length);
  }, [addCards]);

  // Debug log when cards change
  useEffect(() => {
    console.log('Cards updated:', cards.length, 'cards available');
  }, [cards]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">S</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">SwipeApp</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          {getStats().total} swipes
        </div>
      </div>

      {/* Swipe Deck */}
      <SwipeDeck 
        dataProvider={dataProvider}
        onSwipeAction={handleSwipeAction}
        cards={cards}
      />
    </div>
  );
};

export default Index;
