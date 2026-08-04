-- TableConnect NFC — migration : couleur des boutons personnalisable par restaurant
-- À exécuter une fois dans le SQL Editor, en plus des migrations précédentes.

alter table restaurants add column if not exists accent_color text;

-- Valeur attendue : un code hexadécimal, ex. '#1c2f47'. NULL = couleur par défaut (bleu marine).
