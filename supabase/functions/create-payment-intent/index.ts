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

type DiscountRuleRow = {
  percent: number;
  days_of_week: number[];
  start_time: string | null;
  end_time: string | null;
};

// Même logique que src/lib/discounts.ts côté client (dupliquée : cette fonction tourne dans un
// runtime Deno séparé, sans accès au code du bundle Vite) — toujours évaluée en heure de Paris,
// c'est elle qui fait foi pour le montant réellement facturé.
const RESTAURANT_TIMEZONE = 'Europe/Paris';
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function getParisNow(): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: RESTAURANT_TIMEZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const weekdayShort = parts.find((part) => part.type === 'weekday')?.value ?? 'Sun';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0') % 24;
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
  return { weekday: WEEKDAY_INDEX[weekdayShort] ?? 0, minutes: hour * 60 + minute };
}

function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function isRuleActiveNow(rule: DiscountRuleRow, weekday: number, minutes: number): boolean {
  if (!rule.days_of_week.includes(weekday)) return false;
  if (!rule.start_time || !rule.end_time) return true;
  const start = parseTimeToMinutes(rule.start_time);
  const end = parseTimeToMinutes(rule.end_time);
  if (start === null || end === null) return true;
  if (start <= end) return minutes >= start && minutes < end;
  return minutes >= start || minutes < end;
}

function getActiveDiscountPercent(rules: DiscountRuleRow[]): number {
  const { weekday, minutes } = getParisNow();
  const active = rules.filter((rule) => isRuleActiveNow(rule, weekday, minutes));
  if (active.length === 0) return 0;
  return Math.max(...active.map((rule) => rule.percent));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { restaurantId, items, fulfillment = 'dine_in' } = (await req.json()) as {
      restaurantId?: string;
      items?: CartRequestItem[];
      fulfillment?: string;
    };
    if (!restaurantId || !Array.isArray(items) || items.length === 0) {
      return json({ error: 'Requête invalide.' }, 400);
    }
    if (!['dine_in', 'takeaway', 'delivery'].includes(fulfillment)) {
      return json({ error: 'Type de commande invalide.' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      // `*` plutôt qu'une liste de colonnes : les colonnes emporter/livraison (migration_027)
      // peuvent ne pas exister encore, et une colonne absente ferait échouer la requête.
      .select('*')
      .eq('id', restaurantId)
      .maybeSingle();

    if (restaurantError || !restaurant || !restaurant.stripe_account_id || !restaurant.stripe_onboarded) {
      return json({ error: "Ce restaurant n'accepte pas encore le paiement en ligne." }, 400);
    }
    if (fulfillment === 'takeaway' && !restaurant.takeaway_enabled) {
      return json({ error: "Ce restaurant ne propose pas la vente à emporter." }, 400);
    }
    if (fulfillment === 'delivery' && !restaurant.delivery_enabled) {
      return json({ error: 'Ce restaurant ne propose pas la livraison.' }, 400);
    }

    const { data: discountRules } = await supabase
      .from('discount_rules')
      .select('percent, days_of_week, start_time, end_time')
      .eq('restaurant_id', restaurantId)
      .eq('active', true);
    const discountPercent = getActiveDiscountPercent((discountRules ?? []) as DiscountRuleRow[]);

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

      // La réduction s'applique uniquement au prix du plat, pas aux suppléments — voir
      // discountedPrice() côté client (RestaurantExperience.tsx) pour la même règle.
      let unitPrice = Number(dish.price) || 0;
      if (discountPercent > 0) {
        unitPrice = Math.round(unitPrice * (1 - discountPercent / 100) * 100) / 100;
      }
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

    // Livraison : minimum de commande et frais calculés sur le sous-total des plats après
    // réduction — même règle que src/lib/fulfillment.ts côté client (deliveryFeeFor).
    if (fulfillment === 'delivery') {
      const subtotalCents = amount;
      const minOrderCents = Math.round((Number(restaurant.delivery_min_order) || 0) * 100);
      if (subtotalCents < minOrderCents) {
        return json({ error: 'Montant minimum de commande non atteint pour la livraison.' }, 400);
      }
      const freeFrom = restaurant.delivery_free_from == null ? null : Math.round(Number(restaurant.delivery_free_from) * 100);
      const isFree = freeFrom !== null && subtotalCents >= freeFrom;
      if (!isFree) amount += Math.round((Number(restaurant.delivery_fee) || 0) * 100);
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
