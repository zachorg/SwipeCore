// OTP Service for phone verification
// This service handles OTP sending and verification through your backend

import { UserProfileRequest, UserProfileResponse } from "backend/src/types/userProfileTypes";
import verificationService from "./verificationService";

export interface UserProfile {
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
        this.baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!this.baseUrl) {
            throw new Error('Backend URL is not set');
        }
    }

    async createNewUserProfile(profile: Omit<UserProfile, 'phone_number' | 'id' | 'created_at' | 'updated_at'>): Promise<UserProfileResponse> {
        try {
            const accessToken = await verificationService.getStoredAccessToken();
            const request: UserProfileRequest = {
                age: profile.age,
                gender: profile.gender,
            };

            const response = await fetch(`${this.baseUrl}api/userprofile/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ request }),
            });

            const data = await response.json() as UserProfileResponse;

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create user profile');
            }

            if (!data.success) {
                throw new Error(data.errorCode || 'Failed to create user profile');
            }

            return data;
        } catch (error: any) {
            console.error('Error failed to create user profile:', error);
            throw new Error(error.message || 'Failed to create user profile');
        }
    }

    async getUserProfile() {
        try {
            const accessToken = await verificationService.getStoredAccessToken();

            const response = await fetch(`${this.baseUrl}api/userprofile/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                }
            });

            console.log("request", accessToken);

            const data = await response.json() as UserProfileResponse;

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch user profile');
            }
            if (!data.success) {
                throw new Error(data.errorCode || 'Failed to fetch user profile');
            }

            return data.userProfile;
        } catch (error: any) {
            console.error('Error fetching user profile:', error);
            throw new Error(error.message || 'Failed to fetch user profile');
        }
    }
}

export const userProfileService = new UserProfileService();
export default userProfileService;
