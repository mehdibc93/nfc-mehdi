import type { DayHours, Fulfillment, OpeningHours } from './types';

// Type de commande (sur place, à emporter, livraison gérée par le restaurant) : voir types.ts.
export type { Fulfillment };

export type DeliveryPricing = {
  deliveryFee: number;
  deliveryMinOrder: number;
  deliveryFreeFrom: number | null;
};

// Frais de livraison pour un sous-total donné (plats après réduction). Même règle que
// supabase/functions/create-payment-intent, qui fait foi pour le montant réellement facturé.
export function deliveryFeeFor(subtotal: number, pricing: DeliveryPricing): number {
  if (pricing.deliveryFreeFrom !== null && subtotal >= pricing.deliveryFreeFrom) return 0;
  return Math.max(0, pricing.deliveryFee);
}

export function meetsDeliveryMinimum(subtotal: number, pricing: DeliveryPricing): boolean {
  return subtotal >= pricing.deliveryMinOrder;
}

export type PickupSlot = { iso: string; label: string };

// Date.getDay() renvoie 0 pour dimanche, 1 pour lundi, etc.
const JS_DAY_TO_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

// Plage d'ouverture du jour en minutes depuis minuit ; la fin peut dépasser 1440 pour un
// créneau qui traverse minuit (ex : 18:00 -> 01:00). Sans horaires configurés, on considère
// le restaurant ouvert toute la journée (comportement rétrocompatible de getOpenStatus).
function todayWindow(openingHours: OpeningHours | null, now: Date): { start: number; end: number } | null {
  if (!openingHours) return { start: 0, end: 24 * 60 - 1 };
  const today: DayHours | undefined = openingHours[JS_DAY_TO_KEY[now.getDay()]];
  if (!today || today.closed) return null;
  const start = parseTimeToMinutes(today.open);
  const end = parseTimeToMinutes(today.close);
  if (start === null || end === null) return null;
  return { start, end: end >= start ? end : end + 24 * 60 };
}

/** « Dès que possible » n'a de sens que si le restaurant est ouvert en ce moment. */
export function canOrderAsap(openingHours: OpeningHours | null, now: Date = new Date()): boolean {
  const window = todayWindow(openingHours, now);
  if (!window) return false;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= window.start && nowMinutes <= window.end;
}

/**
 * Créneaux de retrait/livraison pour aujourd'hui, par pas de `stepMinutes`, entre
 * maintenant + `leadMinutes` (temps de préparation minimum) et l'heure de fermeture.
 */
export function buildPickupSlots(
  openingHours: OpeningHours | null,
  now: Date = new Date(),
  leadMinutes = 20,
  stepMinutes = 15,
): PickupSlot[] {
  const window = todayWindow(openingHours, now);
  if (!window) return [];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const earliest = Math.max(window.start, nowMinutes + leadMinutes);
  const first = Math.ceil(earliest / stepMinutes) * stepMinutes;
  const slots: PickupSlot[] = [];
  for (let minutes = first; minutes <= window.end; minutes += stepMinutes) {
    // Minutes > 59 normalisées par Date en heure locale (passage à minuit et heure d'été inclus).
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, minutes);
    slots.push({
      iso: date.toISOString(),
      label: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
    });
  }
  return slots;
}

export function formatSlotTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
