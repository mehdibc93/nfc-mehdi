alter table restaurants add column if not exists lunch_enabled boolean not null default true;
alter table restaurants add column if not exists dinner_enabled boolean not null default true;
