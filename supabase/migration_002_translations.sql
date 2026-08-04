-- TableConnect NFC — migration : traductions automatiques
-- À exécuter une fois dans le SQL Editor (en plus de schema.sql déjà exécuté).
-- Idempotent grâce à IF NOT EXISTS.

alter table restaurants add column if not exists translations jsonb not null default '{}'::jsonb;
alter table dishes add column if not exists translations jsonb not null default '{}'::jsonb;

-- Structure attendue :
-- restaurants.translations = { "en": { "name": "...", "address": "...", "tags": ["...", "..."] }, "es": {...}, "zh": {...}, "ru": {...} }
-- dishes.translations      = { "en": { "name": "...", "description": "..." }, "es": {...}, "zh": {...}, "ru": {...} }
