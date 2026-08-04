-- Nourevo — migration : menu midi / menu soir / toute la journée
-- À exécuter une fois dans le SQL Editor, en plus des migrations précédentes.

-- Horaires optionnels du restaurant (format 'HH:MM'). Tant qu'ils ne sont pas renseignés,
-- aucun filtrage par horaire n'est appliqué côté client (comportement actuel inchangé).
alter table restaurants add column if not exists lunch_start text;
alter table restaurants add column if not exists lunch_end text;
alter table restaurants add column if not exists dinner_start text;
alter table restaurants add column if not exists dinner_end text;

-- Créneau auquel appartient un plat. 'all_day' (par défaut) = visible tout le temps.
alter table dishes add column if not exists service text not null default 'all_day'
  check (service in ('all_day', 'lunch', 'dinner'));
