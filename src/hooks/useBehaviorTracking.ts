import { useEffect, useCallback, useState } from 'react';
import { RestaurantCard, SwipeAction } from '@/types/Types';
import { UserBehaviorMetrics, CurrentSessionMetrics, PredictiveSignals } from '@/types/prefetching';
import { behaviorTracker } from '@/services/behaviorTracker';

export interface UseBehaviorTrackingOptions {
  enabled?: boolean;
  autoTrackCardViews?: boolean;
  autoTrackSwipes?: boolean;
}

export interface UseBehaviorTrackingReturn {
  // Current state
  metrics: UserBehaviorMetrics;
  currentSession: CurrentSessionMetrics;
  predictiveSignals: PredictiveSignals;
  
  // Tracking methods
  trackCardView: (card: RestaurantCard, viewDuration: number) => void;
  trackSwipeAction: (action: SwipeAction) => void;
  trackDetailView: (cardId: string) => void;
  trackPhotoInteraction: (cardId: string) => void;
  
  // Session management
  endSession: () => void;
  
  // Utilities
  isSessionActive: boolean;
  sessionDuration: number;
}

export function useBehaviorTracking(options: UseBehaviorTrackingOptions = {}): UseBehaviorTrackingReturn {
  const {
    enabled = true,
    autoTrackCardViews = true,
    autoTrackSwipes = true
  } = options;
  
  const [metrics, setMetrics] = useState<UserBehaviorMetrics>(behaviorTracker.getMetrics());
  const [currentSession, setCurrentSession] = useState<CurrentSessionMetrics>(behaviorTracker.getCurrentSession());
  const [predictiveSignals, setPredictiveSignals] = useState<PredictiveSignals>(behaviorTracker.getPredictiveSignals());
  
  // Update state when behavior tracker emits events
  useEffect(() => {
    if (!enabled) return;
    
    const handleBehaviorEvent = (event: string, data: any) => {
      setMetrics(behaviorTracker.getMetrics());
      setCurrentSession(behaviorTracker.getCurrentSession());
      setPredictiveSignals(behaviorTracker.getPredictiveSignals());
    };
    
    behaviorTracker.addEventListener(handleBehaviorEvent);
    
    return () => {
      behaviorTracker.removeEventListener(handleBehaviorEvent);
    };
  }, [enabled]);
  
  // Periodic updates for predictive signals
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(() => {
      setPredictiveSignals(behaviorTracker.getPredictiveSignals());
      setCurrentSession(behaviorTracker.getCurrentSession());
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [enabled]);
  
  const trackCardView = useCallback((card: RestaurantCard, viewDuration: number) => {
    if (!enabled) return;
    behaviorTracker.trackCardView(card, viewDuration);
  }, [enabled]);
  
  const trackSwipeAction = useCallback((action: SwipeAction) => {
    if (!enabled) return;
    behaviorTracker.trackSwipeAction(action);
  }, [enabled]);
  
  const trackDetailView = useCallback((cardId: string) => {
    if (!enabled) return;
    behaviorTracker.trackDetailView(cardId);
  }, [enabled]);
  
  const trackPhotoInteraction = useCallback((cardId: string) => {
    if (!enabled) return;
    behaviorTracker.trackPhotoInteraction(cardId);
  }, [enabled]);
  
  const endSession = useCallback(() => {
    if (!enabled) return;
    behaviorTracker.endSession();
  }, [enabled]);
  
  // Computed values
  const isSessionActive = currentSession.cardsViewed > 0;
  const sessionDuration = (Date.now() - currentSession.startTime) / 1000 / 60; // minutes
  
  return {
    metrics,
    currentSession,
    predictiveSignals,
    trackCardView,
    trackSwipeAction,
    trackDetailView,
    trackPhotoInteraction,
    endSession,
    isSessionActive,
    sessionDuration
  };
}