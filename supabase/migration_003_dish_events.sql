-- TableConnect NFC — migration : suivi des interactions plats (vues, ajouts, retraits, achats)
-- À exécuter une fois dans le SQL Editor (en plus de schema.sql et migration_002_translations.sql déjà exécutés).

create table if not exists dish_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  dish_id uuid references dishes(id) on delete set null,
  dish_name text not null,
  event_type text not null check (event_type in ('view', 'add_to_cart', 'remove_from_cart', 'purchase')),
  created_at timestamptz default now()
);

create index if not exists dish_events_restaurant_id_idx on dish_events (restaurant_id);

alter table dish_events enable row level security;

-- Écriture ouverte à tous (clients anonymes qui parcourent /r/:slug) : c'est un simple
-- journal d'usage, comme un pixel d'analytics classique.
drop policy if exists "dish_events_public_insert" on dish_events;
create policy "dish_events_public_insert" on dish_events
  for insert with check (true);

-- Lecture réservée au propriétaire du restaurant concerné.
drop policy if exists "dish_events_owner_read" on dish_events;
create policy "dish_events_owner_read" on dish_events
  for select using (
    exists (select 1 from restaurants r where r.id = dish_events.restaurant_id and r.owner_id = auth.uid())
  );
