import { hash, nearbyKey, detailsKey } from '../google/key';
import { NearbySearchParams } from '../types/places';

describe('Cache Key Helpers', () => {
  describe('hash function', () => {
    it('should generate consistent SHA1 hashes', () => {
      const input = 'test string';
      const hash1 = hash(input);
      const hash2 = hash(input);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(40); // SHA1 produces 40 character hex string
      expect(hash1).toBe('661295c9cbf9d6b2f6428414504a8deed3020641'); // Known SHA1 of 'test string'
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = hash('input1');
      const hash2 = hash('input2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('nearbyKey function', () => {
    it('should generate consistent keys for same parameters', () => {
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

    it('should generate different keys for different parameters', () => {
      const params1: NearbySearchParams = {
        lat: 40.7128,
        lng: -74.0060,
        radius: 1500
      };
      
      const params2: NearbySearchParams = {
        lat: 40.7128,
        lng: -74.0060,
        radius: 2000
      };
      
      const key1 = nearbyKey(params1);
      const key2 = nearbyKey(params2);
      
      expect(key1).not.toBe(key2);
    });

    it('should handle optional parameters consistently', () => {
      const paramsWithOptional: NearbySearchParams = {
        lat: 40.7128,
        lng: -74.0060,
        radius: 1500,
        keyword: 'pizza',
        type: 'restaurant'
      };
      
      const paramsWithoutOptional: NearbySearchParams = {
        lat: 40.7128,
        lng: -74.0060,
        radius: 1500
      };
      
      const key1 = nearbyKey(paramsWithOptional);
      const key2 = nearbyKey(paramsWithoutOptional);
      
      expect(key1).not.toBe(key2);
      expect(key1).toMatch(/^nearby:[a-f0-9]{40}$/);
      expect(key2).toMatch(/^nearby:[a-f0-9]{40}$/);
    });
  });

  describe('detailsKey function', () => {
    it('should generate keys with place ID', () => {
      const placeId = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
      const key = detailsKey(placeId);
      
      expect(key).toBe(`details:${placeId}`);
    });

    it('should generate consistent keys for same place ID', () => {
      const placeId = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
      const key1 = detailsKey(placeId);
      const key2 = detailsKey(placeId);
      
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different place IDs', () => {
      const key1 = detailsKey('ChIJN1t_tDeuEmsRUsoyG83frY4');
      const key2 = detailsKey('ChIJrTLr-GyuEmsRBfy61i59si0');
      
      expect(key1).not.toBe(key2);
    });
  });
});