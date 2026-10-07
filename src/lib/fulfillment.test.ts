import { describe, expect, it } from 'vitest';
import { buildPickupSlots, canOrderAsap, deliveryFeeFor, meetsDeliveryMinimum } from './fulfillment';
import type { OpeningHours } from './types';

const pricing = { deliveryFee: 3, deliveryMinOrder: 15, deliveryFreeFrom: 40 };

const hours = (open: string, close: string, closed = false): OpeningHours => {
  const day = { closed, open, close };
  return { mon: day, tue: day, wed: day, thu: day, fri: day, sat: day, sun: day };
};

// Mercredi 7 octobre 2026, heure locale.
const at = (h: number, m: number) => new Date(2026, 9, 7, h, m);

describe('deliveryFeeFor', () => {
  it('applique les frais fixes sous le seuil de gratuité', () => {
    expect(deliveryFeeFor(25, pricing)).toBe(3);
  });

  it('offre la livraison à partir du seuil', () => {
    expect(deliveryFeeFor(40, pricing)).toBe(0);
  });

  it('ne rend jamais la livraison gratuite sans seuil configuré', () => {
    expect(deliveryFeeFor(500, { ...pricing, deliveryFreeFrom: null })).toBe(3);
  });
});

describe('meetsDeliveryMinimum', () => {
  it('refuse une commande sous le minimum', () => {
    expect(meetsDeliveryMinimum(14.99, pricing)).toBe(false);
    expect(meetsDeliveryMinimum(15, pricing)).toBe(true);
  });
});

describe('créneaux de retrait / livraison', () => {
  it('propose des créneaux de 15 min après le temps de préparation, jusqu’à la fermeture', () => {
    const slots = buildPickupSlots(hours('11:00', '14:00'), at(12, 50));
    expect(slots.map((slot) => slot.label)).toEqual(['13:15', '13:30', '13:45', '14:00']);
  });

  it('commence à l’ouverture si le restaurant n’est pas encore ouvert', () => {
    const slots = buildPickupSlots(hours('11:00', '12:00'), at(8, 0));
    expect(slots[0].label).toBe('11:00');
    expect(canOrderAsap(hours('11:00', '12:00'), at(8, 0))).toBe(false);
  });

  it('gère un service qui traverse minuit', () => {
    const slots = buildPickupSlots(hours('18:00', '00:30'), at(23, 50));
    expect(slots.map((slot) => slot.label)).toEqual(['00:15', '00:30']);
    expect(new Date(slots[0].iso).getDate()).toBe(8);
  });

  it('ne propose rien un jour de fermeture', () => {
    expect(buildPickupSlots(hours('11:00', '22:00', true), at(12, 0))).toEqual([]);
    expect(canOrderAsap(hours('11:00', '22:00', true), at(12, 0))).toBe(false);
  });

  it('sans horaires configurés, reste ouvert toute la journée', () => {
    expect(canOrderAsap(null, at(12, 0))).toBe(true);
    expect(buildPickupSlots(null, at(23, 0)).map((slot) => slot.label)).toEqual(['23:30', '23:45']);
  });
});
