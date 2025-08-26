# Backend Setup for React Native App

This document explains how to set up and configure the backend for the NomNom React Native app.

## Overview

The React Native app now makes real REST API calls to a backend server instead of using simulated data. The backend handles:

- **OTP Verification**: Phone number verification and authentication
- **User Profile Management**: Creating and managing user profiles
- **Places API**: Fetching nearby restaurants and place details
- **Photo Management**: Getting restaurant photos

## Backend Requirements

### 1. Server Setup

- **Port**: 4000 (default)
- **Protocol**: HTTP/HTTPS
- **Framework**: Any (Node.js, Python, Go, etc.)

### 2. Required API Endpoints

#### OTP Endpoints

```
POST /api/otp/send
POST /api/otp/verify
GET  /api/otp/auth/is-verified
POST /api/otp/auth/refresh
```

#### User Profile Endpoints

```
POST   /api/userprofile/create
GET    /api/userprofile/me
PUT    /api/userprofile/update
DELETE /api/userprofile/delete
```

#### Places Endpoints

```
GET /api/places/nearby
GET /api/places/{placeId}
GET /api/places/photo/givememyphoto
```

#### Health Check

```
GET /health
```

## Configuration

### 1. Development Environment

The app automatically uses `http://localhost:4000/` when running in development mode.

### 2. Production Environment

Update the backend URL in `src/config/api.ts`:

```typescript
export const API_CONFIG = {
  BACKEND_URL: __DEV__
    ? "http://localhost:4000/" // Development
    : "https://your-production-backend.com/", // Production
  // ... other config
};
```

### 3. Environment Variables (Optional)

You can also use environment variables by creating a `.env` file:

```bash
# .env
BACKEND_URL_DEV=http://localhost:4000/
BACKEND_URL_PROD=https://your-production-backend.com/
```

Then update the config to use them:

```typescript
import { BACKEND_URL_DEV, BACKEND_URL_PROD } from "@env";

export const API_CONFIG = {
  BACKEND_URL: __DEV__ ? BACKEND_URL_DEV : BACKEND_URL_PROD,
  // ... other config
};
```

## API Response Format

All API endpoints should return responses in this format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  count?: number;
  message?: string;
  errorCode?: string;
}
```

### Example Responses

#### Success Response

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE"
}
```

## Authentication

The app uses JWT tokens for authentication:

1. **Access Token**: Short-lived token for API requests
2. **Refresh Token**: Long-lived token for refreshing access tokens

### Token Storage

- Tokens are stored securely using `expo-secure-store`
- Access tokens are automatically included in API headers
- Refresh tokens are used to get new access tokens when they expire

### API Headers

```typescript
{
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer {accessToken}'
}
```

## Error Handling

The app includes comprehensive error handling:

- **Network Errors**: Connection failures, timeouts
- **API Errors**: HTTP status codes, error messages
- **Validation Errors**: Invalid input data
- **Authentication Errors**: Expired tokens, unauthorized access

## Testing

### 1. Health Check

Test if your backend is running:

```bash
curl http://localhost:4000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

### 2. OTP Test

Test OTP sending:

```bash
curl -X POST http://localhost:4000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"request": {"phoneNumber": "+1234567890"}}'
```

### 3. Places Test

Test nearby search:

```bash
curl "http://localhost:4000/api/places/nearby?lat=40.7128&lng=-74.0060&radius=5000&type=restaurant"
```

## Troubleshooting

### Common Issues

1. **Connection Refused**

   - Check if backend server is running
   - Verify port 4000 is correct
   - Check firewall settings

2. **CORS Errors**

   - Ensure backend allows requests from React Native
   - Add appropriate CORS headers

3. **Authentication Failures**

   - Verify JWT token format
   - Check token expiration
   - Ensure refresh token logic works

4. **API Endpoint Not Found**
   - Verify endpoint paths match exactly
   - Check HTTP methods (GET, POST, PUT, DELETE)
   - Ensure backend routes are properly configured

### Debug Mode

Enable debug logging by checking the console output. The app logs all API requests and responses when in development mode.

## Next Steps

1. **Set up your backend server** with the required endpoints
2. **Update the backend URL** in `src/config/api.ts`
3. **Test the API endpoints** using the examples above
4. **Deploy to production** and update the production URL
5. **Monitor API performance** and error rates

## Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify your backend endpoints match the expected format
3. Test endpoints manually using curl or Postman
4. Ensure your backend server is accessible from the device/emulator
