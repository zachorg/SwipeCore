import { supabase, UserProfile } from "../lib/supabase";

export const userProfileService = {
    async upsertProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>) {
        const { data, error } = await supabase
            .from('user_profiles')
            .upsert({
                verification_id: profile.verification_id,
                age: profile.age,
                gender: profile.gender,
                phone_number: profile.phone_number,
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Error upserting profile:', error);
            throw error;
        }

        return data;
    },

    async getProfileViaVerificationId(vid: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('verification_id', vid)
            .single();

        return { data: data, error: error };
    },

    async getProfileViaPhoneNumber(pn: string): Promise<any | null> {
        const { data, error } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("phone_number", pn)
            .single();

        return { data: data, error: error };
    },

    async isValidVerificationId(vid: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('user_verification_lookups')
            .select('*')
            .eq('verification_id', vid)
            .single();

        return { data: data, error: error };
    },

    async deleteProfile(uid: string) {
        const { error } = await supabase
            .from('user_profiles')
            .delete()
            .eq('verification_id', uid);

        if (error) {
            console.error('Error deleting profile:', error);
            throw error;
        }
    },

    async deleteVerificationIdLookup(vid: string): Promise<void> {
        await supabase
            .from('user_verification_lookups')
            .delete()
            .eq('verification_id', vid);
    }
};