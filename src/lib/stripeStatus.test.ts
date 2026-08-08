import { describe, expect, it } from 'vitest';
import { mapStripeStatus } from './stripeStatus';

describe('mapStripeStatus', () => {
  it('traite "active" comme actif', () => {
    expect(mapStripeStatus('active')).toBe('active');
  });

  it('traite "trialing" comme actif — un restaurateur en essai gratuit garde un accès normal', () => {
    expect(mapStripeStatus('trialing')).toBe('active');
  });

  it('traite "past_due" et "unpaid" comme paiement en retard', () => {
    expect(mapStripeStatus('past_due')).toBe('past_due');
    expect(mapStripeStatus('unpaid')).toBe('past_due');
  });

  it('traite "canceled" et "incomplete_expired" comme annulé', () => {
    expect(mapStripeStatus('canceled')).toBe('canceled');
    expect(mapStripeStatus('incomplete_expired')).toBe('canceled');
  });

  it('retombe sur "inactive" pour tout statut Stripe non explicitement géré', () => {
    expect(mapStripeStatus('incomplete')).toBe('inactive');
    expect(mapStripeStatus('paused')).toBe('inactive');
  });
});
