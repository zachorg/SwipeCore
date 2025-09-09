// Environment configuration for React Native
// This file provides environment variables with fallback defaults


// Backend Configuration
export const BACKEND_URL: string = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:4000/';

// Feature Flags
export const USE_MOCK_DATA: boolean = process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true' || false;
export const ENABLE_DEBUG: boolean = process.env.EXPO_PUBLIC_ENABLE_DEBUG === 'true' || __DEV__;
export const USE_LIVE_DATA: boolean = process.env.EXPO_PUBLIC_USE_LIVE_DATA === 'true' || true;

// Google Places Configuration
export const GOOGLE_PLACES_ENABLED: boolean = process.env.EXPO_PUBLIC_GOOGLE_PLACES_ENABLED === 'true' || false;

// Google Ads Configuration
export const ADMOB_APP_ID_ANDROID: string = process.env.EXPO_PUBLIC_ADMOB_APP_ID_ANDROID || 'ca-app-pub-3940256099942544~3347511713';
export const ADMOB_APP_ID_IOS: string = process.env.EXPO_PUBLIC_ADMOB_APP_ID_IOS || 'ca-app-pub-3940256099942544~1458002511';

export const ADMOB_NATIVE_AD_UNIT_ID_ANDROID: string = process.env.EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_ANDROID || 'ca-app-pub-3940256099942544/2247696110';
export const ADMOB_NATIVE_AD_UNIT_ID_IOS: string = process.env.EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_IOS || 'ca-app-pub-3940256099942544/3985214052';

export const ADS_NATIVE_TEST_MODE: boolean = process.env.EXPO_PUBLIC_ADS_NATIVE_TEST_MODE === 'true' || true;
export const ADS_ENABLED: boolean = process.env.EXPO_PUBLIC_ADS_ENABLED === 'true' || true;
export const ADS_TESTING: boolean = process.env.EXPO_PUBLIC_ADS_TESTING === 'true' || true;
export const ADS_NATIVE_IN_DECK: boolean = process.env.EXPO_PUBLIC_ADS_NATIVE_IN_DECK === 'true' || true;

export const ADS_NATIVE_INTERVAL: number = parseInt(process.env.EXPO_PUBLIC_ADS_NATIVE_INTERVAL || '2', 10);
export const ADS_DEBUG: boolean = process.env.EXPO_PUBLIC_ADS_DEBUG === 'true' || true;

// Environment detection
export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;

// Configuration helpers
export const getBackendUrl = (): string => {
  if (isDevelopment && !BACKEND_URL.includes('localhost')) {
    console.warn('⚠️ Development mode detected but backend URL is not localhost. Consider using localhost for development.');
  }
  return BACKEND_URL;
};

export const getAdMobConfig = () => ({
  android: {
    appId: ADMOB_APP_ID_ANDROID,
    nativeAdUnitId: ADMOB_NATIVE_AD_UNIT_ID_ANDROID,
  },
  ios: {
    appId: ADMOB_APP_ID_IOS,
    nativeAdUnitId: ADMOB_NATIVE_AD_UNIT_ID_IOS,
  },
  testing: ADS_TESTING,
  debug: ADS_DEBUG,
});

export const getFeatureFlags = () => ({
  useMockData: USE_MOCK_DATA,
  enableDebug: ENABLE_DEBUG,
  useLiveData: USE_LIVE_DATA,
  googlePlacesEnabled: GOOGLE_PLACES_ENABLED,
  adsEnabled: ADS_ENABLED,
  adsNativeInDeck: ADS_NATIVE_IN_DECK,
  adsNativeInterval: ADS_NATIVE_INTERVAL,
});
