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


