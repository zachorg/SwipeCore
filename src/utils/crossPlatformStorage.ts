import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

/**
 * Cross-platform storage utility that works on web (localStorage) and mobile (Capacitor Preferences)
 */
export class CrossPlatformStorage {
  private static isNative = Capacitor.isNativePlatform();

  /**
   * Set a value in storage
   */
  static async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isNative) {
        await Preferences.set({ key, value });
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Failed to set item in storage:', error);
      throw error;
    }
  }

  /**
   * Get a value from storage
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      if (this.isNative) {
        const result = await Preferences.get({ key });
        return result.value;
      } else {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.error('Failed to get item from storage:', error);
      return null;
    }
  }

  /**
   * Remove a value from storage
   */
  static async removeItem(key: string): Promise<void> {
    try {
      if (this.isNative) {
        await Preferences.remove({ key });
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Failed to remove item from storage:', error);
      throw error;
    }
  }

  /**
   * Clear all storage
   */
  static async clear(): Promise<void> {
    try {
      if (this.isNative) {
        await Preferences.clear();
      } else {
        localStorage.clear();
      }
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  /**
   * Get all keys from storage
   */
  static async keys(): Promise<string[]> {
    try {
      if (this.isNative) {
        const result = await Preferences.keys();
        return result.keys;
      } else {
        return Object.keys(localStorage);
      }
    } catch (error) {
      console.error('Failed to get keys from storage:', error);
      return [];
    }
  }

  /**
   * Check if storage is available
   */
  static isAvailable(): boolean {
    if (this.isNative) {
      return true; // Capacitor Preferences is always available on native platforms
    } else {
      try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Get storage type for debugging
   */
  static getStorageType(): 'native' | 'web' {
    return this.isNative ? 'native' : 'web';
  }
}
