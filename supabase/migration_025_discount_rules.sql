-- Nourevo — migration : réductions automatiques par jour/horaire (ex: "-10% tous les
-- mardis", "happy hour -20% de 17h à 19h"). Le prix réduit s'affiche automatiquement sur le
-- menu public et est appliqué au paiement — aucune action du client requise.
-- `days_of_week` utilise la convention JS Date.getDay() : 0=dimanche .. 6=samedi.
-- `start_time`/`end_time` au format "HH:MM" (heure de Paris) ; les deux null = toute la journée.
-- À exécuter une fois dans le SQL Editor, en plus des migrations précédentes.

create table if not exists discount_rules (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  label text not null default '',
  percent numeric not null check (percent > 0 and percent <= 100),
  days_of_week int[] not null check (cardinality(days_of_week) > 0),
  start_time text,
  end_time text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists discount_rules_restaurant_id_idx on discount_rules (restaurant_id);

alter table discount_rules enable row level security;

-- Lecture publique (le menu client doit savoir quelle réduction est active en ce moment)
-- limitée aux règles actives, comme pour les plats.
drop policy if exists "discount_rules_public_read" on discount_rules;
create policy "discount_rules_public_read" on discount_rules
  for select using (active = true);

drop policy if exists "discount_rules_owner_all" on discount_rules;
create policy "discount_rules_owner_all" on discount_rules
  for all using (
    exists (select 1 from restaurants r where r.id = discount_rules.restaurant_id and r.owner_id = auth.uid())
  ) with check (
    exists (select 1 from restaurants r where r.id = discount_rules.restaurant_id and r.owner_id = auth.uid())
  );
