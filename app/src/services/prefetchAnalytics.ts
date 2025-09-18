import { PrefetchEvent, PrefetchAnalytics } from '@/types/prefetching';
import { CrossPlatformStorage } from '@/utils/crossPlatformStorage';

export class PrefetchAnalyticsService {
  private events: PrefetchEvent[] = [];
  private readonly maxEvents = 1000; // Keep last 1000 events
  private readonly storageKey = 'prefetch_analytics';
  
  constructor() {
    this.loadStoredEvents();
  }
  
  async trackEvent(event: PrefetchEvent): Promise<void> {
    this.events.push(event);
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    
    // Persist to storage
    await this.saveEvents();
  }
  
  getAnalytics(periodHours: number = 24): PrefetchAnalytics {
    const now = Date.now();
    const periodStart = now - (periodHours * 60 * 60 * 1000);
    
    const periodEvents = this.events.filter(event => 
      event.timestamp >= periodStart && event.timestamp <= now
    );
    
    return this.calculateAnalytics(periodEvents, periodStart, now);
  }
  
  private calculateAnalytics(events: PrefetchEvent[], periodStart: number, periodEnd: number): PrefetchAnalytics {
    const prefetchStarted = events.filter(e => e.type === 'prefetch_started');
    const prefetchCompleted = events.filter(e => e.type === 'prefetch_completed');
    const prefetchUsed = events.filter(e => e.type === 'prefetch_used');
    const prefetchWasted = events.filter(e => e.type === 'prefetch_wasted');
    
    // Calculate hit rate (% of prefetched data that was actually used)
    const totalPrefetched = prefetchCompleted.length;
    const totalUsed = prefetchUsed.length;
    const hitRate = totalPrefetched > 0 ? (totalUsed / totalPrefetched) * 100 : 0;
    
    // Calculate waste rate
    const totalWasted = prefetchWasted.length;
    const wasteRate = totalPrefetched > 0 ? (totalWasted / totalPrefetched) * 100 : 0;
    
    // Calculate cost metrics
    const totalCost = prefetchCompleted.reduce((sum, event) => sum + event.cost, 0);
    const wastedCost = prefetchWasted.reduce((sum, event) => sum + event.cost, 0);
    const costSavings = this.calculateCostSavings(prefetchCompleted, prefetchUsed);
    
    // Calculate accuracy metrics
    const correctPredictions = prefetchUsed.length;
    const incorrectPredictions = prefetchWasted.length;
    const totalPredictions = correctPredictions + incorrectPredictions;
    const predictionAccuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;
    
    const falsePositiveRate = totalPredictions > 0 ? (incorrectPredictions / totalPredictions) * 100 : 0;
    const falseNegativeRate = this.calculateFalseNegativeRate(events);
    
    // Calculate performance metrics
    const averageLoadTime = this.calculateAverageLoadTime(prefetchUsed);
    const loadTimeImprovement = this.calculateLoadTimeImprovement(prefetchUsed);
    
    // Calculate business metrics
    const uniqueUsers = this.getUniqueUsers(events);
    const costPerEngagedUser = uniqueUsers > 0 ? totalCost / uniqueUsers : 0;
    const returnOnInvestment = this.calculateROI(totalCost, prefetchUsed);
    
    return {
      hitRate,
      wasteRate,
      costSavings,
      averageLoadTime,
      loadTimeImprovement,
      predictionAccuracy,
      falsePositiveRate,
      falseNegativeRate,
      costPerEngagedUser,
      returnOnInvestment,
      lastUpdated: Date.now(),
      periodStart,
      periodEnd
    };
  }
  
  private calculateCostSavings(completed: PrefetchEvent[], used: PrefetchEvent[]): number {
    // Estimate cost savings vs naive prefetching (prefetching everything)
    const actualCost = completed.reduce((sum, event) => sum + event.cost, 0);
    const naiveCost = completed.length * 0.024; // $0.017 + $0.007 for details + photo
    return Math.max(0, naiveCost - actualCost);
  }
  
  private calculateFalseNegativeRate(events: PrefetchEvent[]): number {
    // This would require tracking cards that were viewed but not prefetched
    // For now, return a placeholder
    return 0;
  }
  
  private calculateAverageLoadTime(usedEvents: PrefetchEvent[]): number {
    // This would require tracking actual load times
    // For now, return estimated improvement
    return usedEvents.length > 0 ? 150 : 0; // 150ms average for prefetched content
  }
  
  private calculateLoadTimeImprovement(usedEvents: PrefetchEvent[]): number {
    // Estimate improvement vs non-prefetched content
    const prefetchedLoadTime = 150; // ms
    const normalLoadTime = 800; // ms
    return normalLoadTime - prefetchedLoadTime;
  }
  
  private getUniqueUsers(events: PrefetchEvent[]): number {
    // This would require user identification
    // For now, estimate based on session patterns
    return Math.max(1, Math.ceil(events.length / 20)); // Rough estimate
  }
  
  private calculateROI(totalCost: number, usedEvents: PrefetchEvent[]): number {
    // Estimate value generated from successful prefetches
    const estimatedValuePerUse = 0.25; // $0.25 value per successful prefetch use
    const totalValue = usedEvents.length * estimatedValuePerUse;
    return totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
  }
  
  private async loadStoredEvents(): Promise<void> {
    try {
      const stored = await CrossPlatformStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.events = parsed.slice(-this.maxEvents); // Keep only recent events
        }
      }
    } catch (error) {
      console.warn('Failed to load stored analytics events:', error);
    }
  }
  
  private async saveEvents(): Promise<void> {
    try {
      // Only save recent events to avoid storage bloat
      const recentEvents = this.events.slice(-this.maxEvents);
      await CrossPlatformStorage.setItem(this.storageKey, JSON.stringify(recentEvents));
    } catch (error) {
      console.warn('Failed to save analytics events:', error);
    }
  }
  
  // Public API methods
 async clearAnalytics(): Promise<void> {
    this.events = [];
    await CrossPlatformStorage.removeItem(this.storageKey);
  }
  
  exportAnalytics(): PrefetchEvent[] {
    return [...this.events];
  }
  
  getRecentEvents(count: number = 50): PrefetchEvent[] {
    return this.events.slice(-count);
  }
  
  getEventsByType(type: PrefetchEvent['type']): PrefetchEvent[] {
    return this.events.filter(event => event.type === type);
  }
  
  getEventsByCard(cardId: string): PrefetchEvent[] {
    return this.events.filter(event => event.cardId === cardId);
  }
}

// Export singleton instance
export const prefetchAnalytics = new PrefetchAnalyticsService();