# NomNom Backend

Express API proxy for Google Places API with unified caching system.

## Features

- **Unified Caching**: File-based development cache + NodeCache for production
- **Google Places API Compliance**: Respects caching rules (≤30 days for coordinates, unlimited for place IDs)
- **Development Cache Management**: Dev-only endpoints for cache inspection and clearing
- **Environment Configuration**: Streamlined setup with dotenv-flow

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

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

# Cache Configuration
CACHE_TTL_DAYS=1    # keep ≤30 per Google rules
USE_DEV_CACHE=true  # File-based cache for development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=600000
RATE_LIMIT_MAX_REQUESTS=100
```

## Caching System

The backend uses a unified caching approach:

- **Development**: File-based cache (`dev-cache-nearby.json`) for persistence across restarts
- **Production**: In-memory NodeCache for optimal performance
- **TTL Compliance**: Configurable cache duration up to 30 days per Google requirements

### Cache Types

- **Nearby Search**: Cache ≤ 30 days (coordinates-based)
- **Place Details**: Cache unlimited (place IDs are permanent)
- **Photos**: Follow same rules as associated place data

## NPM Scripts

```bash
# Development with hot reload
npm run dev

# Production build
npm run build

# Production server
npm start

# Run tests with coverage
npm test

# Watch mode tests
npm run test:watch

# Linting
npm run lint
npm run lint:fix
```

## Development Cache Management

The backend provides development-only endpoints for cache management:

```bash
# Clear development cache
curl -X DELETE http://localhost:4000/api/places/dev-cache

# View cache statistics
curl http://localhost:4000/api/places/dev-cache/stats
```

These endpoints are only available when `NODE_ENV=development`.

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

### 1. Development

```bash
# Start development server
npm run dev

# Test API endpoints
curl "http://localhost:4000/api/places/nearby?lat=40.7128&lng=-74.0060&radius=1500"
```

### 2. Testing

```bash
# Run all tests with coverage
npm test

# Watch mode for development
npm run test:watch
```

### 3. Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Testing

### Test Architecture

- **Comprehensive Coverage**: Jest test suites with mocked integrations
- **Cache Testing**: Unified cache system verification
- **Integration Tests**: End-to-end API behavior testing

### Run Tests

```bash
# All tests with coverage
npm test

# Specific test files
npm test cache-core.test.ts
npm test places.test.ts

# Watch mode
npm run test:watch
```

## Troubleshooting

### API Key Issues

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
# Clear development cache via API
curl -X DELETE http://localhost:4000/api/places/dev-cache

# Or restart development server
npm run dev
```

## Production Considerations

### Environment Variables

- Use proper `GOOGLE_PLACES_API_KEY` with appropriate quotas
- Set `CACHE_TTL_DAYS` to respect Google's 30-day limit (max 30)
- Configure rate limiting appropriately for your use case

### Security

- Never commit `.env` files with real API keys
- Use environment-specific configuration
- Implement proper rate limiting
- Validate all input parameters

## License

ISC
