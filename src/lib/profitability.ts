import type { Dish } from './types';

export type ProfitabilityTier = 'high' | 'medium' | 'low';

export const PROFITABILITY_TIER_LABEL: Record<ProfitabilityTier, string> = {
  high: 'Très rentable',
  medium: 'Correct',
  low: 'À optimiser',
};

export const PROFITABILITY_TIER_EMOJI: Record<ProfitabilityTier, string> = {
  high: '🟢',
  medium: '🟠',
  low: '🔴',
};

// Coût total = coût des matières premières (ou le détail par ingrédient s'il est renseigné)
// + coût de préparation/emballage.
export function getDishTotalCost(dish: Dish): number {
  const ingredientsCost =
    dish.costBreakdown.length > 0
      ? dish.costBreakdown.reduce((sum, item) => sum + (item.cost || 0), 0)
      : dish.costIngredients;
  return ingredientsCost + dish.costPrep;
}

export function getDishMargin(dish: Dish): number {
  return dish.price - getDishTotalCost(dish);
}

// Taux de marge = marge / prix de vente. Repère standard en restauration : un coût matière
// autour de 28-30% du prix (soit ~70% de marge) est considéré sain.
export function getDishMarginRate(dish: Dish): number {
  if (dish.price <= 0) return 0;
  return getDishMargin(dish) / dish.price;
}

export function getProfitabilityTier(marginRate: number): ProfitabilityTier {
  if (marginRate >= 0.65) return 'high';
  if (marginRate >= 0.4) return 'medium';
  return 'low';
}
