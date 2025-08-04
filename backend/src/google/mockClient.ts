import * as live from './liveClient';
import { nearbyKey, detailsKey } from './key';
import { readFixture, writeFixture } from '../utils/fixtureFS';
import { withDevCache } from '../cache/devCache';
import { config } from '../config';
import { NearbySearchParams } from '../types/places';

export async function nearby(p: NearbySearchParams) {
  // In development with dev cache enabled, use the consolidated dev cache
  if (config.nodeEnv === 'development' && config.useDevCache) {
    return withDevCache(
      nearbyKey(p),
      config.cacheTtlDays * 86400,
      () => live.nearby(p)
    );
  }

  // Otherwise use the fixture system (for testing/mock mode)
  const k = nearbyKey(p);
  const hit = await readFixture(k);
  if (hit) return hit;

  const data = await live.nearby(p);
  try {
    await writeFixture(k, data);
  } catch (error) {
    // File might already exist (race condition), ignore
  }
  return data;
}

export async function details(id: string) {
  // In development with dev cache enabled, use the consolidated dev cache
  if (config.nodeEnv === 'development' && config.useDevCache) {
    return withDevCache(
      detailsKey(id),
      config.cacheTtlDays * 86400,
      () => live.details(id, { skipDevCache: true }) // Prevent circular dependency
    );
  }

  // Otherwise use the fixture system (for testing/mock mode) 
  const k = detailsKey(id);
  const hit = await readFixture(k);
  if (hit) return hit;
  
  const data = await live.details(id, { skipDevCache: true });
  try {
    await writeFixture(k, data);
  } catch (error) {
    // File might already exist (race condition), ignore
  }
  return data;
}

export async function photo(photoReference: string, maxWidth: number = 400, maxHeight: number = 400): Promise<string> {
  // In development with dev cache enabled, use the consolidated dev cache
  if (config.nodeEnv === 'development' && config.useDevCache) {
    return withDevCache(
      `photo:${photoReference}:${maxWidth}:${maxHeight}`,
      config.cacheTtlDays * 86400,
      () => live.photo(photoReference, maxWidth, maxHeight)
    );
  }

  // Otherwise use the fixture system (for testing/mock mode)
  const k = `photo:${photoReference}:${maxWidth}:${maxHeight}`;
  const hit = await readFixture(k);
  if (hit) return hit;
  
  const data = await live.photo(photoReference, maxWidth, maxHeight);
  try {
    await writeFixture(k, data);
  } catch (error) {
    // File might already exist (race condition), ignore
  }
  return data;
}