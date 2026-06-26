import { createClient } from '@supabase/supabase-js';

// Robust Env Detection (Vite requires VITE_ for client, process.env for Node/Serverless)
const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 
                    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 
                    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) || '';

const supabaseKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 
                    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 
                    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) || '';

const supabaseServiceKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';

// For client-side use (limited permissions)
export const supabase = createClient(supabaseUrl, supabaseKey);

// For server-side use (admin permissions)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseUrl.length > 10 && (supabaseKey || supabaseServiceKey));
};


