import { Linking, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

export const openUrl = async (url: string) => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('openUrl called with:', url);
  }

  if (Platform.OS === "web") {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('Opening URL in web browser');
    }
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    try {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('Opening URL in Expo WebBrowser');
      }
      // Open URL in Expo's WebBrowser (in-app browser)
      const result = await WebBrowser.openBrowserAsync(url);

      // Log the result for debugging
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('WebBrowser result:', result);
      }

      // If WebBrowser fails, fallback to system browser
      if (result.type === 'cancel' || result.type === 'dismiss') {
        console.log('WebBrowser was dismissed, falling back to system browser');
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          console.warn("Don't know how to open URI: " + url);
        }
      }
    } catch (error) {
      console.error('Error opening URL in WebBrowser:', error);
      // Fallback to system browser
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          console.warn("Don't know how to open URI: " + url);
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    }
  }
};

// Helper function to check if a URL is valid
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Helper function to get domain from URL for display purposes
export const getDomainFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'Unknown';
  }
};

// Function to warm up WebBrowser (call this when app starts)
export const warmUpWebBrowser = async () => {
  if (Platform.OS !== "web") {
    try {
      // Expo WebBrowser doesn't need explicit warmup, but we can check availability
      console.log('WebBrowser is available and ready');
    } catch (error) {
      console.log('WebBrowser warmup check failed:', error);
    }
  }
};

// Function to close WebBrowser programmatically if needed
export const closeWebBrowser = async () => {
  if (Platform.OS !== "web") {
    try {
      // Expo WebBrowser doesn't have a close method, it closes automatically
      console.log('WebBrowser will close automatically when user dismisses it');
    } catch (error) {
      console.log('Error with WebBrowser:', error);
    }
  }
};