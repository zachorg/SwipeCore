import { IsEmptyRowError, supabase, UserProfile } from "../lib/supabase";

export const userProfileService = {
    // create the new user profile if it doesn't exist
    async createUniqueProfile(phoneNumber: string) {
        const { data, error } = await supabase
            .from('user_profiles')
            .upsert({
                phone_number: phoneNumber,
                created_at: new Date().toISOString(),
            }, {
                onConflict: 'phone_number',
                ignoreDuplicates: true  // This will skip the update if record exists
            }).select().single();

        if (error && !IsEmptyRowError(error)) {
            console.error('Error updating user profile:', error);
            throw new Error('Failed to update user profile');
        }

        let userData = data;
        if (data === null) {
            const { data, error } = await supabase.
                from('user_profiles').
                select('*').
                eq('phone_number', phoneNumber).
                single();
            userData = data;

            if (error && !IsEmptyRowError(error)) {
                console.error('Error updating user profile:', error);
                throw new Error('Failed to update user profile');
            }
        }

        return userData;
    },

    // upsert the user profile
    async upsertProfile(profile: Omit<UserProfile, 'created_at' | 'phone_number' | 'updated_at'>) {
        const { data, error } = await supabase
            .from('user_profiles')
            .upsert({
                id: profile.id,
                age: profile.age,
                gender: profile.gender,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'id',
            })
            .select()
            .single();

        if (error) {
            console.error('Error upserting profile:', error);
            throw error;
        }

        return data;
    },

    async getProfile(uid: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', uid)
            .single();

        return { data: data, error: error };
    },

    async deleteProfile(uid: string) {
        const { error } = await supabase
            .from('user_profiles')
            .delete()
            .eq('id', uid);

        if (error) {
            console.error('Error deleting profile:', error);
            throw error;
        }
    }
};