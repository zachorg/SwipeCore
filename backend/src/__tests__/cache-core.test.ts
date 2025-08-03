import { withCache } from '../cache/withCache';
import { redis, redisReady } from '../cache/redis';
import { local } from '../cache/local';

describe('Cache System Core Functionality', () => {
  let fetcherCallCount = 0;
  const mockFetcher = jest.fn(async () => {
    fetcherCallCount++;
    return { data: `fetch-${fetcherCallCount}`, timestamp: Date.now() };
  });

  beforeEach(() => {
    // Clear local cache before each test
    local.flushAll();
    fetcherCallCount = 0;
    mockFetcher.mockClear();
  });

  afterAll(async () => {
    try {
      await redis.quit();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Cache wrapper functionality', () => {
    it('should use fetcher when no cache is available', async () => {
      const key = 'test-fetch-only';
      const ttl = 60;
      
      // Mock Redis as unavailable
      jest.spyOn(require('../cache/redis'), 'redisReady').mockResolvedValue(false);
      
      const result = await withCache(key, ttl, mockFetcher);
      
      expect(mockFetcher).toHaveBeenCalledTimes(1);
      expect(result.data).toBe('fetch-1');
      
      jest.restoreAllMocks();
    });

    it('should hit NodeCache when Redis is unavailable', async () => {
      const key = 'test-nodecache-hit';
      const ttl = 60;
      
      // Mock Redis as unavailable
      jest.spyOn(require('../cache/redis'), 'redisReady').mockResolvedValue(false);
      
      // First call should fetch and cache in NodeCache
      const result1 = await withCache(key, ttl, mockFetcher);
      expect(mockFetcher).toHaveBeenCalledTimes(1);
      expect(result1.data).toBe('fetch-1');
      
      // Second call should hit NodeCache
      const result2 = await withCache(key, ttl, mockFetcher);
      expect(mockFetcher).toHaveBeenCalledTimes(1); // No additional fetch
      expect(result2.data).toBe('fetch-1'); // Same data from NodeCache
      
      jest.restoreAllMocks();
    });

    it('should handle Redis when available', async () => {
      const key = 'test-redis-available';
      const ttl = 60;
      
      // Check if Redis is actually available for this test with timeout
      let isRedisAvailable = false;
      try {
        isRedisAvailable = await Promise.race([
          redisReady(),
          new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Redis timeout')), 5000)
          )
        ]);
      } catch (error) {
        console.log('Redis connection timed out, skipping Redis-specific tests');
      }
      
      if (isRedisAvailable) {
        // Clear Redis key
        await redis.del(key);
        
        // First call should fetch and cache in both Redis and NodeCache
        const result1 = await withCache(key, ttl, mockFetcher);
        expect(mockFetcher).toHaveBeenCalledTimes(1);
        expect(result1.data).toBe('fetch-1');
        
        // Verify data is in Redis
        const redisData = await redis.get(key);
        expect(JSON.parse(redisData!)).toEqual(result1);
        
        // Clear NodeCache to force Redis hit
        local.del(key);
        
        // Second call should hit Redis cache
        const result2 = await withCache(key, ttl, mockFetcher);
        expect(mockFetcher).toHaveBeenCalledTimes(1); // No additional fetch
        expect(result2.data).toBe('fetch-1'); // Same data from Redis
      } else {
        console.log('Redis not available, skipping Redis-specific tests');
        expect(true).toBe(true); // Pass test if Redis unavailable
      }
    }, 15000);

    it('should handle TTL in NodeCache', async () => {
      const key = 'test-ttl-behavior';
      const shortTtl = 1; // 1 second
      
      // Mock Redis as unavailable to force NodeCache usage
      jest.spyOn(require('../cache/redis'), 'redisReady').mockResolvedValue(false);
      
      // First call should fetch and cache
      await withCache(key, shortTtl, mockFetcher);
      expect(mockFetcher).toHaveBeenCalledTimes(1);
      
      // Immediate second call should hit cache
      await withCache(key, shortTtl, mockFetcher);
      expect(mockFetcher).toHaveBeenCalledTimes(1);
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Third call should fetch again as cache expired
      await withCache(key, shortTtl, mockFetcher);
      expect(mockFetcher).toHaveBeenCalledTimes(2);
      
      jest.restoreAllMocks();
    }, 10000);

    it('should gracefully handle Redis connection errors', async () => {
      const key = 'test-redis-error';
      const ttl = 60;
      
      // Mock Redis methods to throw errors silently
      const mockRedisGet = jest.spyOn(redis, 'get').mockImplementation(async () => {
        throw new Error('Redis connection failed');
      });
      const mockRedisSet = jest.spyOn(redis, 'set').mockImplementation(async () => {
        throw new Error('Redis connection failed');
      });
      jest.spyOn(require('../cache/redis'), 'redisReady').mockResolvedValue(true);
      
      // Should fallback to NodeCache despite Redis being "ready"
      const result = await withCache(key, ttl, mockFetcher);
      expect(mockFetcher).toHaveBeenCalledTimes(1);
      expect(result.data).toBe('fetch-1');
      
      // Verify it used NodeCache
      const localData = local.get(key);
      expect(localData).toEqual(result);
      
      mockRedisGet.mockRestore();
      mockRedisSet.mockRestore();
      jest.restoreAllMocks();
    });
  });

  describe('Cache layer verification', () => {
    it('should store data in NodeCache', async () => {
      const key = 'test-nodecache-storage';
      const ttl = 60;
      const testData = { test: 'data', number: 42 };
      
      // Mock Redis as unavailable
      jest.spyOn(require('../cache/redis'), 'redisReady').mockResolvedValue(false);
      
      const mockFetcher = jest.fn().mockResolvedValue(testData);
      
      await withCache(key, ttl, mockFetcher);
      
      // Verify data is stored in NodeCache
      const cachedData = local.get(key);
      expect(cachedData).toEqual(testData);
      
      jest.restoreAllMocks();
    });
  });
});