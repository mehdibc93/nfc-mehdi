import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { playChime } from '../lib/notificationSound';
import { requestNotificationPermission, showBrowserNotification } from '../lib/browserNotify';
import { areNotificationsEnabled } from '../lib/notificationPrefs';
import { useDt } from '../lib/dashboardLocale';

type NotifiedRestaurant = { id: string; name: string } | null | undefined;

// À appeler dans n'importe quelle page du dashboard restaurateur : joue un son et affiche une
// notification système dès qu'une commande ou une demande client arrive pour ce restaurant —
// tant que cette page reste ouverte quelque part (même en arrière-plan), pas besoin de garder
// Mode Service au premier plan pour être prévenu.
export function useOrderNotifications(restaurant: NotifiedRestaurant) {
  const dt = useDt();

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!restaurant) return undefined;
    const restaurantName = restaurant.name;
    const channel = supabase
      .channel(`notify-orders-${restaurant.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
        (payload) => {
          if (!areNotificationsEnabled()) return;
          const tableLabel = (payload.new as { table_label?: string }).table_label ?? '';
          playChime();
          showBrowserNotification(
            dt('Nouvelle commande', 'New order'),
            `${dt('Table', 'Table')} ${tableLabel} — ${restaurantName}`,
          );
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'table_requests', filter: `restaurant_id=eq.${restaurant.id}` },
        (payload) => {
          const request = payload.new as { table_label?: string; type?: string; status?: string };
          if (request.status !== 'pending' || !areNotificationsEnabled()) return;
          playChime();
          showBrowserNotification(
            request.type === 'waiter' ? dt('Un client demande un serveur', 'A customer is requesting a waiter') : dt("Demande l'addition", 'Bill requested'),
            `${dt('Table', 'Table')} ${request.table_label ?? ''} — ${restaurantName}`,
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // `dt` change d'identité à chaque rendu (voir useDt) : l'exclure évite de resouscrire au
    // canal Realtime en boucle. La langue affichée dans la notification reste donc celle en
    // vigueur au moment de la souscription, pas nécessairement la toute dernière si elle a
    // changé entre-temps — acceptable pour un réglage modifié rarement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id, restaurant?.name]);
}
