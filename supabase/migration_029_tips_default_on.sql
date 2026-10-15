-- Nourevo — migration : pourboires activés par défaut pour tous les restaurants.
-- À exécuter une fois dans le SQL Editor (après migration_028_tips.sql).
-- Chaque restaurateur peut toujours les désactiver (Dashboard > Restaurant > Pourboires).

alter table restaurants alter column tips_enabled set default true;
update restaurants set tips_enabled = true;
