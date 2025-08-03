import Redis from 'ioredis';
import { config } from '../config';

export const redis = new Redis(config.redisUrl, { lazyConnect: true });

export async function redisReady(): Promise<boolean> {
  try {
    // Check if already connected
    if (redis.status === 'ready') {
      await redis.ping();
      return true;
    }
    
    // Try to connect if not connected
    if (redis.status === 'close') {
      await redis.connect();
    }
    
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}