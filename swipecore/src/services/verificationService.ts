// Verification service for React Native
import * as SecureStore from 'expo-secure-store';
import { otpService } from './otpService';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export interface VerificationData {
    accessToken: string;
    refreshToken: string;
}

class VerificationService {
    async isVerified(): Promise<boolean> {
        try {
            const stored = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
            if (!stored) {
                return false;
            }
            return await otpService.authIsVerified(stored);
        } catch (error) {
            console.error('[VerificationService] Error checking verification status:', error);
            return false;
        }
    }

    async refreshAccessToken(): Promise<boolean> {
        try {
            const refreshToken = await this.getStoredRefreshToken();
            if (!refreshToken) {
                console.log('[VerificationService] No refresh token found');
                return false;
            }

            console.log('[VerificationService] Refreshing access token...');
            return await otpService.authRefresh(refreshToken);
        } catch (error) {
            console.error('[VerificationService] Error refreshing access token:', error);
            return false;
        }
    }

    async getAccessToken(): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        } catch (error) {
            console.error('[VerificationService] Error getting access token:', error);
            return null;
        }
    }

    async setAccessToken(token: string): Promise<void> {
        try {
            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
            console.log('[VerificationService] Access token stored');
        } catch (error) {
            console.error('[VerificationService] Error storing access token:', error);
        }
    }

    async getStoredRefreshToken(): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        } catch (error) {
            console.error('[VerificationService] Error getting refresh token:', error);
            return null;
        }
    }

    async storeVerification(verification: VerificationData): Promise<void> {
        try {
            await this.setAccessToken(verification.accessToken);
            await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, verification.refreshToken);
            console.log('[VerificationService] Verification stored successfully');
        } catch (error) {
            console.error('[VerificationService] Error storing verification:', error);
            throw error;
        }
    }

    async getStoredAccessToken(): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        } catch (error) {
            console.error('[VerificationService] Error getting stored access token:', error);
            return null;
        }
    }
}

export const verificationService = new VerificationService();
