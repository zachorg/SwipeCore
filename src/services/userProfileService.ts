// OTP Service for phone verification
// This service handles OTP sending and verification through your backend

export interface UserProfile {
    id: string; // Supabase UUID
    verification_id: string;
    age: number;
    gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    phone_number: string;
    created_at: string;
    updated_at: string;
}

class UserProfileService {
    private baseUrl: string;

    constructor() {
        // Replace with your actual backend URL
        this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    }

    async createNewUserProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>) {
        try {
            const response = await fetch(`${this.baseUrl}api/userprofile/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profile),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send OTP');
            }

            return data;
        } catch (error: any) {
            console.error('Error sending OTP:', error);
            throw new Error(error.message || 'Failed to send OTP');
        }
    }

    async getUserProfileViaVerificationId(verificationId: string) {
        try {
            const response = await fetch(`${this.baseUrl}api/userprofile/get-via-verification-id`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ verification_id: verificationId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send OTP');
            }

            return data.user_profile;
        } catch (error: any) {
            console.error('Error sending OTP:', error);
            throw new Error(error.message || 'Failed to send OTP');
        }
    }

    async getUserProfileViaPhoneNumber(phoneNumber: string) {
        try {
            const response = await fetch(`${this.baseUrl}api/userprofile/get-via-phone-number`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone_number: phoneNumber }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errorCode === 'PROFILE_NOT_FOUND') {
                    return null;
                }
                throw new Error(data.message || 'Failed to send OTP');
            }

            if (data.success === false && data.errorCode === 'PROFILE_NOT_FOUND') {
                return null;
            }

            return data.user_profile;
        } catch (error: any) {
            console.error('Error sending OTP:', error);
            throw new Error(error.message || 'Failed to send OTP');
        }
    }
}

export const userProfileService = new UserProfileService();
export default userProfileService;
