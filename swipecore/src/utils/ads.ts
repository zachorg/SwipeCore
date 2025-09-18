// Ads utility for React Native
// This utility handles AdMob configuration and ad management
import { Platform } from 'react-native';
import { getAdMobConfig, getFeatureFlags } from '../config/env';

// Get configuration from environment variables
const adMobConfig = getAdMobConfig();
const featureFlags = getFeatureFlags();

// AdMob configuration
export const ADMOB_CONFIG = {
  // App IDs
  APP_ID_ANDROID: adMobConfig.android.appId,
  APP_ID_IOS: adMobConfig.ios.appId,

  // Native Ad Unit IDs
  NATIVE_AD_UNIT_ID_ANDROID: adMobConfig.android.nativeAdUnitId,
  NATIVE_AD_UNIT_ID_IOS: adMobConfig.ios.nativeAdUnitId,

  // Feature flags
  TESTING: adMobConfig.testing,
  DEBUG: adMobConfig.debug,
  ENABLED: featureFlags.adsEnabled,
  NATIVE_IN_DECK: featureFlags.adsNativeInDeck,
  NATIVE_INTERVAL: featureFlags.adsNativeInterval,
};

// Get platform-specific app ID
export const getAdMobAppId = (): string => {
  if (Platform.OS === 'android') {
    return ADMOB_CONFIG.APP_ID_ANDROID;
  } else if (Platform.OS === 'ios') {
    return ADMOB_CONFIG.APP_ID_IOS;
  }
  return ADMOB_CONFIG.APP_ID_ANDROID; // Default fallback
};

// Get platform-specific native ad unit ID
export const getNativeAdUnitId = (): string => {
  if (Platform.OS === 'android') {
    return ADMOB_CONFIG.NATIVE_AD_UNIT_ID_ANDROID;
  } else if (Platform.OS === 'ios') {
    return ADMOB_CONFIG.NATIVE_AD_UNIT_ID_IOS;
  }
  return ADMOB_CONFIG.NATIVE_AD_UNIT_ID_ANDROID; // Default fallback
};

// Check if ads are enabled
export const areAdsEnabled = (): boolean => {
  return ADMOB_CONFIG.ENABLED; // Disable ads in development
};

// Check if native ads in deck are enabled
export const areNativeAdsInDeckEnabled = (): boolean => {
  return areAdsEnabled() && ADMOB_CONFIG.NATIVE_IN_DECK;
};

// Get native ad interval
export const getNativeAdInterval = (): number => {
  return ADMOB_CONFIG.NATIVE_INTERVAL;
};

// Check if testing mode is enabled
export const isTestingMode = (): boolean => {
  return ADMOB_CONFIG.TESTING || __DEV__;
};

// Check if debug mode is enabled
export const isDebugMode = (): boolean => {
  return ADMOB_CONFIG.DEBUG || __DEV__;
};

// Log configuration for debugging
export const logAdMobConfig = (): void => {
  if (isDebugMode()) {
    console.log('🔧 AdMob Configuration:', {
      platform: Platform.OS,
      appId: getAdMobAppId(),
      nativeAdUnitId: getNativeAdUnitId(),
      testing: isTestingMode(),
      debug: isDebugMode(),
      enabled: areAdsEnabled(),
      nativeInDeck: areNativeAdsInDeckEnabled(),
      nativeInterval: getNativeAdInterval(),
    });
  }
};
