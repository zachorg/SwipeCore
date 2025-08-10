import { BudgetStatus, CostEstimate, PrefetchDecision, CardScore } from '@/types/prefetching';
import { RestaurantCard } from '@/types/Types';

export interface PrefetchCandidate {
  card: RestaurantCard;
  score: CardScore;
  position: number;
  estimatedCost: number;
  expectedValue: number;
  valuePerDollar: number;
}

export class CostOptimizer {
  private static readonly API_COSTS = {
    DETAILS: 0.017,  // $0.017 per Places Details API request
    PHOTO: 0.007     // $0.007 per Photo API request
  };
  
  private static readonly USER_VALUE_ESTIMATES = {
    CARD_VIEW: 0.05,        // Value of a card being viewed
    DETAIL_VIEW: 0.15,      // Value of details being viewed
    PHOTO_VIEW: 0.08,       // Value of photos being viewed
    ENGAGEMENT: 0.25        // Value of high engagement
  };
  
  calculateCostEstimate(card: RestaurantCard, includePhotos: boolean = true): CostEstimate {
    let totalCost = CostOptimizer.API_COSTS.DETAILS; // Always include details cost
    
    if (includePhotos && card.photos && card.photos.length > 0) {
      totalCost += CostOptimizer.API_COSTS.PHOTO;
    }
    
    return {
      detailsApiCost: CostOptimizer.API_COSTS.DETAILS,
      photoApiCost: includePhotos ? CostOptimizer.API_COSTS.PHOTO : 0,
      totalCost,
      confidence: 0.95 // High confidence in cost estimates
    };
  }
  
  calculateExpectedValue(
    score: CardScore,
    estimatedCost: number,
    userEngagementHistory: number = 0.3
  ): number {
    // Calculate probability of different user actions
    const probabilityOfView = score.confidence * (score.finalScore / 100);
    const probabilityOfDetailView = probabilityOfView * userEngagementHistory;
    const probabilityOfPhotoView = probabilityOfView * (userEngagementHistory * 0.7);
    const probabilityOfHighEngagement = probabilityOfView * score.engagementPrediction / 100;
    
    // Calculate expected benefits
    const expectedViewValue = probabilityOfView * CostOptimizer.USER_VALUE_ESTIMATES.CARD_VIEW;
    const expectedDetailValue = probabilityOfDetailView * CostOptimizer.USER_VALUE_ESTIMATES.DETAIL_VIEW;
    const expectedPhotoValue = probabilityOfPhotoView * CostOptimizer.USER_VALUE_ESTIMATES.PHOTO_VIEW;
    const expectedEngagementValue = probabilityOfHighEngagement * CostOptimizer.USER_VALUE_ESTIMATES.ENGAGEMENT;
    
    const totalExpectedBenefit = expectedViewValue + expectedDetailValue + expectedPhotoValue + expectedEngagementValue;
    
    // Expected value = Expected benefit - Cost
    return totalExpectedBenefit - estimatedCost;
  }
  
  optimizePrefetchQueue(
    candidates: Array<{
      card: RestaurantCard;
      score: CardScore;
      position: number;
    }>,
    budgetStatus: BudgetStatus,
    userEngagementHistory: number = 0.3
  ): PrefetchCandidate[] {
    // Calculate cost and value for each candidate
    const enrichedCandidates: PrefetchCandidate[] = candidates.map(candidate => {
      const estimatedCost = this.calculateCostEstimate(candidate.card).totalCost;
      const expectedValue = this.calculateExpectedValue(candidate.score, estimatedCost, userEngagementHistory);
      
      return {
        ...candidate,
        estimatedCost,
        expectedValue,
        valuePerDollar: expectedValue > 0 ? expectedValue / estimatedCost : -1
      };
    });
    
    // Filter out candidates with negative expected value
    const viableCandidates = enrichedCandidates.filter(candidate => candidate.expectedValue > 0);
    
    // Sort by value per dollar (efficiency)
    const sortedCandidates = viableCandidates.sort((a, b) => b.valuePerDollar - a.valuePerDollar);
    
    // Apply budget constraints using knapsack-like algorithm
    return this.applyBudgetConstraints(sortedCandidates, budgetStatus);
  }
  
  private applyBudgetConstraints(
    candidates: PrefetchCandidate[],
    budgetStatus: BudgetStatus
  ): PrefetchCandidate[] {
    const availableBudget = Math.min(
      budgetStatus.remainingDaily,
      budgetStatus.remainingMonthly
    ) - budgetStatus.minimumReserve;
    
    if (availableBudget <= 0) return [];
    
    const selected: PrefetchCandidate[] = [];
    let remainingBudget = availableBudget;
    
    // Greedy selection based on value per dollar
    for (const candidate of candidates) {
      if (candidate.estimatedCost <= remainingBudget) {
        selected.push(candidate);
        remainingBudget -= candidate.estimatedCost;
      }
    }
    
    return selected;
  }
  
  shouldPrefetchPhotos(
    card: RestaurantCard,
    score: CardScore,
    budgetStatus: BudgetStatus
  ): boolean {
    // Conservative approach: only prefetch photos for high-confidence, high-score cards
    if (score.confidence < 0.85 || score.finalScore < 80) return false;
    
    // Check if we have budget for photos
    const photoCost = CostOptimizer.API_COSTS.PHOTO;
    const availableBudget = Math.min(budgetStatus.remainingDaily, budgetStatus.remainingMonthly);
    
    if (availableBudget < photoCost + budgetStatus.minimumReserve) return false;
    
    // Only prefetch photos if card has photos and user likely to engage
    return !!(card.photos && card.photos.length > 0 && score.engagementPrediction > 70);
  }
  
  adjustThresholdsForBudget(
    baseThresholds: { confidence: number; score: number },
    budgetStatus: BudgetStatus
  ): { confidence: number; score: number } {
    const budgetRatio = Math.min(
      budgetStatus.remainingDaily / budgetStatus.dailyBudget,
      budgetStatus.remainingMonthly / budgetStatus.monthlyBudget
    );
    
    // As budget gets lower, increase thresholds (be more conservative)
    let confidenceAdjustment = 0;
    let scoreAdjustment = 0;
    
    if (budgetRatio < 0.1) {
      // Less than 10% budget remaining - very conservative
      confidenceAdjustment = 0.15;
      scoreAdjustment = 20;
    } else if (budgetRatio < 0.25) {
      // Less than 25% budget remaining - more conservative
      confidenceAdjustment = 0.1;
      scoreAdjustment = 10;
    } else if (budgetRatio < 0.5) {
      // Less than 50% budget remaining - slightly more conservative
      confidenceAdjustment = 0.05;
      scoreAdjustment = 5;
    }
    
    return {
      confidence: Math.min(1.0, baseThresholds.confidence + confidenceAdjustment),
      score: Math.min(100, baseThresholds.score + scoreAdjustment)
    };
  }
}