import { useState, useCallback, useMemo } from 'react';
import { SwipeDataProvider, SwipeCard, SwipeAction } from '@/lib/swipe-core';

export function useSwipeDeck(initialCards: SwipeCard[] = []) {
  const [cards, setCards] = useState<SwipeCard[]>(initialCards);
  const [actionHistory, setActionHistory] = useState<SwipeAction[]>([]);
  
  // Create data provider with reactive updates
  const dataProvider = useMemo(() => {
    const provider = new SwipeDataProvider(cards);
    // Override methods to trigger state updates
    const originalAddCards = provider.addCards.bind(provider);
    const originalRemoveCard = provider.removeCard.bind(provider);
    
    provider.addCards = (newCards: SwipeCard[]) => {
      originalAddCards(newCards);
      setCards(provider.getCards());
    };
    
    provider.removeCard = (cardId: string) => {
      originalRemoveCard(cardId);
      setCards(provider.getCards());
    };
    
    return provider;
  }, []);

  const handleSwipeAction = useCallback((cardId: string, action: 'like' | 'pass') => {
    const swipeAction: SwipeAction = {
      cardId,
      action,
      timestamp: Date.now(),
    };
    
    setActionHistory(prev => [...prev, swipeAction]);
  }, []);

  const undoLastAction = useCallback(() => {
    // This would require more complex state management to properly undo
    // For now, just remove from history
    setActionHistory(prev => prev.slice(0, -1));
  }, []);

  const addCards = useCallback((newCards: SwipeCard[]) => {
    dataProvider.addCards(newCards);
  }, [dataProvider]);

  const getStats = useCallback(() => {
    const likes = actionHistory.filter(a => a.action === 'like').length;
    const passes = actionHistory.filter(a => a.action === 'pass').length;
    
    return { likes, passes, total: actionHistory.length };
  }, [actionHistory]);

  return {
    dataProvider,
    cards,
    actionHistory,
    handleSwipeAction,
    undoLastAction,
    addCards,
    getStats,
  };
}