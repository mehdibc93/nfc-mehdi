// Avis de restaurateurs affichés sur la page d'accueil (section « Ils utilisent Nourevo »).
// La section reste masquée tant que la liste est vide.
//
// UNIQUEMENT de vrais avis, recueillis auprès de restaurateurs clients, avec leur accord écrit
// pour la publication (nom, établissement, photo). Publier de faux avis est une pratique
// commerciale trompeuse (Code de la consommation, art. L121-2 et suivants).
//
// Photo : déposer le fichier dans public/images/avis/ (carré, ~400 px) et indiquer son chemin,
// par exemple '/images/avis/prenom.jpg'. Sans photo, l'initiale du prénom est affichée.

export type Testimonial = {
  /** L'avis, tel que le restaurateur l'a formulé (sans guillemets, ils sont ajoutés à l'affichage). */
  quote: string;
  /** Prénom et nom, ou prénom et initiale du nom. */
  name: string;
  /** Fonction, par exemple « Gérant » ou « Chef et propriétaire ». */
  role: string;
  restaurant: string;
  city?: string;
  photo?: string;
  /** Depuis quand il utilise Nourevo, par exemple « Client depuis mars 2027 ». */
  since?: string;
};

export const TESTIMONIALS: Testimonial[] = [];
