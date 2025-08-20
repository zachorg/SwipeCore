// User Behavior Tracking Types
export interface UserBehaviorMetrics {
  // Swipe patterns
  averageSwipeSpeed: number;           // cards per minute
  averageViewTime: number;             // seconds per card
  swipeRatio: {
    like: number;                      // percentage of likes
    pass: number;                      // percentage of passes
  };

  // Session patterns
  sessionDuration: number;             // typical session length in minutes
  cardsPerSession: number;             // average cards viewed per session
  timeOfDayPatterns: Record<string, number>; // activity by hour (0-23)

  // Engagement indicators
  detailViewRate: number;              // % of cards where details are viewed
  photoInteractionRate: number;        // % of cards where photos are swiped
  filterUsageFrequency: number;        // changes per session

  // Predictive indicators
  slowDownThreshold: number;           // cards/min when user slows down
  exhaustionSignals: string[];         // patterns indicating session end

  // Historical data
  totalSessions: number;
  totalCardsViewed: number;
  lastUpdated: number;                 // timestamp
}

export interface CurrentSessionMetrics {
  startTime: number;
  cardsViewed: number;
  currentSwipeSpeed: number;           // current cards per minute
  recentViewTimes: number[];           // sliding window of last 5 cards
  engagementLevel: 'high' | 'medium' | 'low';
  lastInteractionTime: number;
}

export interface PredictiveSignals {
  isSlowingDown: boolean;
  likelyToEndSoon: boolean;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  nextCardProbability: number;         // 0-1 probability of viewing next card
  confidenceLevel: number;             // 0-1 confidence in predictions
}

// Scoring System Types
export interface CardScore {
  // Individual factor scores (0-100)
  positionScore: number;               // based on queue position
  contentRelevanceScore: number;       // matches user preferences
  ratingScore: number;                 // restaurant rating influence
  popularityScore: number;             // general popularity
  userPatternScore: number;            // matches user's historical preferences
  timeContextScore: number;            // relevant to current time
  sessionContextScore: number;         // fits current session pattern
  engagementPrediction: number;        // likelihood of user engagement

  // Computed values
  baseScore: number;                   // weighted combination
  finalScore: number;                  // adjusted for context
  confidence: number;                  // confidence in prediction (0-1)

  // Metadata
  calculatedAt: number;                // timestamp
  factors: Record<string, number>;     // detailed factor breakdown
}

// Decision Engine Types
export interface PrefetchDecision {
  shouldPrefetch: boolean;
  shouldPrefetchPhotos: boolean;       // separate decision for photos
  priority: 'high' | 'medium' | 'low';
  reason: string;                      // human-readable explanation
  estimatedCost: number;               // estimated API cost
  expectedValue: number;               // expected benefit - cost
  confidence: number;                  // confidence in decision
  decidedAt: number;                   // timestamp
}

export interface PrefetchThresholds {
  // Conservative thresholds (as requested)
  minimumConfidence: number;           // default: 0.8 (80%)
  minimumScore: number;                // default: 75
  positionThreshold: number;           // default: 3 (2-3 cards away)

  // Dynamic adjustments
  budgetBasedThreshold: number;        // adjusted based on remaining budget
  sessionBasedThreshold: number;       // adjusted based on session patterns

  // Emergency thresholds
  lowBudgetThreshold: number;          // default: 0.9 (90% when budget low)
  highEngagementThreshold: number;     // default: 0.7 (70% for engaged users)
}

// Cost Management Types
export interface BudgetStatus {
  // Current budget state
  dailyBudget: number;
  monthlyBudget: number;
  remainingDaily: number;
  remainingMonthly: number;

  // Separate budget allocations for photos and details
  photoBudget: {
    daily: number;
    monthly: number;
    remainingDaily: number;
    remainingMonthly: number;
  };
  detailsBudget: {
    daily: number;
    monthly: number;
    remainingDaily: number;
    remainingMonthly: number;
  };

  // Spending tracking
  currentSpend: {
    daily: number;
    monthly: number;
    session: number;
    photos: number;
    details: number;
  };

  // Predictions
  predictedSpend: {
    dailyProjection: number;
    monthlyProjection: number;
  };

  // Constraints
  minimumReserve: number;              // minimum budget to keep in reserve
  emergencyThreshold: number;          // threshold for emergency mode

  // Status flags
  isLowBudget: boolean;
  isEmergencyMode: boolean;
  budgetExceeded: boolean;
}

export interface CostEstimate {
  detailsApiCost: number;              // cost for details API call
  photoApiCost: number;                // cost for photo API call
  totalCost: number;                   // combined cost
  confidence: number;                  // confidence in estimate
}

// Analytics Types
export interface PrefetchAnalytics {
  // Effectiveness metrics
  hitRate: number;                     // % of prefetched data actually used
  wasteRate: number;                   // % of prefetched data never used
  costSavings: number;                 // $ saved vs naive prefetching

  // Performance metrics
  averageLoadTime: number;             // average load time for prefetched content
  loadTimeImprovement: number;         // improvement vs non-prefetched

  // Accuracy metrics
  predictionAccuracy: number;          // % of predictions that were correct
  falsePositiveRate: number;           // % of incorrect prefetch decisions
  falseNegativeRate: number;           // % of missed opportunities

  // Cost metrics
  costPerEngagedUser: number;          // API cost per actively engaged user
  returnOnInvestment: number;          // value generated per dollar spent

  // Timing
  lastUpdated: number;
  periodStart: number;
  periodEnd: number;
}

export interface PrefetchEvent {
  type: 'prefetch_started' | 'prefetch_completed' | 'prefetch_used' | 'prefetch_wasted';
  cardId: string;
  timestamp: number;
  cost: number;
  score: CardScore;
  decision: PrefetchDecision;
  metadata: Record<string, any>;
}

// Configuration Types
export interface PrefetchConfig {
  // Feature flags
  enabled: boolean;
  debugMode: boolean;
  analyticsEnabled: boolean;

  // Thresholds
  thresholds: PrefetchThresholds;

  // Budget settings
  budgetLimits: {
    dailyLimit: number;
    monthlyLimit: number;
    sessionLimit: number;
    photoBudgetRatio: number;          // percentage of budget allocated to photos (0.0 - 1.0)
    detailsBudgetRatio: number;        // percentage of budget allocated to details (0.0 - 1.0)
  };

  // Performance settings
  maxConcurrentRequests: number;
  requestTimeout: number;
  retryAttempts: number;

  // Behavior tracking settings
  behaviorTrackingEnabled: boolean;
  sessionTimeoutMinutes: number;
  metricsRetentionDays: number;
}