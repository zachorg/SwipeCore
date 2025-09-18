import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swipecore.app',
  appName: 'NomNom',
  webDir: 'dist',
  server: {
    cleartext: true
  },
  android: {
    // Android-specific performance optimizations
    webContentsDebuggingEnabled: false,
    allowMixedContent: true,
    captureInput: true
  },
  ios: {
    // iOS-specific configurations
    scheme: 'swipecore',
    limitsNavigationsToAppBoundDomains: false,
    allowsLinkPreview: false,
    // Network security configuration
    webContentsDebuggingEnabled: false
  },
  plugins: {
    StatusBar: {
      overlays: false,
      style: 'LIGHT',
      backgroundColor: '#000000'
    },
    SplashScreen: {
      launchShowDuration: 0
    },
    Geolocation: {
      // Geolocation plugin configuration
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    },
    Permissions: {
      // Audio permissions for voice search
      enabled: true
    },
    CapacitorHttp: {
      enabled: true
    },
    SafeArea: {
      enabled: true,
      customColorsForSystemBars: true,
      statusBarColor: '#000000',
      statusBarContent: 'dark',
      navigationBarColor: '#000000',
      navigationBarContent: 'dark',
      offset: 0,
    }
  }
};

export default config;