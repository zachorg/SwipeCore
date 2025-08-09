// Lightweight AdMob init wired to Capacitor plugin; reads config per platform
import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';
export interface AdsConfig {
  androidAppId?: string;
  iosAppId?: string;
}

let initialized = false;

export async function initMobileAds(config: AdsConfig): Promise<boolean> {
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

    // Require platform-specific app id from provided config
    const appId = platform === 'android' ? config.androidAppId : platform === 'ios' ? config.iosAppId : undefined;
    if (!appId) {
      console.warn(`Ads init skipped: missing app id for platform "${platform}"`);
      return false;
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
      await AdMob.initialize({
        testingDevices: [],
        initializeForTesting: Boolean(import.meta.env.DEV),
      });
      initialized = true;
      return true;
    }

    // No-op before plugin install
    initialized = true;
    return true;
  } catch (e) {
    console.warn('Ads init failed:', e);
    return false;
  }
}


