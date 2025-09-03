import { areAdsEnabled, getNativeAdUnitId, isDebugMode } from "@/utils/ads";
import MobileAds, {
  MaxAdContentRating,
  NativeAd,
  NativeAdChoicesPlacement,
  NativeAdRequestOptions,
  NativeMediaAspectRatio,
} from 'react-native-google-mobile-ads';

// Atomic array wrapper for thread-safe operations
class AtomicArray<T> {
  private array: T[];
  private mutex: boolean;

  constructor() {
    this.array = [];
    this.mutex = false;
  }

  private async acquireLock(): Promise<void> {
    while (this.mutex) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    this.mutex = true;
  }

  private releaseLock(): void {
    this.mutex = false;
  }

  async push(item: T): Promise<void> {
    if (!this.array) {
      this.array = [];
    }
    await this.acquireLock();
    try {
      this.array.push(item);
    } finally {
      this.releaseLock();
    }
  }

  async shift(): Promise<T | undefined> {
    if (!this.array) {
      this.array = [];
      return undefined;
    }
    await this.acquireLock();
    try {
      return this.array.shift();
    } finally {
      this.releaseLock();
    }
  }

  async getLength(): Promise<number> {
    if (!this.array) {
      this.array = [];
      return 0;
    }
    await this.acquireLock();
    try {
      return this.array.length;
    } finally {
      this.releaseLock();
    }
  }

  async isEmpty(): Promise<boolean> {
    return (await this.getLength()) === 0;
  }

  async hasItems(): Promise<boolean> {
    return (await this.getLength()) > 0;
  }
}

// Simple in-memory ad inventory and tracking with atomic operations
const DEBUG = isDebugMode();

const adsRegistry = new AtomicArray<NativeAd>();
let isPreloading = false; // Global flag to prevent multiple preload instances

const nativeAdRequestOptions: NativeAdRequestOptions = {
  aspectRatio: NativeMediaAspectRatio.PORTRAIT,
  adChoicesPlacement: NativeAdChoicesPlacement.TOP_RIGHT,
  startVideoMuted: true,
  requestNonPersonalizedAdsOnly: false,
  keywords: [
    'restaurant', 'food', 'dining', 'cuisine', 'meal', 'lunch', 'dinner', 'breakfast',
    'takeout', 'delivery', 'fast food', 'casual dining', 'fine dining', 'cafe', 'bistro',
    'pizza', 'burger', 'sushi', 'italian', 'chinese', 'mexican', 'indian', 'american',
    'seafood', 'steakhouse', 'bakery', 'dessert', 'coffee', 'bar', 'pub', 'grill'
  ],
};

const maxPreloadedAds = 5;

// Initialize the ad repository
export async function initializeNativeAds(): Promise<boolean> {
  try {

    // // Use a safe default content rating since we can't access user profile here
    const contentRating: MaxAdContentRating = MaxAdContentRating.T; // Teen rating as safe default

    MobileAds().initialize();
    MobileAds().setRequestConfiguration({
      testDeviceIdentifiers: [],
      maxAdContentRating: contentRating,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });

    // Start preloading ads (don't await to avoid blocking initialization)
    nativeAdsPreload().catch(error => {
      console.warn('[Ads] Initial preload failed:', error);
    });

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Ads] Failed to initialize ad repository:', errorMessage);
    return false;
  }
}

export async function nativeAdsPreload(): Promise<void> {
  try {
    if (!areAdsEnabled()) return;

    // Prevent multiple preload instances from running simultaneously
    if (isPreloading) {
      if (DEBUG) console.log("[Ads] Preload already in progress, skipping");
      return;
    }

    // Check if we already have enough ads
    const currentLength = await adsRegistry.getLength();
    if (currentLength >= maxPreloadedAds) {
      if (DEBUG) console.log("[Ads] Already have enough ads, skipping preload");
      return;
    }

    isPreloading = true;
    if (DEBUG) console.log("[Ads] nativeAdsPreload: initializing repository");

    const adUnitId = getNativeAdUnitId();
    if (!adUnitId) {
      console.warn('[Ads] No ad unit ID configured');
      isPreloading = false;
      return;
    }

    // Load ads sequentially to avoid overwhelming the ad network
    while (true) {
      try {
        const currentCount = await adsRegistry.getLength();
        if (currentCount >= maxPreloadedAds) {
          if (DEBUG) console.log("[Ads] Max ads reached, stopping preload");
          break;
        }

        const ad = await NativeAd.createForAdRequest(adUnitId, nativeAdRequestOptions);
        await adsRegistry.push(ad);
        const newLength = await adsRegistry.getLength();
        if (DEBUG) console.log('Ad loaded:', newLength);

        // Add a delay to prevent overwhelming the ad network
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('[Ads] Failed to load ad:', error);
        // Wait longer on error before potentially retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
        break; // Stop on error to prevent infinite retries
      }
    }

    isPreloading = false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn('[Ads] startNativeAdsPreload failed:', errorMessage);
    isPreloading = false;
  }
}

export async function getPreloadedAd(): Promise<NativeAd | null> {
  // First, clean up any excess ads
  await cleanupExcessAds();

  const isEmpty = await adsRegistry.isEmpty();
  if (isEmpty) {
    // Only trigger preload if we don't have any ads
    nativeAdsPreload().catch(error => {
      console.warn('[Ads] Preload failed when ads registry empty:', error);
    });
    return null;
  }
  const ad = await adsRegistry.shift();

  return ad || null;
}

// Check if ads are available
export async function hasPreloadedAds(): Promise<boolean> {
  return await adsRegistry.hasItems();
}

// Clean up excess ads beyond the limit
export async function cleanupExcessAds(): Promise<void> {
  const currentLength = await adsRegistry.getLength();
  if (currentLength > maxPreloadedAds) {
    const excessCount = currentLength - maxPreloadedAds;
    if (DEBUG) console.log(`[Ads] Cleaning up ${excessCount} excess ads`);

    // Remove excess ads
    for (let i = 0; i < excessCount; i++) {
      const ad = await adsRegistry.shift();
      if (ad) {
        try {
          ad.destroy();
        } catch (error) {
          console.warn('[Ads] Failed to destroy excess ad:', error);
        }
      }
    }

    const newLength = await adsRegistry.getLength();
    if (DEBUG) console.log(`[Ads] Cleanup complete, ${newLength} ads remaining`);
  }
}
