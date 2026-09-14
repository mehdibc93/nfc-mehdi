-- Nourevo — migration : notifications push (Web Push) pour les commandes et demandes client.
-- Une ligne = un appareil/navigateur abonné pour un restaurant donné (un restaurateur peut
-- avoir plusieurs appareils abonnés — tablette de service + téléphone perso, par ex.).
-- L'Edge Function send-push lit cette table avec la clé service_role (bypass RLS) pour
-- envoyer les notifications ; le client ne fait que s'abonner/se désabonner lui-même.
-- À exécuter une fois dans le SQL Editor, en plus des migrations précédentes.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_restaurant_id_idx on push_subscriptions (restaurant_id);

alter table push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_owner_all" on push_subscriptions;
create policy "push_subscriptions_owner_all" on push_subscriptions
  for all using (
    exists (select 1 from restaurants r where r.id = push_subscriptions.restaurant_id and r.owner_id = auth.uid())
  ) with check (
    exists (select 1 from restaurants r where r.id = push_subscriptions.restaurant_id and r.owner_id = auth.uid())
  );
