-- TableConnect NFC — schéma Supabase (Postgres)
-- À exécuter une fois dans le SQL Editor du projet Supabase (supabase.com -> votre projet -> SQL Editor).
-- Idempotent : peut être relancé sans dupliquer les tables (mais le seed en bas insère
-- toujours de nouvelles lignes s'il est relancé — voir note en bas de fichier).

create extension if not exists pgcrypto;

-- --- Tables -----------------------------------------------------------

create table if not exists restaurants (
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
  created_at timestamptz default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  position integer default 0
);

create table if not exists dishes (
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
  extras jsonb not null default '[]'::jsonb
);

-- --- Row Level Security -------------------------------------------------
-- Lecture publique partout (les clients scannent une carte NFC sans être connectés).
-- Écriture réservée au propriétaire du restaurant (auth.uid() = restaurants.owner_id).

alter table restaurants enable row level security;
alter table categories enable row level security;
alter table dishes enable row level security;

drop policy if exists "restaurants_public_read" on restaurants;
create policy "restaurants_public_read" on restaurants
  for select using (true);

drop policy if exists "restaurants_owner_insert" on restaurants;
create policy "restaurants_owner_insert" on restaurants
  for insert with check (auth.uid() = owner_id);

drop policy if exists "restaurants_owner_update" on restaurants;
create policy "restaurants_owner_update" on restaurants
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "restaurants_owner_delete" on restaurants;
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

drop policy if exists "categories_public_read" on categories;
create policy "categories_public_read" on categories
  for select using (true);

drop policy if exists "categories_owner_write" on categories;
create policy "categories_owner_write" on categories
  for all using (
    exists (select 1 from restaurants r where r.id = categories.restaurant_id and r.owner_id = auth.uid())
  ) with check (
    exists (select 1 from restaurants r where r.id = categories.restaurant_id and r.owner_id = auth.uid())
  );

drop policy if exists "dishes_public_read" on dishes;
create policy "dishes_public_read" on dishes
  for select using (true);

drop policy if exists "dishes_owner_write" on dishes;
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

-- --- Seed : restaurant de démonstration "Le Jardin Parisien" ------------
-- owner_id reste NULL : c'est une vitrine publique, non éditable via /dashboard
-- (aucun compte n'en est propriétaire). Ne relancez ce bloc qu'une fois —
-- si vous le relancez, supprimez d'abord la ligne existante
-- (delete from restaurants where slug = 'le-jardin-parisien';) sinon vous aurez un conflit de slug.

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
