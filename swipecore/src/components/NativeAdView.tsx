import React from "react";
import { View, StyleSheet } from "react-native";
import NativeAdView, {
  HeadlineView,
  TaglineView,
  AdvertiserView,
  CallToActionView,
  IconView,
  NativeMediaView,
  AdBadge,
} from "react-native-admob-native-ads";
import { getRepositoryName } from "@/services/nativeAdsProvider";

interface CustomNativeAdViewProps {
  style?: any;
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: any) => void;
  onAdClicked?: () => void;
  onAdImpression?: () => void;
}

export function CustomNativeAdView({
  style,
  onAdLoaded,
  onAdFailedToLoad,
  onAdClicked,
  onAdImpression,
}: CustomNativeAdViewProps) {
  return (
    <NativeAdView
      style={[styles.container, style]}
      repository={getRepositoryName()}
      onAdLoaded={onAdLoaded}
      onAdFailedToLoad={onAdFailedToLoad}
      onAdClicked={onAdClicked}
      onAdImpression={onAdImpression}
      adChoicesPlacement="topRight"
      mediaAspectRatio="any"
      enableSwipeGestureOptions={{
        tapsAllowed: true,
        swipeGestureDirection: "right"
      }}
    >
      <View style={styles.adContainer}>
        {/* Ad Badge */}
        <AdBadge style={styles.adBadge} />

        {/* Header Section */}
        <View style={styles.headerSection}>
          <IconView style={styles.icon} />
          <View style={styles.headerText}>
            <HeadlineView style={styles.headline} />
            <AdvertiserView style={styles.advertiser} />
          </View>
        </View>

        {/* Media Section */}
        <NativeMediaView style={styles.mediaView} />

        {/* Content Section */}
        <View style={styles.contentSection}>
          <TaglineView style={styles.tagline} />
          <CallToActionView
            style={styles.callToAction}
            buttonAndroidStyle={{
              backgroundColor: "#007AFF",
              borderColor: "#007AFF",
              borderWidth: 1,
              borderRadius: 8,
            }}
          />
        </View>
      </View>
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  adContainer: {
    padding: 16,
  },
  adBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
  },
  headerSection: {
    flexDirection: "row",
    marginBottom: 12,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    justifyContent: "center",
  },
  headline: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  advertiser: {
    fontSize: 14,
    color: "#666666",
  },
  mediaView: {
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  contentSection: {
    alignItems: "center",
  },
  tagline: {
    fontSize: 16,
    color: "#333333",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  callToAction: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
