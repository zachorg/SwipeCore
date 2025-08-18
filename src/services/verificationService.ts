import { CrossPlatformStorage } from '@/utils/crossPlatformStorage';
import { otpService } from './otpService';

export interface VerificationData {
    verificationId: string;
    phoneNumber: string;
    age?: number;
    gender?: string;
    verifiedAt: number;
}

class VerificationService {
    private readonly STORAGE_KEY = 'userVerification';

    /**
     * Store verification data in persistent storage
     */
    async storeVerification(data: Omit<VerificationData, 'verifiedAt'>): Promise<void> {
        try {
            const verificationData: VerificationData = {
                ...data,
                verifiedAt: Date.now(),
            };

            await CrossPlatformStorage.setItem(
                this.STORAGE_KEY,
                JSON.stringify(verificationData)
            );

            console.log('✅ Verification data stored successfully:', {
                verificationData: JSON.stringify(verificationData),
                storageType: CrossPlatformStorage.getStorageType()
            });
        } catch (error) {
            console.error('Failed to store verification data:', error);
            await this.clearVerification();
            throw error;
        }
    }

    /**
     * Get stored verification data from persistent storage
     */
    async getStoredVerification(): Promise<VerificationData | null> {
        try {
            const stored = await CrossPlatformStorage.getItem(this.STORAGE_KEY);
            if (!stored) {
                console.log('[verificationService]  No verification data found in storage');
                return null;
            }

            const verificationData: VerificationData = JSON.parse(stored);

            // Validate the stored data
            if (!verificationData.verificationId) {
                console.warn('[verificationService] Invalid verification data stored, removing...', verificationData);
                await this.clearVerification();
                return null;
            }

            console.log('[verificationService] Retrieved stored verification data:', JSON.stringify(verificationData));

            return verificationData;
        } catch (error) {
            console.error('Failed to get stored verification data:', error);
            // Clear corrupted data
            await this.clearVerification();
            return null;
        }
    }

    /**
     * Check if user has a valid verification ID stored
     */
    async hasValidVerification(): Promise<boolean> {
        try {
            const verificationStatus = await this.getVerificationStatus();
            return verificationStatus.isValid;
        } catch (error) {
            console.error('Failed to check if verification is valid:', error);
            return false;
        }
    }

    /**
     * Check if user has a valid verification ID stored
     */
    async verifyStoredVerificationId(verificationId: string): Promise<boolean> {
        try {
            console.log('🔍 Checking verification status...');

            // Verify with backend that the stored verification ID is still valid
            const response = await otpService.checkVerification(verificationId);

            if (response.success) {
                console.log('✅ Backend verification successful, user is verified');
                return true;
            } else {
                console.log('❌ Backend verification failed:', response.message);
                // Clear invalid verification data
                await this.clearVerification();
                return false;
            }
        } catch (error) {
            console.error('Failed to validate stored verification:', error);
            // If validation fails, clear the stored data
            await this.clearVerification();
            return false;
        }
    }

    /**
     * Clear stored verification data
     */
    async clearVerification(): Promise<void> {
        try {
            await CrossPlatformStorage.removeItem(this.STORAGE_KEY);
            console.log('🗑️ Verification data cleared from storage');
        } catch (error) {
            console.error('Failed to clear verification data:', error);
            throw error;
        }
    }

    /**
     * Check if verification is expired (optional: add expiration logic)
     */
    isVerificationExpired(verifiedAt: number, maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): boolean {
        const now = Date.now();
        const age = now - verifiedAt;
        const isExpired = age > maxAgeMs;

        if (isExpired) {
            console.log(`⏰ Verification expired: ${Math.round(age / (1000 * 60 * 60 * 24))} days old (max: ${Math.round(maxAgeMs / (1000 * 60 * 60 * 24))} days)`);
        }

        return isExpired;
    }

    /**
     * Get verification status summary for debugging
     */
    async getVerificationStatus(): Promise<{
        hasStoredData: boolean;
        isValid: boolean;
        details?: VerificationData;
    }> {
        try {
            const stored = await this.getStoredVerification();
            if (!stored) {
                return { hasStoredData: false, isValid: false };
            }

            const isValid = await this.verifyStoredVerificationId(stored.verificationId);
            return {
                hasStoredData: true,
                isValid,
                details: stored
            };
        } catch (error) {
            console.error('Error getting verification status:', error);
            return { hasStoredData: false, isValid: false };
        }
    }
}

export const verificationService = new VerificationService();
export default verificationService;
