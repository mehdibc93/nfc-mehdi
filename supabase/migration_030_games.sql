-- Nourevo — migration : salle de jeux (réglages du restaurant + mesure d'utilisation).
-- À exécuter une fois dans le SQL Editor (en plus des migrations précédentes déjà exécutées).

-- Le restaurateur peut couper la salle de jeux, ou masquer certains jeux.
alter table restaurants add column if not exists games_enabled boolean not null default true;
alter table restaurants add column if not exists games_hidden text[] not null default '{}';

-- Utilisation : ouverture de la salle (« open ») et lancement d'un jeu (« start »).
-- Aucune donnée personnelle : ni prénom, ni table.
create table if not exists game_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  game text not null,
  event text not null check (event in ('open', 'start')),
  created_at timestamptz not null default now()
);

create index if not exists game_events_restaurant_created_idx on game_events (restaurant_id, created_at desc);

alter table game_events enable row level security;

-- Les clients ne sont pas connectés : écriture publique, comme dish_events.
drop policy if exists "game_events_public_insert" on game_events;
create policy "game_events_public_insert" on game_events
  for insert with check (true);

-- Lecture réservée au propriétaire du restaurant concerné.
drop policy if exists "game_events_owner_read" on game_events;
create policy "game_events_owner_read" on game_events
  for select using (
    exists (select 1 from restaurants r where r.id = game_events.restaurant_id and r.owner_id = auth.uid())
  );
