import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string; // Supabase UUID
  verification_id: string;
  age: number;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  phone_number: string;
  created_at: string;
  updated_at: string;
}

export const userProfileApi = {
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

  async getProfile(uid: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('verification_id', uid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error getting profile:', error);
      throw error;
    }

    return data;
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
  }
};
