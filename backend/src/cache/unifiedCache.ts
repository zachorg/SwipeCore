import fs from 'fs';
import path from 'path';
import { config } from '../config';
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

  constructor() {
    this.devCacheFilePath = path.join(process.cwd(), 'dev-cache-nearby.json');
    if (this.shouldUseDevCache()) {
      this.loadDevCache();
    }
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

    const now = Date.now();
    const expiresAt = entry.timestamp + entry.ttlSecs * 1000;

    if (now > expiresAt) {
      console.log('🕐 Cache entry expired:', key);
      delete this.devCacheData[section][key];
      this.saveDevCache();
      return null;
    }

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
