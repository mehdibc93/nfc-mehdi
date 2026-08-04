// Supabase Edge Function — crée un PaymentIntent Stripe directement sur le compte Connect
// du restaurant (aucune commission plateforme : pas d'application_fee_amount).
//
// Le montant est TOUJOURS recalculé ici à partir des prix réels en base (table dishes) —
// on ne fait jamais confiance à un montant envoyé par le client, pour éviter qu'un client
// malveillant modifie le prix payé depuis les outils de dev du navigateur.
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

type CartRequestItem = {
  dishId?: string;
  quantity?: number;
  extraNames?: string[];
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { restaurantId, items } = (await req.json()) as { restaurantId?: string; items?: CartRequestItem[] };
    if (!restaurantId || !Array.isArray(items) || items.length === 0) {
      return json({ error: 'Requête invalide.' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, stripe_account_id, stripe_onboarded')
      .eq('id', restaurantId)
      .maybeSingle();

    if (restaurantError || !restaurant || !restaurant.stripe_account_id || !restaurant.stripe_onboarded) {
      return json({ error: "Ce restaurant n'accepte pas encore le paiement en ligne." }, 400);
    }

    let amount = 0;
    for (const item of items) {
      if (!item.dishId) continue;
      const quantity = Math.max(1, Math.min(50, Math.trunc(Number(item.quantity)) || 1));

      const { data: dish } = await supabase
        .from('dishes')
        .select('price, extras')
        .eq('id', item.dishId)
        .maybeSingle();
      if (!dish) continue;

      let unitPrice = Number(dish.price) || 0;
      const dishExtras: { name: string; price: number }[] = Array.isArray(dish.extras) ? dish.extras : [];
      const requestedExtraNames = Array.isArray(item.extraNames) ? item.extraNames : [];
      for (const extraName of requestedExtraNames) {
        const match = dishExtras.find((extra) => extra.name === extraName);
        if (match) unitPrice += Number(match.price) || 0;
      }

      amount += Math.round(unitPrice * 100) * quantity;
    }

    if (amount <= 0) {
      return json({ error: 'Panier vide ou invalide.' }, 400);
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency: 'eur',
        automatic_payment_methods: { enabled: true },
      },
      { stripeAccount: restaurant.stripe_account_id },
    );

    return json({ clientSecret: paymentIntent.client_secret, stripeAccountId: restaurant.stripe_account_id });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Erreur inconnue.' }, 500);
  }
});
