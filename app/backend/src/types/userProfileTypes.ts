import { UserProfile } from "../lib/supabase";

export interface UserProfileRequest {
    age?: number;
    gender?: "male" | "female" | "other" | "prefer-not-to-say";
}

export interface UserProfileResponse {
    success: boolean;
    errorCode?: string;
    message?: string;
    userProfile?: Omit<UserProfile, 'id'>;
}
