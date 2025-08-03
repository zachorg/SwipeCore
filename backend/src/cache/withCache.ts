import { redis, redisReady } from './redis';
import { local } from './local';

export async function withCache<T>(
  key: string,
  ttlSecs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // 1️⃣ Try Redis
  if (await redisReady()) {
    try {
      const hit = await redis.get(key);
      if (hit) return JSON.parse(hit);
    } catch (error) {
      // Redis error, continue to NodeCache
    }
  }

  // 2️⃣ Try NodeCache
  const localHit = local.get<T>(key);
  if (localHit) return localHit;

  // 3️⃣ Fetch, then store in both layers
  const data = await fetcher();
  
  // Store in Redis if available
  if (await redisReady()) {
    try {
      await redis.set(key, JSON.stringify(data), 'EX', ttlSecs);
    } catch (error) {
      // Redis error, continue - data will still be in NodeCache
    }
  }
  
  local.set(key, data, ttlSecs);
  return data;
}