// OTP Service for phone verification
// This service handles OTP sending and verification through your backend

import { UserProfileRequest, UserProfileResponse } from "backend/src/types/userProfileTypes";

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

    async createNewUserProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfileResponse> {
        try {
            const request: UserProfileRequest = {
                verification_id: profile.verification_id,
                age: profile.age,
                gender: profile.gender,
                phone_number: profile.phone_number,
            };

            const response = await fetch(`${this.baseUrl}api/userprofile/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            const data = await response.json() as UserProfileResponse;

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
            const request: UserProfileRequest = {
                verification_id: verificationId,
            };

            const response = await fetch(`${this.baseUrl}api/userprofile/get-via-verification-id`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            const data = await response.json() as UserProfileResponse;

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send OTP');
            }

            return data.userProfile;
        } catch (error: any) {
            console.error('Error sending OTP:', error);
            throw new Error(error.message || 'Failed to send OTP');
        }
    }

    async getUserProfileViaPhoneNumber(phoneNumber: string) {
        try {
            const request: UserProfileRequest = {
                phone_number: phoneNumber,
            };

            const response = await fetch(`${this.baseUrl}api/userprofile/get-via-phone-number`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            const data = await response.json() as UserProfileResponse;
            const profileNotFound = data?.errorCode && data.errorCode === 'PROFILE_NOT_FOUND';

            if (!response.ok) {
                if (profileNotFound) {
                    return null;
                }
                throw new Error(data.message || 'Failed to send OTP');
            }

            if (data.success === false && profileNotFound) {
                return null;
            }

            return data.userProfile;
        } catch (error: any) {
            console.error('Error sending OTP:', error);
            throw new Error(error.message || 'Failed to send OTP');
        }
    }
}

export const userProfileService = new UserProfileService();
export default userProfileService;
