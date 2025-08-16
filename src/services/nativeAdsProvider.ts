import { RestaurantCard } from "@/types/Types";
import { initMobileAds, isAdsEnabled, getNativeAdUnitId } from "@/utils/ads";
import { Capacitor } from "@capacitor/core";
import { AdMobNativeAdvanced } from "@brandonknudsen/admob-native-advanced";
import type { NativeAdData } from "@brandonknudsen/admob-native-advanced";

// Simple in-memory ad inventory and tracking. Safe no-ops on web/dev.

const AD_INTERVAL_ENV = (import.meta as any)?.env?.VITE_ADS_NATIVE_INTERVAL;
const AD_INTERVAL_DEFAULT = 5;

let adCounter = 0;
const adRegistry = new Map<string, RestaurantCard>();
const cardIdToNativeId = new Map<string, string>();

// Maintain a small preload queue for smoother interleaving
const preloadedAds: NativeAdData[] = [];
const MAX_PRELOADED_ADS = 2;

function mapNativeAdToCard(native: NativeAdData): RestaurantCard {
  const id = `native-${native.adId}`;
  const photoUrl = native.mediaContentUrl || native.iconUrl || undefined;
  const photos = photoUrl
    ? [
        {
          url: photoUrl,
          widthPx: 0,
          heightPx: 0,
        } as any,
      ]
    : [];

  const card: RestaurantCard = {
    id,
    isSponsored: true,
    title: native.headline || "Sponsored",
    subtitle: native.advertiser || undefined,
    adClickUrl: undefined, // Click handled by native SDK where applicable
    cuisine: undefined,
    rating: native.starRating || undefined,
    priceRange: undefined,
    distance: undefined,
    address: undefined,
    isOpenNow: undefined,
    photos,
    basicDetails: {
      id,
      displayName: { text: native.headline || "Sponsored", languageCode: "en" },
      regularOpeningHours: { openNow: false },
    },
    // Preserve native ad metadata for tracking
    adMeta: {
      adId: native.adId,
      isAppInstallAd: native.isAppInstallAd,
      isContentAd: native.isContentAd,
    },
  } as RestaurantCard;

  adRegistry.set(id, card);
  cardIdToNativeId.set(id, native.adId);
  return card;
}

function createFallbackAd(): RestaurantCard {
  const id = `ad-${Date.now()}-${adCounter++}`;
  const card: RestaurantCard = {
    id,
    isSponsored: true,
    title: "Sponsored",
    subtitle: "Recommended near you",
    adClickUrl: undefined,
    photos: [],
    basicDetails: {
      id,
      displayName: { text: "Sponsored", languageCode: "en" },
      regularOpeningHours: { openNow: false },
    },
  } as RestaurantCard;
  adRegistry.set(id, card);
  return card;
}

export function startNativeAdsPreload(): void {
  try {
    if (!isAdsEnabled()) return;
    if (import.meta.env.DEV) {
      console.log("[Ads] startNativeAdsPreload: initializing...");
    }
    void initMobileAds();

    const platform = Capacitor.getPlatform();
    if (platform === "web") {
      if (import.meta.env.DEV) console.log("[Ads] Web platform - skipping native preload");
      return;
    }

    // Top up preload queue
    void topUpPreloadedAds();
  } catch {
    // ignore
  }
}

async function topUpPreloadedAds(): Promise<void> {
  try {
    const platform = Capacitor.getPlatform();
    if (platform === "web") return; // not supported
    while (preloadedAds.length < MAX_PRELOADED_ADS) {
      const adUnitId = getNativeAdUnitId();
      if (import.meta.env.DEV) {
        console.log("[Ads] Loading native ad", { adUnitId, queueSize: preloadedAds.length });
      }
      try {
        const data = await AdMobNativeAdvanced.loadAd({ adUnitId });
        preloadedAds.push(data);
        if (import.meta.env.DEV) {
          console.log("[Ads] Native ad loaded", { adId: data.adId, hasMedia: Boolean(data.mediaContentUrl), hasIcon: Boolean(data.iconUrl) });
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn("[Ads] Native ad load failed", e);
        }
        // Stop trying on first failure in this cycle
        break;
      }
    }
  } catch {
    // ignore
  }
}

export function getInterleaveInterval(): number {
  const n = parseInt(AD_INTERVAL_ENV ?? "", 10);
  if (!Number.isNaN(n) && n > 0) return n;
  return AD_INTERVAL_DEFAULT;
}

export function getNextAdCard(): RestaurantCard | null {
  if (!isAdsEnabled()) return null;
  const platform = Capacitor.getPlatform();

  // Use preloaded when available
  const next = preloadedAds.shift();
  if (next) {
    // Refill queue in background
    void topUpPreloadedAds();
    const card = mapNativeAdToCard(next);
    if (import.meta.env.DEV) {
      console.log("[Ads] Emitting preloaded native ad card", { cardId: card.id, nativeId: next.adId });
    }
    return card;
  }

  // On web, fall back to a simple sponsored card to avoid runtime errors
  if (platform === "web") {
    return createFallbackAd();
  }

  // Load on-demand as a fallback
  try {
    // Kick off a background load to warm the queue for next time
    void topUpPreloadedAds();
    return createFallbackAd();
  } catch {
    // If anything fails, return a minimal sponsored card to keep UX flowing
    return createFallbackAd();
  }
}

export function recordImpression(adId: string): void {
  if (!adRegistry.has(adId)) return;
  const nativeId = cardIdToNativeId.get(adId);
  const platform = Capacitor.getPlatform();
  if (nativeId && platform !== "web") {
    // Best-effort; iOS typically auto-tracks when using native overlay
    void AdMobNativeAdvanced.reportImpression(nativeId).catch(() => {});
  } else if (import.meta.env.DEV) {
    console.log("[Ads] Impression recorded", { adId });
  }
}

export function handleClick(adId: string): void {
  const nativeId = cardIdToNativeId.get(adId);
  const platform = Capacitor.getPlatform();
  if (nativeId && platform !== "web") {
    void AdMobNativeAdvanced.reportClick(nativeId).catch(() => {});
    return;
  }
  // Fallback: open AdChoices if available or no-op
}


