// Reflète exactement la règle SQL de decrement_dish_stock() dans
// supabase/migration_016_stock.sql : `greatest(stock_quantity - p_qty, 0)`. Dupliquée ici en
// TypeScript pur pour pouvoir tester unitairement la règle métier (jamais de stock négatif)
// sans dépendre d'une base PostgreSQL réelle — la fonction SQL reste la seule source de vérité
// exécutée en production, cette version n'est qu'une spécification testable de la même règle.

export function nextStockQuantity(current: number, quantityOrdered: number): number {
  return Math.max(current - quantityOrdered, 0);
}
