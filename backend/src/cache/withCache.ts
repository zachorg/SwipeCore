import { local } from './local';

export async function withCache<T>(
  key: string,
  ttlSecs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // 1️⃣ Try NodeCache
  const localHit = local.get<T>(key);
  if (localHit) {
    console.log('📦 Production cache hit for key:', key);
    return localHit;
  }

  // 2️⃣ Fetch and store in NodeCache
  console.log('🌐 Production cache miss, fetching fresh data for key:', key);
  const data = await fetcher();
  local.set(key, data, ttlSecs);
  
  return data;
}