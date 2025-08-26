# Environment Variables Setup for React Native App

This document explains how to set up and configure environment variables for the NomNom React Native app.

## Overview

The app now uses environment variables for configuration instead of hardcoded values. This allows for:

- **Environment-specific settings** (development vs production)
- **Secure configuration management** (API keys, backend URLs)
- **Feature flag control** (enabling/disabling features)
- **Easy deployment configuration**

## Setup Instructions

### 1. Install Dependencies

The app uses `react-native-dotenv` for environment variable support:

```bash
npm install react-native-dotenv
```

### 2. Create Environment File

Create a `.env` file in your project root (`swipecore/.env`) with the following content:

```bash
# Backend Configuration
EXPO_PUBLIC_BACKEND_URL=http://localhost:4000/

# Feature Flags
EXPO_PUBLIC_USE_MOCK_DATA=false
EXPO_PUBLIC_ENABLE_DEBUG=true
EXPO_PUBLIC_USE_LIVE_DATA=true
EXPO_PUBLIC_GOOGLE_PLACES_ENABLED=true

# Google Ads Configuration
EXPO_PUBLIC_ADMOB_APP_ID_ANDROID=ca-app-pub-3940256099942544~3347511713
EXPO_PUBLIC_ADMOB_APP_ID_IOS=ca-app-pub-3940256099942544~1458002511

EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_ANDROID=ca-app-pub-3940256099942544/2247696110
EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_IOS=ca-app-pub-3940256099942544/3985214052

EXPO_PUBLIC_ADS_NATIVE_TEST_MODE=true
EXPO_PUBLIC_ADS_ENABLED=true
EXPO_PUBLIC_ADS_TESTING=true
EXPO_PUBLIC_ADS_NATIVE_IN_DECK=true

EXPO_PUBLIC_ADS_NATIVE_INTERVAL=2
EXPO_PUBLIC_ADS_DEBUG=true
```

### 3. Configuration Files

The following files have been updated to support environment variables:

- **`src/config/env.ts`** - Environment variable configuration with defaults
- **`src/config/api.ts`** - API configuration using environment variables
- **`src/utils/ads.ts`** - AdMob configuration using environment variables
- **`src/types/Types.ts`** - Feature flags using environment variables

### 4. Babel Configuration

The `babel.config.js` has been updated to support environment variables:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
          blacklist: null,
          whitelist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
```

### 5. TypeScript Configuration

The `tsconfig.json` has been updated to support the `@env` module:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"],
      "@env": ["src/config/env.ts"]
    }
  }
}
```

## Environment Variables Reference

### Backend Configuration

| Variable                  | Description        | Default                  | Example                       |
| ------------------------- | ------------------ | ------------------------ | ----------------------------- |
| `EXPO_PUBLIC_BACKEND_URL` | Backend server URL | `http://localhost:4000/` | `https://api.yourdomain.com/` |

### Feature Flags

| Variable                            | Description                       | Default      | Values         |
| ----------------------------------- | --------------------------------- | ------------ | -------------- |
| `EXPO_PUBLIC_USE_MOCK_DATA`         | Use mock data instead of real API | `false`      | `true`/`false` |
| `EXPO_PUBLIC_ENABLE_DEBUG`          | Enable debug logging              | `true` (dev) | `true`/`false` |
| `EXPO_PUBLIC_USE_LIVE_DATA`         | Use live data from backend        | `true`       | `true`/`false` |
| `EXPO_PUBLIC_GOOGLE_PLACES_ENABLED` | Enable Google Places API          | `true`       | `true`/`false` |

### Google Ads Configuration

| Variable                                      | Description                   | Default | Example             |
| --------------------------------------------- | ----------------------------- | ------- | ------------------- |
| `EXPO_PUBLIC_ADMOB_APP_ID_ANDROID`            | Android AdMob App ID          | Test ID | `ca-app-pub-...`    |
| `EXPO_PUBLIC_ADMOB_APP_ID_IOS`                | iOS AdMob App ID              | Test ID | `ca-app-pub-...`    |
| `EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_ANDROID` | Android Native Ad Unit ID     | Test ID | `ca-app-pub-...`    |
| `EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_IOS`     | iOS Native Ad Unit ID         | Test ID | `ca-app-pub-...`    |
| `EXPO_PUBLIC_ADS_NATIVE_TEST_MODE`            | Enable AdMob test mode        | `true`  | `true`/`false`      |
| `EXPO_PUBLIC_ADS_ENABLED`                     | Enable ads globally           | `true`  | `true`/`false`      |
| `EXPO_PUBLIC_ADS_TESTING`                     | Enable AdMob testing          | `true`  | `true`/`false`      |
| `EXPO_PUBLIC_ADS_NATIVE_IN_DECK`              | Show native ads in swipe deck | `true`  | `true`/`false`      |
| `EXPO_PUBLIC_ADS_NATIVE_INTERVAL`             | Interval between native ads   | `2`     | `1`, `2`, `3`, etc. |
| `EXPO_PUBLIC_ADS_DEBUG`                       | Enable ad debug logging       | `true`  | `true`/`false`      |

## Usage in Code

### Importing Environment Variables

```typescript
import { getBackendUrl, getFeatureFlags, getAdMobConfig } from "../config/env";

// Get backend URL
const backendUrl = getBackendUrl();

// Get feature flags
const { useMockData, enableDebug } = getFeatureFlags();

// Get AdMob configuration
const { android, ios, testing } = getAdMobConfig();
```

### Using in Components

```typescript
import { FEATURE_FLAGS } from "../types/Types";

if (FEATURE_FLAGS.ADS_ENABLED) {
  // Show ads
}
```

### Using in Services

```typescript
import { buildApiUrl } from "../config/api";

const response = await fetch(buildApiUrl("api/endpoint"));
```

## Environment-Specific Configuration

### Development Environment

```bash
EXPO_PUBLIC_BACKEND_URL=http://localhost:4000/
EXPO_PUBLIC_ENABLE_DEBUG=true
EXPO_PUBLIC_ADS_TESTING=true
EXPO_PUBLIC_ADS_NATIVE_TEST_MODE=true
```

### Production Environment

```bash
EXPO_PUBLIC_BACKEND_URL=https://api.yourdomain.com/
EXPO_PUBLIC_ENABLE_DEBUG=false
EXPO_PUBLIC_ADS_TESTING=false
EXPO_PUBLIC_ADS_NATIVE_TEST_MODE=false
```

## Security Considerations

1. **Never commit `.env` files** to version control
2. **Use test IDs** for development and testing
3. **Rotate production keys** regularly
4. **Validate environment variables** at startup

## Troubleshooting

### Common Issues

1. **Environment variables not loading**

   - Check `.env` file exists in project root
   - Verify babel configuration
   - Restart Metro bundler

2. **TypeScript errors**

   - Check `tsconfig.json` paths configuration
   - Verify `expo-env.d.ts` includes environment types

3. **Build errors**
   - Clear Metro cache: `npx expo start --clear`
   - Check babel plugin configuration

### Debug Mode

Enable debug logging to see environment variable values:

```typescript
import { logAdMobConfig } from "../utils/ads";

// Log configuration
logAdMobConfig();
```

## Next Steps

1. **Create your `.env` file** with your actual values
2. **Update backend URL** to your actual backend
3. **Replace test AdMob IDs** with your production IDs
4. **Test configuration** in development mode
5. **Deploy with production values**

## Support

If you encounter issues:

1. Check console logs for configuration values
2. Verify `.env` file format and location
3. Ensure babel and TypeScript configurations are correct
4. Restart Metro bundler after configuration changes
