// Supabase Edge Function — envoie une notification push (Web Push) à tous les appareils
// abonnés d'un restaurant dès qu'une nouvelle commande ou demande client (serveur/addition)
// arrive. Fonctionne même si aucun onglet du dashboard n'est ouvert.
//
// Déclenchée par un Database Webhook Supabase (Database -> Webhooks) sur INSERT des tables
// `orders` et `table_requests`, configuré avec l'en-tête HTTP personnalisé
// `x-webhook-secret: <PUSH_WEBHOOK_SECRET>` pour authentifier l'appel (Supabase ne signe pas
// nativement ses Database Webhooks).
//
// ⚠️ Cette fonction doit être déployée avec la vérification JWT DÉSACTIVÉE (le webhook
// Supabase n'envoie pas de token utilisateur) : décoche "Verify JWT" lors du déploiement.
//
// Secrets requis : PUSH_WEBHOOK_SECRET (chaîne aléatoire de votre choix, à reporter dans
// l'en-tête du webhook), VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
// (ex: "mailto:contact@nourevo.com"). SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY sont déjà
// injectées automatiquement.

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

type PushNotification = { title: string; body: string };

function buildNotification(table: string, record: Record<string, unknown>): PushNotification | null {
  if (table === 'orders') {
    return { title: 'Nouvelle commande', body: `Table ${record.table_label ?? ''}` };
  }
  if (table === 'table_requests') {
    if (record.status !== 'pending') return null;
    const title = record.type === 'waiter' ? 'Un client demande un serveur' : "Demande l'addition";
    return { title, body: `Table ${record.table_label ?? ''}` };
  }
  return null;
}

Deno.serve(async (req) => {
  const secret = req.headers.get('x-webhook-secret');
  if (!secret || secret !== Deno.env.get('PUSH_WEBHOOK_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const table = payload?.table as string | undefined;
  const record = payload?.record as Record<string, unknown> | undefined;
  const restaurantId = record?.restaurant_id as string | undefined;
  if (!table || !record || !restaurantId) return new Response('ignored', { status: 200 });

  const notification = buildNotification(table, record);
  if (!notification) return new Response('ignored', { status: 200 });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('restaurant_id', restaurantId);
  if (error || !subscriptions || subscriptions.length === 0) return new Response('ok', { status: 200 });

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT')!,
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  );

  const body = JSON.stringify({ title: notification.title, body: notification.body, url: '/dashboard/service' });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, body);
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Abonnement expiré ou révoqué côté navigateur : on nettoie pour ne pas réessayer indéfiniment.
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('Envoi push échoué', sub.id, err);
        }
      }
    }),
  );

  return new Response('ok', { status: 200 });
});
