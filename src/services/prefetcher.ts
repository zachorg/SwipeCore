import { RestaurantCard, GooglePlacesApiAdvDetails } from "@/types/Types";
import {
  CardScore,
  PrefetchDecision,
  BudgetStatus,
  PrefetchConfig,
  PrefetchThresholds,
  PrefetchEvent,
} from "@/types/prefetching";
import { HeuristicScoringEngine } from "@/utils/heuristicScoring";
import { CostOptimizer, PrefetchCandidate } from "@/utils/costOptimizer";
import { behaviorTracker } from "./behaviorTracker";
import { placesApi } from "./places";
import { QueryClient } from "@tanstack/react-query";
import { CrossPlatformStorage } from "@/utils/crossPlatformStorage";

export class PrefetchingService {
  private scoringEngine: HeuristicScoringEngine;
  public costOptimizer: CostOptimizer;
  private config: PrefetchConfig;
  private budgetStatus: BudgetStatus;
  private eventListeners: Array<(event: PrefetchEvent) => void> = [];
  private prefetchQueue: Map<string, PrefetchCandidate> = new Map();
  private activeRequests: Set<string> = new Set();

  public queryClient: QueryClient | null = null;

  constructor(config: PrefetchConfig) {
    this.scoringEngine = new HeuristicScoringEngine();
    this.costOptimizer = new CostOptimizer();
    this.config = config;
    this.budgetStatus = this.initializeBudgetStatus();

    // Set up behavior tracking integration
    behaviorTracker.addEventListener(this.handleBehaviorEvent.bind(this));
  }

  async intelligentPrefetch(
    cards: RestaurantCard[],
    currentPosition: number = 0,
    userPreferences?: any
  ): Promise<void> {
    if (!this.config.enabled) return;

    try {
      // Update budget status
      await this.updateBudgetStatus();

      // Get current user behavior and session context
      const userBehavior = behaviorTracker.getMetrics();
      const sessionContext = behaviorTracker.getCurrentSession();
      const predictiveSignals = behaviorTracker.getPredictiveSignals();

      console.log(
        `Current: \n\t${JSON.stringify(
          userBehavior,
          null,
          2
        )} \n\n\t${JSON.stringify(
          sessionContext,
          null,
          2
        )} \n\n\t${JSON.stringify(predictiveSignals, null, 2)}`
      );

      // Early exit if user likely to end session soon
      if (
        predictiveSignals.likelyToEndSoon &&
        predictiveSignals.confidenceLevel > 0.7
      ) {
        this.log("Skipping prefetch - user likely to end session soon");
        return;
      }

      // Calculate scores for upcoming cards
      const candidates = this.calculateCandidateScores(
        cards,
        currentPosition,
        userBehavior,
        sessionContext,
        userPreferences
      );

      console.log("candidates: ", candidates);

      // Filter candidates based on thresholds
      const viableCandidates = this.filterViableCandidates(candidates);

      console.log("filterViableCandidates: ", viableCandidates);

      // Optimize selection based on budget constraints
      const optimizedCandidates = this.costOptimizer.optimizePrefetchQueue(
        viableCandidates,
        this.budgetStatus,
        userBehavior.detailViewRate
      );

      console.log("executePrefetchDecisions: ", optimizedCandidates);

      // Execute prefetch decisions
      await this.executePrefetchDecisions(optimizedCandidates);
    } catch (error) {
      console.error("Error in intelligent prefetch:", error);
      this.emitEvent({
        type: "prefetch_started",
        cardId: "error",
        timestamp: Date.now(),
        cost: 0,
        score: {} as CardScore,
        decision: {} as PrefetchDecision,
        metadata: { error: error.message },
      });
    }
  }

  private calculateCandidateScores(
    cards: RestaurantCard[],
    currentPosition: number,
    userBehavior: any,
    sessionContext: any,
    userPreferences?: any
  ): Array<{ card: RestaurantCard; score: CardScore; position: number }> {
    const candidates = [];

    // Only consider cards within the position threshold
    const maxPosition = Math.min(
      cards.length,
      currentPosition + this.config.thresholds.positionThreshold
    );

    for (let i = currentPosition; i < maxPosition; i++) {
      const card = cards[i];
      const position = i - currentPosition + 1; // 1-based position from current

      // Skip if already prefetched or in progress
      if (this.isPrefetched(card.id) || this.activeRequests.has(card.id)) {
        continue;
      }

      const score = this.scoringEngine.calculateCardScore(
        card,
        position,
        userBehavior,
        sessionContext,
        userPreferences
      );

      candidates.push({ card, score, position });
    }

    return candidates;
  }

  private filterViableCandidates(
    candidates: Array<{
      card: RestaurantCard;
      score: CardScore;
      position: number;
    }>
  ): Array<{ card: RestaurantCard; score: CardScore; position: number }> {
    // Get dynamic thresholds based on budget status
    const adjustedThresholds = this.costOptimizer.adjustThresholdsForBudget(
      {
        confidence: this.config.thresholds.minimumConfidence,
        score: this.config.thresholds.minimumScore,
      },
      this.budgetStatus
    );

    console.log(`adjustedThresholds: ${JSON.stringify(adjustedThresholds)}`);

    return candidates.filter((candidate) => {
      const { score, position } = candidate;

      // Apply conservative thresholds
      const meetsConfidence = score.confidence >= adjustedThresholds.confidence;
      const meetsScore = score.finalScore >= adjustedThresholds.score;
      const meetsPosition =
        position <= this.config.thresholds.positionThreshold;

      return meetsConfidence && meetsScore && meetsPosition;
    });
  }

  public async executePrefetchDecisions(
    candidates: PrefetchCandidate[]
  ): Promise<void> {
    for (const candidate of candidates) {
      try {
        // Mark as active
        this.activeRequests.add(candidate.card.id);

        // Prefetch photos if decision says so
        const shouldPrefetchPhotos =
          true ||
          this.costOptimizer.shouldPrefetchPhotos(
            candidate.card,
            candidate.score,
            this.budgetStatus
          );

        // Emit prefetch started event
        this.emitEvent({
          type: "prefetch_started",
          cardId: candidate.card.id,
          timestamp: Date.now(),
          cost: candidate.estimatedCost,
          score: candidate.score,
          decision: {
            shouldPrefetch: true,
            shouldPrefetchPhotos: shouldPrefetchPhotos,
            priority: this.getPriority(candidate.score),
            reason: `Score: ${candidate.score.finalScore.toFixed(
              1
            )}, Confidence: ${(candidate.score.confidence * 100).toFixed(1)}%`,
            estimatedCost: candidate.estimatedCost,
            expectedValue: candidate.expectedValue,
            confidence: candidate.score.confidence,
            decidedAt: Date.now(),
          },
          metadata: {
            position: candidate.position,
            valuePerDollar: candidate.valuePerDollar,
          },
        });

        // Prefetch place details
        await this.prefetchPlaceDetails(candidate.card.id, this.queryClient);

        if (
          shouldPrefetchPhotos &&
          candidate.card.photos &&
          candidate.card.photos.length > 0
        ) {
          console.log(`Prefetching photos for ${candidate.card.title}...`);
          await this.prefetchPhotos(candidate.card, this.queryClient);
        }

        // Update budget
        await this.updateBudgetSpend(candidate.estimatedCost);

        // Emit prefetch completed event
        this.emitEvent({
          type: "prefetch_completed",
          cardId: candidate.card.id,
          timestamp: Date.now(),
          cost: candidate.estimatedCost,
          score: candidate.score,
          decision: {} as PrefetchDecision,
          metadata: { success: true },
        });
      } catch (error) {
        console.error(`Failed to prefetch ${candidate.card.id}:`, error);

        this.emitEvent({
          type: "prefetch_completed",
          cardId: candidate.card.id,
          timestamp: Date.now(),
          cost: 0,
          score: candidate.score,
          decision: {} as PrefetchDecision,
          metadata: { success: false, error: error.message },
        });
      } finally {
        // Remove from active requests
        this.activeRequests.delete(candidate.card.id);
      }
    }
  }

  public async prefetchPlaceDetails(
    placeId: string,
    queryClient: any
  ): Promise<void> {
    try {
      await queryClient.prefetchQuery({
        queryKey: ["places", "details", placeId],
        queryFn: () => placesApi.getPlaceDetails(placeId),
        staleTime: 30 * 60 * 1000, // 30 minutes
        cacheTime: 60 * 60 * 1000, // 1 hour
      });
    } catch (error) {
      throw new Error(
        `Failed to prefetch details for ${placeId}: ${error.message}`
      );
    }
  }

  public async prefetchPhotos(
    card: RestaurantCard,
    queryClient: any
  ): Promise<void> {
    // Check both photos array and photoReferences for photo data
    let shouldPrefetch =
      card.photos?.length > 0 && card.photos[0].url === undefined;
    if (!shouldPrefetch) return;

    try {
      // Use photoReferences if available, otherwise fall back to photos array
      const firstPhoto = card.photos[0];
      await queryClient.prefetchQuery({
        queryKey: ["places", "photos", card.id],
        queryFn: () =>
          placesApi.getPhotoUrl(
            card.basicDetails.id,
            firstPhoto.name,
            firstPhoto.widthPx,
            firstPhoto.heightPx
          ),
        staleTime: 60 * 60 * 1000, // 1 hour
        cacheTime: 2 * 60 * 60 * 1000, // 2 hours
      });
    } catch (error) {
      throw new Error(
        `Failed to prefetch photos for ${card.id}: ${error.message}`
      );
    }
  }

  public setQueryClient(qc: QueryClient) {
    this.queryClient = qc;
  }

  private isPrefetched(cardId: string): boolean {
    const detailsData = this.queryClient.getQueryData([
      "places",
      "details",
      cardId,
    ]);
    return !!detailsData;
  }

  private getPriority(score: CardScore): "high" | "medium" | "low" {
    if (score.finalScore >= 90 && score.confidence >= 0.9) return "high";
    if (score.finalScore >= 80 && score.confidence >= 0.8) return "medium";
    return "low";
  }

  private initializeBudgetStatus(): BudgetStatus {
    return {
      dailyBudget: this.config.budgetLimits.dailyLimit,
      monthlyBudget: this.config.budgetLimits.monthlyLimit,
      remainingDaily: this.config.budgetLimits.dailyLimit,
      remainingMonthly: this.config.budgetLimits.monthlyLimit,
      currentSpend: {
        daily: 0,
        monthly: 0,
        session: 0,
      },
      predictedSpend: {
        dailyProjection: 0,
        monthlyProjection: 0,
      },
      minimumReserve: this.config.budgetLimits.dailyLimit * 0.1, // 10% reserve
      emergencyThreshold: this.config.budgetLimits.dailyLimit * 0.05, // 5% emergency threshold
      isLowBudget: false,
      isEmergencyMode: false,
      budgetExceeded: false,
    };
  }

  private async updateBudgetStatus(): Promise<void> {
    // In a real implementation, this would fetch current spend from a backend service
    // For now, we'll use localStorage to track spending

    const today = new Date().toDateString();
    const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const dailySpend = (await this.getStoredSpend(`daily_${today}`)) || 0;
    const monthlySpend =
      (await this.getStoredSpend(`monthly_${thisMonth}`)) || 0;

    this.budgetStatus.currentSpend.daily = dailySpend;
    this.budgetStatus.currentSpend.monthly = monthlySpend;
    this.budgetStatus.remainingDaily = Math.max(
      0,
      this.budgetStatus.dailyBudget - dailySpend
    );
    this.budgetStatus.remainingMonthly = Math.max(
      0,
      this.budgetStatus.monthlyBudget - monthlySpend
    );

    // Update status flags
    this.budgetStatus.isLowBudget =
      this.budgetStatus.remainingDaily < this.budgetStatus.dailyBudget * 0.25 ||
      this.budgetStatus.remainingMonthly <
        this.budgetStatus.monthlyBudget * 0.25;

    this.budgetStatus.isEmergencyMode =
      this.budgetStatus.remainingDaily < this.budgetStatus.emergencyThreshold ||
      this.budgetStatus.remainingMonthly < this.budgetStatus.emergencyThreshold;

    this.budgetStatus.budgetExceeded =
      this.budgetStatus.remainingDaily <= 0 ||
      this.budgetStatus.remainingMonthly <= 0;
  }

  public async updateBudgetSpend(cost: number): Promise<void> {
    const today = new Date().toDateString();
    const thisMonth = new Date().toISOString().slice(0, 7);

    // Update daily spend
    const currentDailySpend =
      (await this.getStoredSpend(`daily_${today}`)) || 0;
    await this.setStoredSpend(`daily_${today}`, currentDailySpend + cost);

    // Update monthly spend
    const currentMonthlySpend =
      (await this.getStoredSpend(`monthly_${thisMonth}`)) || 0;
    await this.setStoredSpend(
      `monthly_${thisMonth}`,
      currentMonthlySpend + cost
    );

    // Update session spend
    this.budgetStatus.currentSpend.session += cost;

    // Update budget status
    this.budgetStatus.currentSpend.daily += cost;
    this.budgetStatus.currentSpend.monthly += cost;
    this.budgetStatus.remainingDaily = Math.max(
      0,
      this.budgetStatus.remainingDaily - cost
    );
    this.budgetStatus.remainingMonthly = Math.max(
      0,
      this.budgetStatus.remainingMonthly - cost
    );
  }

  private async getStoredSpend(key: string): Promise<number> {
    try {
      const stored = await CrossPlatformStorage.getItem(
        `prefetch_spend_${key}`
      );
      return stored ? parseFloat(stored) : 0;
    } catch {
      return 0;
    }
  }

  private async setStoredSpend(key: string, value: number): Promise<void> {
    try {
      await CrossPlatformStorage.setItem(
        `prefetch_spend_${key}`,
        value.toString()
      );
    } catch (error) {
      console.warn("Failed to store spend data:", error);
    }
  }

  private handleBehaviorEvent(event: string, data: any): void {
    // React to behavior changes that might affect prefetching decisions
    switch (event) {
      case "card_viewed":
        this.onCardViewed(data.card);
        break;
      case "detail_viewed":
        this.onDetailViewed(data.cardId);
        break;
      case "session_ended":
        this.onSessionEnded();
        break;
    }
  }

  private onCardViewed(card: RestaurantCard): void {
    // Track if prefetched data was actually used
    if (this.isPrefetched(card.id)) {
      this.emitEvent({
        type: "prefetch_used",
        cardId: card.id,
        timestamp: Date.now(),
        cost: 0, // Cost was already tracked when prefetched
        score: {} as CardScore,
        decision: {} as PrefetchDecision,
        metadata: { type: "card_view" },
      });
    }
  }

  private onDetailViewed(cardId: string): void {
    // Track if prefetched details were used
    if (this.isPrefetched(cardId)) {
      this.emitEvent({
        type: "prefetch_used",
        cardId,
        timestamp: Date.now(),
        cost: 0,
        score: {} as CardScore,
        decision: {} as PrefetchDecision,
        metadata: { type: "detail_view" },
      });
    }
  }

  private onSessionEnded(): void {
    // Mark any unused prefetched data as wasted
    this.prefetchQueue.forEach((candidate, cardId) => {
      if (!this.wasCardViewed(cardId)) {
        this.emitEvent({
          type: "prefetch_wasted",
          cardId,
          timestamp: Date.now(),
          cost: candidate.estimatedCost,
          score: candidate.score,
          decision: {} as PrefetchDecision,
          metadata: { reason: "session_ended" },
        });
      }
    });

    // Clear the queue
    this.prefetchQueue.clear();
  }

  private wasCardViewed(cardId: string): boolean {
    // This would be tracked by the behavior tracker
    // For now, assume we have a way to check this
    return false; // Placeholder implementation
  }

  public emitEvent(event: PrefetchEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.warn("Error in prefetch event listener:", error);
      }
    });
  }

  private log(message: string, data?: any): void {
    if (this.config.debugMode) {
      console.log(`[PrefetchingService] ${message}`, data);
    }
  }

  // Public API methods
  addEventListener(listener: (event: PrefetchEvent) => void): void {
    this.eventListeners.push(listener);
  }

  removeEventListener(listener: (event: PrefetchEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  getBudgetStatus(): BudgetStatus {
    return { ...this.budgetStatus };
  }

  getConfig(): PrefetchConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<PrefetchConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Emergency methods
  pausePrefetching(): void {
    this.config.enabled = false;
    this.log("Prefetching paused");
  }

  resumePrefetching(): void {
    this.config.enabled = true;
    this.log("Prefetching resumed");
  }

  clearPrefetchQueue(): void {
    this.prefetchQueue.clear();
    this.activeRequests.clear();
    this.log("Prefetch queue cleared");
  }
}

// Default configuration
export const defaultPrefetchConfig: PrefetchConfig = {
  enabled: true,
  debugMode: import.meta.env.DEV,
  analyticsEnabled: true,

  thresholds: {
    minimumConfidence: 0.8,
    minimumScore: 75,
    positionThreshold: 3,
    budgetBasedThreshold: 0.8,
    sessionBasedThreshold: 0.75,
    lowBudgetThreshold: 0.9,
    highEngagementThreshold: 0.7,
  },

  budgetLimits: {
    dailyLimit: 5.0, // $5 per day
    monthlyLimit: 100.0, // $100 per month
    sessionLimit: 1.0, // $1 per session
  },

  maxConcurrentRequests: 3,
  requestTimeout: 10000, // 10 seconds
  retryAttempts: 2,

  behaviorTrackingEnabled: true,
  sessionTimeoutMinutes: 30,
  metricsRetentionDays: 30,
};

// Export singleton instance
export const prefetchingService = new PrefetchingService(defaultPrefetchConfig);
