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

1. **Frontend**: Copy `.env.example` to `.env.local` and configure:
   ```bash
   VITE_BACKEND_URL=http://localhost:4000
   VITE_USE_LIVE_DATA=true
   VITE_ENABLE_LOCATION_SERVICES=true
   ```

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
   npm run build
   npx cap sync android
   npx cap run android

   # iOS  
   npm run build
   npx cap sync ios
   npx cap run ios
   ```

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