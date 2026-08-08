import { describe, expect, it } from 'vitest';
import { nextStockQuantity } from './stock';

describe('nextStockQuantity', () => {
  it('décrémente normalement le stock', () => {
    expect(nextStockQuantity(10, 3)).toBe(7);
  });

  it('ne descend jamais en dessous de zéro, même si la quantité commandée dépasse le stock', () => {
    // Cas concret : deux commandes simultanées sur le dernier plat disponible ne doivent
    // jamais faire passer le stock en négatif (voir dossier de formation, section 11.3).
    expect(nextStockQuantity(1, 3)).toBe(0);
  });

  it('reste à zéro si le stock est déjà épuisé', () => {
    expect(nextStockQuantity(0, 1)).toBe(0);
  });
});
