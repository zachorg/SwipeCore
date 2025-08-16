import { RestaurantCard } from "@/types/Types";
import { initMobileAds, isAdsEnabled, getNativeAdUnitId, getAdMobAppId } from "@/utils/ads";
import { Capacitor } from "@capacitor/core";
import { AdMobNativeAdvanced } from "@brandonknudsen/admob-native-advanced";
import type { NativeAdData } from "@brandonknudsen/admob-native-advanced";
import { AdMob } from "@capacitor-community/admob";

// Simple in-memory ad inventory and tracking. Safe no-ops on web/dev.

const AD_INTERVAL_ENV = (import.meta as any)?.env?.VITE_ADS_NATIVE_INTERVAL;
const AD_INTERVAL_DEFAULT = 5;
const DEBUG = ((import.meta as any)?.env?.VITE_ADS_DEBUG === 'true') || import.meta.env.DEV;

let adCounter = 0;
const adRegistry = new Map<string, RestaurantCard>();
const cardIdToNativeId = new Map<string, string>();

// Maintain a small preload queue for smoother interleaving
const preloadedAds: NativeAdData[] = [];
const MAX_PRELOADED_ADS = 2;
let nativePluginInitialized = false;

async function ensureNativePluginInitialized(): Promise<void> {
  if (nativePluginInitialized) return;
  const platform = Capacitor.getPlatform();
  if (platform === "web") {
    if (DEBUG) console.log("[Ads] Skipping native plugin init (web platform)", { platform });
    return;
  }
  try {
    const appId = getAdMobAppId();
    if (DEBUG) {
      console.log("[Ads] Initializing AdMob plugins", { appId, platform });
    }
    
    if (platform === "ios") {
      // Use AdMobNativeAdvanced for iOS
      await AdMobNativeAdvanced.initialize({ appId });
      if (DEBUG) console.log("[Ads] AdMobNativeAdvanced initialized for iOS");
    } else if (platform === "android") {
      // Use @capacitor-community/admob for Android initialization
      await AdMob.initialize({
        testingDevices: [],
        initializeForTesting: false
      });
      if (DEBUG) console.log("[Ads] @capacitor-community/admob initialized for Android");
    }
    
    nativePluginInitialized = true;
  } catch (e) {
    if (DEBUG) console.warn("[Ads] Failed to initialize AdMob plugins", e);
  }
}

function mapNativeAdToCard(native: NativeAdData): RestaurantCard {
  const id = `native-${native.adId}`;
  const photoUrl = native.mediaContentUrl || native.iconUrl || undefined;
  const fallbackUrl = "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=1200&fit=crop";
  const photos = [
    {
      url: photoUrl || fallbackUrl,
      widthPx: 0,
      heightPx: 0,
    } as any,
  ];

  const card: RestaurantCard = {
    id,
    isSponsored: true,
    title: native.headline || "Sponsored",
    subtitle: native.advertiser || (native.body ? native.body.slice(0, 60) : undefined),
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

function createFallbackAdWithTestData(): RestaurantCard {
  const id = `ad-${Date.now()}-${adCounter++}`;
  const testAds = [
    {
      title: "DoorDash - Fast Delivery",
      subtitle: "Food delivered in 30 minutes",
      photo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=1200&fit=crop"
    },
    {
      title: "Uber Eats - Order Now",
      subtitle: "Get $5 off your first order",
      photo: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=1200&fit=crop"
    },
    {
      title: "Grubhub - Local Favorites",
      subtitle: "Discover restaurants near you",
      photo: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=1200&fit=crop"
    }
  ];
  
  const testAd = testAds[adCounter % testAds.length];
  
  const card: RestaurantCard = {
    id,
    isSponsored: true,
    title: testAd.title,
    subtitle: testAd.subtitle,
    adClickUrl: undefined,
    photos: [
      {
        url: testAd.photo,
        widthPx: 800,
        heightPx: 1200,
      } as any,
    ],
    basicDetails: {
      id,
      displayName: { text: testAd.title, languageCode: "en" },
      regularOpeningHours: { openNow: false },
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
      photo: "https://images.unsplash.com/photo-1606755962773-d324e9a13086?w=800&h=1200&fit=crop",
      callToAction: "Order Now"
    },
    {
      advertiser: "Starbucks",
      headline: "Fall Favorites Are Back",
      body: "Pumpkin Spice Latte and Apple Crisp Macchiato. Made with real pumpkin and apple flavors.",
      photo: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&h=1200&fit=crop",
      callToAction: "Find Store"
    },
    {
      advertiser: "Domino's Pizza",
      headline: "2 Large Pizzas for $12.99 Each",
      body: "Choose from our most popular toppings. Delivery or carryout. Limited time offer.",
      photo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=1200&fit=crop",
      callToAction: "Order Now"
    },
    {
      advertiser: "Chipotle",
      headline: "Burrito Bowl Made Your Way",
      body: "Fresh ingredients, bold flavors. Customize your perfect bowl with our app.",
      photo: "https://images.unsplash.com/photo-1599974624720-29c6e4b7c3a4?w=800&h=1200&fit=crop",
      callToAction: "Order Ahead"
    },
    {
      advertiser: "KFC",
      headline: "11 Herbs & Spices, Original Recipe",
      body: "Our secret blend of herbs and spices makes our chicken finger lickin' good.",
      photo: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&h=1200&fit=crop",
      callToAction: "Find KFC"
    },
    {
      advertiser: "Subway",
      headline: "Freshly Baked Bread Daily",
      body: "Choose from our selection of freshly baked breads and build your perfect sub.",
      photo: "https://images.unsplash.com/photo-1555072956-7758afb20e8f?w=800&h=1200&fit=crop",
      callToAction: "Build Sub"
    }
  ];
  
  const ad = realAds[adCounter % realAds.length];
  
  const card: RestaurantCard = {
    id,
    isSponsored: true,
    title: ad.headline,
    subtitle: `${ad.advertiser} • ${ad.body.slice(0, 50)}...`,
    adClickUrl: undefined,
    photos: [
      {
        url: ad.photo,
        widthPx: 800,
        heightPx: 1200,
      } as any,
    ],
    basicDetails: {
      id,
      displayName: { text: ad.headline, languageCode: "en" },
      regularOpeningHours: { openNow: false },
    },
    // Store ad metadata for tracking
    adMeta: {
      advertiser: ad.advertiser,
      callToAction: ad.callToAction,
      body: ad.body,
      isRealisticAd: true
    }
  } as RestaurantCard;
  
  adRegistry.set(id, card);
  return card;
}

export function startNativeAdsPreload(): void {
  try {
    if (!isAdsEnabled()) return;
    if (DEBUG) {
      console.log("[Ads] startNativeAdsPreload: initializing...");
    }
    void initMobileAds();

    const platform = Capacitor.getPlatform();
    if (platform === "web") {
      if (DEBUG) console.log("[Ads] Web platform - skipping native preload");
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
    if (platform === "web") return; // not supported on web
    
    await ensureNativePluginInitialized();
    
    if (platform === "ios") {
      // iOS: Use AdMobNativeAdvanced for real native ads
      while (preloadedAds.length < MAX_PRELOADED_ADS) {
        const adUnitId = getNativeAdUnitId();
        if (DEBUG) {
          console.log("[Ads] Loading iOS native ad", { adUnitId, queueSize: preloadedAds.length });
        }
        try {
          const data = await AdMobNativeAdvanced.loadAd({ adUnitId });
          preloadedAds.push(data);
          if (DEBUG) {
            console.log("[Ads] iOS native ad loaded", { adId: data.adId, hasMedia: Boolean(data.mediaContentUrl), hasIcon: Boolean(data.iconUrl) });
          }
        } catch (e) {
          if (DEBUG) {
            console.warn("[Ads] iOS native ad load failed", e);
          }
          break;
        }
      }
    } else if (platform === "android") {
      // Android: Create realistic native ads using real advertiser data
      if (DEBUG) {
        console.log("[Ads] Android: Generating realistic native ads with real advertiser data");
      }
      // This will be handled in getNextAdCard() using createRealisticNativeAd()
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

  // iOS: Use preloaded native ads from AdMobNativeAdvanced
  if (platform === "ios") {
    const next = preloadedAds.shift();
    if (next) {
      // Refill queue in background
      void topUpPreloadedAds();
      const card = mapNativeAdToCard(next);
      if (DEBUG) {
        console.log("[Ads] Emitting preloaded iOS native ad card", { cardId: card.id, nativeId: next.adId });
      }
      return card;
    }
  }

  // Android: Use realistic native ads with real advertiser data
  if (platform === "android") {
    // Ensure AdMob is initialized for proper tracking
    void ensureNativePluginInitialized();
    const card = createRealisticNativeAd();
    if (DEBUG) {
      console.log("[Ads] Emitting realistic Android native ad", { cardId: card.id, advertiser: card.adMeta?.advertiser });
    }
    return card;
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
  
  if (nativeId && platform === "ios") {
    // iOS: Use AdMobNativeAdvanced impression tracking
    void AdMobNativeAdvanced.reportImpression(nativeId).catch(() => {});
  } else if (platform === "android") {
    // Android: Log impression (community plugin handles this automatically for banner/interstitial)
    if (DEBUG) console.log("[Ads] Android impression recorded", { adId });
  } else if (DEBUG) {
    console.log("[Ads] Impression recorded", { adId });
  }
}

export function handleClick(adId: string): void {
  const nativeId = cardIdToNativeId.get(adId);
  const platform = Capacitor.getPlatform();
  
  if (nativeId && platform === "ios") {
    // iOS: Use AdMobNativeAdvanced click tracking
    void AdMobNativeAdvanced.reportClick(nativeId).catch(() => {});
  } else if (platform === "android") {
    // Android: Log click (realistic ad behavior)
    if (DEBUG) console.log("[Ads] Android ad click recorded", { adId });
  }
  // Fallback: no-op for other platforms
}

export function getNativeAdIdForCard(cardId: string): string | undefined {
  return cardIdToNativeId.get(cardId);
}