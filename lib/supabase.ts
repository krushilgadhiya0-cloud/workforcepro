import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// For client-side use (limited permissions)
export const supabase = createClient(supabaseUrl, supabaseKey);

// For server-side use (admin permissions)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && (supabaseKey || supabaseServiceKey));
};

