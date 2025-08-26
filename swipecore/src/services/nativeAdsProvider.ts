import { RestaurantCard } from "@/types/Types";
import { areAdsEnabled } from "@/utils/ads";
type AdResult = any;

// Simple in-memory ad inventory and tracking. Safe no-ops on web/dev.

const AD_INTERVAL_ENV = Number(process.env.EXPO_PUBLIC_ADS_NATIVE_INTERVAL) || undefined;
const AD_INTERVAL_DEFAULT = 5;
const DEBUG = __DEV__;

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
    if (!areAdsEnabled()) return;
    if (DEBUG) console.log("[Ads] startNativeAdsPreload: queued init");
    fetchNativeAds();
  } catch {
    // ignore
  }
}

export function getAvailableAd(): RestaurantCard | null {
  if (!areAdsEnabled()) return null;

  console.log("[Ads] Getting the next available ad: ", preloadedAds.length);
  const next = preloadedAds.shift();
  if (next) {
    return mapNativeAdToCard(next);
  }

  fetchNativeAds();
  return null;
}

async function fetchNativeAds(): Promise<void> {
  // No-op stub to remove Capacitor dependency while keeping app stable
  return;
}

export function recordImpression(adId: string): void {
  if (!adRegistry.has(adId)) return;
  // No-op
}

export function handleClick(adId: string): void {
  // No-op
}

export function getNativeAdIdForCard(cardId: string): string | undefined {
  return cardIdToNativeId.get(cardId);
}
