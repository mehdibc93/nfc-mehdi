// Abonnement de cet appareil/navigateur aux notifications push (Web Push) d'un restaurant.
// Contrairement à `notificationPrefs.ts` (son + popup, uniquement tant qu'un onglet du
// dashboard reste ouvert), ceci fonctionne même dashboard fermé : le navigateur reçoit le
// push et affiche la notification via `public/sw.js`, déclenché côté serveur par l'Edge
// Function send-push sur chaque nouvelle commande / demande client.

import { supabase } from './supabaseClient';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    Boolean(VAPID_PUBLIC_KEY)
  );
}

export type PushState = 'subscribed' | 'unsubscribed' | 'unsupported';

export async function getPushSubscriptionState(): Promise<PushState> {
  if (!isPushSupported()) return 'unsupported';
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  return subscription ? 'subscribed' : 'unsubscribed';
}

export async function subscribeToPush(restaurantId: string): Promise<void> {
  if (!isPushSupported()) throw new Error('unsupported');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('permission-denied');

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error('invalid-subscription');

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      restaurant_id: restaurantId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    { onConflict: 'endpoint' },
  );
  if (error) throw error;
}

export async function unsubscribeFromPush(restaurantId: string): Promise<void> {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await supabase.from('push_subscriptions').delete().eq('restaurant_id', restaurantId).eq('endpoint', endpoint);
}
