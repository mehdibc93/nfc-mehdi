// Supabase Edge Function — ouvre le portail Stripe pour que le restaurateur gère lui-même
// son abonnement TableConnect NFC (changer de carte, annuler, voir ses factures).
//
// Secrets requis : STRIPE_SECRET_KEY, SITE_URL

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
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return json({ error: 'Non authentifié.' }, 401);

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('stripe_customer_id')
      .eq('owner_id', userData.user.id)
      .maybeSingle();

    if (restaurantError || !restaurant || !restaurant.stripe_customer_id) {
      return json({ error: 'Aucun abonnement trouvé.' }, 400);
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: restaurant.stripe_customer_id,
      return_url: `${siteUrl}/dashboard`,
    });

    return json({ url: portalSession.url });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Erreur inconnue.' }, 500);
  }
});
