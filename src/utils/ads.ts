// Lightweight AdMob init scaffolding; replace with real plugin calls when installed
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

    // If a Capacitor AdMob plugin is present, attempt initialization
    const maybeAdMob = (window as any).AdMob || (window as any).Capacitor?.Plugins?.AdMob;
    if (maybeAdMob?.initialize) {
      await maybeAdMob.initialize({
        requestTrackingAuthorization: false,
        testingDevices: [],
        initializeForTesting: true,
      });
      initialized = true;
      return true;
    }

    // No-op in web or before plugin install
    initialized = true;
    return true;
  } catch (e) {
    console.warn('Ads init failed:', e);
    return false;
  }
}


