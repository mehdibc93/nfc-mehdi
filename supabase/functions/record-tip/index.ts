// Supabase Edge Function — enregistre sur la commande un pourboire payé « après le repas ».
//
// Le client (page publique, non authentifiée) ne peut pas modifier la table `orders` (RLS) :
// il envoie seulement l'id du paiement Stripe. Cette fonction va vérifier directement auprès
// de Stripe que ce paiement est bien encaissé, que c'est un pourboire, et qu'il concerne cette
// commande — un client ne peut donc pas déclarer un faux pourboire. Chaque paiement n'est
// compté qu'une fois (colonne orders.tip_payment_intents, voir migration_028_tips.sql).
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
    const { orderId, paymentIntentId } = (await req.json()) as { orderId?: string; paymentIntentId?: string };
    if (!orderId || !paymentIntentId || !paymentIntentId.startsWith('pi_')) {
      return json({ error: 'Requête invalide.' }, 400);
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: order } = await supabase
      .from('orders')
      .select('id, restaurant_id, tip_amount, tip_payment_intents')
      .eq('id', orderId)
      .maybeSingle();
    if (!order) return json({ error: 'Commande introuvable.' }, 404);

    const alreadyRecorded: string[] = order.tip_payment_intents ?? [];
    if (alreadyRecorded.includes(paymentIntentId)) {
      return json({ tipAmount: Number(order.tip_amount) });
    }

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('stripe_account_id')
      .eq('id', order.restaurant_id)
      .maybeSingle();
    if (!restaurant?.stripe_account_id) return json({ error: 'Paiement en ligne non configuré.' }, 400);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, undefined, {
      stripeAccount: restaurant.stripe_account_id,
    });
    if (
      paymentIntent.status !== 'succeeded' ||
      paymentIntent.metadata?.kind !== 'tip' ||
      paymentIntent.metadata?.order_id !== orderId
    ) {
      return json({ error: 'Paiement de pourboire non valide.' }, 400);
    }

    const tipAmount = Math.round((Number(order.tip_amount) || 0) * 100 + paymentIntent.amount_received) / 100;
    const { error } = await supabase
      .from('orders')
      .update({ tip_amount: tipAmount, tip_payment_intents: [...alreadyRecorded, paymentIntentId] })
      .eq('id', orderId);
    if (error) throw error;

    return json({ tipAmount });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Erreur inconnue.' }, 500);
  }
});
