// Supabase Edge Function — crée une session Stripe Checkout pour que le restaurateur
// s'abonne à TableConnect NFC (abonnement à LA PLATEFORME — à ne pas confondre avec le
// compte Stripe Connect du restaurant, qui sert à encaisser SES clients).
//
// Secrets requis :
//   STRIPE_SECRET_KEY, SITE_URL,
//   STRIPE_PRICE_MONTHLY, STRIPE_PRICE_ANNUAL_MONTHLY, STRIPE_PRICE_ANNUAL_UPFRONT
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

    const { plan, promoCode } = (await req.json()) as { plan?: string; promoCode?: string };
    if (plan !== 'monthly' && plan !== 'annual_monthly' && plan !== 'annual_upfront') {
      return json({ error: 'Formule invalide.' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';
    const priceEnvKey =
      plan === 'monthly'
        ? 'STRIPE_PRICE_MONTHLY'
        : plan === 'annual_monthly'
          ? 'STRIPE_PRICE_ANNUAL_MONTHLY'
          : 'STRIPE_PRICE_ANNUAL_UPFRONT';
    const priceId = Deno.env.get(priceEnvKey);
    if (!priceId) return json({ error: 'Tarif non configuré côté serveur.' }, 500);

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return json({ error: 'Non authentifié.' }, 401);

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, stripe_customer_id, stripe_subscription_id')
      .eq('owner_id', userData.user.id)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      return json({ error: "Créez d'abord votre restaurant." }, 400);
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

    let customerId = restaurant.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.user.email ?? undefined,
        name: restaurant.name,
        metadata: { restaurant_id: restaurant.id },
      });
      customerId = customer.id;
      await supabase.from('restaurants').update({ stripe_customer_id: customerId }).eq('id', restaurant.id);
    }

    // Essai gratuit de 7 jours réservé au premier abonnement du restaurant (jamais eu de
    // stripe_subscription_id) — évite qu'un restaurateur résilie puis se réabonne pour cumuler
    // des essais gratuits à l'infini.
    const isFirstSubscription = !restaurant.stripe_subscription_id;

    // Code promo saisi directement dans notre propre formulaire (facultatif). On le résout ici
    // en son ID Stripe pour l'appliquer nous-mêmes à la session — plutôt que de se reposer
    // uniquement sur le champ "Code promo" natif de la page Stripe Checkout (`allow_promotion_codes`,
    // gardé comme repli si aucun code n'est fourni ici).
    let discounts: { promotion_code: string }[] | undefined;
    if (promoCode && promoCode.trim()) {
      const matches = await stripe.promotionCodes.list({ code: promoCode.trim(), active: true, limit: 1 });
      if (matches.data.length === 0) {
        return json({ error: 'Code promo invalide ou expiré.' }, 400);
      }
      discounts = [{ promotion_code: matches.data[0].id }];
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      payment_method_types: ['card', 'paypal'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard?billing=success`,
      cancel_url: `${siteUrl}/dashboard?billing=cancel`,
      metadata: { restaurant_id: restaurant.id, plan },
      subscription_data: {
        metadata: { restaurant_id: restaurant.id, plan },
        ...(isFirstSubscription ? { trial_period_days: 7 } : {}),
      },
      // Stripe interdit de combiner `discounts` et `allow_promotion_codes` sur une même session.
      ...(discounts ? { discounts } : { allow_promotion_codes: true }),
    });

    return json({ url: session.url });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Erreur inconnue.' }, 500);
  }
});
