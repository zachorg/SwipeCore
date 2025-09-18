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
  public static readonly API_COSTS = {
    DETAILS: 0.0017,  // $0.017 per Places Details API request
    PHOTO: 0.007     // $0.007 per Photo API request
  };

  private static readonly USER_VALUE_ESTIMATES = {
    CARD_VIEW: 0,        // Value of a card being viewed
    DETAIL_VIEW: 0,      // Value of details being viewed
    PHOTO_VIEW: 0,       // Value of photos being viewed
    ENGAGEMENT: 0        // Value of high engagement
  };

  public calculateCostEstimate(card: RestaurantCard, includePhotos: boolean = true): CostEstimate {
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

  // New method to calculate separate cost estimates
  public calculateSeparateCostEstimates(card: RestaurantCard): {
    detailsCost: CostEstimate;
    photoCost: CostEstimate;
  } {
    const detailsCost: CostEstimate = {
      detailsApiCost: CostOptimizer.API_COSTS.DETAILS,
      photoApiCost: 0,
      totalCost: CostOptimizer.API_COSTS.DETAILS,
      confidence: 0.95
    };

    const photoCost: CostEstimate = {
      detailsApiCost: 0,
      photoApiCost: card.photos && card.photos.length > 0 ? CostOptimizer.API_COSTS.PHOTO : 0,
      totalCost: card.photos && card.photos.length > 0 ? CostOptimizer.API_COSTS.PHOTO : 0,
      confidence: 0.95
    };

    return { detailsCost, photoCost };
  }

  calculateExpectedValue(
    score: CardScore,
    estimatedCost: number,
    userEngagementHistory: number = 0.3
  ): number {
    // Calculate probability of different user actions
    const probabilityOfView = score.confidence * (score.finalScore / 100) * userEngagementHistory;

    // Calculate expected benefits
    const expectedViewValue = probabilityOfView * CostOptimizer.USER_VALUE_ESTIMATES.CARD_VIEW;

    // Expected value = Expected benefit - Cost
    return expectedViewValue - estimatedCost;
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
      // expected cost will always be negative...
      const expectedValue = this.calculateExpectedValue(candidate.score, estimatedCost, userEngagementHistory);

      return {
        ...candidate,
        estimatedCost,
        expectedValue,
        valuePerDollar: expectedValue > 0 ? expectedValue / estimatedCost : -1
      };
    });

    // Filter out candidates with negative expected value
    // const viableCandidates = enrichedCandidates.filter(candidate => candidate.expectedValue > 0);

    // Sort by value per dollar (efficiency)
    const sortedCandidates = enrichedCandidates.sort((a, b) => b.valuePerDollar - a.valuePerDollar);

    // Apply budget constraints using knapsack-like algorithm
    return this.applyBudgetConstraints(sortedCandidates, budgetStatus);
  }

  // New method to optimize photos and details separately
  public optimizeSeparatePrefetchQueue(
    candidates: Array<{
      card: RestaurantCard;
      score: CardScore;
      position: number;
    }>,
    budgetStatus: BudgetStatus,
    userEngagementHistory: number = 0.3
  ): {
    detailsCandidates: PrefetchCandidate[];
    photoCandidates: PrefetchCandidate[];
  } {
    // Calculate separate costs for details and photos
    const detailsCandidates: PrefetchCandidate[] = [];
    const photoCandidates: PrefetchCandidate[] = [];

    for (const candidate of candidates) {
      const { detailsCost, photoCost } = this.calculateSeparateCostEstimates(candidate.card);

      // Photo candidates (only if card has photos)
      if (candidate.card.photos && candidate.card.photos.length > 0) {
        const photoExpectedValue = this.calculateExpectedValue(candidate.score, photoCost.totalCost, userEngagementHistory);
        photoCandidates.push({
          ...candidate,
          estimatedCost: photoCost.totalCost,
          expectedValue: photoExpectedValue,
          valuePerDollar: photoExpectedValue > 0 ? photoExpectedValue / photoCost.totalCost : -1
        });
      }

      // Details candidates (always available)
      const detailsExpectedValue = this.calculateExpectedValue(candidate.score, detailsCost.totalCost, userEngagementHistory);
      detailsCandidates.push({
        ...candidate,
        estimatedCost: detailsCost.totalCost,
        expectedValue: detailsExpectedValue,
        valuePerDollar: detailsExpectedValue > 0 ? detailsExpectedValue / detailsCost.totalCost : -1
      });
    }

    // Sort by value per dollar
    detailsCandidates.sort((a, b) => b.valuePerDollar - a.valuePerDollar);
    photoCandidates.sort((a, b) => b.valuePerDollar - a.valuePerDollar);

    // Apply separate budget constraints
    const optimizedDetails = this.applySeparateBudgetConstraints(detailsCandidates, budgetStatus.detailsBudget);
    const optimizedPhotos = this.applySeparateBudgetConstraints(photoCandidates, budgetStatus.photoBudget);

    return { detailsCandidates: optimizedDetails, photoCandidates: optimizedPhotos };
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

  // New method for separate budget constraints
  private applySeparateBudgetConstraints(
    candidates: PrefetchCandidate[],
    photoOrDetailsBudget: { remainingDaily: number; remainingMonthly: number }
  ): PrefetchCandidate[] {
    const availableBudget = Math.min(
      photoOrDetailsBudget.remainingDaily,
      photoOrDetailsBudget.remainingMonthly
    );

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

    // Check if we have budget for photos specifically
    const photoCost = CostOptimizer.API_COSTS.PHOTO;
    const availablePhotoBudget = Math.min(
      budgetStatus.photoBudget.remainingDaily,
      budgetStatus.photoBudget.remainingMonthly
    );

    if (availablePhotoBudget < photoCost) return false;

    // Only prefetch photos if card has photos and user likely to engage
    return !!(card.photos && card.photos.length > 0 && score.engagementPrediction > 70);
  }

  // New method to check if we should prefetch details
  shouldPrefetchDetails(
    card: RestaurantCard,
    score: CardScore,
    budgetStatus: BudgetStatus
  ): boolean {
    // Check if we have budget for details specifically
    const detailsCost = CostOptimizer.API_COSTS.DETAILS;
    const availableDetailsBudget = Math.min(
      budgetStatus.detailsBudget.remainingDaily,
      budgetStatus.detailsBudget.remainingMonthly
    );

    if (availableDetailsBudget < detailsCost) return false;

    // Basic confidence and score thresholds for details
    return score.confidence >= 0.7 && score.finalScore >= 60;
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