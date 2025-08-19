// AdMob helpers
import { AdmobConsentDebugGeography, AdmobConsentStatus } from "@capacitor-community/admob";
import { Capacitor } from "@capacitor/core";

let initialized = false;
let intializing = false;

export interface NativeAdData {
  adId: string;
  headline: string;
  cta: string;
  body: string;
  advertiser: string;
  iconUrl: string;
  mediaContentUrl: string;
  adChoicesIconUrl: string;
  adChoicesLinkUrl: string;
}

export function getAdMobAppId(): string {
  try {
    const platform = Capacitor.getPlatform();
    const DEBUG =
      import.meta.env.VITE_ADS_DEBUG === "true" || import.meta.env.DEV;

    if (platform === "android") {
      const id = import.meta.env.VITE_ADMOB_APP_ID_ANDROID;
      if (!id) {
        console.error("[Ads] VITE_ADMOB_APP_ID_ANDROID not set in .env file");
        return "";
      }
      if (DEBUG) console.log("[Ads] Using Android app ID from .env:", id);
      return id;
    }
    if (platform === "ios") {
      const id = import.meta.env.VITE_ADMOB_APP_ID_IOS;
      if (!id) {
        console.error("[Ads] VITE_ADMOB_APP_ID_IOS not set in .env file");
        return "";
      }
      if (DEBUG) console.log("[Ads] Using iOS app ID from .env:", id);
      return id;
    }
    if (DEBUG) console.log("[Ads] Using test app ID for platform:", platform);
    return "test-app-id";
  } catch (e) {
    console.warn("[Ads] Error getting app ID:", e);
    return "test-app-id";
  }
}

export function isAdsEnabled(): boolean {
  try {
    return (import.meta as any)?.env?.VITE_ADS_ENABLED === "true";
  } catch {
    return false;
  }
}

export function getNativeAdUnitId(): string {
  const platform = Capacitor.getPlatform();
  if (platform === "android") {
    const id = (import.meta as any)?.env?.VITE_ADMOB_NATIVE_AD_UNIT_ID_ANDROID;
    if (!id) {
      console.error(
        "[Ads] VITE_ADMOB_NATIVE_AD_UNIT_ID_ANDROID not set in .env file"
      );
      return "";
    }
    return id;
  }
  if (platform === "ios") {
    const id = (import.meta as any)?.env?.VITE_ADMOB_NATIVE_AD_UNIT_ID_IOS;
    if (!id) {
      console.error(
        "[Ads] VITE_ADMOB_NATIVE_AD_UNIT_ID_IOS not set in .env file"
      );
      return "";
    }
    return id;
  }
  return "";
}

export function getBannerAdUnitId(): string {
  const platform = Capacitor.getPlatform();
  if (platform === "android") {
    const id = (import.meta as any)?.env?.VITE_ADMOB_BANNER_AD_UNIT_ID_ANDROID;
    if (!id) {
      console.error(
        "[Ads] VITE_ADMOB_BANNER_AD_UNIT_ID_ANDROID not set in .env file"
      );
      return "";
    }
    return id;
  }
  if (platform === "ios") {
    const id = (import.meta as any)?.env?.VITE_ADMOB_BANNER_AD_UNIT_ID_IOS;
    if (!id) {
      console.error(
        "[Ads] VITE_ADMOB_BANNER_AD_UNIT_ID_IOS not set in .env file"
      );
      return "";
    }
    return id;
  }
  return "";
}

export async function initMobileAds(): Promise<boolean> {
  if (!isAdsEnabled() || intializing) return false;
  if (initialized) return true;
  intializing = true;
  try {
    const appId = getAdMobAppId();
    console.log("[AdMob] Initializing Mobile Ads SDK: ", appId);

    // Android: Use @capacitor-community/admob for initialization
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.initialize({
      testingDevices: [],
      initializeForTesting: false,
    });
    console.log("[AdMob] @capacitor-community/admob initialized for Android");


    // @TODO: IOS tracking authorization
    if (false) {
      const [trackingInfo] = await Promise.all([
        AdMob.trackingAuthorizationStatus()

      ]);

      if (trackingInfo.status === 'notDetermined') {
        /**
         * If you want to explain TrackingAuthorization before showing the iOS dialog,
         * you can show the modal here.
         * ex)
         * const modal = await this.modalCtrl.create({
         *   component: RequestTrackingPage,
         * });
         * await modal.present();
         * await modal.onDidDismiss();  // Wait for close modal
         **/

        await AdMob.requestTrackingAuthorization();
      }

      const authorizationStatus = await AdMob.trackingAuthorizationStatus();
      if (
        authorizationStatus.status === 'authorized'
      ) {
        initialized = true;
        throw new Error("Tracking authorization not determined");
      }

    }

    initialized = true;
    console.log("[AdMob] Mobile Ads SDK initialization complete");
    return true;
  } catch (e) {
    console.warn("[AdMob] Ads init failed:", e);
    return false;
  } finally {
    intializing = false;
  }
}
