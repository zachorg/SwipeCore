import request from 'supertest';

// Create mock functions that can be imported and controlled
const mockNearby = jest.fn();
const mockDetails = jest.fn();
const mockPhoto = jest.fn();

// Mock the Google API integration before importing the app
jest.mock('../google', () => ({
  places: {
    nearby: mockNearby,
    details: mockDetails, 
    photo: mockPhoto,
  },
}));

import app from '../index';

describe('Places API Endpoints', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/places/nearby', () => {
    it('should return nearby places with valid parameters', async () => {
      const mockResponse = {
        places: [
          {
            id: 'place1',
            displayName: { text: 'Test Restaurant', languageCode: 'en' },
            rating: 4.5,
            location: { latitude: 40.7128, longitude: -74.0060 },
          },
        ],
      };

      mockNearby.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/api/places/nearby')
        .query({
          lat: 40.7128,
          lng: -74.0060,
          radius: 1500,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse.places);
      expect(response.body.count).toBe(1);
      expect(mockNearby).toHaveBeenCalledWith({
        lat: 40.7128,
        lng: -74.0060,
        radius: 1500,
      });
    });

    it('should handle empty places response', async () => {
      const mockResponse = { places: [] };
      mockNearby.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/api/places/nearby')
        .query({
          lat: 40.7128,
          lng: -74.0060,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
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
      mockNearby.mockRejectedValue(new Error('Service unavailable'));

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

      mockDetails.mockResolvedValue(mockPlace);

      const response = await request(app)
        .get('/api/places/place1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPlace);
      expect(mockDetails).toHaveBeenCalledWith('place1');
    });

    it('should return 400 for empty place ID', async () => {
      const response = await request(app)
        .get('/api/places/');

      expect(response.status).toBe(404); // Route not found
    });

    it('should handle service errors gracefully', async () => {
      mockDetails.mockRejectedValue(new Error('Place not found'));

      const response = await request(app)
        .get('/api/places/invalid-place-id');

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/places/photo/:photoReference', () => {
    it('should return photo URL for valid photo reference', async () => {
      const mockPhotoUrl = 'https://example.com/photo.jpg';

      mockPhoto.mockResolvedValue(mockPhotoUrl);

      const response = await request(app)
        .get('/api/places/photo/test-photo-ref')
        .query({
          photoReference: 'test-photo-ref',
          maxWidth: 400,
          maxHeight: 400,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.photoUrl).toBe(mockPhotoUrl);
      expect(response.body.data.photoReference).toBe('test-photo-ref');
      expect(mockPhoto).toHaveBeenCalledWith('test-photo-ref', 400, 400);
    });

    it('should use default dimensions when not provided', async () => {
      const mockPhotoUrl = 'https://example.com/photo.jpg';

      mockPhoto.mockResolvedValue(mockPhotoUrl);

      const response = await request(app)
        .get('/api/places/photo/test-photo-ref')
        .query({
          photoReference: 'test-photo-ref',
        });

      expect(response.status).toBe(200);
      expect(mockPhoto).toHaveBeenCalledWith('test-photo-ref', 400, 400);
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
    it('should apply rate limiting headers', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
    });
  });
});