import React from "react";
import { View, Text, StyleSheet, Image, Dimensions } from "react-native";
import { useRef, useState, useEffect } from "react";
import {
  NativeAdView,
  NativeAd,
  TestIds,
  NativeAdChoicesPlacement,
  NativeMediaAspectRatio,
  NativeMediaView,
  NativeAsset,
  NativeAssetType,
  NativeAdEventType,
} from "react-native-google-mobile-ads";
import { getNativeAdUnitId, areAdsEnabled, isTestingMode } from "@/utils/ads";
import { Ionicons } from "@expo/vector-icons";
import { getPreloadedAd } from "@/services/nativeAdsProvider";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const AdView = () => {
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);
  const [adState, setAdState] = useState<
    "loading" | "loaded" | "failed" | "empty"
  >("loading");
  const [debugInfo, setDebugInfo] = useState<string>("Initializing...");

  useEffect(() => {
    const loadAd = async () => {
      try {
        if (!areAdsEnabled()) {
          setAdState("empty");
          setDebugInfo("Ads disabled");
          return;
        }

        setAdState("loading");
        setDebugInfo("Loading ad...");

        const ad = await getPreloadedAd();
        setNativeAd(ad);
        setAdState("loaded");
        setDebugInfo("Ad loaded successfully");
      } catch (error) {
        console.error("[AdView] Failed to load ad:", error);
        setAdState("failed");
        setDebugInfo(
          `Ad failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    };

    loadAd();
  }, []);

  // Add event listeners for the new API - only once when ad is loaded
  useEffect(() => {
    if (!nativeAd) return;

    const listeners = [
      nativeAd.addAdEventListener(NativeAdEventType.CLICKED, () => {
        console.log("[AdView] 👆 Ad clicked");
        setDebugInfo("Ad clicked");
      }),
      nativeAd.addAdEventListener(NativeAdEventType.IMPRESSION, () => {
        console.log("[AdView] 👁 Ad impression");
        setDebugInfo("Ad impression recorded");
      }),
      nativeAd.addAdEventListener(NativeAdEventType.OPENED, () => {
        console.log("[AdView] 🔗 Ad opened");
        setDebugInfo("Ad opened");
      }),
      nativeAd.addAdEventListener(NativeAdEventType.CLOSED, () => {
        console.log("[AdView] 🔒 Ad closed");
        setDebugInfo("Ad closed");
      }),
    ];

    return () => {
      listeners.forEach((listener) => listener.remove());
      // Don't destroy the ad here - let it live until component unmounts
    };
  }, [nativeAd]); // Empty dependency array - only run once

  // Cleanup effect - only run when component unmounts
  useEffect(() => {
    return () => {
      if (nativeAd) {
        try {
          nativeAd.destroy();
        } catch (error) {
          console.warn("[AdView] Failed to destroy ad on unmount:", error);
        }
      }
    };
  }, []); // Empty dependency array - only run on unmount

  // Debug component to show current state
  const DebugOverlay = () =>
    false && (
      <View style={styles.debugOverlay}>
        <Text style={styles.debugTitle}>🔍 Ad Debug Info</Text>
        <Text style={styles.debugText}>State: {adState}</Text>
        <Text style={styles.debugText}>Info: {debugInfo}</Text>
        <Text style={styles.debugText}>Ad: {nativeAd ? "✅" : "❌"}</Text>
      </View>
    );

  // Don't render anything if no ad is loaded
  if (!nativeAd) {
    return (
      <View style={styles.adCard}>
        <DebugOverlay />
        <View style={styles.backgroundImageContainer}>
          <View style={styles.fallbackWrapper}>
            <View style={styles.fallbackContainer}>
              <View style={styles.fallbackOverlay} />
              <View style={styles.fallbackBadge}>
                <View style={styles.badgeContent}>
                  <Ionicons name="megaphone" size={16} color="#374151" />
                  <Text style={styles.badgeText}>Advertisement</Text>
                </View>
              </View>
              <View style={styles.fallbackContent}>
                <Text style={styles.fallbackHeadline}>
                  Loading Advertisement...
                </Text>
                <Text style={styles.fallbackTagline}>
                  Please wait while we load an ad for you
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.adCard}>
      {/* Debug overlay - always visible */}
      <DebugOverlay />

      {/* Background Image Section - Full height with rounded corners */}
      <View style={styles.backgroundImageContainer}>
        <NativeAdView nativeAd={nativeAd} style={styles.nativeAdContainer}>
          {/* Background media view */}
          <NativeMediaView style={styles.mediaView} />

          {/* Gradient Overlay - Removed to keep top content clear */}

          {/* Ad Badge */}
          <View style={styles.adBadge}>
            <View style={styles.badgeContent}>
              <Ionicons name="megaphone" size={16} color="#374151" />
              <Text style={styles.badgeText}>Advertisement</Text>
            </View>
          </View>

          {/* Ad Icon - Top Left */}
          {nativeAd.icon && (
            <View style={styles.adIconContainer}>
              <NativeAsset assetType={NativeAssetType.ICON}>
                <Image
                  source={{ uri: nativeAd.icon.url }}
                  style={[styles.adIcon, { width: 36, height: 36 }]}
                  resizeMode="contain"
                />
              </NativeAsset>
            </View>
          )}

          {/* Top Content Section */}
          <View style={styles.topContentSection}>
            {/* Basic Info */}
            <View style={styles.basicInfoContainer}>
              <NativeAsset assetType={NativeAssetType.HEADLINE}>
                <Text style={styles.adHeadline}>{nativeAd.headline}</Text>
              </NativeAsset>
              <View style={styles.ratingAndStoreContainer}>
                {nativeAd.starRating && (
                  <NativeAsset assetType={NativeAssetType.STAR_RATING}>
                    <View style={styles.starRating} />
                  </NativeAsset>
                )}
                {nativeAd.store && (
                  <NativeAsset assetType={NativeAssetType.STORE}>
                    <Text style={styles.storeName}>{nativeAd.store}</Text>
                  </NativeAsset>
                )}
              </View>
            </View>

            {/* Price Section */}
            {nativeAd.price && (
              <View style={styles.priceContainer}>
                <NativeAsset assetType={NativeAssetType.PRICE}>
                  <Text style={styles.priceText}>{nativeAd.price}</Text>
                </NativeAsset>
              </View>
            )}
          </View>

          {/* Content Overlay at Bottom */}
          <View style={styles.contentOverlay}>
            <View style={styles.adContent}>
              <View style={styles.adTextContainer}>
                {nativeAd.body && (
                  <NativeAsset assetType={NativeAssetType.BODY}>
                    <Text style={styles.adTagline}>{nativeAd.body}</Text>
                  </NativeAsset>
                )}
                {nativeAd.advertiser && (
                  <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                    <Text style={styles.adAdvertiser}>
                      {nativeAd.advertiser}
                    </Text>
                  </NativeAsset>
                )}
              </View>
              {nativeAd.callToAction && (
                <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
                  <Text style={styles.adCta}>{nativeAd.callToAction}</Text>
                </NativeAsset>
              )}
            </View>
          </View>
        </NativeAdView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  adCard: {
    position: "relative",
    width: "100%",
    height: screenHeight * 0.7, // Match SwipeCard height
    backgroundColor: "white",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(139,69,19,0.05)",
  },
  backgroundImageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
  },
  nativeAdContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  mediaView: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    overflow: "hidden",
  },
  gradientOverlay: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  adBadge: {
    position: "absolute",
    top: 20,
    left: "50%",
    transform: [{ translateX: -60 }],
    backgroundColor: "rgba(255,255,255,1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 120,
    zIndex: 10,
  },
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4, // Add consistent gap between icon and text
  },
  badgeText: {
    color: "#374151",
    fontWeight: "bold",
    fontSize: 14,
    // Removed marginLeft since we're using gap now
  },
  adIconContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
  },
  topContentSection: {
    position: "absolute",
    top: 80,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  iconAndInfoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  adIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  basicInfoContainer: {
    flex: 1,
  },
  adHeadline: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1f2937",
    lineHeight: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  ratingAndStoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  starRating: {
    height: 20,
    width: 100,
  },
  storeName: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  priceContainer: {
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#059669",
  },
  contentOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,1)",
    padding: 24,
    paddingBottom: 50, // Extra padding to ensure Ad Choices icon is visible
    borderTopWidth: 1,
    borderTopColor: "rgba(139,69,19,0.1)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 10,
  },
  adContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  adTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  adTagline: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 6,
  },
  adAdvertiser: {
    fontSize: 14,
    color: "#9ca3af",
    lineHeight: 18,
    marginBottom: 0,
  },
  adCta: {
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
    textAlign: "center",
    shadowColor: "#0a7ea4",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  // Debug styles
  debugOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 12,
    borderRadius: 8,
    zIndex: 1000,
    maxWidth: 200,
  },
  debugTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 4,
  },
  debugText: {
    color: "white",
    fontSize: 10,
    marginBottom: 2,
  },
  // Fallback styles
  fallbackWrapper: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fallbackContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  fallbackImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  fallbackOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
  },
  fallbackBadge: {
    position: "absolute",
    top: 16,
    left: "50%",
    transform: [{ translateX: -60 }],
    backgroundColor: "rgba(255,255,255,1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 120,
    zIndex: 10,
  },
  fallbackContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(139,69,19,0.1)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 10,
  },
  fallbackHeadline: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    lineHeight: 24,
    marginBottom: 8,
  },
  fallbackTagline: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 6,
  },
  fallbackAdvertiser: {
    fontSize: 14,
    color: "#9ca3af",
    lineHeight: 18,
    marginBottom: 16,
  },
  fallbackCta: {
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  fallbackCtaText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default AdView;
