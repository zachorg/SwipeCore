import { RestaurantCard } from "@/types/Types";
import { initMobileAds, isAdsEnabled } from "@/utils/ads";

// Simple in-memory ad inventory and tracking. Safe no-ops on web/dev.

const AD_INTERVAL_ENV = (import.meta as any)?.env?.VITE_ADS_NATIVE_INTERVAL;
const AD_INTERVAL_DEFAULT = 5;

let adCounter = 0;
const adRegistry = new Map<string, RestaurantCard>();

function createAd(baseId?: string): RestaurantCard {
  const id = baseId ?? `ad-${Date.now()}-${adCounter++}`;

  const card: RestaurantCard = {
    id,
    isSponsored: true,
    title: "Sponsored recommendation",
    subtitle: "Discover great local options",
    adClickUrl: "https://www.google.com/maps/search/restaurants+near+me",
    cuisine: undefined,
    rating: undefined,
    priceRange: undefined,
    distance: undefined,
    address: undefined,
    isOpenNow: undefined,
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
  // Initialize mobile ads when enabled; safe to call on web (no-op)
  try {
    if (isAdsEnabled()) {
      void initMobileAds();
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
  // For now, return a lightweight sponsored card. Real native rendering is handled elsewhere.
  return createAd();
}

export function recordImpression(adId: string): void {
  if (!adRegistry.has(adId)) return;
  if (import.meta.env.DEV) {
    console.log("[Ads] Impression recorded", { adId });
  }
}

export function handleClick(adId: string): void {
  const card = adRegistry.get(adId);
  if (!card) return;
  const url = card.adClickUrl;
  if (url && typeof window !== "undefined") {
    try {
      window.open(url, "_blank");
    } catch {
      // ignore
    }
  }
}


