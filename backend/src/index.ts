// Load environment variables FIRST - before any other imports
// Note: dotenv-flow is already loaded in config/index.ts

// Debug: Log environment loading
console.log('🔧 Environment loaded:', {
  hasApiKey: !!process.env.GOOGLE_PLACES_API_KEY,
  apiKeyLength: process.env.GOOGLE_PLACES_API_KEY?.length || 0,
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
});

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { placesRouter } from './routes/places';
import dotenv from 'dotenv';

const app = express();
const PORT = process.env.PORT || 4000;

dotenv.config({ path: './etc/secrets/BACKEND_ENV.txt' });

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '600000'), // 10 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all requests
app.use(limiter);

// Security middleware
app.use(helmet());

// CORS configuration
// Allow all origins for simplicity, but refine this in a production environment
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Permit specific HTTP methods
    allowedHeaders: ['Content-Type'], // Specify permitted headers
    credentials: true, // Allow credentials like cookies, authorization headers
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/places', placesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

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

export default app;
