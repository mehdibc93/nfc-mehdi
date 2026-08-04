// Supabase Edge Function — vérifie directement auprès de Stripe l'état réel du compte
// Connect du restaurateur connecté, et met à jour restaurants.stripe_onboarded en conséquence.
//
// Sert de filet de sécurité au retour de l'onboarding Stripe (?stripe=return), indépendamment
// du webhook (qui peut avoir du retard ou, en test, ne pas se déclencher de façon fiable).
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
      .select('id, stripe_account_id')
      .eq('owner_id', userData.user.id)
      .maybeSingle();

    if (restaurantError || !restaurant || !restaurant.stripe_account_id) {
      return json({ onboarded: false });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
    const account = await stripe.accounts.retrieve(restaurant.stripe_account_id);
    const onboarded = Boolean(account.charges_enabled && account.details_submitted);

    await supabase.from('restaurants').update({ stripe_onboarded: onboarded }).eq('id', restaurant.id);

    return json({ onboarded });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Erreur inconnue.' }, 500);
  }
});
