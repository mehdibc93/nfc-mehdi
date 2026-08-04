-- TableConnect NFC — migration : régime/allergènes, piment, calories, rupture de stock, suppléments
-- À exécuter une fois dans le SQL Editor, en plus des migrations précédentes.

alter table dishes add column if not exists diet_tags text[] not null default '{}';
alter table dishes add column if not exists allergens text[] not null default '{}';
alter table dishes add column if not exists spice_level integer not null default 0;
alter table dishes add column if not exists calories integer;
alter table dishes add column if not exists out_of_stock boolean not null default false;
alter table dishes add column if not exists extras jsonb not null default '[]'::jsonb;

-- Structure attendue pour extras : [{ "name": "Sauce fromage", "price": 2 }, ...]
