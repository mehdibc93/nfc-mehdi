-- Nourevo — migration : pourboires (paiement en ligne uniquement).
-- À exécuter une fois dans le SQL Editor (en plus des migrations précédentes déjà exécutées).

-- Réglages du restaurant : pourboires activés + pourcentages proposés au client.
alter table restaurants add column if not exists tips_enabled boolean not null default false;
alter table restaurants add column if not exists tip_percentages integer[] not null default '{5,10,15}';

-- Pourboire d'une commande, en euros, compté À PART de `total` (le chiffre d'affaires reste
-- celui des plats). Il peut être donné au paiement, puis complété après le repas.
alter table orders add column if not exists tip_amount numeric not null default 0 check (tip_amount >= 0);
-- Paiements Stripe de pourboire « après le repas » déjà comptés (évite de compter deux fois
-- le même paiement — voir supabase/functions/record-tip).
alter table orders add column if not exists tip_payment_intents text[] not null default '{}';
