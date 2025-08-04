/**
 * Device optimization utilities for better performance on Android and other mobile devices
 */

export interface DeviceInfo {
  isAndroid: boolean;
  isIOS: boolean;
  isMobile: boolean;
  isLowEndDevice: boolean;
  supportsHardwareAcceleration: boolean;
  devicePixelRatio: number;
}

export interface PerformanceConfig {
  reducedAnimations: boolean;
  optimizedDragThreshold: number;
  fastSnapBack: boolean;
  hardwareAcceleration: boolean;
  reducedMotion: boolean;
}

/**
 * Detect device capabilities and characteristics
 */
export function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent;
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isMobile = isAndroid || isIOS || /Mobile/i.test(userAgent);
  
  // Detect low-end devices based on various factors
  const hardwareConcurrency = navigator.hardwareConcurrency || 1;
  const deviceMemory = (navigator as any).deviceMemory || 1;
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  // Consider device low-end if it has limited cores, memory, or is an older Android version
  const isLowEndDevice = hardwareConcurrency <= 2 || 
                        deviceMemory <= 2 || 
                        (isAndroid && /Android [4-6]/.test(userAgent));

  // Check for hardware acceleration support
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const supportsHardwareAcceleration = !!gl;

  return {
    isAndroid,
    isIOS,
    isMobile,
    isLowEndDevice,
    supportsHardwareAcceleration,
    devicePixelRatio,
  };
}

/**
 * Get optimized performance configuration based on device capabilities
 */
export function getOptimizedPerformanceConfig(deviceInfo?: DeviceInfo): PerformanceConfig {
  const device = deviceInfo || getDeviceInfo();
  
  return {
    reducedAnimations: device.isLowEndDevice,
    optimizedDragThreshold: device.isAndroid ? 8 : 12, // Lower threshold for Android
    fastSnapBack: device.isAndroid || device.isLowEndDevice,
    hardwareAcceleration: device.supportsHardwareAcceleration,
    reducedMotion: device.isLowEndDevice,
  };
}

/**
 * Apply performance optimizations to DOM elements
 */
export function applyPerformanceOptimizations(element: HTMLElement, config: PerformanceConfig) {
  if (config.hardwareAcceleration) {
    element.style.transform = 'translateZ(0)';
    element.style.backfaceVisibility = 'hidden';
    element.style.perspective = '1000px';
  }
  
  if (config.reducedMotion) {
    element.style.willChange = 'auto';
  } else {
    element.style.willChange = 'transform';
  }
}

/**
 * Optimize touch events for better responsiveness on Android
 */
export function optimizeTouchEvents() {
  // Prevent default touch behaviors that can cause lag
  document.addEventListener('touchstart', (e) => {
    // Only prevent default for swipe areas, not for scrollable content
    const target = e.target as HTMLElement;
    if (target.closest('[data-swipe-card]')) {
      e.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-swipe-card]')) {
      e.preventDefault();
    }
  }, { passive: false });
}

/**
 * Initialize device optimizations
 */
export function initializeDeviceOptimizations() {
  const deviceInfo = getDeviceInfo();
  const config = getOptimizedPerformanceConfig(deviceInfo);
  
  // Apply global optimizations
  if (deviceInfo.isAndroid) {
    // Add Android-specific CSS class for targeted optimizations
    document.documentElement.classList.add('android-device');
    
    // Optimize touch events
    optimizeTouchEvents();
  }
  
  if (deviceInfo.isLowEndDevice) {
    document.documentElement.classList.add('low-end-device');
  }
  
  return { deviceInfo, config };
}
