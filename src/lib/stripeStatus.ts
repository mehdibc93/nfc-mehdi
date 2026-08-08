// Reflète exactement mapStripeStatus() de supabase/functions/billing-webhook/index.ts.
// Dupliquée ici (plutôt qu'importée) car les Edge Functions sont déployées comme des fichiers
// uniques et autonomes (copiés-collés dans l'éditeur Supabase) — cette copie permet de tester
// unitairement la règle métier avec l'outillage Vitest déjà en place côté front-end, sans
// dépendre du runtime Deno. Toute modification de la règle doit être répercutée aux deux endroits.

export type StripeSubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'incomplete_expired'
  | 'incomplete'
  | 'paused';

export type NourevoSubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'inactive';

export function mapStripeStatus(status: StripeSubscriptionStatus): NourevoSubscriptionStatus {
  if (status === 'active' || status === 'trialing') return 'active';
  if (status === 'past_due' || status === 'unpaid') return 'past_due';
  if (status === 'canceled' || status === 'incomplete_expired') return 'canceled';
  return 'inactive';
}
