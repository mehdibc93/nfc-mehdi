import { supabase } from './supabaseClient';
import type { OrderItem, OrderStatus, RequestType } from './types';

// L'écriture de la commande elle-même ne doit jamais bloquer ni casser l'expérience client si
// elle échoue : les erreurs sont avalées, seul l'id (utile pour suivre le statut en direct
// ensuite) est renvoyé quand l'insertion réussit.
//
// L'id est généré côté client (plutôt que relu via `.select()` après l'insertion) car la
// politique RLS de la table `orders` autorise l'écriture publique mais pas la lecture — un
// client anonyme ne peut pas relire la ligne qu'il vient d'insérer.
export async function placeOrder(
  restaurantId: string,
  tableLabel: string,
  items: OrderItem[],
  total: number,
  paid: boolean,
  specialInstructions: string,
  stockDecrements: { dishId: string; quantity: number }[] = [],
): Promise<string | null> {
  const orderId = crypto.randomUUID();
  const { error } = await supabase.from('orders').insert({
    id: orderId,
    restaurant_id: restaurantId,
    table_label: tableLabel,
    paid,
    total,
    items,
    special_instructions: specialInstructions,
  });
  if (error) return null;

  // Décrémente le stock des plats suivis (voir migration_016_stock.sql). Fonction RPC atomique
  // côté base, appelée en fire-and-forget comme le reste de cette fonction.
  stockDecrements.forEach(({ dishId, quantity }) => {
    supabase.rpc('decrement_dish_stock', { p_dish_id: dishId, p_qty: quantity }).then(
      () => {},
      () => {},
    );
  });

  return orderId;
}

// Interroge le statut réel d'une commande (via une Edge Function qui ne renvoie que ce champ,
// jamais le total ni les autres commandes — voir supabase/functions/get-order-status).
export async function getOrderStatus(orderId: string): Promise<OrderStatus | null> {
  const { data, error } = await supabase.functions.invoke<{ status?: OrderStatus; error?: string }>(
    'get-order-status',
    { body: { orderId } },
  );
  if (error || !data?.status) return null;
  return data.status;
}

export function sendTableRequest(restaurantId: string, tableLabel: string, type: RequestType) {
  supabase
    .from('table_requests')
    .insert({ restaurant_id: restaurantId, table_label: tableLabel, type })
    .then(
      () => {},
      () => {},
    );
}
