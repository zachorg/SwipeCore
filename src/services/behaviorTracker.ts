import { UserBehaviorMetrics, CurrentSessionMetrics, PredictiveSignals } from '@/types/prefetching';
import { RestaurantCard, SwipeAction } from '@/types/Types';
import { CrossPlatformStorage } from '@/utils/crossPlatformStorage';

export class BehaviorTracker {
  private static readonly STORAGE_KEY = 'NomNom_behavior_metrics';
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  private metrics: UserBehaviorMetrics;
  private currentSession: CurrentSessionMetrics;
  private eventListeners: Array<(event: string, data: any) => void> = [];

  constructor() {
    this.metrics = this.getDefaultMetrics();
    this.currentSession = this.initializeSession();
    this.initializeMetrics();
    this.setupEventListeners();
  }

  // Initialize metrics asynchronously
  private async initializeMetrics(): Promise<void> {
    try {
      const stored = await CrossPlatformStorage.getItem(BehaviorTracker.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate and migrate if necessary
        this.metrics = this.validateAndMigrateMetrics(parsed);
      }
    } catch (error) {
      console.warn('Failed to load behavior metrics:', error);
      // Keep default metrics if loading fails
    }
  }

  private getDefaultMetrics(): UserBehaviorMetrics {
    return {
      averageSwipeSpeed: 0,
      averageViewTime: 0,
      swipeRatio: { like: 0, pass: 0 },
      sessionDuration: 0,
      cardsPerSession: 0,
      timeOfDayPatterns: {},
      detailViewRate: 0,
      photoInteractionRate: 0,
      filterUsageFrequency: 0,
      slowDownThreshold: 10, // cards per minute
      exhaustionSignals: [],
      totalSessions: 0,
      totalCardsViewed: 0,
      lastUpdated: Date.now()
    };
  }

  private initializeSession(): CurrentSessionMetrics {
    return {
      startTime: Date.now(),
      cardsViewed: 0,
      currentSwipeSpeed: 0,
      recentViewTimes: [],
      engagementLevel: 'medium',
      lastInteractionTime: Date.now()
    };
  }

  // Track card view event
  trackCardView(card: RestaurantCard, viewDuration: number): void {
    this.currentSession.cardsViewed++;
    this.currentSession.lastInteractionTime = Date.now();

    // Update recent view times (sliding window)
    this.currentSession.recentViewTimes.push(viewDuration);
    if (this.currentSession.recentViewTimes.length > 5) {
      this.currentSession.recentViewTimes.shift();
    }

    // Calculate current swipe speed
    this.updateSwipeSpeed();

    // Update engagement level
    this.updateEngagementLevel();

    // Emit event
    this.emit('card_viewed', { card, viewDuration, session: this.currentSession });
  }

  // Track swipe action
  trackSwipeAction(action: SwipeAction): void {
    this.currentSession.lastInteractionTime = Date.now();

    // Update historical swipe ratios
    this.updateSwipeRatios(action.action);

    // Emit event
    this.emit('swipe_action', { action, session: this.currentSession });
  }

  // Track detail view
  trackDetailView(cardId: string): void {
    this.currentSession.lastInteractionTime = Date.now();

    // Update detail view rate
    this.updateDetailViewRate();

    // Emit event
    this.emit('detail_viewed', { cardId, session: this.currentSession });
  }

  // Track photo interaction
  trackPhotoInteraction(cardId: string): void {
    this.currentSession.lastInteractionTime = Date.now();

    // Update photo interaction rate
    this.updatePhotoInteractionRate();

    // Emit event
    this.emit('photo_interaction', { cardId, session: this.currentSession });
  }

  // Get current predictive signals
  getPredictiveSignals(): PredictiveSignals {
    const sessionDuration = Date.now() - this.currentSession.startTime;
    const timeSinceLastInteraction = Date.now() - this.currentSession.lastInteractionTime;

    // Detect if user is slowing down
    const isSlowingDown = this.detectSlowdown();

    // Predict if session is likely to end soon
    const likelyToEndSoon = this.predictSessionEnd(sessionDuration, timeSinceLastInteraction);

    // Calculate engagement trend
    const engagementTrend = this.calculateEngagementTrend();

    // Calculate probability of viewing next card
    const nextCardProbability = this.calculateNextCardProbability();

    // Calculate confidence in predictions
    const confidenceLevel = this.calculatePredictionConfidence();

    return {
      isSlowingDown,
      likelyToEndSoon,
      engagementTrend,
      nextCardProbability,
      confidenceLevel
    };
  }

  // Get current user behavior metrics
  getMetrics(): UserBehaviorMetrics {
    return { ...this.metrics };
  }

  // Get current session metrics
  getCurrentSession(): CurrentSessionMetrics {
    return { ...this.currentSession };
  }

  // End current session and update historical metrics
  endSession(): void {
    const sessionDuration = (Date.now() - this.currentSession.startTime) / 1000 / 60; // minutes

    // Update historical metrics
    this.updateHistoricalMetrics(sessionDuration);

    // Save metrics
    this.saveMetrics();

    // Reset session
    this.currentSession = this.initializeSession();

    // Emit event
    this.emit('session_ended', { duration: sessionDuration, metrics: this.metrics });
  }

  // Private helper methods
  private updateSwipeSpeed(): void {
    const sessionDuration = (Date.now() - this.currentSession.startTime) / 1000 / 60; // minutes
    if (sessionDuration > 0) {
      this.currentSession.currentSwipeSpeed = this.currentSession.cardsViewed / sessionDuration;
    }

    this.metrics.averageSwipeSpeed = this.currentSession.currentSwipeSpeed;
  }

  private updateEngagementLevel(): void {
    const avgViewTime = this.currentSession.recentViewTimes.length > 0
      ? this.currentSession.recentViewTimes.reduce((a, b) => a + b, 0) / this.currentSession.recentViewTimes.length
      : 0;

    if (avgViewTime > 10) {
      this.currentSession.engagementLevel = 'high';
    } else if (avgViewTime > 5) {
      this.currentSession.engagementLevel = 'medium';
    } else {
      this.currentSession.engagementLevel = 'low';
    }

    this.metrics.averageViewTime = avgViewTime;
  }

  private updateSwipeRatios(action: 'menu' | 'pass'): void {
    // Simple implementation - would be more sophisticated in production
    const totalSwipes = this.metrics.totalCardsViewed;
    if (totalSwipes > 0) {
      if (action === 'menu') {
        this.metrics.swipeRatio.like = (this.metrics.swipeRatio.like * totalSwipes + 1) / (totalSwipes + 1);
        this.metrics.swipeRatio.pass = (this.metrics.swipeRatio.pass * totalSwipes) / (totalSwipes + 1);
      } else {
        this.metrics.swipeRatio.pass = (this.metrics.swipeRatio.pass * totalSwipes + 1) / (totalSwipes + 1);
        this.metrics.swipeRatio.like = (this.metrics.swipeRatio.like * totalSwipes) / (totalSwipes + 1);
      }
    } else {
      this.metrics.swipeRatio.like = action === 'menu' ? 1 : 0;
      this.metrics.swipeRatio.pass = action === 'pass' ? 1 : 0;
    }
  }

  private updateDetailViewRate(): void {
    // Increment detail view counter (simplified implementation)
    const currentRate = this.metrics.detailViewRate;
    const totalViews = this.metrics.totalCardsViewed;
    if (totalViews > 0) {
      this.metrics.detailViewRate = (currentRate * totalViews + 1) / (totalViews + 1);
    } else {
      this.metrics.detailViewRate = 1;
    }
  }

  private updatePhotoInteractionRate(): void {
    // Increment photo interaction counter (simplified implementation)
    const currentRate = this.metrics.photoInteractionRate;
    const totalViews = this.metrics.totalCardsViewed;
    if (totalViews > 0) {
      this.metrics.photoInteractionRate = (currentRate * totalViews + 1) / (totalViews + 1);
    } else {
      this.metrics.photoInteractionRate = 1;
    }
  }

  private detectSlowdown(): boolean {
    if (this.currentSession.recentViewTimes.length < 3) return false;

    const recent = this.currentSession.recentViewTimes.slice(-3);
    const earlier = this.currentSession.recentViewTimes.slice(0, -3);

    if (earlier.length === 0) return false;

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

    return recentAvg > earlierAvg * 1.5; // 50% increase in view time indicates slowdown
  }

  private predictSessionEnd(sessionDuration: number, timeSinceLastInteraction: number): boolean {
    // Session likely to end if:
    // 1. No interaction for more than 2 minutes
    // 2. Session duration exceeds typical session length by 50%
    // 3. User is showing exhaustion signals

    const noRecentInteraction = timeSinceLastInteraction > 2 * 60 * 1000; // 2 minutes
    const exceedsTypicalDuration = this.metrics.sessionDuration > 0 &&
      sessionDuration > this.metrics.sessionDuration * 1.5;

    return noRecentInteraction || exceedsTypicalDuration;
  }

  private calculateEngagementTrend(): 'increasing' | 'stable' | 'decreasing' {
    if (this.currentSession.recentViewTimes.length < 4) return 'stable';

    const firstHalf = this.currentSession.recentViewTimes.slice(0, 2);
    const secondHalf = this.currentSession.recentViewTimes.slice(-2);

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const threshold = 0.2; // 20% change threshold

    if (secondAvg > firstAvg * (1 + threshold)) return 'increasing';
    if (secondAvg < firstAvg * (1 - threshold)) return 'decreasing';
    return 'stable';
  }

  private calculateNextCardProbability(): number {
    // Base probability on historical patterns and current session
    let probability = 0.7; // Base probability

    // Adjust based on engagement level
    switch (this.currentSession.engagementLevel) {
      case 'high':
        probability += 0.2;
        break;
      case 'low':
        probability -= 0.3;
        break;
    }

    // Adjust based on session progress
    const sessionDuration = (Date.now() - this.currentSession.startTime) / 1000 / 60;
    if (this.metrics.sessionDuration > 0) {
      const progressRatio = sessionDuration / this.metrics.sessionDuration;
      if (progressRatio > 0.8) probability -= 0.2; // Near end of typical session
    }

    // Adjust based on recent activity
    const timeSinceLastInteraction = Date.now() - this.currentSession.lastInteractionTime;
    if (timeSinceLastInteraction > 60000) probability -= 0.3; // No activity for 1 minute

    return Math.max(0, Math.min(1, probability));
  }

  private calculatePredictionConfidence(): number {
    // Confidence based on amount of historical data
    let confidence = 0.5; // Base confidence

    // Increase confidence with more data
    if (this.metrics.totalSessions > 10) confidence += 0.2;
    if (this.metrics.totalSessions > 50) confidence += 0.2;
    if (this.metrics.totalCardsViewed > 500) confidence += 0.1;

    // Increase confidence with current session data
    if (this.currentSession.cardsViewed > 5) confidence += 0.1;
    if (this.currentSession.recentViewTimes.length >= 5) confidence += 0.1;

    return Math.min(1, confidence);
  }

  private updateHistoricalMetrics(sessionDuration: number): void {
    const totalSessions = this.metrics.totalSessions + 1;
    const totalCards = this.metrics.totalCardsViewed + this.currentSession.cardsViewed;

    // Update averages using weighted approach
    this.metrics.sessionDuration = this.updateWeightedAverage(
      this.metrics.sessionDuration,
      sessionDuration,
      this.metrics.totalSessions,
      0.1 // Learning rate
    );

    this.metrics.cardsPerSession = totalCards / totalSessions;

    // Update time of day patterns
    const hour = new Date().getHours().toString();
    this.metrics.timeOfDayPatterns[hour] = (this.metrics.timeOfDayPatterns[hour] || 0) + 1;

    // Update totals
    this.metrics.totalSessions = totalSessions;
    this.metrics.totalCardsViewed = totalCards;
    this.metrics.lastUpdated = Date.now();
  }

  private updateWeightedAverage(currentAvg: number, newValue: number, count: number, learningRate: number): number {
    if (count === 0) return newValue;
    return currentAvg * (1 - learningRate) + newValue * learningRate;
  }

  private async saveMetrics(): Promise<void> {
    try {
      await CrossPlatformStorage.setItem(BehaviorTracker.STORAGE_KEY, JSON.stringify(this.metrics));
    } catch (error) {
      console.warn('Failed to save behavior metrics:', error);
    }
  }

  private emit(event: string, data: any): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.warn('Error in behavior tracker event listener:', error);
      }
    });
  }

  // Event listener management
  addEventListener(listener: (event: string, data: any) => void): void {
    this.eventListeners.push(listener);
  }

  removeEventListener(listener: (event: string, data: any) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  // Utility methods for validation and migration
  private validateAndMigrateMetrics(metrics: any): UserBehaviorMetrics {
    const defaultMetrics = this.getDefaultMetrics();

    // Ensure all required fields exist
    return {
      ...defaultMetrics,
      ...metrics,
      lastUpdated: Date.now()
    };
  }

  // Setup automatic session timeout
  private setupEventListeners(): void {
    // Auto-end session after timeout
    setInterval(() => {
      const timeSinceLastInteraction = Date.now() - this.currentSession.lastInteractionTime;
      if (timeSinceLastInteraction > BehaviorTracker.SESSION_TIMEOUT) {
        this.endSession();
      }
    }, 60000); // Check every minute
  }
}

// Export singleton instance
export const behaviorTracker = new BehaviorTracker();
