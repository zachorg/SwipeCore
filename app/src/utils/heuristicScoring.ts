import { RestaurantCard, UserPreferences } from '@/types/Types';
import { CardScore, UserBehaviorMetrics, CurrentSessionMetrics } from '@/types/prefetching';

export class HeuristicScoringEngine {
  private static readonly WEIGHTS = {
    position: 0.35,      // Position is most important for conservative approach
    content: 0.25,       // Content relevance
    behavior: 0.20,      // User behavior patterns
    session: 0.15,       // Current session context
    time: 0.05          // Time context (least important)
  };
  
  calculateCardScore(
    card: RestaurantCard,
    position: number,
    userBehavior: UserBehaviorMetrics,
    sessionContext: CurrentSessionMetrics,
    userPreferences?: UserPreferences
  ): CardScore {
    
    // 1. Position-based scoring (exponential decay for conservative approach)
    const positionScore = this.calculatePositionScore(position);
    
    // 2. Content relevance scoring
    const contentScore = this.calculateContentRelevance(card, userPreferences);
    
    // 3. User behavior pattern matching
    const behaviorScore = this.calculateBehaviorMatch(card, userBehavior);
    
    // 4. Session context scoring
    const sessionScore = this.calculateSessionContext(card, sessionContext);
    
    // 5. Time-based contextual scoring
    const timeScore = this.calculateTimeContext(card);
    
    // 6. Rating-based scoring
    const ratingScore = this.calculateRatingScore(card);
    
    // 7. Popularity scoring
    const popularityScore = this.calculatePopularityScore(card);
    
    // 8. Engagement prediction
    const engagementPrediction = this.predictEngagement(card, userBehavior, sessionContext);
    
    // 9. Weighted combination
    const baseScore = 
      positionScore * HeuristicScoringEngine.WEIGHTS.position +
      contentScore * HeuristicScoringEngine.WEIGHTS.content +
      behaviorScore * HeuristicScoringEngine.WEIGHTS.behavior +
      sessionScore * HeuristicScoringEngine.WEIGHTS.session +
      timeScore * HeuristicScoringEngine.WEIGHTS.time;
    
    // 10. Apply contextual adjustments
    const finalScore = this.applyContextualAdjustments(baseScore, card, sessionContext);
    
    // 11. Calculate confidence
    const confidence = this.calculateConfidence(userBehavior, sessionContext, position);
    
    return {
      positionScore,
      contentRelevanceScore: contentScore,
      ratingScore,
      popularityScore,
      userPatternScore: behaviorScore,
      timeContextScore: timeScore,
      sessionContextScore: sessionScore,
      engagementPrediction,
      baseScore,
      finalScore,
      confidence,
      calculatedAt: Date.now(),
      factors: {
        position: positionScore,
        content: contentScore,
        behavior: behaviorScore,
        session: sessionScore,
        time: timeScore,
        rating: ratingScore,
        popularity: popularityScore,
        engagement: engagementPrediction
      }
    };
  }
  
  private calculatePositionScore(position: number): number {
    // Exponential decay with steeper curve for conservative approach
    // Position 1: 100, Position 2: ~74, Position 3: ~55, Position 4: ~41, etc.
    return Math.max(0, 100 * Math.exp(-0.3 * (position - 1)));
  }
  
  private calculateContentRelevance(card: RestaurantCard, userPreferences?: UserPreferences): number {
    if (!userPreferences) return 50; // Neutral score without preferences
    
    let score = 50; // Base score
    
    // Rating preference matching
    if (card.rating && userPreferences.minRating) {
      const ratingDiff = card.rating - userPreferences.minRating;
      score += Math.max(-20, Math.min(20, ratingDiff * 10)); // ±20 points based on rating
    }
    
    // Price range preference matching
    if (card.priceRange && userPreferences.preferredPriceRange.length > 0) {
      const priceMatch = userPreferences.preferredPriceRange.includes(card.priceRange);
      score += priceMatch ? 15 : -10;
    }
    
    // Cuisine preference matching
    if (card.cuisine && userPreferences.preferredCuisines.length > 0) {
      const cuisineMatch = userPreferences.preferredCuisines.some(pref => 
        card.cuisine?.toLowerCase().includes(pref.toLowerCase()) ||
        card.types?.some(type => type.toLowerCase().includes(pref.toLowerCase()))
      );
      score += cuisineMatch ? 20 : -5;
    }
    
    // Distance preference
    if (card.distanceInMeters && userPreferences.maxDistance) {
      const distanceRatio = card.distanceInMeters / userPreferences.maxDistance;
      if (distanceRatio <= 1) {
        score += 10 * (1 - distanceRatio); // Closer is better
      } else {
        score -= 15; // Outside preferred range
      }
    }
    
    // Open now preference
    if (userPreferences.onlyOpenNow && card.isOpenNow !== undefined) {
      score += card.isOpenNow ? 10 : -20;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateBehaviorMatch(card: RestaurantCard, userBehavior: UserBehaviorMetrics): number {
    let score = 50; // Base score
    
    // Match against historical preferences (simplified - would be more complex in real implementation)
    if (userBehavior.totalCardsViewed > 50) {
      // User has enough history for pattern matching
      
      // Rating preference pattern
      if (card.rating) {
        if (card.rating >= 4.0) score += 15; // Users typically prefer higher rated places
        if (card.rating < 3.0) score -= 20;
      }
      
      // Time of day patterns
      const currentHour = new Date().getHours().toString();
      const hourActivity = userBehavior.timeOfDayPatterns[currentHour] || 0;
      const maxActivity = Math.max(...Object.values(userBehavior.timeOfDayPatterns));
      if (maxActivity > 0) {
        const activityRatio = hourActivity / maxActivity;
        score += activityRatio * 20; // Up to 20 points for peak activity times
      }
      
      // Engagement level matching
      if (userBehavior.detailViewRate > 0.3) {
        // User frequently views details, prefer higher quality restaurants
        if (card.rating && card.rating >= 4.0) score += 10;
        if (card.priceRange && ['$$$', '$$$$'].includes(card.priceRange)) score += 5;
      }
    } else {
      // Not enough history, use general heuristics
      score = 60; // Slightly optimistic for new users
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateSessionContext(card: RestaurantCard, sessionContext: CurrentSessionMetrics): number {
    let score = 50; // Base score
    
    // Engagement level impact
    switch (sessionContext.engagementLevel) {
      case 'high':
        score += 20; // Highly engaged users more likely to continue
        break;
      case 'low':
        score -= 15; // Low engagement suggests user may stop soon
        break;
      // 'medium' keeps base score
    }
    
    // Session progress impact
    if (sessionContext.cardsViewed > 0) {
      const avgViewTime = sessionContext.recentViewTimes.length > 0
        ? sessionContext.recentViewTimes.reduce((a, b) => a + b, 0) / sessionContext.recentViewTimes.length
        : 0;
      
      if (avgViewTime > 8) {
        score += 15; // User taking time to consider cards
      } else if (avgViewTime < 3) {
        score -= 10; // User quickly swiping through
      }
    }
    
    // Swipe speed impact
    if (sessionContext.currentSwipeSpeed > 0) {
      if (sessionContext.currentSwipeSpeed < 5) {
        score += 10; // Slower, more deliberate swiping
      } else if (sessionContext.currentSwipeSpeed > 15) {
        score -= 15; // Very fast swiping suggests low engagement
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateTimeContext(card: RestaurantCard): number {
    let score = 50; // Base score
    
    const now = new Date();
    const hour = now.getHours();
    
    // Meal time relevance
    if (hour >= 11 && hour <= 14) {
      // Lunch time
      score += 10;
    } else if (hour >= 17 && hour <= 21) {
      // Dinner time
      score += 15;
    } else if (hour >= 7 && hour <= 10) {
      // Breakfast time
      score += 5;
    }
    
    // Weekend vs weekday
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    if (isWeekend) {
      score += 5; // People more likely to explore on weekends
    }
    
    // Open now bonus
    if (card.isOpenNow) {
      score += 10;
    } else {
      score -= 20; // Significant penalty for closed restaurants
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateRatingScore(card: RestaurantCard): number {
    if (!card.rating) return 50; // Neutral score for no rating
    
    // Linear scaling: 1 star = 0 points, 5 stars = 100 points
    return Math.max(0, Math.min(100, (card.rating - 1) * 25));
  }
  
  private calculatePopularityScore(card: RestaurantCard): number {
    let score = 50; // Base score
    
    // Use rating as a proxy for popularity
    if (card.rating && card.rating >= 4.5) score += 20;
    else if (card.rating && card.rating >= 4.0) score += 10;
    else if (card.rating && card.rating < 3.0) score -= 15;
    
    // Use price level as indicator (higher price often correlates with popularity for special occasions)
    if (card.priceRange === '$$$$') score += 5;
    else if (card.priceRange === '$$$') score += 3;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private predictEngagement(
    card: RestaurantCard,
    userBehavior: UserBehaviorMetrics,
    sessionContext: CurrentSessionMetrics
  ): number {
    let engagement = 50; // Base engagement prediction
    
    // Historical engagement patterns
    if (userBehavior.detailViewRate > 0.4) {
      engagement += 20; // User frequently engages with details
    } else if (userBehavior.detailViewRate < 0.1) {
      engagement -= 15; // User rarely engages
    }
    
    // Photo interaction patterns
    if (userBehavior.photoInteractionRate > 0.3) {
      engagement += 15; // User likes to browse photos
    }
    
    // Current session engagement
    switch (sessionContext.engagementLevel) {
      case 'high':
        engagement += 25;
        break;
      case 'low':
        engagement -= 20;
        break;
    }
    
    // Card quality impact on engagement
    if (card.rating && card.rating >= 4.5) engagement += 10;
    if (card.photos && card.photos.length > 3) engagement += 5;
    
    return Math.max(0, Math.min(100, engagement));
  }
  
  private applyContextualAdjustments(
    baseScore: number,
    card: RestaurantCard,
    sessionContext: CurrentSessionMetrics
  ): number {
    let adjustedScore = baseScore;
    
    // Boost score for exceptional restaurants
    if (card.rating && card.rating >= 4.8) {
      adjustedScore *= 1.1; // 10% boost for exceptional ratings
    }
    
    // Reduce score if user is showing signs of fatigue
    const sessionDuration = (Date.now() - sessionContext.startTime) / 1000 / 60; // minutes
    if (sessionDuration > 15 && sessionContext.engagementLevel === 'low') {
      adjustedScore *= 0.8; // 20% reduction for fatigued users
    }
    
    // Boost score for highly relevant content during peak engagement
    if (sessionContext.engagementLevel === 'high' && baseScore > 80) {
      adjustedScore *= 1.05; // 5% boost for high-quality content during high engagement
    }
    
    return Math.max(0, Math.min(100, adjustedScore));
  }
  
  private calculateConfidence(
    userBehavior: UserBehaviorMetrics,
    sessionContext: CurrentSessionMetrics,
    position: number
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence with more historical data
    if (userBehavior.totalSessions > 10) confidence += 0.15;
    if (userBehavior.totalSessions > 50) confidence += 0.15;
    if (userBehavior.totalCardsViewed > 500) confidence += 0.1;
    
    // Increase confidence with current session data
    if (sessionContext.cardsViewed > 5) confidence += 0.1;
    if (sessionContext.recentViewTimes.length >= 5) confidence += 0.1;
    
    // Position-based confidence (more confident about closer positions)
    if (position <= 2) confidence += 0.1;
    else if (position > 5) confidence -= 0.1;
    
    // Engagement level impact
    switch (sessionContext.engagementLevel) {
      case 'high':
        confidence += 0.1;
        break;
      case 'low':
        confidence -= 0.1;
        break;
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }
}
    
    