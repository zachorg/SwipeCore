import { withCache } from '../cache';
import { local } from '../cache/local';

describe('Unified Cache System', () => {
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

  describe('Unified cache functionality', () => {
    it('should use fetcher when no cache is available', async () => {
      const key = 'test-fetch-only';
      const ttl = 60;
      
      const result = await withCache(key, ttl, mockFetcher);
      
      expect(mockFetcher).toHaveBeenCalledTimes(1);
      expect(result.data).toBe('fetch-1');
    });

    it('should hit cache on subsequent calls', async () => {
      const key = 'test-nodecache-hit';
      const ttl = 60;
      
      // First call should fetch and cache in NodeCache
      const result1 = await withCache(key, ttl, mockFetcher);
      expect(mockFetcher).toHaveBeenCalledTimes(1);
      expect(result1.data).toBe('fetch-1');
      
      // Second call should hit cache
      const result2 = await withCache(key, ttl, mockFetcher);
      expect(mockFetcher).toHaveBeenCalledTimes(1); // No additional fetch
      expect(result2.data).toBe('fetch-1'); // Same data from cache
    });

    it('should handle TTL expiration', async () => {
      const key = 'test-ttl-behavior';
      const shortTtl = 1; // 1 second
      
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
    }, 10000);

    it('should store data correctly in cache', async () => {
      const key = 'test-nodecache-storage';
      const ttl = 60;
      const testData = { test: 'data', number: 42 };
      
      const mockFetcher = jest.fn().mockResolvedValue(testData);
      
      await withCache(key, ttl, mockFetcher);
      
      // Verify data is stored (in test env, uses NodeCache)
      const cachedData = local.get(key);
      expect(cachedData).toEqual(testData);
    });

    it('should handle different cache keys independently', async () => {
      const key1 = 'test-key-1';
      const key2 = 'test-key-2';
      const ttl = 60;
      
      const mockFetcher1 = jest.fn().mockResolvedValue({ data: 'result-1' });
      const mockFetcher2 = jest.fn().mockResolvedValue({ data: 'result-2' });
      
      // Cache different data with different keys
      const result1 = await withCache(key1, ttl, mockFetcher1);
      const result2 = await withCache(key2, ttl, mockFetcher2);
      
      // Verify both were fetched
      expect(mockFetcher1).toHaveBeenCalledTimes(1);
      expect(mockFetcher2).toHaveBeenCalledTimes(1);
      expect((result1 as any).data).toBe('result-1');
      expect((result2 as any).data).toBe('result-2');
      
      // Verify they're cached independently
      const cachedResult1 = await withCache(key1, ttl, mockFetcher1);
      const cachedResult2 = await withCache(key2, ttl, mockFetcher2);
      
      // No additional fetches should occur
      expect(mockFetcher1).toHaveBeenCalledTimes(1);
      expect(mockFetcher2).toHaveBeenCalledTimes(1);
      expect((cachedResult1 as any).data).toBe('result-1');
      expect((cachedResult2 as any).data).toBe('result-2');
    });
  });
});