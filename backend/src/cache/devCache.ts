import fs from 'fs';
import path from 'path';
import { config } from '../config';

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

class DevFileCache {
  private cacheFilePath: string;
  private cacheData: DevCacheStructure = {
    nearby: {},
    details: {},
    photos: {}
  };
  private isLoaded = false;

  constructor() {
    // Store single cache file in backend root directory  
    this.cacheFilePath = path.join(process.cwd(), 'dev-cache-nearby.json');
    this.cleanupOldCacheFiles();
    this.loadCache();
  }

  private cleanupOldCacheFiles(): void {
    try {
      const oldCacheFile = path.join(process.cwd(), 'dev-cache.json');
      if (fs.existsSync(oldCacheFile)) {
        fs.unlinkSync(oldCacheFile);
        console.log('🧹 Cleaned up old dev-cache.json file');
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  private loadCache(): void {
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        const fileContent = fs.readFileSync(this.cacheFilePath, 'utf-8');
        const loaded = JSON.parse(fileContent);
        
        // Handle legacy cache format or initialize new structure
        if (loaded.nearby && loaded.details && loaded.photos) {
          this.cacheData = loaded;
        } else {
          // Legacy format - convert or start fresh
          this.cacheData = { nearby: {}, details: {}, photos: {} };
        }
        
        const totalEntries = Object.keys(this.cacheData.nearby).length + 
                           Object.keys(this.cacheData.details).length + 
                           Object.keys(this.cacheData.photos).length;
        
        console.log('📁 Dev cache loaded from:', this.cacheFilePath);
        console.log('📁 Cache contains:', {
          nearby: Object.keys(this.cacheData.nearby).length,
          details: Object.keys(this.cacheData.details).length, 
          photos: Object.keys(this.cacheData.photos).length,
          total: totalEntries
        });
      } else {
        console.log('📁 No dev cache file found, will create on first write');
      }
      this.isLoaded = true;
    } catch (error) {
      console.error('❌ Error loading dev cache:', error);
      this.cacheData = { nearby: {}, details: {}, photos: {} };
      this.isLoaded = true;
    }
  }

  private saveCache(): void {
    try {
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(this.cacheData, null, 2));
      console.log('💾 Dev cache saved to file:', this.cacheFilePath);
    } catch (error) {
      console.error('❌ Error saving dev cache:', error);
    }
  }

  private getCacheSection(key: string): 'nearby' | 'details' | 'photos' {
    if (key.startsWith('nearby:')) return 'nearby';
    if (key.startsWith('details:')) return 'details';
    if (key.startsWith('photo:')) return 'photos';
    return 'nearby'; // fallback
  }

  get<T>(key: string): T | null {
    if (!this.isLoaded) return null;

    const section = this.getCacheSection(key);
    const entry = this.cacheData[section][key];
    if (!entry) return null;

    // Check if expired
    const now = Date.now();
    const expiresAt = entry.timestamp + (entry.ttlSecs * 1000);
    
    if (now > expiresAt) {
      console.log('🕐 Dev cache entry expired for key:', key);
      delete this.cacheData[section][key];
      this.saveCache();
      return null;
    }

    console.log('📦 Dev cache hit for key:', key, `(${section})`);
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSecs: number): void {
    if (!this.isLoaded) return;

    const section = this.getCacheSection(key);
    this.cacheData[section][key] = {
      data,
      timestamp: Date.now(),
      ttlSecs
    };

    console.log('💾 Dev cache set for key:', key, `(${section})`);
    this.saveCache();
  }

  has(key: string): boolean {
    if (!this.isLoaded) return false;
    
    const section = this.getCacheSection(key);
    const entry = this.cacheData[section][key];
    if (!entry) return false;

    // Check if expired
    const now = Date.now();
    const expiresAt = entry.timestamp + (entry.ttlSecs * 1000);
    
    return now <= expiresAt;
  }

  clear(): void {
    this.cacheData = { nearby: {}, details: {}, photos: {} };
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        fs.unlinkSync(this.cacheFilePath);
        console.log('🗑️ Dev cache file deleted');
      }
    } catch (error) {
      console.error('❌ Error deleting dev cache file:', error);
    }
  }

  getCacheStats(): { 
    totalEntries: number; 
    validEntries: number; 
    expiredEntries: number;
    breakdown: {
      nearby: { total: number; valid: number; expired: number };
      details: { total: number; valid: number; expired: number };
      photos: { total: number; valid: number; expired: number };
    };
    filePath: string;
  } {
    const now = Date.now();
    const breakdown = {
      nearby: { total: 0, valid: 0, expired: 0 },
      details: { total: 0, valid: 0, expired: 0 },
      photos: { total: 0, valid: 0, expired: 0 }
    };

    let totalValid = 0;
    let totalExpired = 0;

    (['nearby', 'details', 'photos'] as const).forEach(section => {
      Object.values(this.cacheData[section]).forEach(entry => {
        breakdown[section].total++;
        const expiresAt = entry.timestamp + (entry.ttlSecs * 1000);
        if (now <= expiresAt) {
          breakdown[section].valid++;
          totalValid++;
        } else {
          breakdown[section].expired++;
          totalExpired++;
        }
      });
    });

    const totalEntries = breakdown.nearby.total + breakdown.details.total + breakdown.photos.total;

    return {
      totalEntries,
      validEntries: totalValid,
      expiredEntries: totalExpired,
      breakdown,
      filePath: this.cacheFilePath
    };
  }
}

// Create singleton instance
export const devCache = new DevFileCache();

// Enhanced withCache function that uses dev file cache in development
export async function withDevCache<T>(
  key: string,
  ttlSecs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Only use dev cache in development mode
  if (config.nodeEnv !== 'development' && config.nodeEnv !== 'dev') {
    // Fall back to regular cache in non-dev environments
    const { withCache } = await import('./withCache');
    return withCache(key, ttlSecs, fetcher);
  }

  // 1️⃣ Try dev file cache first
  const cached = devCache.get<T>(key);
  if (cached) {
    return cached;
  }

  // 2️⃣ Fetch fresh data
  console.log('🌐 Dev cache miss, fetching fresh data for key:', key);
  const data = await fetcher();
  
  // 3️⃣ Store in dev cache
  devCache.set(key, data, ttlSecs);
  
  return data;
}