# # SwipeCore

A modern restaurant discovery app with swipe-based interface, powered by Google Places API.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite + Capacitor
- **Backend**: Express.js + TypeScript (Google Places API proxy)
- **State Management**: React Query (TanStack Query)
- **UI**: Tailwind CSS + Radix UI components
- **Mobile**: Capacitor for native features (geolocation, etc.)

## Setup

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Environment Configuration

1. **Frontend**: Create `.env` and `.env.production` with the following (Google test IDs by default):
   ```bash
   # Common
   VITE_BACKEND_URL=http://localhost:4000
   VITE_USE_LIVE_DATA=true
   VITE_ENABLE_LOCATION_SERVICES=true

   # Ads
   VITE_ADS_ENABLED=true
   VITE_ADS_TESTING=true
   VITE_ADMOB_APP_ID_ANDROID=ca-app-pub-3940256099942544~3347511713
   VITE_ADMOB_APP_ID_IOS=ca-app-pub-3940256099942544~1458002511
   VITE_ADMOB_NATIVE_AD_UNIT_ID_ANDROID=ca-app-pub-3940256099942544/2247696110
   VITE_ADMOB_NATIVE_AD_UNIT_ID_IOS=ca-app-pub-3940256099942544/3986624511
   ```

   - Use `VITE_ADS_ENABLED=false` to disable all ad injection.
   - Keep `VITE_ADS_TESTING=true` during development.

2. **Backend**: Copy `backend/env.example` to `backend/.env` and configure:
   ```bash
   GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
   PLACES_BASE_URL=https://places.googleapis.com/v1
   PORT=4000
   ```

### Installation

1. Install frontend dependencies:
   ```bash
   npm install
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   cd ..
   ```

### Development

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   npm run dev
   ```

3. For mobile development:
   ```bash
   # Android
   npm install
   npm run build
   npx cap sync android
   npx cap run android

   # iOS (on macOS)
   npm install
   npm run build
   npx cap sync ios
   # Open Xcode and run the workspace to install CocoaPods and fetch the Mobile Ads SDK
   ```

### Google AdMob Native Ads Setup

1. Ensure the Capacitor AdMob plugin is initialized (handled in `src/utils/ads.ts`).
2. Android: `android/app/src/main/AndroidManifest.xml` includes:
   ```xml
   <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="${VITE_ADMOB_APP_ID_ANDROID}" />
   ```
   Use Google test IDs until you are ready for production.
3. iOS: Add the following to `ios/App/App/Info.plist` (create if missing):
   ```xml
   <key>GADApplicationIdentifier</key>
   <string>$(VITE_ADMOB_APP_ID_IOS)</string>
   ```
   Also include the recommended SKAdNetwork IDs per Google docs. Then run `npx cap sync ios`.
4. Environment variables control ads:
   - `VITE_ADS_ENABLED`: master toggle
   - `VITE_ADS_TESTING`: initialize in testing mode
   - `VITE_ADMOB_NATIVE_AD_UNIT_ID_*`: native ad unit IDs

Native ad cards are interleaved into the swipe deck (after roughly every 4 real cards) and labeled “Sponsored.” Taps use the native plugin’s click handler, and impressions are recorded when the ad becomes the top card.

## Google Places API Setup

1. **Create API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable "Places API (New)"
   - Create an API key with proper restrictions

2. **Security Configuration**:
   - **Application restrictions**: Set to IP addresses for server-to-server
   - **API restrictions**: Enable only "Places API (New)"
   - Add your development/production server IPs

3. **Billing**: Ensure billing is enabled on your Google Cloud project

## API Endpoints

The backend proxy provides these endpoints:

- `GET /api/places/nearby` - Search nearby places
- `GET /api/places/:placeId` - Get place details
- `GET /api/places/photo/:ref` - Get place photo URL
- `GET /health` - Health check

## Features

- 📍 **Location-based search** using device GPS
- 🏪 **Restaurant discovery** with swipe interface
- 📱 **Mobile-first design** with native capabilities
- ⚡ **Optimized performance** with caching and prefetching
- 🔒 **Secure API access** with server-side key management
- 🎨 **Modern UI** with smooth animations and gestures