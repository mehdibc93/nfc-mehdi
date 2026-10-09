// Pourboires : uniquement avec le paiement en ligne. Mêmes bornes que
// supabase/functions/create-payment-intent, qui fait foi pour le montant réellement facturé.
export const MAX_TIP = 200;
// Montant minimum d'un paiement Stripe en euros : un pourboire « après le repas » est un
// paiement à part, il ne peut donc pas être plus petit.
export const MIN_SEPARATE_TIP = 0.5;
export const DEFAULT_TIP_PERCENTAGES = [5, 10, 15];

const toCents = (value: number) => Math.round(value * 100) / 100;

/** Pourboire en euros pour un pourcentage du montant de la commande, arrondi au centime. */
export function tipFromPercent(base: number, percent: number): number {
  if (base <= 0 || percent <= 0) return 0;
  // Calcul en centimes entiers : 27,90 € × 15 % = 4,185 € doit donner 4,19 € et non 4,18 €
  // (27.9 * 15 vaut 418.4999… en virgule flottante).
  const baseCents = Math.round(base * 100);
  return Math.round((baseCents * percent) / 100) / 100;
}

/** Montant libre saisi par le client (« 2,50 » ou « 2.5 ») ; null si invalide. */
export function parseTipInput(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (normalized === '') return 0;
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return amount > MAX_TIP ? null : toCents(amount);
}

/** Pourcentages configurés par le restaurant : entiers 1–50, sans doublon, triés. */
export function normalizeTipPercentages(values: number[]): number[] {
  const cleaned = values.filter((value) => Number.isInteger(value) && value >= 1 && value <= 50);
  return [...new Set(cleaned)].sort((a, b) => a - b);
}
