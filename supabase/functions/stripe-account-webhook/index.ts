// Supabase Edge Function — webhook Stripe : met à jour restaurants.stripe_onboarded
// quand le compte Connect du restaurateur devient actif (ou redevient inactif).
//
// ⚠️ Cette fonction doit être déployée avec la vérification JWT DÉSACTIVÉE
// (Stripe n'envoie pas de token Supabase) : décoche "Verify JWT" lors du déploiement,
// ou côté dashboard Supabase, section Edge Functions -> cette fonction -> Settings.
//
// Secrets requis : STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
// (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont déjà injectées automatiquement.)

import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17';

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error('Signature manquante.');
    // Deno n'a pas l'implémentation crypto de Node : Stripe fournit un provider
    // basé sur SubtleCrypto (Web Crypto) pour les environnements type edge/Deno.
    const cryptoProvider = Stripe.createSubtleCryptoProvider();
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret, undefined, cryptoProvider);
  } catch (error) {
    console.error('Signature Stripe invalide', error);
    return new Response('Signature invalide', { status: 400 });
  }

  if (event.type === 'account.updated') {
    // On ne fait pas confiance aux champs envoyés dans l'événement (leur présence dépend du
    // "style de charge utile" choisi dans Stripe — léger/thin ou instantané/snapshot) : on
    // récupère l'id du compte puis on va chercher son état à jour directement auprès de Stripe.
    const accountId = (event.data.object as { id?: string }).id;
    if (accountId) {
      const account = await stripe.accounts.retrieve(accountId);
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const onboarded = Boolean(account.charges_enabled && account.details_submitted);
      await supabase.from('restaurants').update({ stripe_onboarded: onboarded }).eq('stripe_account_id', account.id);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
