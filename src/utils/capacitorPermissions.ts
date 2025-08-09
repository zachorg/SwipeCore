// Capacitor Permissions Integration
// Handles native Android/iOS permission requests for microphone access

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export interface PermissionResult {
  granted: boolean;
  error?: string;
}

export interface PermissionCache {
  status: 'granted' | 'denied' | 'prompt' | 'unknown';
  timestamp: number;
  platform: string;
}

/**
 * Capacitor Permissions Manager
 * Handles microphone permissions across different platforms with caching
 */
export class CapacitorPermissionsManager {
  private permissionCache: PermissionCache | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Check if running in Capacitor native app
   */
  public isNativeApp(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Get current platform
   */
  public getPlatform(): string {
    return Capacitor.getPlatform();
  }

  /**
   * Check if permission cache is valid
   */
  private isCacheValid(): boolean {
    if (!this.permissionCache) return false;

    const now = Date.now();
    const isExpired = (now - this.permissionCache.timestamp) > this.CACHE_DURATION;
    const platformChanged = this.permissionCache.platform !== this.getPlatform();

    return !isExpired && !platformChanged;
  }

  /**
   * Get cached permission status
   */
  private getCachedPermission(): 'granted' | 'denied' | 'prompt' | 'unknown' | null {
    if (!this.isCacheValid()) {
      this.permissionCache = null;
      return null;
    }
    return this.permissionCache.status;
  }

  /**
   * Cache permission status
   */
  private cachePermission(status: 'granted' | 'denied' | 'prompt' | 'unknown'): void {
    this.permissionCache = {
      status,
      timestamp: Date.now(),
      platform: this.getPlatform()
    };
  }

  /**
   * Fast permission check - returns immediately if permission is already granted
   */
  public async checkMicrophonePermission(): Promise<PermissionResult> {
    try {
      // Check cache first
      const cachedStatus = this.getCachedPermission();
      if (cachedStatus === 'granted') {
        console.log('✅ Using cached permission: granted');
        return { granted: true };
      }

      // Fast check current permission status
      const currentStatus = await this.getCurrentPermissionStatus();
      this.cachePermission(currentStatus);

      if (currentStatus === 'granted') {
        console.log('✅ Permission already granted');
        return { granted: true };
      }

      return {
        granted: false,
        error: currentStatus === 'denied' ? 'Permission previously denied' : 'Permission not granted'
      };

    } catch (error: any) {
      console.error('❌ Permission check failed:', error);
      return { granted: false, error: error.message };
    }
  }

  /**
   * Request microphone permission (only if not already granted)
   */
  public async requestMicrophonePermission(): Promise<PermissionResult> {
    try {
      if (!this.isNativeApp()) {
        return { granted: false, error: 'Not running in native app' };
      }

      // First, do a fast check to see if we already have permission
      const quickCheck = await this.checkMicrophonePermission();
      if (quickCheck.granted) {
        console.log('🚀 Permission already granted, skipping request');
        return quickCheck;
      }

      console.log(`🎤 Requesting microphone permission on ${this.getPlatform()}...`);

      // Only request if we don't have permission
      let result: PermissionResult;
      if (this.getPlatform() === 'android') {
        result = await this.requestAndroidMicrophonePermission();
      } else if (this.getPlatform() === 'ios') {
        result = await this.requestIOSMicrophonePermission();
      } else {
        result = { granted: false, error: 'Unsupported platform' };
      }

      // Cache the result
      this.cachePermission(result.granted ? 'granted' : 'denied');
      return result;

    } catch (error: any) {
      console.error('❌ Capacitor permission request failed:', error);
      this.cachePermission('denied');
      return { granted: false, error: error.message };
    }
  }

  /**
   * Get current permission status quickly without requesting
   */
  private async getCurrentPermissionStatus(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
    try {
      if (!this.isNativeApp()) {
        // For web, try to check navigator.permissions
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          return permission.state as 'granted' | 'denied' | 'prompt';
        }
        return 'unknown';
      }

      // For native apps, try a quick getUserMedia test without actually requesting
      try {
        // This is a fast way to check if permission is already granted
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudioInput = devices.some(device => device.kind === 'audioinput' && device.label !== '');

        if (hasAudioInput) {
          // If we can see device labels, permission is likely granted
          return 'granted';
        }

        // Try a very quick getUserMedia test
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });

        // If we get here without a permission dialog, permission was already granted
        stream.getTracks().forEach(track => track.stop());
        return 'granted';

      } catch (error: any) {
        if (error.name === 'NotAllowedError') {
          return 'denied';
        } else if (error.name === 'NotFoundError') {
          return 'denied'; // No microphone available
        }
        return 'prompt'; // Likely needs permission request
      }

    } catch (error) {
      console.warn('Could not check permission status:', error);
      return 'unknown';
    }
  }

  /**
   * Request Android microphone permission
   */
  private async requestAndroidMicrophonePermission(): Promise<PermissionResult> {
    try {
      console.log('📱 Requesting Android microphone permission...');

      // Method 1: Try using native Android permission request
      try {
        console.log('📱 Attempting native Android permission request...');

        // Use Capacitor's native bridge to request Android permissions
        const result = await this.requestAndroidNativePermission();
        if (result.granted) {
          return result;
        }

        console.log('⚠️ Native permission request failed, trying alternatives...');
      } catch (error) {
        console.log('⚠️ Native permission method failed:', error);
      }

      // Method 2: Try direct Capacitor native call
      const result = await this.callNativePermissionRequest('android.permission.RECORD_AUDIO');
      if (result.granted) {
        return result;
      }

      // Method 3: Fallback to getUserMedia (will trigger Android permission dialog)
      return await this.fallbackToGetUserMedia();

    } catch (error: any) {
      console.error('❌ Android permission request failed:', error);
      return { granted: false, error: `Android permission error: ${error.message}` };
    }
  }

  /**
   * Request iOS microphone permission
   */
  private async requestIOSMicrophonePermission(): Promise<PermissionResult> {
    try {
      console.log('📱 Requesting iOS microphone permission...');

      // iOS permissions are handled automatically by the system
      // when getUserMedia is called, but we can check status first
      if ((window as any).CapacitorPermissions) {
        const { Permissions } = (window as any).CapacitorPermissions;
        
        const checkResult = await Permissions.query({ name: 'microphone' });
        console.log('iOS permission status:', checkResult);

        if (checkResult.state === 'granted') {
          return { granted: true };
        }

        const requestResult = await Permissions.request({ permissions: ['microphone'] });
        return { 
          granted: requestResult.microphone === 'granted',
          error: requestResult.microphone !== 'granted' ? 'iOS microphone permission denied' : undefined
        };
      }

      // Fallback to getUserMedia for iOS
      return await this.fallbackToGetUserMedia();

    } catch (error: any) {
      console.error('❌ iOS permission request failed:', error);
      return { granted: false, error: `iOS permission error: ${error.message}` };
    }
  }

  /**
   * Request Android native permission using Capacitor bridge
   */
  private async requestAndroidNativePermission(): Promise<PermissionResult> {
    try {
      console.log('🔌 Requesting Android native permission...');

      // Create a promise that will be resolved by the native side
      return new Promise((resolve) => {
        // Use Capacitor's native bridge to call Android permission request
        if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {

          // Method 1: Try direct native call
          try {
            (window as any).CapacitorWebView?.postMessage({
              type: 'capacitor:plugin',
              pluginId: 'PermissionRequest',
              methodName: 'requestPermissions',
              options: {
                permissions: ['android.permission.RECORD_AUDIO', 'android.permission.MODIFY_AUDIO_SETTINGS']
              }
            });

            // Set a timeout for the response
            setTimeout(() => {
              resolve({ granted: false, error: 'Native permission request timeout' });
            }, 10000);

          } catch (error) {
            console.log('Direct native call failed, using fallback...');
            resolve({ granted: false, error: 'Direct native call failed' });
          }

        } else {
          resolve({ granted: false, error: 'Not on Android platform' });
        }
      });

    } catch (error: any) {
      console.log('⚠️ Android native permission failed:', error.message);
      return { granted: false, error: error.message };
    }
  }

  /**
   * Call native permission request directly
   */
  private async callNativePermissionRequest(permission: string): Promise<PermissionResult> {
    try {
      console.log(`🔌 Calling native permission request for: ${permission}`);

      // Since Capacitor doesn't have a built-in permissions plugin,
      // we'll use getUserMedia which triggers the native permission dialog
      return await this.fallbackToGetUserMedia();

    } catch (error: any) {
      console.log('⚠️ Native permission call failed:', error.message);
      return { granted: false, error: error.message };
    }
  }

  /**
   * Fallback to getUserMedia (triggers native permission dialog)
   */
  private async fallbackToGetUserMedia(): Promise<PermissionResult> {
    try {
      console.log('🌐 Using getUserMedia fallback for permission...');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { granted: false, error: 'getUserMedia not available' };
      }

      // This will trigger the native permission dialog on both Android and iOS
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Permission granted, stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ getUserMedia permission granted');

      return { granted: true };

    } catch (error: any) {
      console.error('❌ getUserMedia permission failed:', error);

      let errorMessage = 'Microphone permission denied';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone access was denied. Please allow microphone access in your device settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found on this device.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security error accessing microphone.';
      }

      return { granted: false, error: errorMessage };
    }
  }

  /**
   * Check current permission status
   */
  public async checkPermissionStatus(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
    try {
      if (!this.isNativeApp()) {
        return 'unknown';
      }

      if ((window as any).CapacitorPermissions) {
        const { Permissions } = (window as any).CapacitorPermissions;
        const result = await Permissions.query({ name: 'microphone' });
        return result.state as 'granted' | 'denied' | 'prompt';
      }

      // Fallback: try to check web permissions
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        return permission.state as 'granted' | 'denied' | 'prompt';
      }

      return 'unknown';

    } catch (error) {
      console.warn('Could not check permission status:', error);
      return 'unknown';
    }
  }

  /**
   * Clear permission cache (useful when user changes permissions manually)
   */
  public clearCache(): void {
    this.permissionCache = null;
    console.log('🗑️ Permission cache cleared');
  }

  /**
   * Open device settings for manual permission management
   */
  public async openSettings(): Promise<void> {
    try {
      if (this.isNativeApp()) {
        await App.openSettings();
        console.log('📱 Opened device settings');
        // Clear cache since user might change permissions
        this.clearCache();
      }
    } catch (error) {
      console.warn('Could not open settings:', error);
    }
  }
}

// Create singleton instance
export const capacitorPermissions = new CapacitorPermissionsManager();
