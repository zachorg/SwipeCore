import { RestaurantCard } from "@/types/Types";
import { initMobileAds, isAdsEnabled, getNativeAdUnitId, NativeAdData } from "@/utils/ads";
import { Capacitor } from "@capacitor/core";
import { AdmobAds, AdResult } from "capacitor-admob-ads";

// Simple in-memory ad inventory and tracking. Safe no-ops on web/dev.

const AD_INTERVAL_ENV = (import.meta as any)?.env?.VITE_ADS_NATIVE_INTERVAL;
const AD_INTERVAL_DEFAULT = 5;
const DEBUG =
  (import.meta as any)?.env?.VITE_ADS_DEBUG === "true" || import.meta.env.DEV;

let adCounter = 0;
const adRegistry = new Map<string, RestaurantCard>();
const cardIdToNativeId = new Map<string, string>();

// Maintain a small preload queue for smoother interleaving
const preloadedAds: AdResult[] = [];
const MAX_PRELOADED_ADS = 5; // Increased to support more real ads
// Removed duplicate initialization - now using unified initMobileAds() from @/utils/ads

// Track AdChoices link URLs for Android ads (plugin returns link, not icon)
const nativeAdIdToAdChoicesLinkUrl = new Map<string, string>();

// Simple event listeners to notify UI when an ad card has been updated with real content
// type AdUpdateListener = (payload: {
//   cardId: string;
//   updatedCard: RestaurantCard;
// }) => void;
// const adUpdateListeners = new Set<AdUpdateListener>();

// export function onAdUpdated(listener: AdUpdateListener): () => void {
//   adUpdateListeners.add(listener);
//   return () => adUpdateListeners.delete(listener);
// }

// function emitAdUpdated(cardId: string, updatedCard: RestaurantCard): void {
//   adUpdateListeners.forEach((fn) => {
//     try {
//       fn({ cardId, updatedCard });
//     } catch { }
//   });
// }

function mapNativeAdToCard(native: AdResult, targetCardId?: string): RestaurantCard {
  const id = targetCardId ?? `native-${native.id}`;
  const photoUrl = native.cover;
  const fallbackUrl =
    "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=1200&fit=crop";
  const photos = [
    {
      url: photoUrl || fallbackUrl,
      widthPx: Math.max(native.cover ? 800 : 150, 150), // Ensure minimum 150px (well above 32dp requirement)
      heightPx: Math.max(native.cover ? 600 : 150, 150), // Ensure minimum 150px
    } as any,
  ];

  if (DEBUG) {
    console.log("[Ads] Mapping native ad to card: ", JSON.stringify(native));
  }

  const adChoicesLink = native.adChoicesUrl;

  const card: RestaurantCard = {
    id,
    title: native.headline || "Sponsored",
    subtitle: native.body,
    cuisine: undefined,
    rating: undefined,
    priceRange: undefined,
    distance: native.cta,
    address: undefined,
    isOpenNow: undefined,
    photos,
    images: photos.map((p) => p.url), // Add images array for SwipeCard navigation
    basicDetails: {
      id,
      displayName: { text: native.headline || "Sponsored", languageCode: "en" },
      regularOpeningHours: { openNow: false },
    },
    // Preserve native ad metadata for tracking
    adData: {
      adId: native.id,
      headline: native.headline,
      cta: native.cta,
      body: native.body,
      advertiser: native.advertiser,
      iconUrl: native.icon,
      mediaContentUrl: native.cover,
      adChoicesIconUrl: "https://storage.googleapis.com/interactive-media-ads/hosted-samples/wta/icon_adchoices.png",
      adChoicesLinkUrl: adChoicesLink,
    },
  } as RestaurantCard;

  adRegistry.set(id, card);
  cardIdToNativeId.set(id, native.id);

  if (DEBUG) {
    console.log("[Ads] Final mapped card", JSON.stringify(card.adData));
  }

  return card;
}

export function startNativeAdsPreload(): void {
  try {
    if (!isAdsEnabled()) return;
    if (DEBUG) console.log("[Ads] startNativeAdsPreload: queued init");
    fetchNativeAds();
  } catch {
    // ignore
  }
}

export function getAvailableAd(): RestaurantCard | null {
  if (!isAdsEnabled()) return null;

  console.log("[Ads] Getting the next available ad: ", preloadedAds.length);
  const next = preloadedAds.shift();
  if (next) {
    return mapNativeAdToCard(next);
  }

  fetchNativeAds();
  return null;
}

async function fetchNativeAds(): Promise<void> {
  try {
    // Ensure AdMob is initialized using the unified approach
    await initMobileAds();

    console.log("[Ads] Fetching native ads: ", preloadedAds.length);
    if (preloadedAds.length < MAX_PRELOADED_ADS) {
      const adUnitId = getNativeAdUnitId();
      const data = await AdmobAds.loadNativeAd({
        adId: adUnitId,
        isTesting: import.meta.env.VITE_ADS_TESTING === "true",
        adsCount: (MAX_PRELOADED_ADS - preloadedAds.length) as 1 | 2 | 3 | 4 | 5,
      });
      preloadedAds.push(...data.ads);
      console.log("[Ads] native ad loaded", JSON.stringify(data));
    }
  } catch (e) {
    console.warn("[Ads] native ad load failed", e);
    // ignore
  }
}

export function recordImpression(adId: string): void {
  if (!adRegistry.has(adId)) return;
  const nativeId = cardIdToNativeId.get(adId);
  const platform = Capacitor.getPlatform();

  if (platform === "android") {
    console.log("[Ads] Recording impression for ad: ", adId);
    (async () => {
      try {
        await initMobileAds();
      } catch (e) {
        if (DEBUG) console.warn("[Ads] Android on-impression load failed", e);
      }
    })();
  }
}

export function handleClick(adId: string): void {
  const nativeId = cardIdToNativeId.get(adId);
  const platform = Capacitor.getPlatform();

  if (platform === "android") {
    try {
      AdmobAds.triggerNativeAd?.({ id: nativeId });
      console.log("[Ads] Android ad overlay triggered: ", nativeId);
    } catch {
      console.warn("[Ads] Android ad click trigger failed", {
        adId,
        nativeId,
      });
    }
  }
}

export function getNativeAdIdForCard(cardId: string): string | undefined {
  return cardIdToNativeId.get(cardId);
}
