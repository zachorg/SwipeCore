import { RestaurantCard } from "@/types/Types";
import { initMobileAds, isAdsEnabled, getNativeAdUnitId } from "@/utils/ads";
import { Capacitor } from "@capacitor/core";
import { AdMobNativeAdvanced } from "@brandonknudsen/admob-native-advanced";
import type { NativeAdData } from "@brandonknudsen/admob-native-advanced";
import { AdmobAds } from "capacitor-admob-ads";


// Simple in-memory ad inventory and tracking. Safe no-ops on web/dev.

const AD_INTERVAL_ENV = (import.meta as any)?.env?.VITE_ADS_NATIVE_INTERVAL;
const AD_INTERVAL_DEFAULT = 5;
const DEBUG = ((import.meta as any)?.env?.VITE_ADS_DEBUG === 'true') || import.meta.env.DEV;

let adCounter = 0;
const adRegistry = new Map<string, RestaurantCard>();
const cardIdToNativeId = new Map<string, string>();

// Maintain a small preload queue for smoother interleaving
const preloadedAds: NativeAdData[] = [];
const MAX_PRELOADED_ADS = 5; // Increased to support more real ads
// Removed duplicate initialization - now using unified initMobileAds() from @/utils/ads

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

  if (DEBUG) {
    console.log("[Ads] Mapping native ad to card", {
      nativeAdId: native.adId,
      headline: native.headline,
      body: native.body,
      advertiser: native.advertiser,
      photoUrl,
      hasMediaUrl: Boolean(native.mediaContentUrl),
      hasIconUrl: Boolean(native.iconUrl)
    });
  }

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
    images: photos.map(p => p.url), // Add images array for SwipeCard navigation
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
  
  if (DEBUG) {
    console.log("[Ads] Final mapped card", {
      cardId: card.id,
      isSponsored: card.isSponsored,
      title: card.title,
      subtitle: card.subtitle,
      photosLength: card.photos?.length,
      imagesLength: card.images?.length,
      firstPhotoUrl: card.photos?.[0]?.url,
      firstImageUrl: card.images?.[0]
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
    subtitle: "Recommended near you",
    adClickUrl: undefined,
    photos: [],
    images: [], // Add empty images array
    basicDetails: {
      id,
      displayName: { text: "Sponsored", languageCode: "en" },
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
  
  const photos = [
    {
      url: ad.photo,
      widthPx: 800,
      heightPx: 1200,
    } as any,
  ];

  const card: RestaurantCard = {
    id,
    isSponsored: true,
    title: ad.headline,
    subtitle: `${ad.advertiser} • ${ad.body.slice(0, 50)}...`,
    adClickUrl: undefined,
    photos,
    images: photos.map(p => p.url), // Add images array for SwipeCard navigation
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
    
    if (DEBUG) {
      console.log("[Ads] topUpPreloadedAds called", { platform, currentQueueSize: preloadedAds.length, target: MAX_PRELOADED_ADS });
    }
    
    // Ensure AdMob is initialized using the unified approach
    await initMobileAds();
    
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
      // Android: Try capacitor-admob-ads for native ads (fallback to mock if issues)
      if (DEBUG) {
        console.log("[Ads] Android: Attempting real native ads via capacitor-admob-ads (compatibility warning exists)");
      }
      while (preloadedAds.length < MAX_PRELOADED_ADS) {
        const adUnitId = getNativeAdUnitId();
        if (DEBUG) {
          console.log("[Ads] Loading Android native ad", { 
            adUnitId, 
            queueSize: preloadedAds.length,
            adsEnabled: isAdsEnabled(),
            testingMode: import.meta.env.VITE_ADS_TESTING,
            envVars: {
              VITE_ADS_ENABLED: import.meta.env.VITE_ADS_ENABLED,
              VITE_ADS_TESTING: import.meta.env.VITE_ADS_TESTING,
              VITE_ADMOB_NATIVE_AD_UNIT_ID_ANDROID: import.meta.env.VITE_ADMOB_NATIVE_AD_UNIT_ID_ANDROID
            }
          });
        }
        try {
          if (DEBUG) {
            console.log("[Ads] Calling AdmobAds.loadNativeAd with options:", {
              adId: adUnitId,
              isTesting: import.meta.env.VITE_ADS_TESTING === 'true',
              adsCount: 1
            });
          }
          
          const result = await AdmobAds.loadNativeAd({
            adId: adUnitId,
            isTesting: import.meta.env.VITE_ADS_TESTING === 'true',
            adsCount: 1
          });
          
          if (DEBUG) {
            console.log("[Ads] AdmobAds.loadNativeAd result:", result);
          }
          
          if (result && result.ads && result.ads.length > 0) {
            const adData = result.ads[0];
            if (DEBUG) {
              console.log("[Ads] Processing ad data:", adData);
            }
            
            // Convert to our expected format
            const nativeAdData: NativeAdData = {
              adId: adData.id,
              headline: adData.headline,
              body: adData.body,
              callToAction: adData.cta,
              advertiser: adData.advertiser,
              mediaContentUrl: adData.cover,
              iconUrl: adData.icon,
              adChoicesIconUrl: adData.adChoicesUrl,
              isContentAd: true // Default for this plugin
            };
            preloadedAds.push(nativeAdData);
            if (DEBUG) {
              console.log("[Ads] Android native ad loaded successfully", { 
                adId: nativeAdData.adId, 
                headline: nativeAdData.headline,
                hasMedia: Boolean(nativeAdData.mediaContentUrl) 
              });
            }
          } else {
            if (DEBUG) {
              console.warn("[Ads] No ads returned from AdmobAds.loadNativeAd", { result });
            }
            // Break the loop if we get an empty response to avoid infinite requests
            break;
          }
        } catch (e) {
          if (DEBUG) {
            console.warn("[Ads] Android native ad load failed, will use mock data", e);
          }
          break;
        }
        
        // Add a small delay between ad requests to avoid rate limiting
        if (preloadedAds.length < MAX_PRELOADED_ADS) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (DEBUG) {
        console.log("[Ads] Android ad preload completed", { finalQueueSize: preloadedAds.length });
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

  // Android: Use real native ads via capacitor-admob-ads, fallback to mock
  if (platform === "android") {
    // Ensure AdMob is initialized for proper tracking
    void initMobileAds();
    
    // Try to get a real native ad if available
    const next = preloadedAds.shift();
    if (next) {
      // Aggressively refill queue when it gets low
      if (preloadedAds.length <= 2) {
        if (DEBUG) {
          console.log("[Ads] Queue getting low, triggering refill", { remaining: preloadedAds.length });
        }
        void topUpPreloadedAds();
      }
      const card = mapNativeAdToCard(next);
      if (DEBUG) {
        console.log("[Ads] Emitting real Android native ad card", { cardId: card.id, nativeId: next.adId, queueRemaining: preloadedAds.length });
      }
      return card;
    }
    
    // Try to refill immediately if queue is empty
    if (preloadedAds.length === 0) {
      if (DEBUG) {
        console.log("[Ads] Queue is empty, attempting immediate refill");
      }
      try {
        // Try one immediate ad load
        const adUnitId = getNativeAdUnitId();
        const result = await AdmobAds.loadNativeAd({
          adId: adUnitId,
          isTesting: import.meta.env.VITE_ADS_TESTING === 'true',
          adsCount: 1
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
            isContentAd: true
          };
          
          const card = mapNativeAdToCard(nativeAdData);
          if (DEBUG) {
            console.log("[Ads] Immediate refill successful, emitting real ad", { cardId: card.id });
          }
          
          // Start background refill for next time
          void topUpPreloadedAds();
          return card;
        }
      } catch (e) {
        if (DEBUG) {
          console.warn("[Ads] Immediate refill failed", e);
        }
      }
    }
    
    // Fallback to realistic mock data if no real ads available
    const card = createRealisticNativeAd();
    if (DEBUG) {
      console.log("[Ads] Emitting mock Android native ad (no real ads available)", { cardId: card.id, advertiser: card.adMeta?.advertiser });
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