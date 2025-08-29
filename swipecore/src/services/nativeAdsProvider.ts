import { RestaurantCard } from "@/types/Types";
import { areAdsEnabled, getNativeAdUnitId, isDebugMode } from "@/utils/ads";
import { Platform } from 'react-native';
import {
  AdManager,
  MAX_AD_CONTENT_RATING,
  NativeAd,
  TestIds,
} from 'react-native-admob-native-ads';
import { useAuth } from "@/contexts/AuthContext";

// Simple in-memory ad inventory and tracking
const AD_INTERVAL_ENV = Number(process.env.EXPO_PUBLIC_ADS_NATIVE_INTERVAL) || 5;
const AD_INTERVAL_DEFAULT = 5;
const DEBUG = isDebugMode();

let adCounter = 0;
const adRegistry = new Map<string, RestaurantCard>();
const cardIdToNativeId = new Map<string, string>();

// Repository name for native ads
const REPOSITORY_NAME = 'swipecore_native_ads';

// Track AdChoices link URLs for Android ads
const nativeAdIdToAdChoicesLinkUrl = new Map<string, string>();

// Initialize the ad repository
async function initializeAdRepository(): Promise<boolean> {
  try {
    const adUnitId = getNativeAdUnitId();
    if (!adUnitId) {
      console.warn('[Ads] No ad unit ID configured');
      return false;
    }

    const { userProfile } = useAuth();

    let contentRating: MAX_AD_CONTENT_RATING = 'UNSPECIFIED';
    if (userProfile?.age < 13) {
      contentRating = 'G';
    } else if (userProfile?.age < 17) {
      contentRating = 'PG';
    } else if (userProfile?.age < 19) {
      contentRating = 'T';
    } else if (userProfile?.age >= 21) {
      contentRating = 'MA';
    }

    // Configure AdManager
    await AdManager.setRequestConfiguration({
      testDeviceIds: [],
      maxAdContentRating: contentRating,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeConsent: false,
    });

    // Register repository for native ads
    const success = await AdManager.registerRepository({
      name: REPOSITORY_NAME,
      adUnitId: adUnitId,
      numOfAds: 10, // Preload 10 ads
      expirationPeriod: 3600000, // 1 hour
      adChoicesPlacement: 'topRight',
      mediaAspectRatio: 'any',
    });

    if (DEBUG) {
      console.log('[Ads] Ad repository initialized:', success ? 'success' : 'failed');
    }

    return success;
  } catch (error) {
    console.error('[Ads] Failed to initialize ad repository:', error);
    return false;
  }
}

function mapNativeAdToCard(native: NativeAd, nativeAdId: string, targetCardId?: string): RestaurantCard {
  const id = targetCardId ?? `native-${adCounter++}`;

  // Extract ad data from the real native ad
  const headline = native.headline || "Sponsored";
  const body = native.tagline || "";
  const cta = native.callToAction || "Learn More";
  const advertiser = native.advertiser || "Advertiser";
  const iconUrl = native.icon || "";
  const mediaUrl = native.images?.[0]?.url || "";

  const fallbackUrl = "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=1200&fit=crop";
  const photos = [
    {
      url: mediaUrl || fallbackUrl,
      widthPx: Math.max(mediaUrl ? 800 : 150, 150),
      heightPx: Math.max(mediaUrl ? 600 : 150, 150),
    } as any,
  ];

  if (DEBUG) {
    console.log("[Ads] Mapping real native ad to card: ", JSON.stringify(native));
  }

  const card: RestaurantCard = {
    id,
    title: headline, // Add the missing title property
    name: headline,
    subtitle: body,
    cuisine: undefined,
    rating: undefined,
    priceRange: undefined,
    distance: cta,
    address: undefined,
    isOpenNow: undefined,
    photos,
    images: photos.map((p) => p.url),
    basicDetails: {
      id,
      displayName: { text: headline, languageCode: "en" },
      regularOpeningHours: { openNow: false },
    },
    // Preserve native ad metadata for tracking
    adData: native,
  } as RestaurantCard;

  adRegistry.set(id, card);
  cardIdToNativeId.set(id, nativeAdId);

  if (DEBUG) {
    console.log("[Ads] Final mapped card", JSON.stringify(card.adData));
  }

  return card;
}

export function startNativeAdsPreload(): void {
  try {
    if (!areAdsEnabled()) return;
    if (DEBUG) console.log("[Ads] startNativeAdsPreload: initializing repository");

    // Initialize ad repository
    initializeAdRepository().then(success => {
      if (success) {
        if (DEBUG) console.log("[Ads] Repository initialized, ads will be loaded automatically");
      }
    });
  } catch (error) {
    console.warn('[Ads] startNativeAdsPreload failed:', error);
  }
}

export function getAvailableAd(): RestaurantCard | null {
  if (!areAdsEnabled()) return null;

  // Check if repository has ads available
  AdManager.hasAd(REPOSITORY_NAME).then(hasAd => {
    if (hasAd && DEBUG) {
      console.log("[Ads] Repository has ads available");
    }
  });

  // For now, return null as ads are loaded through the repository system
  // The actual ad display will be handled by the NativeAdView component
  return null;
}

export function recordImpression(adId: string): void {
  if (!adRegistry.has(adId)) return;

  if (DEBUG) {
    console.log("[Ads] Recording impression for real ad: ", adId);
  }

  // The impression is automatically recorded by the ad component
  // when it becomes visible, so this is mainly for logging
}

export function handleClick(adId: string): void {
  const nativeId = cardIdToNativeId.get(adId);

  if (DEBUG) {
    console.log("[Ads] Handling click for real ad: ", adId, "native ID:", nativeId);
  }

  // The click is automatically handled by the ad component
  // This function is mainly for logging and analytics
}

export function getNativeAdIdForCard(cardId: string): string | undefined {
  return cardIdToNativeId.get(cardId);
}

// Get repository name for use in NativeAdView components
export function getRepositoryName(): string {
  return REPOSITORY_NAME;
}

// Clean up function for when the app is backgrounded or destroyed
export function cleanupAds(): void {
  try {
    // Unregister repository
    AdManager.unRegisterRepository(REPOSITORY_NAME);

    // Clear local caches
    adRegistry.clear();
    cardIdToNativeId.clear();
    nativeAdIdToAdChoicesLinkUrl.clear();

    if (DEBUG) {
      console.log('[Ads] Real ads cleaned up');
    }
  } catch (error) {
    console.warn('[Ads] Cleanup failed:', error);
  }
}
