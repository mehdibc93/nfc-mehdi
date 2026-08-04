// Supabase Edge Function — génère un lien de connexion vers le tableau de bord Express Stripe
// du restaurateur, pour qu'il puisse modifier lui-même son IBAN, ses infos bancaires/société,
// à tout moment, directement depuis l'interface sécurisée de Stripe (pas la nôtre).
//
// Secrets requis : STRIPE_SECRET_KEY
// (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont déjà injectées automatiquement.)

import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Non authentifié.' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return json({ error: 'Non authentifié.' }, 401);

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('stripe_account_id')
      .eq('owner_id', userData.user.id)
      .maybeSingle();

    if (restaurantError || !restaurant || !restaurant.stripe_account_id) {
      return json({ error: 'Aucun compte Stripe connecté.' }, 400);
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
    const loginLink = await stripe.accounts.createLoginLink(restaurant.stripe_account_id);

    return json({ url: loginLink.url });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Erreur inconnue.' }, 500);
  }
});
