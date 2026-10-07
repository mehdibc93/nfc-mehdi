-- Nourevo — migration : commandes à emporter et livraison gérée par le restaurant.
-- À exécuter une fois dans le SQL Editor (en plus des migrations précédentes déjà exécutées).

-- Réglages du restaurant (onglet Restaurant du dashboard). La commande sur place reste
-- toujours disponible ; l'emporter et la livraison sont désactivés par défaut.
alter table restaurants add column if not exists takeaway_enabled boolean not null default false;
alter table restaurants add column if not exists delivery_enabled boolean not null default false;
-- Paiement sur place autorisé (au retrait / au livreur) en plus du paiement en ligne.
alter table restaurants add column if not exists takeaway_pay_on_site boolean not null default true;
alter table restaurants add column if not exists delivery_pay_on_delivery boolean not null default false;
-- Tarification de la livraison : frais fixes, minimum de commande, et seuil à partir duquel
-- la livraison est offerte (null = jamais offerte). Montants en euros, calculés sur le
-- sous-total des plats après réduction.
alter table restaurants add column if not exists delivery_fee numeric not null default 0 check (delivery_fee >= 0);
alter table restaurants add column if not exists delivery_min_order numeric not null default 0 check (delivery_min_order >= 0);
alter table restaurants add column if not exists delivery_free_from numeric check (delivery_free_from is null or delivery_free_from >= 0);

-- Commandes : type de commande + coordonnées du client pour l'emporter / la livraison.
alter table orders add column if not exists fulfillment text not null default 'dine_in'
  check (fulfillment in ('dine_in', 'takeaway', 'delivery'));
alter table orders add column if not exists customer_name text;
alter table orders add column if not exists customer_phone text;
alter table orders add column if not exists delivery_address text;
-- Créneau demandé par le client ; null = « dès que possible ».
alter table orders add column if not exists scheduled_for timestamptz;
-- Frais de livraison inclus dans `total` (total = plats + frais).
alter table orders add column if not exists delivery_fee numeric not null default 0;

-- Nouveau statut « refused » : le restaurant refuse une commande (adresse trop loin, rupture...).
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('new', 'confirmed', 'served', 'done', 'refused'));
