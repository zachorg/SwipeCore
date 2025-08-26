// Environment variable type declarations
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Backend Configuration
      EXPO_PUBLIC_BACKEND_URL?: string;

      // Feature Flags
      EXPO_PUBLIC_USE_MOCK_DATA?: string;
      EXPO_PUBLIC_ENABLE_DEBUG?: string;
      EXPO_PUBLIC_USE_LIVE_DATA?: string;

      EXPO_PUBLIC_GOOGLE_PLACES_ENABLED?: string;

      // Google Ads Configuration
      EXPO_PUBLIC_ADMOB_APP_ID_ANDROID?: string;
      EXPO_PUBLIC_ADMOB_APP_ID_IOS?: string;

      EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_ANDROID?: string;
      EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_IOS?: string;

      EXPO_PUBLIC_ADS_NATIVE_TEST_MODE?: string;
      EXPO_PUBLIC_ADS_ENABLED?: string;
      EXPO_PUBLIC_ADS_TESTING?: string;
      EXPO_PUBLIC_ADS_NATIVE_IN_DECK?: string;

      EXPO_PUBLIC_ADS_NATIVE_INTERVAL?: string;
      EXPO_PUBLIC_ADS_DEBUG?: string;
    }
  }
}

export { };
