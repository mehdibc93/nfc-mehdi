-- TableConnect NFC — migration : Mode Service (commandes en direct + demandes clients)
-- À exécuter une fois dans le SQL Editor (en plus des migrations précédentes déjà exécutées).

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_label text not null,
  status text not null default 'new' check (status in ('new', 'confirmed', 'served', 'done')),
  paid boolean not null default false,
  total numeric not null default 0,
  items jsonb not null default '[]'::jsonb,
  special_instructions text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_restaurant_id_idx on orders (restaurant_id);

alter table orders enable row level security;

-- Écriture ouverte à tous : le client passe commande sans être connecté.
drop policy if exists "orders_public_insert" on orders;
create policy "orders_public_insert" on orders
  for insert with check (true);

-- Lecture et mise à jour du statut réservées au propriétaire du restaurant (page /service).
drop policy if exists "orders_owner_read" on orders;
create policy "orders_owner_read" on orders
  for select using (
    exists (select 1 from restaurants r where r.id = orders.restaurant_id and r.owner_id = auth.uid())
  );

drop policy if exists "orders_owner_update" on orders;
create policy "orders_owner_update" on orders
  for update using (
    exists (select 1 from restaurants r where r.id = orders.restaurant_id and r.owner_id = auth.uid())
  );

create table if not exists table_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_label text not null,
  type text not null check (type in ('bill', 'waiter')),
  status text not null default 'pending' check (status in ('pending', 'handled')),
  created_at timestamptz not null default now()
);

create index if not exists table_requests_restaurant_id_idx on table_requests (restaurant_id);

alter table table_requests enable row level security;

drop policy if exists "table_requests_public_insert" on table_requests;
create policy "table_requests_public_insert" on table_requests
  for insert with check (true);

drop policy if exists "table_requests_owner_read" on table_requests;
create policy "table_requests_owner_read" on table_requests
  for select using (
    exists (select 1 from restaurants r where r.id = table_requests.restaurant_id and r.owner_id = auth.uid())
  );

drop policy if exists "table_requests_owner_update" on table_requests;
create policy "table_requests_owner_update" on table_requests
  for update using (
    exists (select 1 from restaurants r where r.id = table_requests.restaurant_id and r.owner_id = auth.uid())
  );

-- Active le temps réel (Supabase Realtime) sur ces deux tables, pour que la page /service
-- reçoive les nouvelles commandes/demandes sans avoir à rafraîchir.
-- Si cette ligne échoue ("already member of publication"), c'est déjà activé, tu peux l'ignorer.
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table table_requests;
