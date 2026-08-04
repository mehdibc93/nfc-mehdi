import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';

// Un compte Stripe Connect différent par restaurant : Stripe.js doit être chargé avec le
// bon `stripeAccount` pour pouvoir confirmer un PaymentIntent créé sur ce compte connecté.
const stripePromises = new Map<string, Promise<Stripe | null>>();

export function getStripe(stripeAccountId: string): Promise<Stripe | null> {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error(
      'VITE_STRIPE_PUBLISHABLE_KEY manquante — ajoutez-la dans .env.local (voir .env.example).',
    );
  }
  let promise = stripePromises.get(stripeAccountId);
  if (!promise) {
    promise = loadStripe(publishableKey, { stripeAccount: stripeAccountId });
    stripePromises.set(stripeAccountId, promise);
  }
  return promise;
}
