import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error('Supabase env vars missing. Check .env for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = url && anonKey
  ? createClient(url, anonKey, { auth: { persistSession: false } })
  : null as unknown as ReturnType<typeof createClient>;
