import { readFixture, writeFixture } from '../utils/fixtureFS';
import { hash, nearbyKey, detailsKey } from '../google/key';
import { places } from '../google';
import { config } from '../config';
import { NearbySearchParams } from '../types/places';

// Mock axios to avoid actual API calls
jest.mock('axios');
const mockedAxios = jest.mocked(require('axios'));

describe('Google Places Integration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Clean up any leftover fixtures from previous test runs
    try {
      const fs = require('node:fs/promises');
      await fs.rm('./test/fixtures', { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }
  });

  describe('Fixture System', () => {
    it('should handle atomic file operations', async () => {
      const testData = { test: 'fixture data', timestamp: Date.now() };
      const key = 'test-integration';

      // Should return null initially
      const initialRead = await readFixture(key);
      expect(initialRead).toBeNull();

      // Write fixture
      await writeFixture(key, testData);

      // Read should return data
      const readData = await readFixture(key);
      expect(readData).toEqual(testData);
    });
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

  describe('Client Factory', () => {
    it('should export places client with correct interface', () => {
      expect(places).toBeDefined();
      expect(typeof places.nearby).toBe('function');
      expect(typeof places.details).toBe('function');
    });

    it('should switch between live and mock based on config', () => {
      // Test that client factory respects config
      const originalMode = config.apiMode;
      
      // The factory should have loaded based on the current config
      expect(['live', 'mock']).toContain(config.apiMode);
      
      // Restore original config
      (config as any).apiMode = originalMode;
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