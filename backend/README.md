# SwipeCore Backend

Express API proxy for Google Places API with Redis caching and smart-mock system.

## Features

- **Redis + NodeCache Fallback**: Resilient caching with automatic fallback
- **Smart-Mock System**: Captures live API responses as fixtures for development
- **Google Places API Compliance**: Respects caching rules (≤30 days for coordinates, unlimited for place IDs)
- **Environment-Based Switching**: Live vs mock modes for different environments

## Quick Start

### 1. Start Redis with Docker

```bash
docker run -d --name swipecore-redis -p 6379:6379 redis:7-alpine
```

Verify Redis is running:
```bash
docker exec swipecore-redis redis-cli ping
# Should return: PONG
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file:
```bash
cp env.example .env
```

Configure your environment variables:

```env
# Google Places API Configuration
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
PLACES_BASE_URL=https://places.googleapis.com/v1

# Server Configuration
PORT=4000
NODE_ENV=development

# Redis Configuration
REDIS_URL=redis://localhost:6379
CACHE_TTL_DAYS=28    # keep ≤30 per Google rules
GOOGLE_API_MODE=live # live | mock
FIXTURE_DIR=./test/fixtures

# Rate Limiting
RATE_LIMIT_WINDOW_MS=600000
RATE_LIMIT_MAX_REQUESTS=100

# Cache TTL (in seconds)
CACHE_TTL_NEARBY=300
CACHE_TTL_DETAILS=1800
CACHE_TTL_PHOTOS=3600
```

## API Modes

### Live Mode (`GOOGLE_API_MODE=live`)
- Makes real API calls to Google Places
- Uses Redis → NodeCache → Google API fallback chain
- Respects Google's caching rules

### Mock Mode (`GOOGLE_API_MODE=mock`)
- **Smart-Mock System**: First call captures live response and writes fixture
- Subsequent calls use cached fixtures
- No network calls after initial capture
- Perfect for development and testing

## Google Places API Caching Rules

According to [Google's documentation](https://developers.google.com/maps/documentation/places/web-service/policies#caching):

- **Nearby Search (coordinates)**: Cache ≤ 30 days
- **Place Details (place IDs)**: Cache unlimited (place IDs are permanent)
- **Photos**: Follow same rules as the associated place data

Our system enforces these rules automatically via `CACHE_TTL_DAYS` configuration.

## NPM Scripts

```bash
# Development (mock mode with hot reload)
npm run dev

# Production build
npm run build

# Production server (live mode)
npm run serve

# Run tests (mock mode with coverage)
npm test

# Watch mode tests
npm run test:watch

# Prime fixtures with real API calls
npm run prime

# Linting
npm run lint
npm run lint:fix
```

## Cache Architecture

### Cache Fallback Chain

```
Request → Redis → NodeCache → Google API
    ↓         ↓         ↓           ↓
   Hit    Miss but   Miss but   Live API
  Return   NodeCache   Fetcher    Response
  Data      Hit       Call API   (with TTL)
           Return     Store both
           Data       Return Data
```

### Cache Keys

- **Nearby Search**: `nearby:{sha1_hash_of_params}`
- **Place Details**: `details:{place_id}`
- **Photos**: `photo:{photo_reference}`

Example:
```typescript
// Parameters: { lat: 40.7128, lng: -74.0060, radius: 1500 }
// Cache Key: nearby:a1b2c3d4e5f6789abcdef1234567890abcdef12
```

## Smart-Mock System

### How It Works

1. **First Request**: Makes live API call → saves response as JSON fixture
2. **Subsequent Requests**: Reads from fixture file instantly
3. **Atomic Writes**: Uses `flag: 'wx'` to prevent race conditions
4. **Network Blocking**: `nock.disableNetConnect()` prevents accidental live calls in tests

### Fixture Management

Fixtures are stored in `FIXTURE_DIR` (default: `./test/fixtures`):

```
test/fixtures/
├── nearby:a1b2c3d4e5f6789abcdef1234567890abcdef12.json
├── details:ChIJN1t_tDeuEmsRUsoyG83frY4.json
└── photo:photo_reference_123.json
```

### Prime Fixtures

Generate fixtures for common queries:

```bash
npm run prime
```

This makes real API calls and saves responses as fixtures for development use.

## API Endpoints

### Nearby Search
```http
GET /api/places/nearby?lat=40.7128&lng=-74.0060&radius=1500&keyword=restaurant
```

### Place Details
```http
GET /api/places/ChIJN1t_tDeuEmsRUsoyG83frY4
```

### Place Photos
```http
GET /api/places/photo/photo_reference?maxWidth=400&maxHeight=400
```

## Development Workflow

### 1. Mock Development
```bash
# Start in mock mode (default for npm run dev)
npm run dev

# API calls will create fixtures automatically
curl "http://localhost:4000/api/places/nearby?lat=40.7128&lng=-74.0060&radius=1500"
```

### 2. Test with Coverage
```bash
# Run all tests with network blocking
npm test

# Watch mode for development
npm run test:watch
```

### 3. Production Deployment
```bash
# Build for production
npm run build

# Run with live Google API
GOOGLE_API_MODE=live npm run serve
```

## Redis Management

### Start Redis
```bash
docker run -d --name swipecore-redis -p 6379:6379 redis:7-alpine
```

### Stop Redis
```bash
docker stop swipecore-redis
```

### Restart Redis
```bash
docker restart swipecore-redis
```

### Redis CLI
```bash
docker exec -it swipecore-redis redis-cli
```

Common Redis commands:
```redis
# Check connection
PING

# List all keys
KEYS *

# Get cache value
GET "nearby:a1b2c3d4e5f6789abcdef1234567890abcdef12"

# Clear all cache
FLUSHALL
```

## Testing

### Test Architecture
- **Network Blocking**: `nock.disableNetConnect()` in mock mode
- **Fixture Validation**: Tests verify fixture creation and reuse
- **Cache Testing**: Redis → NodeCache fallback verification
- **Integration Tests**: End-to-end API behavior

### Run Tests
```bash
# All tests with coverage
npm test

# Specific test files
npm test cache-core.test.ts
npm test mock-integration.test.ts

# Watch mode
npm run test:watch
```

## Troubleshooting

### Redis Connection Issues
```bash
# Check if Redis is running
docker ps --filter name=swipecore-redis

# Check Redis logs
docker logs swipecore-redis

# Restart Redis
docker restart swipecore-redis
```

### Google API Issues
```bash
# Verify API key in environment
echo $GOOGLE_PLACES_API_KEY

# Test API key manually
curl "https://places.googleapis.com/v1/places:searchNearby" \
  -H "Content-Type: application/json" \
  -d '{"locationRestriction":{"circle":{"center":{"latitude":40.7128,"longitude":-74.0060},"radius":1500}}}' \
  -X POST \
  --url "https://places.googleapis.com/v1/places:searchNearby?key=YOUR_API_KEY"
```

### Cache Issues
```bash
# Clear Redis cache
docker exec swipecore-redis redis-cli FLUSHALL

# Clear fixture files
rm -rf test/fixtures/*

# Restart with fresh cache
npm run dev
```

## Production Considerations

### Environment Variables
- Set `GOOGLE_API_MODE=live` in production
- Configure `REDIS_URL` for production Redis instance
- Use proper `GOOGLE_PLACES_API_KEY` with appropriate quotas
- Set `CACHE_TTL_DAYS=28` to respect Google's 30-day limit

### Monitoring
- Monitor Redis memory usage and connection health
- Track Google API quota usage
- Log cache hit/miss ratios for optimization
- Set up alerts for API failures

### Security
- Never commit `.env` files with real API keys
- Use environment-specific configuration
- Implement proper rate limiting
- Validate all input parameters

## License

ISC