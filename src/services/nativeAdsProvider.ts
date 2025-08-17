import { RestaurantCard } from "@/types/Types";
import { initMobileAds, isAdsEnabled, getNativeAdUnitId } from "@/utils/ads";
import { Capacitor } from "@capacitor/core";
import { AdmobAds } from "capacitor-admob-ads";

// Simple in-memory ad inventory and tracking. Safe no-ops on web/dev.

const AD_INTERVAL_ENV = (import.meta as any)?.env?.VITE_ADS_NATIVE_INTERVAL;
const AD_INTERVAL_DEFAULT = 5;
const DEBUG =
  (import.meta as any)?.env?.VITE_ADS_DEBUG === "true" || import.meta.env.DEV;

let adCounter = 0;
const adRegistry = new Map<string, RestaurantCard>();
const cardIdToNativeId = new Map<string, string>();

// Maintain a small preload queue for smoother interleaving
const preloadedAds: any = [];
const MAX_PRELOADED_ADS = 5; // Increased to support more real ads
// Removed duplicate initialization - now using unified initMobileAds() from @/utils/ads

// Track AdChoices link URLs for Android ads (plugin returns link, not icon)
const nativeAdIdToAdChoicesLinkUrl = new Map<string, string>();

// Simple event listeners to notify UI when an ad card has been updated with real content
type AdUpdateListener = (payload: {
  cardId: string;
  updatedCard: RestaurantCard;
}) => void;
const adUpdateListeners = new Set<AdUpdateListener>();

export function onAdUpdated(listener: AdUpdateListener): () => void {
  adUpdateListeners.add(listener);
  return () => adUpdateListeners.delete(listener);
}

function emitAdUpdated(cardId: string, updatedCard: RestaurantCard): void {
  adUpdateListeners.forEach((fn) => {
    try {
      fn({ cardId, updatedCard });
    } catch {}
  });
}

function mapNativeAdToCard(native: any, targetCardId?: string): RestaurantCard {
  const id = targetCardId ?? `native-${native.adId}`;
  const photoUrl = native.mediaContentUrl || native.iconUrl || undefined;
  const fallbackUrl =
    "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=1200&fit=crop";
  const photos = [
    {
      url: photoUrl || fallbackUrl,
      widthPx: Math.max(native.mediaContentUrl ? 800 : 150, 150), // Ensure minimum 150px (well above 32dp requirement)
      heightPx: Math.max(native.mediaContentUrl ? 600 : 150, 150), // Ensure minimum 150px
    } as any,
  ];

  if (DEBUG) {
    console.log("[Ads] Mapping native ad to card", {
      nativeAdId: native.adId,
      headline: native.headline,
      body: native.body,
      advertiser: native.advertiser,
      photoUrl,
      hasMediaUrl: Boolean(native.mediaContentUrl),
      hasIconUrl: Boolean(native.iconUrl),
    });
  }

  const adChoicesLink =
    nativeAdIdToAdChoicesLinkUrl.get(native.adId) ||
    (typeof (native as any)?.adChoicesIconUrl === "string" &&
    (native as any).adChoicesIconUrl.startsWith("http")
      ? (native as any).adChoicesIconUrl
      : undefined) ||
    "https://www.youradchoices.com/";

  const card: RestaurantCard = {
    id,
    isSponsored: true,
    title: native.headline || "Sponsored",
    subtitle:
      native.advertiser || (native.body ? native.body.slice(0, 60) : undefined),
    adClickUrl: undefined, // Click handled by native SDK where applicable
    cuisine: undefined,
    rating: native.starRating || undefined,
    priceRange: undefined,
    distance: undefined,
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
    adMeta: {
      adId: native.adId,
      isAppInstallAd: native.isAppInstallAd,
      isContentAd: native.isContentAd,
      adChoicesIconUrl:
        native.adChoicesIconUrl ||
        "https://www.gstatic.com/adsense/adchoices/images/adchoices_blue.png",
      adChoicesText: native.adChoicesText || "Ad",
      adChoicesLinkUrl: adChoicesLink,
    },
  } as RestaurantCard;

  adRegistry.set(id, card);
  cardIdToNativeId.set(id, native.adId);

  if (DEBUG) {
    console.log("[Ads] Final mapped card", {
      cardId: card.id,
      isSponsored: card.isSponsored,
      title: card.title,
      subtitle: card.subtitle,
      photosLength: card.photos?.length,
      imagesLength: card.images?.length,
      firstPhotoUrl: card.photos?.[0]?.url,
      firstImageUrl: card.images?.[0],
      photoWidth: card.photos?.[0]?.widthPx,
      photoHeight: card.photos?.[0]?.heightPx,
      hasAdChoicesIcon: Boolean(card.adMeta?.adChoicesIconUrl),
      adChoicesText: card.adMeta?.adChoicesText,
    });
  }

  return card;
}

function createFallbackAd(): RestaurantCard {
  const id = `ad-${Date.now()}-${adCounter++}`;
  const card: RestaurantCard = {
    id,
    isSponsored: true,
    title: "Sponsored",
    subtitle: undefined,
    adClickUrl: undefined,
    photos: [],
    images: [], // Add empty images array
    basicDetails: {
      id,
      displayName: { text: "Sponsored", languageCode: "en" },
      regularOpeningHours: { openNow: false },
    },
    adMeta: {
      adChoicesIconUrl:
        "https://www.gstatic.com/adsense/adchoices/images/adchoices_blue.png",
      adChoicesText: "Ad",
    },
  } as RestaurantCard;
  adRegistry.set(id, card);
  return card;
}

function createRealisticNativeAd(): RestaurantCard {
  const id = `native-ad-${Date.now()}-${adCounter++}`;

  // Real advertiser data that would appear in actual native ads
  const realAds = [
    {
      advertiser: "McDonald's",
      headline: "Try Our New Crispy Chicken Sandwich",
      body: "Made with 100% white meat chicken breast. Available now at participating locations.",
      photo:
        "https://images.unsplash.com/photo-1606755962773-d324e9a13086?w=800&h=1200&fit=crop",
      callToAction: "Order Now",
    },
    {
      advertiser: "Starbucks",
      headline: "Fall Favorites Are Back",
      body: "Pumpkin Spice Latte and Apple Crisp Macchiato. Made with real pumpkin and apple flavors.",
      photo:
        "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&h=1200&fit=crop",
      callToAction: "Find Store",
    },
    {
      advertiser: "Domino's Pizza",
      headline: "2 Large Pizzas for $12.99 Each",
      body: "Choose from our most popular toppings. Delivery or carryout. Limited time offer.",
      photo:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=1200&fit=crop",
      callToAction: "Order Now",
    },
    {
      advertiser: "Chipotle",
      headline: "Burrito Bowl Made Your Way",
      body: "Fresh ingredients, bold flavors. Customize your perfect bowl with our app.",
      photo:
        "https://images.unsplash.com/photo-1599974624720-29c6e4b7c3a4?w=800&h=1200&fit=crop",
      callToAction: "Order Ahead",
    },
    {
      advertiser: "KFC",
      headline: "11 Herbs & Spices, Original Recipe",
      body: "Our secret blend of herbs and spices makes our chicken finger lickin' good.",
      photo:
        "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&h=1200&fit=crop",
      callToAction: "Find KFC",
    },
    {
      advertiser: "Subway",
      headline: "Freshly Baked Bread Daily",
      body: "Choose from our selection of freshly baked breads and build your perfect sub.",
      photo:
        "https://images.unsplash.com/photo-1555072956-7758afb20e8f?w=800&h=1200&fit=crop",
      callToAction: "Build Sub",
    },
  ];

  const ad = realAds[adCounter % realAds.length];

  const photos = [
    {
      url: ad.photo,
      widthPx: 800, // Already meets minimum requirement
      heightPx: 1200, // Already meets minimum requirement
    } as any,
  ];

  const card: RestaurantCard = {
    id,
    isSponsored: true,
    title: "Sponsored",
    subtitle: undefined,
    adClickUrl: undefined,
    photos: [],
    images: [], // Keep blank until real ad loads
    basicDetails: {
      id,
      displayName: { text: "Sponsored", languageCode: "en" },
      regularOpeningHours: { openNow: false },
    },
    // Store ad metadata for tracking
    adMeta: {
      isRealisticAd: true,
      adChoicesIconUrl:
        "https://www.gstatic.com/adsense/adchoices/images/adchoices_blue.png", // Standard AdChoices icon
      adChoicesText: "Ad",
    },
  } as RestaurantCard;

  adRegistry.set(id, card);
  return card;
}

export function startNativeAdsPreload(): void {
  try {
    if (!isAdsEnabled()) return;
    if (DEBUG) console.log("[Ads] startNativeAdsPreload: queued init");
    const platform = Capacitor.getPlatform();
    if (platform === "web") {
      if (DEBUG) console.log("[Ads] Web platform - skipping native preload");
      return;
    }

    // No eager init here. Actual init happens only inside topUpPreloadedAds and getNextAdCard call sites.
  } catch {
    // ignore
  }
}

async function topUpPreloadedAds(): Promise<void> {
  try {
    const platform = Capacitor.getPlatform();
    if (platform === "web") return; // not supported on web

    if (DEBUG) {
      console.log("[Ads] topUpPreloadedAds called", {
        platform,
        currentQueueSize: preloadedAds.length,
        target: MAX_PRELOADED_ADS,
      });
    }

    // Ensure AdMob is initialized using the unified approach
    await initMobileAds();

    while (preloadedAds.length < MAX_PRELOADED_ADS) {
      const adUnitId = getNativeAdUnitId();
      if (DEBUG) {
        console.log("[Ads] Loading iOS native ad", {
          adUnitId,
          queueSize: preloadedAds.length,
        });
      }
      try {
        const data = await AdmobAds.loadNativeAd({
          adId: adUnitId,
          isTesting: import.meta.env.VITE_ADS_TESTING === "true",
          adsCount: 1,
        });
        preloadedAds.push(data);
        if (DEBUG) {
          console.log("[Ads] iOS native ad loaded", JSON.stringify(data));
        }
      } catch (e) {
        if (DEBUG) {
          console.warn("[Ads] iOS native ad load failed", e);
        }
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

export async function getNextAdCard(): Promise<RestaurantCard | null> {
  if (!isAdsEnabled()) return null;
  const platform = Capacitor.getPlatform();

  // iOS: Use preloaded native ads from AdMobNativeAdvanced
  await topUpPreloadedAds();
  const next = preloadedAds.shift();
  if (next) {
    // Refill queue in background
    const card = mapNativeAdToCard(next);
    if (DEBUG) {
      console.log("[Ads] Emitting preloaded iOS native ad card", {
        cardId: card.id,
        nativeId: next.adId,
      });
    }
    return card;
  }
}

export function recordImpression(adId: string): void {
  if (!adRegistry.has(adId)) return;
  const nativeId = cardIdToNativeId.get(adId);
  const platform = Capacitor.getPlatform();

  if (platform === "android") {
    // Android: On first impression of placeholder, load and swap in a real native ad
    (async () => {
      try {
        const adUnitId = getNativeAdUnitId();
        await initMobileAds();
        const result = await AdmobAds.loadNativeAd({
          adId: adUnitId,
          isTesting: import.meta.env.VITE_ADS_TESTING === "true",
          adsCount: 1,
        });
        if (result && result.ads && result.ads.length > 0) {
          const adData = result.ads[0];
          const nativeAdData: NativeAdData = {
            adId: adData.id,
            headline: adData.headline,
            body: adData.body,
            callToAction: adData.cta,
            advertiser: adData.advertiser,
            mediaContentUrl: adData.cover,
            iconUrl: adData.icon,
            adChoicesIconUrl: adData.adChoicesUrl,
            isContentAd: true,
          };
          // Replace content of existing card id so UI updates in place
          const realCard = mapNativeAdToCard(nativeAdData, adId);
          adRegistry.set(adId, realCard);
          cardIdToNativeId.set(adId, nativeAdData.adId);
          emitAdUpdated(adId, realCard);
          if (DEBUG)
            console.log(
              "[Ads] Android swapped placeholder with real native ad",
              { cardId: adId }
            );
        }
      } catch (e) {
        if (DEBUG) console.warn("[Ads] Android on-impression load failed", e);
      }
    })();
  } else if (DEBUG) {
    console.log("[Ads] Impression recorded", { adId });
  }
}

export function handleClick(adId: string): void {
  const nativeId = cardIdToNativeId.get(adId);
  const platform = Capacitor.getPlatform();

  if (platform === "android") {
    // Android: Trigger native ad overlay so user can click through
    try {
      // Shows the native ad UI (provided by the SDK) which handles navigation
      // and proper click/impression reporting
      // Best-effort, ignore if plugin not available
      void (AdmobAds as any)?.triggerNativeAd?.({ id: nativeId });
      if (DEBUG)
        console.log("[Ads] Android ad overlay triggered", { adId, nativeId });
    } catch {
      if (DEBUG)
        console.warn("[Ads] Android ad click trigger failed", {
          adId,
          nativeId,
        });
    }
  }
  // Fallback: no-op for other platforms
}

export function getNativeAdIdForCard(cardId: string): string | undefined {
  return cardIdToNativeId.get(cardId);
}
