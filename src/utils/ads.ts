// Lightweight Mobile Ads init; now oriented around Native Ads
import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';
import { NativeAds } from '@/utils/nativeAds';
let initialized = false;

export async function initMobileAds(): Promise<boolean> {
  if (initialized) return true;
  try {
    const enabled = import.meta.env.VITE_ADS_ENABLED === 'true';
    if (!enabled) return false;

    const platform = Capacitor.getPlatform();

    // On web, act as a no-op to avoid errors during local dev/preview
    if (platform === 'web') {
      initialized = true;
      return true;
    }

    // If a Capacitor AdMob plugin is present, attempt initialization
    // On iOS, request ATT if supported by the plugin
    if (platform === 'ios') {
      try {
        await (AdMob as any)?.requestTrackingAuthorization?.();
      } catch {
        // ignore
      }
    }

    // Initialize via Capacitor plugin when present
    if (AdMob?.initialize) {
      console.log('[AdMob] Initializing Mobile Ads SDK');
      await AdMob.initialize({
        testingDevices: [],
        initializeForTesting: true,
      });
      console.log('[AdMob] Initialization complete');
      initialized = true;
    }

    const nativeAdUnitId = platform === 'android'
      ? (import.meta.env.VITE_ADMOB_NATIVE_AD_UNIT_ID_ANDROID)
      : (import.meta.env.VITE_ADMOB_NATIVE_AD_UNIT_ID_IOS);

    // Attempt a preload only on Android, since our NativeAds bridge is Android-only right now
    if (platform === 'android') {
      try {
        console.log('[NativeAds][Init] Preloading native ad', { nativeAdUnitId });
        await NativeAds.load({ adUnitId: nativeAdUnitId });
        console.log('[NativeAds][Init] Preload success');
      } catch (e) {
        console.warn('[NativeAds][Init] Preload failed', e);
      }
    }

    return true;
  } catch (e) {
    console.warn('[AdMob] Ads init failed:', e);
    return false;
  }
}


