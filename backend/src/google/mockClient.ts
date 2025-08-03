import * as live from './liveClient';
import { readFixture, writeFixture } from '../utils/fixtureFS';
import { nearbyKey, detailsKey } from './key';
import { NearbySearchParams } from '../types/places';

export async function nearby(p: NearbySearchParams) {
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
  const k = detailsKey(id);
  const hit = await readFixture(k);
  if (hit) return hit;
  
  const data = await live.details(id);
  try {
    await writeFixture(k, data);
  } catch (error) {
    // File might already exist (race condition), ignore
  }
  return data;
}

export async function photo(photoReference: string, maxWidth: number = 400, maxHeight: number = 400): Promise<string> {
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