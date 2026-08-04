-- Nourevo — migration : lien pour laisser un avis (Google, TripAdvisor...), proposé au client
-- pendant l'écran d'attente. Facultatif.
-- À exécuter une fois dans le SQL Editor, en plus des migrations précédentes.

alter table restaurants add column if not exists review_url text;
