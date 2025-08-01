import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swipecore.app',
  appName: 'SwipeCore',
  webDir: 'dist',
  server: {
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    Geolocation: {
      // Geolocation plugin configuration
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }
  }
};

export default config;