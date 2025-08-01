# SwipeCore Backend API

A TypeScript Express proxy for Google Places API endpoints, providing secure server-side access to Google Places data for the SwipeCore application.

## Setup

### Prerequisites
- Node.js 18 LTS or higher
- npm or pnpm
- Google Cloud Platform account with Places API enabled

### Installation
```bash
npm install
```

### Environment Configuration
1. Copy `env.example` to `.env`
2. Configure your Google Places API key and other settings

### Google Places API Key Setup

**Important: API Key Security Configuration**

To ensure security and prevent unauthorized usage:

1. **Create API Key in Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to APIs & Services > Credentials
   - Click "Create Credentials" > "API Key"

2. **Restrict the API Key:**
   - **Application restrictions:** Set to "HTTP referrers" for web deployment or "IP addresses" for server-to-server
   - **API restrictions:** Enable only "Places API (New)" - DO NOT leave unrestricted
   - **For development:** Add your development server IP
   - **For production:** Add your production server IP ranges

3. **Required APIs:**
   - Places API (New)
   - Ensure billing is enabled on your Google Cloud project

4. **Quota Management:**
   - Monitor usage in Google Cloud Console
   - Set up billing alerts
   - Configure daily quotas to prevent unexpected charges

### Development
```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run test   # Run tests
```

## API Endpoints

### GET /api/places/nearby
Search for nearby places using Google Places Nearby Search (New).

**Query Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude  
- `radius` (optional): Search radius in meters (default: 1500)
- `keyword` (optional): Search keyword
- `type` (optional): Place type filter

**Response:** Array of place summaries with basic information.

### GET /api/places/:placeId
Get detailed information about a specific place.

**Parameters:**
- `placeId`: Google Places ID

**Response:** Detailed place information including photos, reviews, hours, etc.

### GET /api/places/photo/:photoReference
Get a signed URL for a place photo.

**Parameters:**
- `photoReference`: Google Places photo reference

**Response:** Signed photo URL.

## Architecture

- **Rate Limiting:** 100 requests per 10 minutes per IP
- **Caching:** In-memory cache with TTL (5min nearby, 30min details)
- **Error Handling:** Standardized error responses with proper HTTP status codes
- **Validation:** Request validation using Zod schemas
- **Security:** Helmet for security headers, CORS configured for frontend domain

## Testing
The API includes comprehensive unit tests covering:
- Happy path scenarios
- Input validation
- Error handling
- Rate limiting
- Cache behavior