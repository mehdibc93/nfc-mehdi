-- Mode d'accès restreint : au lieu d'un vrai système de comptes/rôles (chantier plus lourd),
-- le patron choisit quelles zones du dashboard peuvent être ouvertes avec le seul code PIN
-- (service_pin, voir migration_017), sans connexion complète.

alter table restaurants add column if not exists staff_mode_enabled boolean not null default false;
alter table restaurants add column if not exists pin_protected_sections text[] not null default '{}';
