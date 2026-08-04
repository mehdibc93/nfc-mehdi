-- TableConnect NFC — migration : choix de l'animation affichée pendant la préparation de la commande
-- À exécuter une fois dans le SQL Editor, en plus des migrations précédentes.

alter table restaurants add column if not exists wait_animation text;

-- Valeur attendue : 'chef' ou 'lottie-cooking' (voir src/lib/waitAnimations.ts). NULL = 'chef' par défaut.
