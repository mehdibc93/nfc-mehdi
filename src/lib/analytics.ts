import { supabase } from './supabaseClient';

export type DishEventType = 'view' | 'add_to_cart' | 'remove_from_cart' | 'purchase';

export type DishEventRow = {
  id: string;
  dish_id: string | null;
  dish_name: string;
  event_type: DishEventType;
  created_at: string;
};

// Fire-and-forget : un événement d'usage ne doit jamais bloquer ni casser l'expérience client.
export function logDishEvent(
  restaurantId: string,
  dishId: string | null,
  dishName: string,
  eventType: DishEventType,
) {
  supabase
    .from('dish_events')
    .insert({ restaurant_id: restaurantId, dish_id: dishId, dish_name: dishName, event_type: eventType })
    .then(
      () => {},
      () => {},
    );
}
