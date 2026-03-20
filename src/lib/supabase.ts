import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key';

// This acts as a standard supabase client.
// In this prototype, we will mostly rely on mock data, but we export this for
// actual DB interaction when Supabase is connected.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
