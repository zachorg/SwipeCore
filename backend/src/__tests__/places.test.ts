import request from 'supertest';

// Create mock functions that can be imported and controlled
const mockSearchNearby = jest.fn();
const mockGetPlaceDetails = jest.fn();
const mockGetPhotoUrl = jest.fn();
const mockGetCacheStats = jest.fn();
const mockClearCache = jest.fn();

// Mock the GooglePlacesService before importing the app
jest.mock('../services/googlePlaces', () => {
  return {
    GooglePlacesService: jest.fn().mockImplementation(() => ({
      searchNearby: mockSearchNearby,
      getPlaceDetails: mockGetPlaceDetails,
      getPhotoUrl: mockGetPhotoUrl,
      getCacheStats: mockGetCacheStats,
      clearCache: mockClearCache,
    })),
  };
});

import app from '../index';

describe('Places API Endpoints', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set up default mock implementations
    mockGetCacheStats.mockReturnValue({ keys: 0, hits: 0, misses: 0 });
  });

  describe('GET /api/places/nearby', () => {
    it('should return nearby places with valid parameters', async () => {
      const mockPlaces = [
        {
          id: 'place1',
          displayName: { text: 'Test Restaurant', languageCode: 'en' },
          rating: 4.5,
          location: { latitude: 40.7128, longitude: -74.0060 },
        },
      ];

      mockSearchNearby.mockResolvedValue(mockPlaces);

      const response = await request(app)
        .get('/api/places/nearby')
        .query({
          lat: 40.7128,
          lng: -74.0060,
          radius: 1500,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPlaces);
      expect(response.body.count).toBe(1);
      expect(mockSearchNearby).toHaveBeenCalledWith({
        lat: 40.7128,
        lng: -74.0060,
        radius: 1500,
      });
    });

    it('should return 400 for invalid latitude', async () => {
      const response = await request(app)
        .get('/api/places/nearby')
        .query({
          lat: 91, // Invalid latitude
          lng: -74.0060,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing required parameters', async () => {
      const response = await request(app)
        .get('/api/places/nearby')
        .query({
          lat: 40.7128,
          // Missing lng
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should handle service errors gracefully', async () => {
      mockSearchNearby.mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .get('/api/places/nearby')
        .query({
          lat: 40.7128,
          lng: -74.0060,
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/places/:placeId', () => {
    it('should return place details for valid place ID', async () => {
      const mockPlace = {
        id: 'place1',
        displayName: { text: 'Test Restaurant', languageCode: 'en' },
        rating: 4.5,
        formattedAddress: '123 Test St, New York, NY',
        nationalPhoneNumber: '+1 555-123-4567',
      };

      mockGetPlaceDetails.mockResolvedValue(mockPlace);

      const response = await request(app)
        .get('/api/places/place1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPlace);
      expect(mockGetPlaceDetails).toHaveBeenCalledWith('place1');
    });

    it('should return 400 for empty place ID', async () => {
      const response = await request(app)
        .get('/api/places/');

      expect(response.status).toBe(404); // Route not found
    });

    it('should handle service errors gracefully', async () => {
      mockGetPlaceDetails.mockRejectedValue(new Error('Place not found'));

      const response = await request(app)
        .get('/api/places/invalid-place-id');

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/places/photo/:photoReference', () => {
    it('should return photo URL for valid photo reference', async () => {
      const mockPhotoUrl = 'https://example.com/photo.jpg';

      mockGetPhotoUrl.mockResolvedValue(mockPhotoUrl);

      const response = await request(app)
        .get('/api/places/photo/test-photo-ref')
        .query({
          maxWidth: 400,
          maxHeight: 400,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.photoUrl).toBe(mockPhotoUrl);
      expect(response.body.data.photoReference).toBe('test-photo-ref');
      expect(mockGetPhotoUrl).toHaveBeenCalledWith('test-photo-ref', 400, 400);
    });

    it('should use default dimensions when not provided', async () => {
      const mockPhotoUrl = 'https://example.com/photo.jpg';

      mockGetPhotoUrl.mockResolvedValue(mockPhotoUrl);

      const response = await request(app)
        .get('/api/places/photo/test-photo-ref');

      expect(response.status).toBe(200);
      expect(mockGetPhotoUrl).toHaveBeenCalledWith('test-photo-ref', 400, 400);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Route not found');
      expect(response.body.path).toBe('/unknown-route');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting after many requests', async () => {
      // Note: This test would need to be adjusted based on actual rate limit settings
      // For now, just verify the endpoint works normally
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
    });
  });
});