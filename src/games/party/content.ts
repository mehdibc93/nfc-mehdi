// Contenu des jeux d'ambiance (en français). Tout est pensé pour un repas au restaurant :
// léger, sans alcool ni sujet qui fâche.

export const FOREHEAD_DECKS: { id: string; emoji: string; label: string; words: string[] }[] = [
  {
    id: 'animaux',
    emoji: '🦁',
    label: 'Animaux',
    words: ['Girafe', 'Pingouin', 'Kangourou', 'Escargot', 'Dauphin', 'Hérisson', 'Crocodile', 'Paon', 'Panda', 'Chameau', 'Pieuvre', 'Flamant rose', 'Koala', 'Perroquet', 'Zèbre', 'Requin', 'Chauve-souris', 'Tortue', 'Écureuil', 'Hibou', 'Grenouille', 'Hippopotame', 'Abeille', 'Lama', 'Morse'],
  },
  {
    id: 'cuisine',
    emoji: '🍝',
    label: 'À table !',
    words: ['Raclette', 'Sushi', 'Crêpe', 'Pizza', 'Couscous', 'Croissant', 'Tacos', 'Fondue', 'Macaron', 'Hamburger', 'Paella', 'Ratatouille', 'Tiramisu', 'Bouillabaisse', 'Croque-monsieur', 'Quiche', 'Lasagnes', 'Kebab', 'Éclair au chocolat', 'Barbe à papa', 'Pop-corn', 'Gaufre', 'Omelette', 'Ramen', 'Churros'],
  },
  {
    id: 'metiers',
    emoji: '👩‍🚒',
    label: 'Métiers',
    words: ['Pompier', 'Dentiste', 'Boulanger', 'Astronaute', 'Plombier', 'Coiffeur', 'Pilote', 'Magicien', 'Facteur', 'Chirurgien', 'Serveur', 'Jardinier', 'Professeur', 'Vétérinaire', 'Policier', 'Chef cuisinier', 'Clown', 'Photographe', 'Architecte', 'Maître-nageur', 'DJ', 'Arbitre', 'Pâtissier', 'Mécanicien', 'Chauffeur de taxi'],
  },
  {
    id: 'objets',
    emoji: '🧸',
    label: 'Objets',
    words: ['Parapluie', 'Brosse à dents', 'Trottinette', 'Aspirateur', 'Lunettes', 'Grille-pain', 'Valise', 'Bougie', 'Guitare', 'Ventilateur', 'Télécommande', 'Ciseaux', 'Casque', 'Ballon', 'Miroir', 'Réveil', 'Tire-bouchon', 'Sèche-cheveux', 'Échelle', 'Cadenas', 'Pinceau', 'Sac à dos', 'Boussole', 'Chaussette', 'Trampoline'],
  },
  {
    id: 'sports',
    emoji: '⚽',
    label: 'Sports & loisirs',
    words: ['Ski', 'Pétanque', 'Surf', 'Judo', 'Bowling', 'Escalade', 'Tennis', 'Natation', 'Karaoké', 'Équitation', 'Danse', 'Yoga', 'Boxe', 'Rugby', 'Plongée', 'Patin à glace', 'Golf', 'Pêche', 'Basket', 'Vélo', 'Parachute', 'Échecs', 'Cache-cache', 'Camping', 'Jardinage'],
  },
  {
    id: 'voyage',
    emoji: '✈️',
    label: 'Voyage',
    words: ['Tour Eiffel', 'Pyramides', 'Plage', 'Venise', 'New York', 'Désert', 'Igloo', 'Volcan', 'Statue de la Liberté', 'Mont Blanc', 'Croisière', 'Safari', 'Aéroport', 'Gondole', 'Montgolfière', 'Japon', 'Brésil', 'Muraille de Chine', 'Château de sable', 'Passeport', 'Carte postale', 'Île déserte', 'Train de nuit', 'Cactus', 'Phare'],
  },
];

export const UNDERCOVER_PAIRS: [string, string][] = [
  ['Café', 'Thé'], ['Pizza', 'Tarte flambée'], ['Plage', 'Piscine'], ['Chat', 'Chien'], ['Ski', 'Snowboard'],
  ['Croissant', 'Pain au chocolat'], ['Avion', 'Hélicoptère'], ['Guitare', 'Violon'], ['Lune', 'Soleil'], ['Fourchette', 'Cuillère'],
  ['Tennis', 'Ping-pong'], ['Montagne', 'Colline'], ['Crêpe', 'Gaufre'], ['Pomme', 'Poire'], ['Cinéma', 'Théâtre'],
  ['Vélo', 'Trottinette'], ['Pirate', 'Viking'], ['Sushi', 'Maki'], ['Lion', 'Tigre'], ['Hôpital', 'Pharmacie'],
  ['Mariage', 'Anniversaire'], ['Football', 'Rugby'], ['Bougie', 'Lampe'], ['Train', 'Métro'], ['Neige', 'Grêle'],
  ['Chocolat', 'Caramel'], ['Fraise', 'Framboise'], ['Docteur', 'Infirmier'], ['Hamburger', 'Sandwich'], ['Rivière', 'Lac'],
  ['Château', 'Palais'], ['Sorcière', 'Fée'], ['Instagram', 'TikTok'], ['Valise', 'Sac à dos'], ['Glace', 'Sorbet'],
  ['Requin', 'Dauphin'], ['Boulangerie', 'Pâtisserie'], ['Piano', 'Orgue'], ['Raclette', 'Fondue'], ['Taxi', 'Bus'],
];

export const LETTER_RUSH_CATEGORIES = [
  'Un fruit', 'Un légume', 'Un pays', 'Une ville', 'Un prénom', 'Un animal', 'Un métier', 'Un plat',
  'Une marque', 'Un sport', 'Un objet de la maison', 'Un vêtement', 'Une couleur', 'Un film ou une série',
  'Un chanteur ou une chanteuse', 'Un personnage de dessin animé', 'Un instrument de musique', 'Un dessert',
  'Une boisson', 'Quelque chose de rond', 'Quelque chose de froid', 'Un moyen de transport', 'Une partie du corps',
  'Un fromage', 'Un mot en anglais', 'Une émotion', 'Quelque chose dans un restaurant', 'Un superhéros',
];

/** Lettres qui laissent toujours une chance de répondre. */
export const LETTER_RUSH_LETTERS = 'ABCDEFGHIJLMNOPRST'.split('');

export type QuizQuestion = { q: string; options: string[]; answer: number };

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { q: 'Quelle est la capitale de l’Australie ?', options: ['Sydney', 'Canberra', 'Melbourne', 'Perth'], answer: 1 },
  { q: 'Combien de pattes a une araignée ?', options: ['6', '8', '10', '12'], answer: 1 },
  { q: 'Quel pays a gagné la Coupe du monde de football 2018 ?', options: ['Croatie', 'Brésil', 'France', 'Allemagne'], answer: 2 },
  { q: 'Quelle planète est la plus proche du Soleil ?', options: ['Vénus', 'Mars', 'Mercure', 'Terre'], answer: 2 },
  { q: 'Qui a peint La Joconde ?', options: ['Michel-Ange', 'Léonard de Vinci', 'Raphaël', 'Botticelli'], answer: 1 },
  { q: 'Combien y a-t-il de minutes dans une journée ?', options: ['1 240', '1 400', '1 440', '2 400'], answer: 2 },
  { q: 'Quel est le plus grand océan du monde ?', options: ['Atlantique', 'Indien', 'Pacifique', 'Arctique'], answer: 2 },
  { q: 'De quel pays vient la paella ?', options: ['Italie', 'Espagne', 'Portugal', 'Mexique'], answer: 1 },
  { q: 'Quel est l’ingrédient principal du guacamole ?', options: ['Avocat', 'Concombre', 'Petit pois', 'Courgette'], answer: 0 },
  { q: 'En quelle année l’homme a-t-il marché sur la Lune pour la première fois ?', options: ['1959', '1965', '1969', '1972'], answer: 2 },
  { q: 'Quel est le symbole chimique de l’or ?', options: ['Or', 'Ag', 'Au', 'Go'], answer: 2 },
  { q: 'Combien de joueurs par équipe sur un terrain de football ?', options: ['9', '10', '11', '12'], answer: 2 },
  { q: 'Quelle ville est surnommée « la Ville rose » ?', options: ['Toulouse', 'Lyon', 'Bordeaux', 'Nice'], answer: 0 },
  { q: 'De quelle région vient le camembert ?', options: ['Bretagne', 'Normandie', 'Alsace', 'Savoie'], answer: 1 },
  { q: 'Quel est l’animal terrestre le plus rapide ?', options: ['Lion', 'Guépard', 'Antilope', 'Cheval'], answer: 1 },
  { q: 'Combien de côtés a un hexagone ?', options: ['5', '6', '7', '8'], answer: 1 },
  { q: 'Quelle langue parle-t-on principalement au Brésil ?', options: ['Espagnol', 'Portugais', 'Anglais', 'Italien'], answer: 1 },
  { q: 'Quel fromage met-on dans une tartiflette ?', options: ['Comté', 'Reblochon', 'Brie', 'Roquefort'], answer: 1 },
  { q: 'Qui a écrit « Les Misérables » ?', options: ['Victor Hugo', 'Émile Zola', 'Balzac', 'Flaubert'], answer: 0 },
  { q: 'Quel est le plus long fleuve de France ?', options: ['La Seine', 'La Loire', 'Le Rhône', 'La Garonne'], answer: 1 },
  { q: 'Quelle est la monnaie du Japon ?', options: ['Yuan', 'Won', 'Yen', 'Roupie'], answer: 2 },
  { q: 'Dans quel pays se trouve le Machu Picchu ?', options: ['Mexique', 'Pérou', 'Chili', 'Bolivie'], answer: 1 },
  { q: 'Combien de cordes a une guitare classique ?', options: ['4', '5', '6', '7'], answer: 2 },
  { q: 'Bleu + jaune, ça donne…', options: ['Vert', 'Violet', 'Orange', 'Marron'], answer: 0 },
  { q: 'Pour quelle Exposition universelle la tour Eiffel a-t-elle été construite ?', options: ['1855', '1889', '1900', '1925'], answer: 1 },
  { q: 'Quel est le plus grand pays du monde ?', options: ['Canada', 'Chine', 'Russie', 'États-Unis'], answer: 2 },
  { q: 'Combien de zéros compte un million ?', options: ['5', '6', '7', '9'], answer: 1 },
  { q: 'Quels fruits secs met-on dans le pesto traditionnel ?', options: ['Noix', 'Pignons de pin', 'Amandes', 'Noisettes'], answer: 1 },
  { q: 'De quel pays vient le tiramisu ?', options: ['France', 'Espagne', 'Italie', 'Grèce'], answer: 2 },
  { q: 'Quel gaz les plantes absorbent-elles pour faire la photosynthèse ?', options: ['Oxygène', 'Azote', 'Dioxyde de carbone', 'Hélium'], answer: 2 },
  { q: 'Combien de jours compte une année bissextile ?', options: ['364', '365', '366', '367'], answer: 2 },
  { q: 'Quel est le plus haut sommet des Alpes ?', options: ['Le Cervin', 'Le mont Blanc', 'Le mont Rose', 'La Meije'], answer: 1 },
  { q: 'Dans quel sport utilise-t-on un volant ?', options: ['Tennis', 'Badminton', 'Squash', 'Ping-pong'], answer: 1 },
  { q: 'Quelle est la capitale du Canada ?', options: ['Toronto', 'Montréal', 'Ottawa', 'Vancouver'], answer: 2 },
  { q: 'Combien de pièces y a-t-il sur un échiquier au début d’une partie ?', options: ['16', '24', '32', '36'], answer: 2 },
  { q: 'Quelle épice donne au curry sa couleur jaune ?', options: ['Paprika', 'Curcuma', 'Cumin', 'Cannelle'], answer: 1 },
  { q: 'Quel animal porte ses petits dans une poche ?', options: ['Kangourou', 'Paresseux', 'Lémurien', 'Tatou'], answer: 0 },
  { q: 'Combien de couleurs compte-t-on traditionnellement dans un arc-en-ciel ?', options: ['5', '6', '7', '8'], answer: 2 },
  { q: 'Quel métal est liquide à température ambiante ?', options: ['Mercure', 'Plomb', 'Étain', 'Zinc'], answer: 0 },
  { q: 'Qui a composé « La Lettre à Élise » ?', options: ['Mozart', 'Beethoven', 'Chopin', 'Bach'], answer: 1 },
  { q: 'Combien d’os compte le squelette d’un adulte ?', options: ['186', '206', '226', '306'], answer: 1 },
  { q: 'Quel pays a la forme d’une botte ?', options: ['Grèce', 'Italie', 'Portugal', 'Chili'], answer: 1 },
  { q: 'Dans quelle ville se trouve Big Ben ?', options: ['Londres', 'Dublin', 'Édimbourg', 'Manchester'], answer: 0 },
  { q: 'Quel est le plus petit pays du monde ?', options: ['Monaco', 'Le Vatican', 'Saint-Marin', 'Le Liechtenstein'], answer: 1 },
  { q: 'Quelle est la capitale de l’Espagne ?', options: ['Barcelone', 'Madrid', 'Séville', 'Valence'], answer: 1 },
  { q: 'Combien de secondes dans une heure ?', options: ['360', '3 600', '6 000', '36 000'], answer: 1 },
  { q: 'Quel pays est surnommé « le pays du Soleil-Levant » ?', options: ['Chine', 'Japon', 'Corée du Sud', 'Thaïlande'], answer: 1 },
  { q: 'Quel organe pompe le sang dans le corps ?', options: ['Le foie', 'Le cœur', 'Les poumons', 'Les reins'], answer: 1 },
];

export const WHO_OF_US_PROMPTS = [
  'Qui est le plus susceptible d’arriver en retard à son propre mariage ?',
  'Qui commanderait le plat le plus étrange de la carte ?',
  'Qui finirait l’assiette des autres ?',
  'Qui a la meilleure chance de devenir célèbre ?',
  'Qui se perdrait avec un GPS ?',
  'Qui rit le plus fort ?',
  'Qui survivrait le plus longtemps sur une île déserte ?',
  'Qui oublie toujours les anniversaires ?',
  'Qui pourrait parler pendant des heures sans s’arrêter ?',
  'Qui serait le pire candidat dans une émission de cuisine ?',
  'Qui a le plus de photos dans son téléphone ?',
  'Qui partirait faire le tour du monde demain matin ?',
  'Qui pleure devant les dessins animés ?',
  'Qui met le plus de temps à choisir dans un menu ?',
  'Qui serait le meilleur président ou la meilleure présidente ?',
  'Qui gagnerait à un jeu télé de culture générale ?',
  'Qui danse le mieux ?',
  'Qui se lève le plus tard le week-end ?',
  'Qui a le plus de chances de devenir millionnaire ?',
  'Qui ferait le meilleur prof ?',
  'Qui raconte les pires blagues ?',
  'Qui serait capable de manger piquant sans broncher ?',
  'Qui adopterait dix chats ?',
  'Qui oublierait son téléphone dans le restaurant ?',
  'Qui chante sous la douche ?',
  'Qui est le plus mauvais perdant ?',
  'Qui a le meilleur style vestimentaire ?',
  'Qui ferait un excellent espion ?',
  'Qui garde le mieux un secret ?',
  'Qui réserverait des vacances sur un coup de tête ?',
  'Qui serait le premier éliminé dans un film d’horreur ?',
  'Qui ouvrirait son propre restaurant ?',
  'Qui envoie les messages vocaux les plus longs ?',
  'Qui serait le meilleur ou la meilleure DJ de la soirée ?',
  'Qui est le plus gourmand ?',
  'Qui ferait le plus beau discours de témoin ?',
];

// De vrais dilemmes, qui font débattre la table (pas de bonne réponse !).
export const WOULD_YOU_RATHER: [string, string][] = [
  ['Être riche mais seul', 'Être pauvre mais entouré de ta famille'],
  ['Une semaine de vacances seul avec ta mère', 'Une semaine de vacances seul avec ton père'],
  ['Retrouver ton premier amour', 'Rencontrer l’amour de ta vie demain'],
  ['1 million d’euros aujourd’hui', '5 000 € par mois à vie'],
  ['Lire tous les messages de ton ou ta partenaire', 'Qu’il ou elle lise tous les tiens'],
  ['Que ta famille lise ton historique de recherche', 'Que ta famille lise tes messages'],
  ['Ne plus jamais revoir ton meilleur ami', 'Ne plus jamais revoir ta ville natale'],
  ['Revivre ton enfance', 'Voir à quoi ressemblera ta vie dans 20 ans'],
  ['Doubler ton salaire', 'Travailler deux fois moins'],
  ['Être aimé de tout le monde', 'Être respecté de tout le monde'],
  ['Effacer ton pire souvenir', 'Revivre ton meilleur souvenir une seule fois'],
  ['Savoir ce que tout le monde pense de toi', 'Ne jamais le savoir'],
  ['Vivre jusqu’à 100 ans sans tes amis', 'Vivre jusqu’à 70 ans avec eux'],
  ['Ne plus jamais pouvoir mentir', 'Ne plus jamais savoir quand on te ment'],
  ['Ton ex devient ton patron', 'Ton patron devient ton colocataire'],
  ['Ta mère choisit tes vêtements pendant un an', 'Ton père choisit ta coupe de cheveux pendant un an'],
  ['Le job de tes rêves à l’autre bout du monde', 'Un job moyen près des tiens'],
  ['Un an sans téléphone', 'Un an sans voir tes amis'],
  ['Être célèbre et détesté', 'Être inconnu et heureux'],
  ['Connaître tous les secrets de ta famille', 'Que ta famille connaisse tous les tiens'],
  ['Revenir à tes 15 ans avec ta tête d’aujourd’hui', 'Avoir 60 ans demain avec toute ta sagesse'],
  ['Ne plus jamais manger ton plat préféré', 'Le manger à chaque repas pour toujours'],
  ['Que tes parents te voient à ta pire soirée', 'Que ton patron te voie à ta pire soirée'],
  ['Pardonner une trahison de ton meilleur ami', 'Perdre cet ami pour toujours'],
  ['10 000 € tout de suite', '1 centime doublé chaque jour pendant 30 jours'],
  ['Une immense maison perdue à la campagne', 'Un petit appartement en plein centre-ville'],
  ['Toujours 10 minutes en retard', 'Toujours 20 minutes en avance'],
  ['Un ou une partenaire très drôle', 'Un ou une partenaire très beau ou belle'],
  ['Perdre tous tes souvenirs', 'Ne plus pouvoir en créer de nouveaux'],
  ['Être mal payé pour un métier passionnant', 'Être très bien payé pour un métier ennuyeux'],
  ['Que tout le monde entende tes pensées pendant une journée', 'Chanter tout ce que tu dis pendant une semaine'],
  ['Rester coincé dans un ascenseur avec ton ex', 'Rester coincé dans un ascenseur avec ta belle-mère'],
  ['Laisser tes parents choisir le prénom de ton enfant', 'Le tirer au sort'],
  ['Ne plus jamais pouvoir dire « non »', 'Ne plus jamais pouvoir dire « oui »'],
  ['Arrêter les réseaux sociaux à vie', 'Arrêter le sucre à vie'],
  ['Être enfant unique', 'Avoir 6 frères et sœurs'],
  ['Savoir quand ta relation va finir', 'Ne jamais le savoir'],
  ['Vivre dans le passé avec ceux que tu as perdus', 'Vivre dans le futur sans les connaître'],
  ['Gagner au loto et ne le dire à personne', 'Ne jamais gagner mais pouvoir tout raconter'],
  ['Partager tous tes repas avec ta famille pendant un an', 'Manger seul pendant un an'],
  ['Un meilleur ami pour la vie', 'Dix bons amis qui changent souvent'],
  ['Pouvoir voler', 'Être invisible'],
  ['Voyager dans le passé', 'Voyager dans le futur'],
  ['Ne plus jamais avoir froid', 'Ne plus jamais avoir chaud'],
  ['Que ton enfant soit un génie insupportable', 'Que ton enfant soit adorable mais pas très doué'],
];

export const DARES = [
  'Imite un serveur qui présente le plat du jour.',
  'Raconte ton pire rendez-vous.',
  'Fais un compliment sincère à chaque personne de la table.',
  'Parle avec un accent pendant le prochain tour.',
  'Chante le refrain d’une chanson choisie par la table.',
  'Dis ce que tu commanderais si tout était gratuit.',
  'Raconte ton souvenir d’enfance le plus gênant.',
  'Fais deviner un film en mime, sans parler.',
  'Choisis qui commande le dessert pour toute la table.',
  'Raconte une anecdote que personne à la table ne connaît.',
];

export const ROULETTE_QUESTIONS = ['Qui paie l’addition ?', 'Qui choisit le dessert ?', 'Qui commande en premier ?', 'Qui raconte une anecdote ?', 'Qui lance le prochain jeu ?'];

export type ForeheadDeck = { id: string; emoji: string; label: string; words: string[] };

/** Tout le contenu des jeux d'ambiance, pour une langue. */
export type PartyContent = {
  forehead: ForeheadDeck[];
  undercover: [string, string][];
  letterCategories: string[];
  letters: string[];
  quiz: QuizQuestion[];
  whoOfUs: string[];
  rather: [string, string][];
  dares: string[];
  roulette: string[];
};

export const FR_CONTENT: PartyContent = {
  forehead: FOREHEAD_DECKS,
  undercover: UNDERCOVER_PAIRS,
  letterCategories: LETTER_RUSH_CATEGORIES,
  letters: LETTER_RUSH_LETTERS,
  quiz: QUIZ_QUESTIONS,
  whoOfUs: WHO_OF_US_PROMPTS,
  rather: WOULD_YOU_RATHER,
  dares: DARES,
  roulette: ROULETTE_QUESTIONS,
};
