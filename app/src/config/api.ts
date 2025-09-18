// API configuration for React Native
// This file manages backend URLs and API settings
import { getBackendUrl, getFeatureFlags } from './env';

export const API_CONFIG = {
    // Backend URLs - now using environment variables
    BACKEND_URL: getBackendUrl(),

    // API Endpoints
    ENDPOINTS: {
        // OTP endpoints
        OTP: {
            SEND: "api/otp/send",
            VERIFY: "api/otp/verify",
            AUTH: {
                IS_VERIFIED: "api/otp/auth/is-verified",
                REFRESH: "api/otp/auth/refresh",
            },
        },

        // User Profile endpoints
        USER_PROFILE: {
            CREATE: "api/userprofile/create",
            GET: "api/userprofile/me",
            UPDATE: "api/userprofile/update",
            DELETE: "api/userprofile/delete",
        },

        // Places endpoints
        PLACES: {
            NEARBY: "api/places/nearby",
            DETAILS: "api/places", // Will be appended with /{placeId}
            PHOTO: "api/places/photo/givememyphoto",
        },

        // Health check
        HEALTH: "health",
    },

    // API Settings
    SETTINGS: {
        TIMEOUT: 30000, // 30 seconds
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000, // 1 second
    },

    // Headers
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
    return `${API_CONFIG.BACKEND_URL}${endpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = (accessToken: string) => {
    return {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${accessToken}`,
    };
};

// Environment detection
export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;

// Platform-specific configurations
export const getPlatformConfig = () => {
    const featureFlags = getFeatureFlags();

    return {
        backendUrl: API_CONFIG.BACKEND_URL,
        timeout: API_CONFIG.SETTINGS.TIMEOUT,
        useMockData: featureFlags.useMockData,
        useLiveData: featureFlags.useLiveData,
        googlePlacesEnabled: featureFlags.googlePlacesEnabled,
    };
};
