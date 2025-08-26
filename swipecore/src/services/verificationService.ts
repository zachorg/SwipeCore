// Verification service for React Native
import * as SecureStore from 'expo-secure-store';
import { otpService } from './otpService';

const VERIFICATION_KEY = 'verification_status';
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export interface VerificationStatus {
    isVerified: boolean;
    expiresAt: number;
    userId?: string;
}

export interface VerificationData {
    accessToken: string;
    refreshToken: string;
}

class VerificationService {
    private verificationStatus: VerificationStatus | null = null;

    async isVerified(): Promise<boolean> {
        try {
            if (this.verificationStatus) {
                return this.verificationStatus.isVerified &&
                    this.verificationStatus.expiresAt > Date.now();
            }

            const stored = await SecureStore.getItemAsync(VERIFICATION_KEY);
            if (stored) {
                this.verificationStatus = JSON.parse(stored);
                return !!(this.verificationStatus?.isVerified &&
                    this.verificationStatus?.expiresAt > Date.now());
            }

            return false;
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

    async setVerificationStatus(status: VerificationStatus): Promise<void> {
        try {
            this.verificationStatus = status;
            await SecureStore.setItemAsync(VERIFICATION_KEY, JSON.stringify(status));
            console.log('[VerificationService] Verification status updated');
        } catch (error) {
            console.error('[VerificationService] Error setting verification status:', error);
        }
    }

    async clearVerificationStatus(): Promise<void> {
        try {
            this.verificationStatus = null;
            await SecureStore.deleteItemAsync(VERIFICATION_KEY);
            await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
            console.log('[VerificationService] Verification status cleared');
        } catch (error) {
            console.error('[VerificationService] Error clearing verification status:', error);
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
            await this.setVerificationStatus({
                isVerified: true,
                expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
                userId: 'user_' + Date.now(),
            });
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
