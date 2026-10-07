import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables Supabase manquantes : copiez .env.example en .env.local et renseignez VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (Project Settings -> API sur supabase.com).',
  );
}

// Ce module est aussi chargé (sans être utilisé) pendant le pré-rendu des pages publiques au
// build, sous Node : pas de session persistée ni de rafraîchissement de token hors navigateur.
// Dans le navigateur, ces options valent leurs valeurs par défaut (true).
const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser,
  },
});
