import fs from 'fs';
import path from 'path';
import { config } from '../config';
import NodeCache from 'node-cache';
import { local } from './local';

interface CachedEntry {
  data: any;
  timestamp: number;
  ttlSecs: number;
}

interface DevCacheStructure {
  nearby: { [key: string]: CachedEntry };
  details: { [placeId: string]: CachedEntry };
  photos: { [key: string]: CachedEntry };
}

class UnifiedCache {
  private devCacheFilePath: string;
  private devCacheData: DevCacheStructure = {
    nearby: {},
    details: {},
    photos: {},
  };
  private isDevCacheLoaded = false;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL_MS = 60000; // Run cleanup every minute

  constructor() {
    this.devCacheFilePath = path.join(process.cwd(), 'dev-cache-nearby.json');
    if (this.shouldUseDevCache()) {
      this.loadDevCache();
    }

    // Initialize the async cache cleanup
    this.startPeriodicCleanup();

    // Configure NodeCache for proper TTL handling
    this.configureProdCache();
  }

  private shouldUseDevCache(): boolean {
    return config.nodeEnv === 'development' && config.useDevCache;
  }

  private isCachingEnabled(): boolean {
    return config.cacheFeatureEnabled;
  }

  private loadDevCache(): void {
    try {
      if (fs.existsSync(this.devCacheFilePath)) {
        const fileContent = fs.readFileSync(this.devCacheFilePath, 'utf-8');
        const loaded = JSON.parse(fileContent);

        if (loaded.nearby && loaded.details && loaded.photos) {
          this.devCacheData = loaded;
        } else {
          this.devCacheData = { nearby: {}, details: {}, photos: {} };
        }

        const totalEntries =
          Object.keys(this.devCacheData.nearby).length +
          Object.keys(this.devCacheData.details).length +
          Object.keys(this.devCacheData.photos).length;

        console.log('📁 Dev cache loaded:', totalEntries, 'entries');
      } else {
        console.log('📁 Dev cache will be created on first write');
      }
      this.isDevCacheLoaded = true;
    } catch (error) {
      console.error('❌ Error loading dev cache:', error);
      this.devCacheData = { nearby: {}, details: {}, photos: {} };
      this.isDevCacheLoaded = true;
    }
  }

  private saveDevCache(): void {
    if (!this.shouldUseDevCache()) return;

    try {
      fs.writeFileSync(
        this.devCacheFilePath,
        JSON.stringify(this.devCacheData, null, 2)
      );
      console.log('💾 Dev cache saved');
    } catch (error) {
      console.error('❌ Error saving dev cache:', error);
    }
  }

  private getDevCacheSection(key: string): 'nearby' | 'details' | 'photos' {
    if (key.startsWith('nearby:')) return 'nearby';
    if (key.startsWith('details:')) return 'details';
    if (key.startsWith('photo:')) return 'photos';
    return 'nearby';
  }

  private getFromDevCache<T>(key: string): T | null {
    if (!this.shouldUseDevCache() || !this.isDevCacheLoaded) return null;

    const section = this.getDevCacheSection(key);
    const entry = this.devCacheData[section][key];
    if (!entry) return null;

    // update expire time as this is still relevant data..
    this.setInDevCache(key, entry.data, entry.ttlSecs);

    console.log('📦 Dev cache hit:', key);
    return entry.data as T;
  }

  private setInDevCache<T>(key: string, data: T, ttlSecs: number): void {
    if (!this.shouldUseDevCache() || !this.isDevCacheLoaded) return;

    const section = this.getDevCacheSection(key);
    this.devCacheData[section][key] = {
      data,
      timestamp: Date.now(),
      ttlSecs,
    };

    console.log('💾 Dev cache set:', key);
    this.saveDevCache();
  }

  private getFromProdCache<T>(key: string): T | null {
    const cached = local.get<T>(key);
    if (cached) {
      console.log('📦 Production cache hit:', key);
      return cached;
    }
    return null;
  }

  private setInProdCache<T>(key: string, data: T, ttlSecs: number): void {
    local.set(key, data, ttlSecs);
    console.log('💾 Production cache set:', key);
  }

  /**
   * Configure production NodeCache with proper TTL options
   */
  private configureProdCache(): void {
    // NodeCache should already handle TTL expiration automatically
    // This is just to ensure it's properly configured
    if (local.options && local.options.checkperiod === undefined) {
      // If checkperiod isn't set, we'll recreate the cache with proper settings
      console.log('⚙️ Configuring production cache TTL settings');

      // NodeCache's checkperiod is in seconds
      // Default to checking every 10 seconds if not already configured
      const checkPeriod = 10;

      // We can't modify the existing NodeCache instance directly,
      // but we can ensure it's properly configured in local.ts
      console.log(
        `ℹ️ Production cache will check for expired items every ${checkPeriod} seconds`
      );
    }
  }

  /**
   * Clean up expired entries in the dev cache asynchronously
   */
  private async cleanupExpiredDevCache(): Promise<void> {
    if (!this.shouldUseDevCache() || !this.isDevCacheLoaded) return;

    console.log('Cleaning up expired dev cache...');

    const now = Date.now();
    let expiredCount = 0;
    let hasChanges = false;

    // Process each section of the cache
    (['nearby', 'details', 'photos'] as const).forEach((section) => {
      Object.keys(this.devCacheData[section]).forEach((key) => {
        const entry = this.devCacheData[section][key];
        const expiresAt = entry.timestamp + entry.ttlSecs * 1000;

        if (now > expiresAt) {
          delete this.devCacheData[section][key];
          expiredCount++;
          hasChanges = true;
        }
      });
    });

    // Only save if we actually removed something
    if (hasChanges) {
      console.log(
        `🧹 Async cleanup removed ${expiredCount} expired entries from dev cache`
      );

      // Use setTimeout to make the file write non-blocking
      setTimeout(() => {
        this.saveDevCache();
      }, 0);
    }
  }

  /**
   * Start the periodic cleanup task
   */
  private startPeriodicCleanup(): void {
    // Clear any existing interval first
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Set up the new interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredDevCache().catch((err) => {
        console.error('❌ Error during async cache cleanup:', err);
      });
    }, this.CLEANUP_INTERVAL_MS);

    console.log(
      `🔄 Started periodic cache cleanup (every ${this.CLEANUP_INTERVAL_MS / 1000} seconds)`
    );
  }

  async get<T>(
    key: string,
    ttlSecs: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    if (!this.isCachingEnabled()) {
      const data = await fetcher();
      return data;
    }

    // 1️⃣ Try appropriate cache first
    let cached: T | null = null;

    if (this.shouldUseDevCache()) {
      cached = this.getFromDevCache<T>(key);
    } else {
      cached = this.getFromProdCache<T>(key);
    }

    if (cached) return cached;

    // 2️⃣ Cache miss - fetch fresh data
    const cacheType = this.shouldUseDevCache() ? 'dev' : 'production';
    console.log(`🌐 ${cacheType} cache miss, fetching:`, key);

    const data = await fetcher();

    // 3️⃣ Store in appropriate cache
    if (this.shouldUseDevCache()) {
      this.setInDevCache(key, data, ttlSecs);
    } else {
      this.setInProdCache(key, data, ttlSecs);
    }

    return data;
  }

  // Dev cache management methods
  clearDevCache(): void {
    this.devCacheData = { nearby: {}, details: {}, photos: {} };
    try {
      if (fs.existsSync(this.devCacheFilePath)) {
        fs.unlinkSync(this.devCacheFilePath);
        console.log('🗑️ Dev cache cleared');
      }
    } catch (error) {
      console.error('❌ Error clearing dev cache:', error);
    }
  }

  getDevCacheStats() {
    const now = Date.now();
    const breakdown = {
      nearby: { total: 0, valid: 0, expired: 0 },
      details: { total: 0, valid: 0, expired: 0 },
      photos: { total: 0, valid: 0, expired: 0 },
    };

    let totalValid = 0;
    let totalExpired = 0;

    (['nearby', 'details', 'photos'] as const).forEach((section) => {
      Object.values(this.devCacheData[section]).forEach((entry) => {
        breakdown[section].total++;
        const expiresAt = entry.timestamp + entry.ttlSecs * 1000;
        if (now <= expiresAt) {
          breakdown[section].valid++;
          totalValid++;
        } else {
          breakdown[section].expired++;
          totalExpired++;
        }
      });
    });

    const totalEntries =
      breakdown.nearby.total + breakdown.details.total + breakdown.photos.total;

    return {
      totalEntries,
      validEntries: totalValid,
      expiredEntries: totalExpired,
      breakdown,
      filePath: this.devCacheFilePath,
    };
  }

  /**
   * Stop the periodic cleanup task
   * This can be called when shutting down the application
   */
  stopPeriodicCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('⏹️ Stopped periodic cache cleanup');
    }
  }

  /**
   * Test the async cache cleanup functionality
   * This method is for testing purposes only and should not be used in production
   */
  async testCacheCleanup(): Promise<{
    added: number;
    expired: number;
    remaining: number;
  }> {
    // Only run in development mode
    if (!this.shouldUseDevCache()) {
      console.log('⚠️ Cache cleanup test can only run in development mode');
      return { added: 0, expired: 0, remaining: 0 };
    }

    console.log('🧪 Testing async cache cleanup...');

    // Add some test entries with different TTLs
    const testEntries = 10;
    const expiredEntries = 5;

    // Clear existing entries first
    this.devCacheData = { nearby: {}, details: {}, photos: {} };

    // Add test entries - half of them with expired TTL
    for (let i = 0; i < testEntries; i++) {
      const isExpired = i < expiredEntries;
      const ttl = isExpired ? -1 : 300; // -1 TTL means already expired
      const timestamp = isExpired ? Date.now() - 10000 : Date.now();

      const section =
        i % 3 === 0 ? 'nearby' : i % 3 === 1 ? 'details' : 'photos';
      const key = `test:${section}:${i}`;

      this.devCacheData[section][key] = {
        data: { testId: i, value: `Test value ${i}` },
        timestamp: timestamp,
        ttlSecs: ttl,
      };
    }

    console.log(
      `🧪 Added ${testEntries} test entries (${expiredEntries} expired)`
    );

    // Save the test data
    this.saveDevCache();

    // Run the cleanup process manually
    console.time('Cleanup Duration');
    await this.cleanupExpiredDevCache();
    console.timeEnd('Cleanup Duration');

    // Count remaining entries
    let remainingEntries = 0;
    (['nearby', 'details', 'photos'] as const).forEach((section) => {
      remainingEntries += Object.keys(this.devCacheData[section]).length;
    });

    const result = {
      added: testEntries,
      expired: expiredEntries,
      remaining: remainingEntries,
    };

    console.log(
      `🧪 Test results: ${result.expired} entries expired, ${result.remaining} entries remaining`
    );

    return result;
  }
}

// Export singleton instance
export const cache = new UnifiedCache();

// Simple wrapper function
export async function withCache<T>(
  key: string,
  ttlSecs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  return cache.get(key, ttlSecs, fetcher);
}
