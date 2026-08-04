-- Nourevo — migration : analyse de rentabilité (optionnelle, par plat)
-- À exécuter une fois dans le SQL Editor, en plus des migrations précédentes.

alter table dishes add column if not exists cost_enabled boolean not null default false;
alter table dishes add column if not exists cost_ingredients numeric not null default 0;
alter table dishes add column if not exists cost_prep numeric not null default 0;
alter table dishes add column if not exists cost_breakdown jsonb not null default '[]'::jsonb;

-- Structure attendue pour cost_breakdown (optionnel, détail avancé par ingrédient) :
-- [{ "name": "Pain brioché", "cost": 0.8 }, { "name": "Steak haché 150g", "cost": 2.5 }, ...]
-- Quand cost_breakdown n'est pas vide, son total remplace cost_ingredients dans le calcul du coût.
