import { Capacitor, registerPlugin } from '@capacitor/core';

export interface AttachOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NativeAdsPlugin {
  load(options: { adUnitId: string }): Promise<void>;
  attach(options: AttachOptions): Promise<void>;
  detach(): Promise<void>;
}

export const NativeAds = registerPlugin<NativeAdsPlugin>('NativeAds');

export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

export interface MockNativeAdData {
  headline: string;
  body: string;
  cta: string;
  advertiser: string;
  imageUrl: string;
  clickUrl: string;
}

export function isNativeAdsTestMode(): boolean {
  // Enable mock/native-UI-only mode explicitly with VITE_ADS_NATIVE_TEST_MODE=true
  // Defaults to false so we load real AdMob (using Google's test unit if no prod unit specified)
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  const env = (import.meta as any)?.env || {};
  return env?.VITE_ADS_NATIVE_TEST_MODE === 'true';
}

export function getAndroidTestNativeAdUnitId(): string {
  // Official Google AdMob Native Advanced test unit ID
  return 'ca-app-pub-3940256099942544/2247696110';
}

export function getMockNativeAd(): MockNativeAdData {
  return {
    headline: 'Discover Great Eats Near You',
    body: 'Fresh deals from local favorites. Tap to learn more.',
    cta: 'Learn More',
    advertiser: 'Sample Advertiser',
    imageUrl: 'https://via.placeholder.com/800x1200.png?text=Mock+Sponsored+Ad',
    clickUrl: 'https://www.google.com',
  };
}


