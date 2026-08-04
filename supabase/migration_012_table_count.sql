-- TableConnect NFC — migration : nombre de tables configurable par restaurant
-- À exécuter une fois dans le SQL Editor, en plus des migrations précédentes.

alter table restaurants add column if not exists table_count integer not null default 12
  check (table_count >= 1 and table_count <= 200);
