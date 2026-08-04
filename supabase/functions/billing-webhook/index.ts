// Supabase Edge Function — webhook Stripe : suit le statut de l'abonnement du restaurateur
// à TableConnect NFC (événements sur VOTRE compte Stripe, pas sur les comptes connectés —
// destination Stripe séparée de stripe-account-webhook).
//
// ⚠️ Cette fonction doit être déployée avec la vérification JWT DÉSACTIVÉE
// (Stripe n'envoie pas de token Supabase) : décoche "Verify JWT" lors du déploiement.
//
// Secrets requis : STRIPE_SECRET_KEY, STRIPE_BILLING_WEBHOOK_SECRET
// (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont déjà injectées automatiquement.)

import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17';

function mapStripeStatus(status: Stripe.Subscription.Status): 'active' | 'past_due' | 'canceled' | 'inactive' {
  if (status === 'active' || status === 'trialing') return 'active';
  if (status === 'past_due' || status === 'unpaid') return 'past_due';
  if (status === 'canceled' || status === 'incomplete_expired') return 'canceled';
  return 'inactive';
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_BILLING_WEBHOOK_SECRET')!;
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error('Signature manquante.');
    const cryptoProvider = Stripe.createSubtleCryptoProvider();
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret, undefined, cryptoProvider);
  } catch (error) {
    console.error('Signature Stripe invalide', error);
    return new Response('Signature invalide', { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === 'subscription' && session.customer && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        await supabase
          .from('restaurants')
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: mapStripeStatus(subscription.status),
            subscription_plan: session.metadata?.plan ?? null,
          })
          .eq('stripe_customer_id', session.customer as string);
      }
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from('restaurants')
        .update({ subscription_status: mapStripeStatus(subscription.status) })
        .eq('stripe_subscription_id', subscription.id);
    }
  } catch (error) {
    console.error(error);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
