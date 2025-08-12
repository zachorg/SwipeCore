import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

export const openUrl = async (url: string) => {
  // Check if running on a native platform
  if (Capacitor.isNativePlatform()) {
    // Use Capacitor Browser plugin for native platforms
    await Browser.open({ url });
  } else {
    // Fallback to window.open for web
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};