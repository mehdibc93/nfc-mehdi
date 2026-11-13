// Avis de restaurateurs affichés sur le site (accueil, Tarifs, Avantages).
// La section reste masquée tant que la liste est vide.
//
// UNIQUEMENT de vrais avis, recueillis auprès de restaurateurs, avec leur accord pour la
// publication. Publier de faux avis est une pratique commerciale trompeuse (Code de la
// consommation, art. L121-2 et suivants). Un avis peut être anonyme (sans nom ni établissement),
// mais les mots doivent rester ceux du restaurateur.
//
// Photo : déposer le fichier dans public/images/avis/ (carré, ~400 px) et indiquer son chemin,
// par exemple '/images/avis/prenom.jpg'. Sans photo, l'initiale du prénom (ou 🍽️) est affichée.

export type Testimonial = {
  /** L'avis, tel que le restaurateur l'a formulé (sans guillemets, ils sont ajoutés à l'affichage). */
  quote: string;
  /** Prénom et nom, ou prénom et initiale du nom. Vide : avis anonyme (« Restaurateur »). */
  name?: string;
  /** Fonction ou contexte, par exemple « Gérant » ou « A testé Nourevo dans son restaurant ». */
  role: string;
  /** Nom de l'établissement : à n'ajouter qu'avec l'accord du restaurateur. */
  restaurant?: string;
  city?: string;
  photo?: string;
  /** Depuis quand il utilise Nourevo, par exemple « Client depuis mars 2027 ». */
  since?: string;
};

// Retours de restaurateurs ayant testé Nourevo (phase de test, automne 2026), publiés sans le nom
// de leur établissement pour l'instant.
export const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'Ça me facilite vraiment la journée.',
    role: 'A testé Nourevo dans son restaurant',
  },
  {
    quote: 'Avec ça, on se démarque de plusieurs restaurants.',
    role: 'A testé Nourevo dans son restaurant',
  },
];
