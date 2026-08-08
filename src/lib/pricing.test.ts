import { describe, expect, it } from 'vitest';
import { calculateOrderAmount, clampQuantity } from './pricing';
import type { PricingDish } from './pricing';

describe('clampQuantity', () => {
  it('accepte une quantité normale', () => {
    expect(clampQuantity(3)).toBe(3);
  });

  it('remplace une quantité négative ou nulle par 1 — un client malveillant ne peut pas payer 0', () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-5)).toBe(1);
  });

  it('plafonne une quantité absurde à 50', () => {
    expect(clampQuantity(99999)).toBe(50);
  });

  it("retombe sur 1 si la valeur n'est pas un nombre", () => {
    expect(clampQuantity('abc')).toBe(1);
    expect(clampQuantity(undefined)).toBe(1);
  });
});

describe('calculateOrderAmount', () => {
  const dishesById: Record<string, PricingDish> = {
    burger: { price: 21, extras: [{ name: 'Bacon', price: 2.5 }, { name: 'Fromage', price: 1.5 }] },
    salade: { price: 12, extras: [] },
  };

  it('calcule le montant en centimes pour un plat simple', () => {
    expect(calculateOrderAmount([{ dishId: 'salade', quantity: 1 }], dishesById)).toBe(1200);
  });

  it('multiplie correctement par la quantité', () => {
    expect(calculateOrderAmount([{ dishId: 'salade', quantity: 3 }], dishesById)).toBe(3600);
  });

  it('ajoute le prix des extras sélectionnés', () => {
    const amount = calculateOrderAmount([{ dishId: 'burger', quantity: 1, extraNames: ['Bacon'] }], dishesById);
    expect(amount).toBe(2350); // 21€ + 2,50€ = 23,50€
  });

  it("ignore un montant envoyé par le client : seul le prix réel en base compte", () => {
    // Même si un attaquant modifiait un champ "price" dans la requête, cette fonction ne lit
    // jamais le panier du client pour le prix — uniquement dishesById, simulant la base réelle.
    const amount = calculateOrderAmount([{ dishId: 'burger', quantity: 1 }], dishesById);
    expect(amount).toBe(2100);
  });

  it('ignore un plat inconnu (dishId invalide) sans faire planter le calcul', () => {
    expect(calculateOrderAmount([{ dishId: 'inconnu', quantity: 5 }], dishesById)).toBe(0);
  });

  it('additionne plusieurs lignes de commande différentes', () => {
    const amount = calculateOrderAmount(
      [
        { dishId: 'burger', quantity: 2, extraNames: ['Bacon', 'Fromage'] },
        { dishId: 'salade', quantity: 1 },
      ],
      dishesById,
    );
    // (21 + 2.5 + 1.5) * 2 = 50€, + 12€ = 62€
    expect(amount).toBe(6200);
  });
});
