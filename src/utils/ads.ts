// AdMob (Capacitor Community) helpers
import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';

let initialized = false;
let trackingAuthorized: boolean | null = null;

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
    return (
      (import.meta as any)?.env?.VITE_ADMOB_NATIVE_AD_UNIT_ID_ANDROID ||
      'ca-app-pub-3940256099942544/2247696110'
    );
  }
  if (platform === 'ios') {
    return (
      (import.meta as any)?.env?.VITE_ADMOB_NATIVE_AD_UNIT_ID_IOS ||
      'ca-app-pub-3940256099942544/3986624511'
    );
  }
  return 'test-native-ad-unit';
}

export async function initMobileAds(): Promise<boolean> {
  if (initialized) return true;
  try {
    const enabled = isAdsEnabled();
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
        const status = await (AdMob as any)?.requestTrackingAuthorization?.();
        trackingAuthorized = status === 'authorized' || status === 3;
        if (import.meta.env.DEV) {
          console.log('[AdMob] ATT status', status);
        }
      } catch (e) {
        if (import.meta.env.DEV) console.log('[AdMob] ATT request failed', e);
        trackingAuthorized = null;
      }
    }

    // Initialize via Capacitor plugin when present
    if (AdMob?.initialize) {
      const initializeForTesting =
        (import.meta as any)?.env?.VITE_ADS_TESTING === 'true';
      const testingDevices: string[] = [];
      if (import.meta.env.DEV) {
        console.log('[AdMob] Initializing Mobile Ads SDK', {
          initializeForTesting,
        });
      }
      await AdMob.initialize({
        testingDevices,
        initializeForTesting,
      });
      console.log('[AdMob] Initialization complete');
      initialized = true;
    }

    return true;
  } catch (e) {
    console.warn('[AdMob] Ads init failed:', e);
    return false;
  }
}

function getInterstitialAdUnitId(): string {
  const platform = Capacitor.getPlatform();
  if (platform === 'android') {
    return (import.meta as any)?.env?.VITE_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID || 'ca-app-pub-3940256099942544/1033173712';
  }
  if (platform === 'ios') {
    return (import.meta as any)?.env?.VITE_ADMOB_INTERSTITIAL_AD_UNIT_ID_IOS || 'ca-app-pub-3940256099942544/4411468910';
  }
  return 'test';
}

export async function prepareInterstitial(): Promise<boolean> {
  try {
    const adId = getInterstitialAdUnitId();
    const isTesting = (import.meta as any)?.env?.VITE_ADS_TESTING === 'true';
    await (AdMob as any).prepareInterstitial?.({ adId, isTesting });
    return true;
  } catch (e) {
    console.warn('[AdMob] prepareInterstitial failed', e);
    return false;
  }
}

export async function showInterstitial(): Promise<boolean> {
  try {
    await (AdMob as any).showInterstitial?.();
    return true;
  } catch (e) {
    console.warn('[AdMob] showInterstitial failed', e);
    return false;
  }
}


