-- TableConnect NFC — migration : choix de la vidéo d'introduction par restaurant
-- À exécuter une fois dans le SQL Editor, en plus des migrations précédentes.

alter table restaurants add column if not exists intro_video text;

-- Valeur attendue : l'identifiant d'une vidéo du catalogue (voir src/lib/introVideos.ts),
-- ex. 'bistro'. NULL = vidéo par défaut.
