// Reflète exactement la boucle de calcul de supabase/functions/create-payment-intent/index.ts
// (recalcul serveur du montant à payer, jamais confiance en une valeur envoyée par le client).
// Dupliquée ici pour la même raison que stripeStatus.ts : déploiement en fichier unique côté
// Edge Function, testabilité côté Vitest ici. Toute modification doit être répercutée aux deux
// endroits — voir le dossier de formation, section 17, pour cette limite assumée.

export type PricingExtra = { name: string; price: number };
export type PricingDish = { price: number; extras: PricingExtra[] };
export type PricingCartItem = { dishId: string; quantity?: number; extraNames?: string[] };

// Borne la quantité entre 1 et 50, comme côté serveur — évite qu'une valeur absurde ou
// négative envoyée par un client malveillant ne produise un montant incohérent.
export function clampQuantity(quantity: unknown): number {
  return Math.max(1, Math.min(50, Math.trunc(Number(quantity)) || 1));
}

// Calcule le montant total en centimes à partir des prix réels des plats (jamais du panier
// envoyé par le client) et des extras sélectionnés.
export function calculateOrderAmount(items: PricingCartItem[], dishesById: Record<string, PricingDish>): number {
  let amount = 0;
  for (const item of items) {
    const dish = dishesById[item.dishId];
    if (!dish) continue;

    const quantity = clampQuantity(item.quantity);
    let unitPrice = Number(dish.price) || 0;

    for (const extraName of item.extraNames ?? []) {
      const match = dish.extras.find((extra) => extra.name === extraName);
      if (match) unitPrice += Number(match.price) || 0;
    }

    amount += Math.round(unitPrice * 100) * quantity;
  }
  return amount;
}
