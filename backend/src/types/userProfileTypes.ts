import { UserProfile } from "../lib/supabase";

export interface UserProfileRequest {
    verification_id?: string;
    age?: number;
    gender?: "male" | "female" | "other" | "prefer-not-to-say";
    phone_number?: string;
}

export interface UserProfileResponse {
    success: boolean;
    errorCode?: string;
    message?: string;
    userProfile?: UserProfile;
}
