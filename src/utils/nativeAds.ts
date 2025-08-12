import { Capacitor } from '@capacitor/core';

export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}
