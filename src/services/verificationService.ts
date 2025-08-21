import { CrossPlatformStorage } from '@/utils/crossPlatformStorage';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { otpService } from './otpService';

export interface VerificationData {
    accessToken: string;
    refreshToken: string;
}

class VerificationService {
    private readonly ACCESS_TOKEN_KEY = 'AUTH_ACCESS_TOKEN';
    private readonly REFRESH_TOKEN_KEY = 'AUTH_REFRESH_TOKEN';

    /**
     * Store verification data in persistent storage
     */
    async storeVerification(data: Omit<VerificationData, 'verifiedAt'>): Promise<void> {
        try {
            await CrossPlatformStorage.setItem(
                this.ACCESS_TOKEN_KEY,
                data.accessToken
            );

            await SecureStoragePlugin.set({
                key: this.REFRESH_TOKEN_KEY,
                value: data.refreshToken,
            });

            console.log('✅ Verification data stored successfully:', {
                verificationData: JSON.stringify(data),
                storageType: CrossPlatformStorage.getStorageType()
            });
        } catch (error) {
            console.error('Failed to store verification data:', error);
            await this.clearVerification();
            throw error;
        }
    }

    /**
     * Check if user has a valid verification ID stored
     */
    async isVerified(): Promise<boolean> {
        try {
            const accessToken = await this.getStoredAccessToken();
            return await otpService.authIsVerified(accessToken);
        } catch (error) {
            console.error('Failed to check if verification is valid:', error);
            return false;
        }
    }

    async refreshAccessToken(): Promise<boolean> {
        try {
            const refreshToken = await this.getStoredRefreshToken();
            return await otpService.authRefresh(refreshToken);
        } catch (error) {
            console.error('Failed to refresh access token:', error);
            return null;
        }
    }

    /**
     * Clear stored verification data
     */
    async clearVerification(): Promise<void> {
        try {
            await CrossPlatformStorage.removeItem(this.ACCESS_TOKEN_KEY);
            await SecureStoragePlugin.remove({ key: this.REFRESH_TOKEN_KEY });
            console.log('🗑️ Verification data cleared from storage');
        } catch (error) {
            console.error('Failed to clear verification data:', error);
            throw error;
        }
    }

    async getStoredRefreshToken(): Promise<string | null> {
        try {
            const { value } = await SecureStoragePlugin.get({ key: this.REFRESH_TOKEN_KEY });
            return value || null;
        } catch (error) {
            console.error('Failed to get stored refresh token:', error);
            return null;
        }
    }

    async getStoredAccessToken(): Promise<string | null> {
        try {
            const value = await CrossPlatformStorage.getItem(this.ACCESS_TOKEN_KEY);
            return value || null;
        } catch (error) {
            console.error('Failed to get stored access token:', error);
            return null;
        }
    }
}

export const verificationService = new VerificationService();
export default verificationService;
