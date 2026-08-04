-- Nourevo — migration : code PIN à 4 chiffres pour quitter le Mode Service
-- (empêche un serveur qui utilise la tablette de retourner au dashboard complet — chiffre
-- d'affaires, menu, facturation — sans connaître le code). Facultatif : si non renseigné,
-- aucun verrou n'est appliqué.
-- À exécuter une fois dans le SQL Editor, en plus des migrations précédentes.

alter table restaurants add column if not exists service_pin text;
