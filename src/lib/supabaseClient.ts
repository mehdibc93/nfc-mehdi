import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables Supabase manquantes : copiez .env.example en .env.local et renseignez VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (Project Settings -> API sur supabase.com).',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
