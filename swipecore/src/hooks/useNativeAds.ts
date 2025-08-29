import { useState, useEffect, useCallback } from 'react';
import { RestaurantCard } from '@/types/Types';
import {
    startNativeAdsPreload,
    getAvailableAd,
    recordImpression,
    handleClick,
    cleanupAds,
} from '@/services/nativeAdsProvider';
import { areAdsEnabled, areNativeAdsInDeckEnabled, getNativeAdInterval } from '@/utils/ads';

interface UseNativeAdsReturn {
    // Ad data
    currentAd: RestaurantCard | null;
    isLoading: boolean;
    error: string | null;

    // Ad management
    loadNextAd: () => void;
    recordAdImpression: (adId: string) => void;
    handleAdClick: (adId: string) => void;

    // Configuration
    isAdsEnabled: boolean;
    nativeAdsEnabled: boolean;
    adInterval: number;
}

export const useNativeAds = (): UseNativeAdsReturn => {
    const [currentAd, setCurrentAd] = useState<RestaurantCard | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAdsEnabledValue = areAdsEnabled();
    const nativeAdsEnabled = areNativeAdsInDeckEnabled();
    const adInterval = getNativeAdInterval();

    // Load the next available ad
    const loadNextAd = useCallback(() => {
        if (!isAdsEnabledValue || !nativeAdsEnabled) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const ad = getAvailableAd();
            if (ad) {
                setCurrentAd(ad);
                setIsLoading(false);
            } else {
                // If no ad is available, try to preload more
                startNativeAdsPreload();
                setIsLoading(false);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load ad');
            setIsLoading(false);
        }
    }, [isAdsEnabledValue, nativeAdsEnabled]);

    // Record ad impression
    const recordAdImpression = useCallback((adId: string) => {
        if (isAdsEnabledValue) {
            recordImpression(adId);
        }
    }, [isAdsEnabledValue]);

    // Handle ad click
    const handleAdClick = useCallback((adId: string) => {
        if (isAdsEnabledValue) {
            handleClick(adId);
        }
    }, [isAdsEnabledValue]);

    // Initialize ads when the hook is first used
    useEffect(() => {
        if (isAdsEnabledValue && nativeAdsEnabled) {
            startNativeAdsPreload();
        }
    }, [isAdsEnabledValue, nativeAdsEnabled]);

    // Cleanup when component unmounts
    useEffect(() => {
        return () => {
            cleanupAds();
        };
    }, []);

    // Auto-load ads at intervals
    useEffect(() => {
        if (!isAdsEnabledValue || !nativeAdsEnabled || adInterval <= 0) {
            return;
        }

        const interval = setInterval(() => {
            loadNextAd();
        }, adInterval * 1000); // Convert to milliseconds

        return () => clearInterval(interval);
    }, [isAdsEnabledValue, nativeAdsEnabled, adInterval, loadNextAd]);

    return {
        currentAd,
        isLoading,
        error,
        loadNextAd,
        recordAdImpression,
        handleAdClick,
        isAdsEnabled: isAdsEnabledValue,
        nativeAdsEnabled,
        adInterval,
    };
};

export default useNativeAds;
