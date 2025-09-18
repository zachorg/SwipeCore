# NomNom - React Native + Expo

This is the converted version of the NomNom app from Capacitor + React Native + Vite to pure React Native + Expo.

## Project Structure

```
src/
├── components/          # React Native components
│   ├── auth/           # Authentication components
│   ├── filters/        # Filter components
│   └── ui/             # UI components
├── contexts/            # React contexts (AuthContext)
├── hooks/               # Custom React hooks
├── pages/               # Main app pages
├── services/            # Business logic services
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## Key Changes Made

1. **Removed Capacitor dependencies** - Replaced with Expo equivalents
2. **Converted HTML to React Native components** - Replaced div, span, etc. with View, Text
3. **Replaced Tailwind CSS** - Converted to React Native StyleSheet
4. **Updated navigation** - Changed from React Router to React Navigation
5. **Updated storage** - Changed from Capacitor Preferences to Expo SecureStore
6. **Updated ads** - Changed from Capacitor AdMob to Expo AdMob
7. **Updated location** - Changed from Capacitor Geolocation to Expo Location

## Dependencies

- React Native 0.79.6
- Expo SDK 53
- React Navigation 7
- Expo Location, Speech, AV, SecureStore
- React Query for data fetching
- Zustand for state management

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

3. Run on device/simulator:
   ```bash
   npm run android  # For Android
   npm run ios      # For iOS (requires macOS)
   ```

## Building for Production

### Android

```bash
expo build:android
```

### iOS

```bash
expo build:ios
```

## Notes

- This is a 1:1 conversion maintaining the same functionality
- All Capacitor-specific code has been replaced with React Native equivalents
- The app targets iOS and Android (no web support)
- Placeholder components are included for incomplete features
- Test AdMob IDs are used by default - replace with real IDs for production
