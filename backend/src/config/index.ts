import { config as load } from 'dotenv-flow';

load();

export const config = {
  cacheTtlDays: Number(process.env.CACHE_TTL_DAYS) || 1,
  apiMode: process.env.GOOGLE_API_MODE ?? 'live',
  fixtureDir: process.env.FIXTURE_DIR ?? './test/fixtures',
  
  // Server config
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY!,
  placesBaseUrl: process.env.PLACES_BASE_URL || 'https://places.googleapis.com/v1',
  
  // Dev cache settings (file-based caching for development)
  useDevCache: process.env.USE_DEV_CACHE !== 'false', // Enabled by default in dev
  
  // Rate limiting
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 600000,
  rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // Cache TTLs (in seconds)
  cacheTtlNearby: Number(process.env.CACHE_TTL_NEARBY) || 300,
  cacheTtlDetails: Number(process.env.CACHE_TTL_DETAILS) || 1800,
  cacheTtlPhotos: Number(process.env.CACHE_TTL_PHOTOS) || 3600,
};