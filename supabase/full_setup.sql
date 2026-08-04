-- TableConnect NFC — installation complète (schéma + traductions + statistiques)
-- À utiliser sur une base VIDE (efface d'abord toute installation précédente).
-- Colle tout ce fichier dans le SQL Editor de Supabase et clique Run, une seule fois.

-- --- Nettoyage (supprime les tables si elles existent déjà) --------------

drop table if exists dish_events cascade;
drop table if exists dishes cascade;
drop table if exists categories cascade;
drop table if exists restaurants cascade;

-- --- Extensions -----------------------------------------------------------

create extension if not exists pgcrypto;

-- --- Stockage des photos (upload direct) ---------------------------------

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos_public_read" on storage.objects;
create policy "photos_public_read" on storage.objects
  for select using (bucket_id = 'photos');

drop policy if exists "photos_owner_insert" on storage.objects;
create policy "photos_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "photos_owner_update" on storage.objects;
create policy "photos_owner_update" on storage.objects
  for update using (
    bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "photos_owner_delete" on storage.objects;
create policy "photos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- --- Stockage des vidéos (intro + animation d'attente personnalisées) ----

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 20971520, array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "videos_public_read" on storage.objects;
create policy "videos_public_read" on storage.objects
  for select using (bucket_id = 'videos');

drop policy if exists "videos_owner_insert" on storage.objects;
create policy "videos_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "videos_owner_update" on storage.objects;
create policy "videos_owner_update" on storage.objects
  for update using (
    bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "videos_owner_delete" on storage.objects;
create policy "videos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- --- Tables -----------------------------------------------------------

create table restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade unique,
  slug text unique not null,
  name text not null,
  hero_image text,
  rating numeric default 4.8,
  review_count integer default 0,
  prep_time text default '15-20 min',
  address text default '',
  tags text[] default '{}',
  translations jsonb not null default '{}'::jsonb,
  stripe_account_id text,
  stripe_onboarded boolean not null default false,
  accent_color text,
  intro_video text,
  wait_animation text,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text not null default 'inactive'
    check (subscription_status in ('inactive', 'active', 'past_due', 'canceled')),
  subscription_plan text
    check (subscription_plan is null or subscription_plan in ('monthly', 'annual_monthly', 'annual_upfront')),
  table_count integer not null default 12 check (table_count >= 1 and table_count <= 200),
  lunch_start text,
  lunch_end text,
  dinner_start text,
  dinner_end text,
  review_url text,
  service_pin text,
  opening_hours jsonb,
  lunch_enabled boolean not null default true,
  dinner_enabled boolean not null default true,
  custom_intro_video text,
  custom_wait_video text,
  pin_protected_sections text[] not null default '{}',
  created_at timestamptz default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  position integer default 0
);

create table dishes (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  description text default '',
  price numeric not null default 0,
  image text,
  images text[],
  recommended boolean default false,
  best_seller boolean default false,
  ingredients text[] default '{}',
  accompaniments text[] default '{}',
  drink text default '',
  dessert_suggestion text default '',
  position integer default 0,
  translations jsonb not null default '{}'::jsonb,
  diet_tags text[] not null default '{}',
  allergens text[] not null default '{}',
  spice_level integer not null default 0,
  calories integer,
  out_of_stock boolean not null default false,
  extras jsonb not null default '[]'::jsonb,
  cost_enabled boolean not null default false,
  cost_ingredients numeric not null default 0,
  cost_prep numeric not null default 0,
  cost_breakdown jsonb not null default '[]'::jsonb,
  service text not null default 'all_day' check (service in ('all_day', 'lunch', 'dinner')),
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  prep_time_minutes integer check (prep_time_minutes is null or prep_time_minutes >= 0)
);

create table dish_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  dish_id uuid references dishes(id) on delete set null,
  dish_name text not null,
  event_type text not null check (event_type in ('view', 'add_to_cart', 'remove_from_cart', 'purchase')),
  created_at timestamptz default now()
);

create index dish_events_restaurant_id_idx on dish_events (restaurant_id);

-- --- Row Level Security -------------------------------------------------
-- Lecture publique partout (les clients scannent une carte NFC sans être connectés).
-- Écriture réservée au propriétaire du restaurant (auth.uid() = restaurants.owner_id).

alter table restaurants enable row level security;
alter table categories enable row level security;
alter table dishes enable row level security;
alter table dish_events enable row level security;

create policy "restaurants_public_read" on restaurants
  for select using (true);

create policy "restaurants_owner_insert" on restaurants
  for insert with check (auth.uid() = owner_id);

create policy "restaurants_owner_update" on restaurants
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "restaurants_owner_delete" on restaurants
  for delete using (auth.uid() = owner_id);

-- stripe_account_id / stripe_onboarded ne doivent être modifiés que par les Edge Functions
-- (via la clé service_role) — jamais directement par le restaurateur.
create or replace function protect_stripe_columns()
returns trigger as $$
begin
  if auth.role() is distinct from 'service_role' then
    new.stripe_account_id := old.stripe_account_id;
    new.stripe_onboarded := old.stripe_onboarded;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_stripe_columns_trigger on restaurants;
create trigger protect_stripe_columns_trigger
  before update on restaurants
  for each row execute function protect_stripe_columns();

-- Même logique de protection pour les colonnes d'abonnement à la plateforme (facturation).
create or replace function protect_billing_columns()
returns trigger as $$
begin
  if auth.role() is distinct from 'service_role' then
    new.stripe_customer_id := old.stripe_customer_id;
    new.stripe_subscription_id := old.stripe_subscription_id;
    new.subscription_status := old.subscription_status;
    new.subscription_plan := old.subscription_plan;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_billing_columns_trigger on restaurants;
create trigger protect_billing_columns_trigger
  before update on restaurants
  for each row execute function protect_billing_columns();

create policy "categories_public_read" on categories
  for select using (true);

create policy "categories_owner_write" on categories
  for all using (
    exists (select 1 from restaurants r where r.id = categories.restaurant_id and r.owner_id = auth.uid())
  ) with check (
    exists (select 1 from restaurants r where r.id = categories.restaurant_id and r.owner_id = auth.uid())
  );

create policy "dishes_public_read" on dishes
  for select using (true);

create policy "dishes_owner_write" on dishes
  for all using (
    exists (
      select 1 from categories c
      join restaurants r on r.id = c.restaurant_id
      where c.id = dishes.category_id and r.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from categories c
      join restaurants r on r.id = c.restaurant_id
      where c.id = dishes.category_id and r.owner_id = auth.uid()
    )
  );

-- Écriture ouverte à tous (clients anonymes qui parcourent /r/:slug) : c'est un simple
-- journal d'usage, comme un pixel d'analytics classique.
create policy "dish_events_public_insert" on dish_events
  for insert with check (true);

-- Lecture réservée au propriétaire du restaurant concerné.
create policy "dish_events_owner_read" on dish_events
  for select using (
    exists (select 1 from restaurants r where r.id = dish_events.restaurant_id and r.owner_id = auth.uid())
  );

-- Décrémente le stock d'un plat de façon atomique (voir migration_016_stock.sql).
create or replace function decrement_dish_stock(p_dish_id uuid, p_qty integer)
returns void as $$
begin
  update dishes
  set stock_quantity = greatest(stock_quantity - p_qty, 0)
  where id = p_dish_id and stock_quantity is not null;
end;
$$ language plpgsql security definer;

grant execute on function decrement_dish_stock(uuid, integer) to anon, authenticated;

-- --- Seed : restaurant de démonstration "Le Jardin Parisien" ------------
-- owner_id reste NULL : c'est une vitrine publique, non éditable via /dashboard.

do $$
declare
  v_restaurant_id uuid;
  v_entrees_id uuid;
  v_plats_id uuid;
  v_desserts_id uuid;
  v_boissons_id uuid;
begin
  insert into restaurants (owner_id, slug, name, hero_image, rating, review_count, prep_time, address, tags)
  values (
    null,
    'le-jardin-parisien',
    'Le Jardin Parisien',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80',
    4.8,
    462,
    '15-20 min',
    '14 rue des Vertus, Paris 3e',
    array['Cuisine de saison', 'Produits frais', 'Service en salle']
  )
  returning id into v_restaurant_id;

  insert into categories (restaurant_id, name, position) values (v_restaurant_id, 'Entrées', 0) returning id into v_entrees_id;
  insert into categories (restaurant_id, name, position) values (v_restaurant_id, 'Plats', 1) returning id into v_plats_id;
  insert into categories (restaurant_id, name, position) values (v_restaurant_id, 'Desserts', 2) returning id into v_desserts_id;
  insert into categories (restaurant_id, name, position) values (v_restaurant_id, 'Boissons', 3) returning id into v_boissons_id;

  insert into dishes (category_id, name, description, price, image, images, recommended, best_seller, ingredients, accompaniments, drink, dessert_suggestion, position)
  values
    (v_entrees_id, 'Burrata crémeuse', 'Tomates anciennes, basilic frais, huile d''olive infusée.', 14, '/images/burrata.jpg', null, false, false,
      array['Burrata di bufala', 'Tomates anciennes', 'Basilic frais', 'Huile d''olive'],
      array['Focaccia chaude', 'Salade d''herbes', 'Huile basilic'],
      'Verre de Chardonnay bien frais', 'Panna cotta légère au citron', 0),
    (v_entrees_id, 'Tartare de saumon', 'Agrumes, aneth, pickles maison et crumble salé.', 16, '/images/tartare.jpg', null, true, false,
      array['Saumon frais', 'Agrumes', 'Aneth', 'Pickles maison'],
      array['Toast grillé', 'Crème citronnée', 'Salade croquante'],
      'Sancerre ou eau pétillante agrumes', 'Sorbet exotique pour finir léger', 1);

  insert into dishes (category_id, name, description, price, image, images, recommended, best_seller, ingredients, accompaniments, drink, dessert_suggestion, position)
  values
    (v_plats_id, 'Burger Gourmet', 'Brioche artisanale, cheddar affiné, sauce signature.', 21, '/images/burger.jpg',
      array['/images/burger.jpg',
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80'],
      true, true,
      array['Steak grillé', 'Cheddar affiné', 'Brioche artisanale', 'Sauce signature'],
      array['Pommes frites maison', 'Salade coleslaw', 'Sauce truffe'],
      'IPA légère ou cola artisanal', 'Fondant chocolat pour un combo signature', 0),
    (v_plats_id, 'Filet de bœuf sauce maison', 'Jus réduit, légumes rôtis et pommes grenailles.', 29, '/images/beef.jpg', null, false, true,
      array['Filet de bœuf', 'Jus réduit', 'Légumes rôtis', 'Herbes de saison'],
      array['Gratin dauphinois', 'Légumes rôtis', 'Sauce poivre'],
      'Bordeaux rouge ou mocktail intense', 'Tiramisu maison', 1),
    (v_plats_id, 'Risotto aux champignons', 'Parmesan affiné, pleurotes, huile de truffe légère.', 23, '/images/risotto.jpg',
      array['/images/risotto.jpg', 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=1200&q=80'],
      true, false,
      array['Riz arborio', 'Pleurotes', 'Parmesan affiné', 'Huile de truffe'],
      array['Parmesan affiné', 'Mesclun', 'Noisettes torréfiées'],
      'Verre de blanc minéral', 'Dessert fruité conseillé', 2);

  insert into dishes (category_id, name, description, price, image, images, recommended, best_seller, ingredients, accompaniments, drink, dessert_suggestion, position)
  values
    (v_desserts_id, 'Tiramisu maison', 'Mascarpone aérien, cacao intense et biscuits imbibés.', 11, '/images/tiramisu.jpg',
      array['/images/tiramisu.jpg', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=1200&q=80'],
      true, true,
      array['Mascarpone', 'Cacao intense', 'Biscuits imbibés', 'Crème légère'],
      array['Coulis café', 'Éclats de cacao', 'Crème légère'],
      'Espresso ou limoncello', 'Chocolat chaud maison', 0),
    (v_desserts_id, 'Fondant chocolat', 'Cœur coulant, glace vanille et éclats de noisettes.', 12, '/images/fondant.jpg', null, false, true,
      array['Chocolat noir', 'Cœur coulant', 'Glace vanille', 'Noisettes'],
      array['Glace vanille', 'Crème anglaise', 'Crumble noisette'],
      'Café gourmand ou porto', 'Ajout d''un second dessert à partager', 1);

  insert into dishes (category_id, name, description, price, image, images, recommended, best_seller, ingredients, accompaniments, drink, dessert_suggestion, position)
  values
    (v_boissons_id, 'Spritz maison', 'Aperol, prosecco et zeste d''orange, servi bien frais.', 9,
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80',
      array['https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80', '/images/spritz.jpg'],
      true, false,
      array['Aperol', 'Prosecco', 'Eau pétillante', 'Zeste d''orange'],
      array['Glaçons', 'Zeste d''orange', 'Olive verte'],
      'Un doux mélange pour prolonger l''apéritif', 'Tiramisu maison pour finir en douceur', 0),
    (v_boissons_id, 'Mocktail citrus', 'Citron vert, sirop maison et menthe fraîche, sans alcool.', 7, '/images/mocktail.jpg', null, false, false,
      array['Citron vert', 'Sirop maison', 'Eau pétillante', 'Menthe fraîche'],
      array['Glaçons', 'Rondelle de citron', 'Feuille de menthe'],
      'Servi seul, pour une fraîcheur sans alcool', 'Fondant chocolat pour contraster la fraîcheur', 1),
    (v_boissons_id, 'Vin rouge du chef', 'Sélection du sommelier, parfaite avec les viandes.', 8, '/images/wine.jpg', null, false, true,
      array['Cépage sélectionné', 'Service au verre'],
      array['Verre à vin', 'Carafe sur demande'],
      'Un second verre pour accompagner le plat', 'Tiramisu maison en accord classique', 2);
end $$;
