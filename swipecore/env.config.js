// Environment Configuration for React Native App
// Copy this file to .env and fill in your actual values

module.exports = {
  // Backend Configuration
  EXPO_PUBLIC_BACKEND_URL: "http://localhost:4000/", // Your backend URL

  // Feature Flags
  EXPO_PUBLIC_USE_MOCK_DATA: "false", // Set to 'true' to use mock data
  EXPO_PUBLIC_ENABLE_DEBUG: "true", // Set to 'true' to enable debug mode
  EXPO_PUBLIC_USE_LIVE_DATA: "true", // Set to 'true' to use live data

  EXPO_PUBLIC_GOOGLE_PLACES_ENABLED: "true", // Set to 'true' to enable Google Places

  // Google Ads Configuration
  EXPO_PUBLIC_ADMOB_APP_ID_ANDROID: "ca-app-pub-3940256099942544~3347511713", // Your Android AdMob App ID
  EXPO_PUBLIC_ADMOB_APP_ID_IOS: "ca-app-pub-3940256099942544~1458002511", // Your iOS AdMob App ID

  EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_ANDROID:
    "ca-app-pub-3940256099942544/2247696110", // Your Android Native Ad Unit ID
  EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_IOS:
    "ca-app-pub-3940256099942544/3985214052", // Your iOS Native Ad Unit ID

  EXPO_PUBLIC_ADS_NATIVE_TEST_MODE: "true", // Set to 'false' for production
  EXPO_PUBLIC_ADS_ENABLED: "true", // Set to 'false' to disable ads
  EXPO_PUBLIC_ADS_TESTING: "true", // Set to 'false' for production
  EXPO_PUBLIC_ADS_NATIVE_IN_DECK: "true", // Set to 'false' to disable native ads in deck

  EXPO_PUBLIC_ADS_NATIVE_INTERVAL: "2", // Interval between native ads
  EXPO_PUBLIC_ADS_DEBUG: "true", // Set to 'false' to disable debug logging
};

// Instructions:
// 1. Copy this file to .env in your project root
// 2. Fill in your actual values (remove quotes for non-string values)
// 3. For production, set testing flags to false
// 4. Update backend URL to your production backend
// 5. Update AdMob IDs to your actual production IDs
