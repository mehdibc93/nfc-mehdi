// Supabase Edge Function — déconnecte le compte Stripe du restaurateur (remet stripe_account_id
// et stripe_onboarded à leur valeur vide), pour qu'il puisse en reconnecter un autre depuis zéro.
// N'annule rien côté Stripe (le compte existe toujours chez Stripe si besoin), on retire juste
// le lien avec ce restaurant.
//
// (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont déjà injectées automatiquement.)

import { createClient } from 'npm:@supabase/supabase-js@2';

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

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return json({ error: 'Non authentifié.' }, 401);

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', userData.user.id)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      return json({ error: 'Restaurant introuvable.' }, 400);
    }

    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ stripe_account_id: null, stripe_onboarded: false })
      .eq('id', restaurant.id);

    if (updateError) return json({ error: updateError.message }, 500);

    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Erreur inconnue.' }, 500);
  }
});
