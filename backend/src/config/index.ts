import { config as load } from 'dotenv-flow';

load();

export const config = {
  cacheTtlDays: Number(process.env.CACHE_TTL_DAYS) || 1,
  
  // Server config
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY!,
  placesBaseUrl: process.env.PLACES_BASE_URL || 'https://places.googleapis.com/v1',
  
  // Dev cache settings (file-based caching for development)
  useDevCache: process.env.USE_DEV_CACHE !== 'false', // Enabled by default in dev
  cacheFeatureEnabled: process.env.ENABLE_CACHE_FEATURE !== 'false',
  
  // Rate limiting
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 600000,
  rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
};

// validate all envs..
function validateDotEnv() {
  // Google Places API Configuration
  const PLACES_BASE_URL = process.env.PLACES_BASE_URL;
  if(!PLACES_BASE_URL)
  {
    console.log(
      'You must set a PLACES_BASE_URL in the environment variables.'
    )
    process.exit(0);
  }
  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  if(!GOOGLE_PLACES_API_KEY)
  {
    console.log(
      'You must set a GOOGLE_PLACES_API_KEY in the environment variables.'
    )
    process.exit(0);
  }

  // Server Configuration;
  const PORT = process.env.PORT;
  if(!PORT)
  {
    console.log(
      'You must set a PORT in the environment variables.'
    )
    process.exit(0);
  }
  const NODE_ENV = process.env.NODE_ENV;
  if(!NODE_ENV)
  {
    console.log(
      'You must set NODE_ENV in the environment variables.'
    )
    process.exit(0);
  }

  // Rate Limiting
  const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS;
  if(!RATE_LIMIT_WINDOW_MS)
  {
    console.log(
      'You must set RATE_LIMIT_WINDOW_MS in the environment variables.'
    )
    process.exit(0);
  }
  const RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS;
  if(!RATE_LIMIT_MAX_REQUESTS)
  {
    console.log(
      'You must set RATE_LIMIT_MAX_REQUESTS in the environment variables.'
    )
    process.exit(0);
  }

  // Cache TTL (in seconds)
  const CACHE_TTL_NEARBY = process.env.CACHE_TTL_NEARBY;
  if(!CACHE_TTL_NEARBY)
  {
    console.log(
      'You must set CACHE_TTL_NEARBY in the environment variables.'
    )
    process.exit(0);
  }
  const CACHE_TTL_DETAILS = process.env.CACHE_TTL_DETAILS;
  if(!CACHE_TTL_DETAILS)
  {
    console.log(
      'You must set CACHE_TTL_DETAILS in the environment variables.'
    )
    process.exit(0);
  }
  const CACHE_TTL_PHOTOS = process.env.CACHE_TTL_PHOTOS;
  if(!CACHE_TTL_PHOTOS)
  {
    console.log(
      'You must set CACHE_TTL_PHOTOS in the environment variables.'
    )
    process.exit(0);
  }

  // Dev Cache (for development mode only)
  const USE_DEV_CACHE = process.env.USE_DEV_CACHE;
  if(!USE_DEV_CACHE)
  {
    console.log(
      'You must set USE_DEV_CACHE in the environment variables.'
    )
    process.exit(0);
  }

  const ENABLE_CACHE_FEATURE = process.env.ENABLE_CACHE_FEATURE;
  if(!ENABLE_CACHE_FEATURE)
  {
    console.log(
      'You must set ENABLE_CACHE_FEATURE in the environment variables.'
    )
    process.exit(0);
  }

  console.log("Successfully loaded and validated dot env...")
}

validateDotEnv();