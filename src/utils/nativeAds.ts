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
  // Enable mock/test mode with VITE_ADS_NATIVE_TEST_MODE=true
  // Defaults to false
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  const env = (import.meta as any)?.env || {};
  if (env?.VITE_ADS_NATIVE_TEST_MODE === 'true') return true;
  // Default to test mode for non-production builds to make emulator/dev testing easy
  return env?.MODE && env.MODE !== 'production';
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


