// Load environment variables FIRST - before any other imports
import dotenv from 'dotenv';
dotenv.config();

// Debug: Log environment loading
console.log('🔧 Environment loaded:', {
  hasApiKey: !!process.env.GOOGLE_PLACES_API_KEY,
  apiKeyLength: process.env.GOOGLE_PLACES_API_KEY?.length || 0,
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT
});

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { placesRouter } from './routes/places';

const app = express();
const PORT = process.env.PORT || 4000;

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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Permit specific HTTP methods
  allowedHeaders: ['Content-Type'], // Specify permitted headers
  credentials: true, // Allow credentials like cookies, authorization headers
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
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

export default app;