import { hash, nearbyKey, detailsKey } from '../google/key';
import * as places from '../google';
import { config } from '../config';
import { NearbySearchParams } from '../types/places';

// Mock axios to avoid actual API calls
jest.mock('axios');
const mockedAxios = jest.mocked(require('axios'));

describe('Google Places Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Key Generation', () => {
    it('should generate consistent cache keys', () => {
      const params: NearbySearchParams = {
        lat: 40.7128,
        lng: -74.0060,
        radius: 1500,
        keyword: 'restaurant'
      };

      const key1 = nearbyKey(params);
      const key2 = nearbyKey(params);
      
      expect(key1).toBe(key2);
      expect(key1).toMatch(/^nearby:[a-f0-9]{40}$/);
    });

    it('should generate place ID keys', () => {
      const placeId = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
      const key = detailsKey(placeId);
      
      expect(key).toBe(`details:${placeId}`);
    });
  });

  describe('Client Interface', () => {
    it('should export places client with correct interface', () => {
      expect(places).toBeDefined();
      expect(typeof places.nearby).toBe('function');
      expect(typeof places.details).toBe('function');
      expect(typeof places.photo).toBe('function');
    });
  });

  describe('Hash Function', () => {
    it('should generate consistent SHA1 hashes', () => {
      const input = 'test-hash-input';
      const hash1 = hash(input);
      const hash2 = hash(input);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(40);
    });
  });
});