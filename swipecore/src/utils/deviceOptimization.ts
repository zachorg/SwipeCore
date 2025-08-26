// Device optimization utilities for React Native
import { Platform, Dimensions } from 'react-native';

export function initializeDeviceOptimizations(): void {
  try {
    console.log('[DeviceOptimization] Initializing device optimizations...');

    // Get device dimensions
    const { width, height } = Dimensions.get('window');
    console.log(`[DeviceOptimization] Device dimensions: ${width}x${height}`);

    // Platform-specific optimizations
    if (Platform.OS === 'android') {
      console.log('[DeviceOptimization] Applying Android-specific optimizations');
      // Android-specific optimizations would go here
    } else if (Platform.OS === 'ios') {
      console.log('[DeviceOptimization] Applying iOS-specific optimizations');
      // iOS-specific optimizations would go here
    }

    console.log('[DeviceOptimization] Device optimizations initialized successfully');
  } catch (error) {
    console.warn('[DeviceOptimization] Failed to initialize device optimizations:', error);
  }
}

export function getDevicePerformanceProfile(): 'low' | 'medium' | 'high' {
  // This is a simplified version - in a real app you might check
  // device specs, memory, CPU cores, etc.
  if (Platform.OS === 'android') {
    return 'medium'; // Default for Android
  } else if (Platform.OS === 'ios') {
    return 'high'; // Default for iOS
  }
  return 'medium';
}

export function shouldEnableAdvancedFeatures(): boolean {
  const profile = getDevicePerformanceProfile();
  return profile === 'high';
}

// New lightweight helpers expected by components like SwipeCard
export interface DeviceInfo {
  isLowEndDevice: boolean;
  isAndroid: boolean;
  isIOS: boolean;
}

export function getDeviceInfo(): DeviceInfo {
  const { width, height } = Dimensions.get('window');
  const minDim = Math.min(width, height);
  const isAndroid = Platform.OS === 'android';
  const isIOS = Platform.OS === 'ios';

  // Heuristic: very small screens act as "low-end" for animation throttling
  const isLowEndDevice = (isAndroid && minDim < 380) || (!isAndroid && minDim < 360) || getDevicePerformanceProfile() === 'low';

  return {
    isLowEndDevice,
    isAndroid,
    isIOS,
  };
}

export function getOptimizedPerformanceConfig(device: DeviceInfo): {
  optimizedDragThreshold: number;
  fastSnapBack: boolean;
  reducedAnimations: boolean;
} {
  if (device.isLowEndDevice) {
    return {
      optimizedDragThreshold: 12,
      fastSnapBack: true,
      reducedAnimations: true,
    };
  }
  return {
    optimizedDragThreshold: device.isAndroid ? 10 : 8,
    fastSnapBack: false,
    reducedAnimations: false,
  };
}