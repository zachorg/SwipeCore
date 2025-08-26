// User profile service for React Native
// This service handles user profile creation and management through your backend
import * as SecureStore from 'expo-secure-store';
import { verificationService } from './verificationService';
import { API_CONFIG, buildApiUrl, getAuthHeaders } from '../config/api';

// Types for User Profile API
export interface UserProfileRequest {
    age: number;
    gender: string;
}

export interface UserProfileResponse {
    success: boolean;
    message?: string;
    errorCode?: string;
    userProfile?: UserProfile;
}

export interface UserProfile {
    id: string;
    created_at: string;
    updated_at: string;
    phone_number: string;
    age: number | null;
    gender: string | null;
    preferences?: {
        cuisine: string[];
        price_range: string[];
        max_distance: number;
    };
}

class UserProfileService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_CONFIG.BACKEND_URL;

        if (!this.baseUrl) {
            throw new Error('Backend URL is not set');
        }
    }

    async getUserProfile(): Promise<UserProfile | null> {
        try {
            const accessToken = await verificationService.getAccessToken();

            if (!accessToken) {
                console.log('[UserProfileService] No access token found');
                return null;
            }

            console.log('[UserProfileService] Fetching user profile from backend...');

            const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USER_PROFILE.GET), {
                method: 'GET',
                headers: getAuthHeaders(accessToken),
            });

            const data = await response.json() as UserProfileResponse;

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch user profile');
            }

            if (!data.success) {
                throw new Error(data.errorCode || 'Failed to fetch user profile');
            }

            if (data.userProfile) {
                // Store in local secure storage for offline access
                await SecureStore.setItemAsync('user_profile', JSON.stringify(data.userProfile));
                console.log('[UserProfileService] User profile fetched and stored locally');
                return data.userProfile;
            }

            return null;
        } catch (error: any) {
            console.error('[UserProfileService] Error fetching user profile:', error);

            // Fallback to local storage if backend call fails
            try {
                const stored = await SecureStore.getItemAsync('user_profile');
                if (stored) {
                    console.log('[UserProfileService] Using locally stored profile as fallback');
                    return JSON.parse(stored);
                }
            } catch (fallbackError) {
                console.error('[UserProfileService] Fallback to local storage failed:', fallbackError);
            }

            throw new Error(error.message || 'Failed to fetch user profile');
        }
    }

    async createUserProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile> {
        try {
            const accessToken = await verificationService.getAccessToken();

            if (!accessToken) {
                throw new Error('No access token found');
            }

            const request: UserProfileRequest = {
                age: profile.age || 0,
                gender: profile.gender || 'prefer-not-to-say',
            };

            console.log('[UserProfileService] Creating user profile in backend...');

            const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USER_PROFILE.CREATE), {
                method: 'POST',
                headers: getAuthHeaders(accessToken),
                body: JSON.stringify({ request }),
            });

            const data = await response.json() as UserProfileResponse;

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create user profile');
            }

            if (!data.success) {
                throw new Error(data.errorCode || 'Failed to create user profile');
            }

            if (data.userProfile) {
                // Store in local secure storage
                await SecureStore.setItemAsync('user_profile', JSON.stringify(data.userProfile));
                console.log('[UserProfileService] User profile created and stored locally');
                return data.userProfile;
            }

            throw new Error('No user profile returned from backend');
        } catch (error: any) {
            console.error('[UserProfileService] Error creating user profile:', error);
            throw new Error(error.message || 'Failed to create user profile');
        }
    }

    async updateUserProfile(updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>): Promise<UserProfile | null> {
        try {
            const accessToken = await verificationService.getAccessToken();

            if (!accessToken) {
                throw new Error('No access token found');
            }

            console.log('[UserProfileService] Updating user profile in backend...');

            const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USER_PROFILE.UPDATE), {
                method: 'PUT',
                headers: getAuthHeaders(accessToken),
                body: JSON.stringify({ updates }),
            });

            const data = await response.json() as UserProfileResponse;

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update user profile');
            }

            if (!data.success) {
                throw new Error(data.errorCode || 'Failed to update user profile');
            }

            if (data.userProfile) {
                // Update local storage
                await SecureStore.setItemAsync('user_profile', JSON.stringify(data.userProfile));
                console.log('[UserProfileService] User profile updated and stored locally');
                return data.userProfile;
            }

            return null;
        } catch (error: any) {
            console.error('[UserProfileService] Error updating user profile:', error);
            return null;
        }
    }

    async deleteUserProfile(): Promise<void> {
        try {
            const accessToken = await verificationService.getAccessToken();

            if (!accessToken) {
                throw new Error('No access token found');
            }

            console.log('[UserProfileService] Deleting user profile from backend...');

            const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USER_PROFILE.DELETE), {
                method: 'DELETE',
                headers: getAuthHeaders(accessToken),
            });

            if (!response.ok) {
                throw new Error('Failed to delete user profile from backend');
            }

            // Clear local storage
            await SecureStore.deleteItemAsync('user_profile');
            console.log('[UserProfileService] User profile deleted from backend and local storage');
        } catch (error: any) {
            console.error('[UserProfileService] Error deleting user profile:', error);
            throw error;
        }
    }

    async hasCompleteProfile(): Promise<boolean> {
        try {
            const profile = await this.getUserProfile();
            return !!(profile && profile.age !== null && profile.gender !== null);
        } catch (error: any) {
            console.error('[UserProfileService] Error checking profile completeness:', error);
            return false;
        }
    }

    async createNewUserProfile(profile: { age: number; gender: string }): Promise<UserProfile> {
        try {
            const accessToken = await verificationService.getAccessToken();

            if (!accessToken) {
                throw new Error('No access token found');
            }

            const request: UserProfileRequest = {
                age: profile.age,
                gender: profile.gender,
            };

            console.log('[UserProfileService] Creating new user profile in backend...');

            const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USER_PROFILE.CREATE), {
                method: 'POST',
                headers: getAuthHeaders(accessToken),
                body: JSON.stringify({ request }),
            });

            const data = await response.json() as UserProfileResponse;

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create new user profile');
            }

            if (!data.success) {
                throw new Error(data.errorCode || 'Failed to create new user profile');
            }

            if (data.userProfile) {
                // Store in local secure storage
                await SecureStore.setItemAsync('user_profile', JSON.stringify(data.userProfile));
                console.log('[UserProfileService] New user profile created and stored locally');
                return data.userProfile;
            }

            throw new Error('No user profile returned from backend');
        } catch (error: any) {
            console.error('[UserProfileService] Error creating new user profile:', error);
            throw new Error(error.message || 'Failed to create new user profile');
        }
    }
}

export default new UserProfileService();
