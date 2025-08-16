// AdMob helpers
import { Capacitor } from '@capacitor/core';

let initialized = false;

export function getAdMobAppId(): string {
  try {
    const platform = Capacitor.getPlatform();
    const DEBUG = import.meta.env.VITE_ADS_DEBUG === 'true' || import.meta.env.DEV;

    if (platform === 'android') {
      const id = import.meta.env.VITE_ADMOB_APP_ID_ANDROID;
      if (!id) {
        console.error('[Ads] VITE_ADMOB_APP_ID_ANDROID not set in .env file');
        return '';
      }
      if (DEBUG) console.log('[Ads] Using Android app ID from .env:', id);
      return id;
    }
    if (platform === 'ios') {
      const id = import.meta.env.VITE_ADMOB_APP_ID_IOS;
      if (!id) {
        console.error('[Ads] VITE_ADMOB_APP_ID_IOS not set in .env file');
        return '';
      }
      if (DEBUG) console.log('[Ads] Using iOS app ID from .env:', id);
      return id;
    }
    if (DEBUG) console.log('[Ads] Using test app ID for platform:', platform);
    return 'test-app-id';
  } catch (e) {
    console.warn('[Ads] Error getting app ID:', e);
    return 'test-app-id';
  }
}

export function isAdsEnabled(): boolean {
  try {
    return (import.meta as any)?.env?.VITE_ADS_ENABLED === 'true';
  } catch {
    return false;
  }
}

export function getNativeAdUnitId(): string {
  const platform = Capacitor.getPlatform();
  if (platform === 'android') {
    const id = (import.meta as any)?.env?.VITE_ADMOB_NATIVE_AD_UNIT_ID_ANDROID;
    if (!id) {
      console.error('[Ads] VITE_ADMOB_NATIVE_AD_UNIT_ID_ANDROID not set in .env file');
      return '';
    }
    return id;
  }
  if (platform === 'ios') {
    const id = (import.meta as any)?.env?.VITE_ADMOB_NATIVE_AD_UNIT_ID_IOS;
    if (!id) {
      console.error('[Ads] VITE_ADMOB_NATIVE_AD_UNIT_ID_IOS not set in .env file');
      return '';
    }
    return id;
  }
  return '';
}

export function getBannerAdUnitId(): string {
  const platform = Capacitor.getPlatform();
  if (platform === 'android') {
    const id = (import.meta as any)?.env?.VITE_ADMOB_BANNER_AD_UNIT_ID_ANDROID;
    if (!id) {
      console.error('[Ads] VITE_ADMOB_BANNER_AD_UNIT_ID_ANDROID not set in .env file');
      return '';
    }
    return id;
  }
  if (platform === 'ios') {
    const id = (import.meta as any)?.env?.VITE_ADMOB_BANNER_AD_UNIT_ID_IOS;
    if (!id) {
      console.error('[Ads] VITE_ADMOB_BANNER_AD_UNIT_ID_IOS not set in .env file');
      return '';
    }
    return id;
  }
  return '';
}

export async function initMobileAds(): Promise<boolean> {
  if (initialized) return true;
  try {
    const enabled = isAdsEnabled();
    if (!enabled) return false;

    const platform = Capacitor.getPlatform();
    const DEBUG = import.meta.env.VITE_ADS_DEBUG === 'true' || import.meta.env.DEV;

    // On web, act as a no-op to avoid errors during local dev/preview
    if (platform === 'web') {
      initialized = true;
      return true;
    }

    const appId = getAdMobAppId();
    if (DEBUG) {
      console.log('[AdMob] Initializing Mobile Ads SDK', { appId, platform });
    }
    
    if (platform === 'ios') {
      // iOS: Use AdMobNativeAdvanced for native ads
      const { AdMobNativeAdvanced } = await import('@brandonknudsen/admob-native-advanced');
      await AdMobNativeAdvanced.initialize({ appId });
      if (DEBUG) console.log('[AdMob] AdMobNativeAdvanced initialized for iOS');
    } else if (platform === 'android') {
      // Android: Use @capacitor-community/admob for initialization
      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.initialize({
        testingDevices: [],
        initializeForTesting: false
      });
      if (DEBUG) console.log('[AdMob] @capacitor-community/admob initialized for Android');
    }
    
    initialized = true;
    
    if (DEBUG) {
      console.log('[AdMob] Mobile Ads SDK initialization complete');
    }
    
    return true;
  } catch (e) {
    console.warn('[AdMob] Ads init failed:', e);
    return false;
  }
}