import crypto from 'node:crypto';
import { NearbySearchParams, TextSearchParams } from '../types/places';

export const hash = (s: string) => crypto.createHash('sha1').update(s).digest('hex');

export const nearbyKey = (p: NearbySearchParams) => `nearby:${hash(JSON.stringify(p))}`;

export const textSearchKey = (p: TextSearchParams) => `textSearch:${hash(JSON.stringify(p))}`;

export const detailsKey = (id: string) => `details:${id}`;