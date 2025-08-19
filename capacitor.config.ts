import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swipecore.app',
  appName: 'SwipeCore',
  webDir: 'dist',
  server: {
    cleartext: true
  },
  android: {
    // Android-specific performance optimizations
    webContentsDebuggingEnabled: false,
    allowMixedContent: true,
    captureInput: true,
    webViewPresentationStyle: 'fullscreen',
    // Audio permissions for voice search
    permissions: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.RECORD_AUDIO',
      'android.permission.MODIFY_AUDIO_SETTINGS',
      'android.permission.WRITE_EXTERNAL_STORAGE'
    ]
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
    },
  }
};

export default config;