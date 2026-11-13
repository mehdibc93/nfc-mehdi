-- Nourevo — migration : envoi des cartes NFC aux restaurants abonnés.
-- À exécuter une fois dans le SQL Editor (en plus des migrations précédentes déjà exécutées).
--
-- Le restaurateur indique depuis son tableau de bord où envoyer ses cartes (contact, téléphone,
-- adresse). Table SÉPARÉE de `restaurants`, car `restaurants` est lisible publiquement (la carte
-- client) : le téléphone et l'adresse d'envoi ne doivent être visibles que par le restaurateur.
-- Vous, vous les voyez dans Supabase › Table Editor › nfc_shipments.

create table if not exists nfc_shipments (
  restaurant_id uuid primary key references restaurants(id) on delete cascade,
  contact_name text not null,
  phone text not null,
  address_line1 text not null,
  address_line2 text not null default '',
  postal_code text not null,
  city text not null,
  country text not null default 'France',
  cards_count integer not null default 1 check (cards_count between 1 and 200),
  notes text not null default '',
  -- to_ship : à préparer · shipped : expédiées (à passer à la main quand vous postez les cartes).
  status text not null default 'to_ship' check (status in ('to_ship', 'shipped')),
  shipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table nfc_shipments enable row level security;

-- Seul le propriétaire du restaurant lit et renseigne son adresse d'envoi.
drop policy if exists "nfc_shipments_owner_read" on nfc_shipments;
create policy "nfc_shipments_owner_read" on nfc_shipments
  for select using (
    exists (select 1 from restaurants r where r.id = nfc_shipments.restaurant_id and r.owner_id = auth.uid())
  );

drop policy if exists "nfc_shipments_owner_insert" on nfc_shipments;
create policy "nfc_shipments_owner_insert" on nfc_shipments
  for insert with check (
    status = 'to_ship'
    and exists (select 1 from restaurants r where r.id = nfc_shipments.restaurant_id and r.owner_id = auth.uid())
  );

-- Modifiable tant que les cartes ne sont pas parties ; le statut reste « à envoyer ».
drop policy if exists "nfc_shipments_owner_update" on nfc_shipments;
create policy "nfc_shipments_owner_update" on nfc_shipments
  for update using (
    status = 'to_ship'
    and exists (select 1 from restaurants r where r.id = nfc_shipments.restaurant_id and r.owner_id = auth.uid())
  ) with check (status = 'to_ship');
