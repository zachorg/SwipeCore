import { Linking, Platform } from "react-native";

export const openUrl = async (url: string) => {
  if (Platform.OS === "web") {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    // On iOS/Android, use React Native's Linking API
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.warn("Don't know how to open URI: " + url);
    }
  }
};