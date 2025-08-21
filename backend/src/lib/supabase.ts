import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

if (supabase) {
  console.log("[supabase] Supabase client initialized");
}

export interface UserProfile {
  id: string; // Supabase UUID
  age: number;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  phone_number: string;
  created_at: string;
  updated_at: string;
};

export function IsEmptyRowError(error: any) {
  return error.code === 'PGRST116';
}
