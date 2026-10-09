// Calculs du simulateur « Combien vous coûte une plateforme de livraison ? » (page d'accueil).
// Les montants viennent des chiffres saisis par le restaurateur lui-même.

/** Commission mensuelle (en euros, arrondie à l'euro) prélevée sur un chiffre d'affaires donné. */
export function monthlyCommission(monthlyRevenue: number, commissionPercent: number): number {
  if (!Number.isFinite(monthlyRevenue) || !Number.isFinite(commissionPercent)) return 0;
  const revenue = Math.max(0, monthlyRevenue);
  const percent = Math.min(100, Math.max(0, commissionPercent));
  return Math.round((revenue * percent) / 100);
}

/**
 * « 12 600 € » — formatage fait à la main plutôt qu'avec Intl.NumberFormat : le séparateur de
 * milliers d'Intl (espace insécable fine) peut différer entre Node (pré-rendu) et le navigateur,
 * ce qui provoquerait un écart d'hydratation.
 */
export function formatEuros(amount: number): string {
  const rounded = Math.round(amount);
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${rounded < 0 ? '-' : ''}${digits} €`;
}
