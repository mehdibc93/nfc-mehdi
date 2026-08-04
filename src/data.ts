export const restaurantMenu = {
  name: 'Le Jardin Parisien',
  heroImage:
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80',
  rating: 4.8,
  reviewCount: 462,
  prepTime: '15-20 min',
  address: '14 rue des Vertus, Paris 3e',
  tags: ['Cuisine de saison', 'Produits frais', 'Service en salle'],
  categories: [
    {
      name: 'Entrées',
      items: [
        {
          name: 'Burrata crémeuse',
          description: 'Tomates anciennes, basilic frais, huile d’olive infusée.',
          price: '14€',
          image: '/images/burrata.jpg',
          recommended: false,
          bestSeller: false,
          ingredients: ['Burrata di bufala', 'Tomates anciennes', 'Basilic frais', 'Huile d’olive'],
          accompaniments: ['Focaccia chaude', 'Salade d’herbes', 'Huile basilic'],
          drink: 'Verre de Chardonnay bien frais',
          dessertSuggestion: 'Panna cotta légère au citron',
        },
        {
          name: 'Tartare de saumon',
          description: 'Agrumes, aneth, pickles maison et crumble salé.',
          price: '16€',
          image: '/images/tartare.jpg',
          recommended: true,
          bestSeller: false,
          ingredients: ['Saumon frais', 'Agrumes', 'Aneth', 'Pickles maison'],
          accompaniments: ['Toast grillé', 'Crème citronnée', 'Salade croquante'],
          drink: 'Sancerre ou eau pétillante agrumes',
          dessertSuggestion: 'Sorbet exotique pour finir léger',
        },
      ],
    },
    {
      name: 'Plats',
      items: [
        {
          name: 'Burger Gourmet',
          description: 'Brioche artisanale, cheddar affiné, sauce signature.',
          price: '21€',
          image: '/images/burger.jpg',
          images: [
            '/images/burger.jpg',
            'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
          ],
          recommended: true,
          bestSeller: true,
          ingredients: ['Steak grillé', 'Cheddar affiné', 'Brioche artisanale', 'Sauce signature'],
          accompaniments: ['Pommes frites maison', 'Salade coleslaw', 'Sauce truffe'],
          drink: 'IPA légère ou cola artisanal',
          dessertSuggestion: 'Fondant chocolat pour un combo signature',
        },
        {
          name: 'Filet de bœuf sauce maison',
          description: 'Jus réduit, légumes rôtis et pommes grenailles.',
          price: '29€',
          image: '/images/beef.jpg',
          recommended: false,
          bestSeller: true,
          ingredients: ['Filet de bœuf', 'Jus réduit', 'Légumes rôtis', 'Herbes de saison'],
          accompaniments: ['Gratin dauphinois', 'Légumes rôtis', 'Sauce poivre'],
          drink: 'Bordeaux rouge ou mocktail intense',
          dessertSuggestion: 'Tiramisu maison',
        },
        {
          name: 'Risotto aux champignons',
          description: 'Parmesan affiné, pleurotes, huile de truffe légère.',
          price: '23€',
          image: '/images/risotto.jpg',
          images: [
            '/images/risotto.jpg',
            'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=1200&q=80',
          ],
          recommended: true,
          bestSeller: false,
          ingredients: ['Riz arborio', 'Pleurotes', 'Parmesan affiné', 'Huile de truffe'],
          accompaniments: ['Parmesan affiné', 'Mesclun', 'Noisettes torréfiées'],
          drink: 'Verre de blanc minéral',
          dessertSuggestion: 'Dessert fruité conseillé',
        },
      ],
    },
    {
      name: 'Desserts',
      items: [
        {
          name: 'Tiramisu maison',
          description: 'Mascarpone aérien, cacao intense et biscuits imbibés.',
          price: '11€',
          image: '/images/tiramisu.jpg',
          images: [
            '/images/tiramisu.jpg',
            'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=1200&q=80',
          ],
          recommended: true,
          bestSeller: true,
          ingredients: ['Mascarpone', 'Cacao intense', 'Biscuits imbibés', 'Crème légère'],
          accompaniments: ['Coulis café', 'Éclats de cacao', 'Crème légère'],
          drink: 'Espresso ou limoncello',
          dessertSuggestion: 'Chocolat chaud maison',
        },
        {
          name: 'Fondant chocolat',
          description: 'Cœur coulant, glace vanille et éclats de noisettes.',
          price: '12€',
          image: '/images/fondant.jpg',
          recommended: false,
          bestSeller: true,
          ingredients: ['Chocolat noir', 'Cœur coulant', 'Glace vanille', 'Noisettes'],
          accompaniments: ['Glace vanille', 'Crème anglaise', 'Crumble noisette'],
          drink: 'Café gourmand ou porto',
          dessertSuggestion: 'Ajout d’un second dessert à partager',
        },
      ],
    },
    {
      name: 'Boissons',
      items: [
        {
          name: 'Spritz maison',
          description: 'Aperol, prosecco et zeste d’orange, servi bien frais.',
          price: '9€',
          image:
            'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80',
          images: [
            'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80',
            '/images/spritz.jpg',
          ],
          recommended: true,
          bestSeller: false,
          ingredients: ['Aperol', 'Prosecco', 'Eau pétillante', 'Zeste d’orange'],
          accompaniments: ['Glaçons', 'Zeste d’orange', 'Olive verte'],
          drink: 'Un doux mélange pour prolonger l’apéritif',
          dessertSuggestion: 'Tiramisu maison pour finir en douceur',
        },
        {
          name: 'Mocktail citrus',
          description: 'Citron vert, sirop maison et menthe fraîche, sans alcool.',
          price: '7€',
          image: '/images/mocktail.jpg',
          recommended: false,
          bestSeller: false,
          ingredients: ['Citron vert', 'Sirop maison', 'Eau pétillante', 'Menthe fraîche'],
          accompaniments: ['Glaçons', 'Rondelle de citron', 'Feuille de menthe'],
          drink: 'Servi seul, pour une fraîcheur sans alcool',
          dessertSuggestion: 'Fondant chocolat pour contraster la fraîcheur',
        },
        {
          name: 'Vin rouge du chef',
          description: 'Sélection du sommelier, parfaite avec les viandes.',
          price: '8€',
          image: '/images/wine.jpg',
          recommended: false,
          bestSeller: true,
          ingredients: ['Cépage sélectionné', 'Service au verre'],
          accompaniments: ['Verre à vin', 'Carafe sur demande'],
          drink: 'Un second verre pour accompagner le plat',
          dessertSuggestion: 'Tiramisu maison en accord classique',
        },
      ],
    },
  ],
};

export const restaurantPhotos = restaurantMenu.categories.flatMap((category) =>
  category.items.map((item) => ({
    title: item.name,
    subtitle: item.description,
    image: item.image,
  })),
);

export const drinkSuggestions = [
  {
    name: 'Spritz maison',
    description: 'Idéal pour ouvrir l’appétit et dynamiser la commande.',
    image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Mocktail citrus',
    description: 'Fraîcheur premium sans alcool pour élargir le panier moyen.',
    image: '/images/mocktail.jpg',
  },
  {
    name: 'Vin rouge du chef',
    description: 'Le complément naturel des viandes et plats généreux.',
    image: '/images/wine.jpg',
  },
];

export const restaurantStats = [
  { label: 'Scans NFC aujourd’hui', value: '247', progress: 78 },
  { label: 'Menus consultés', value: '183', progress: 64 },
  { label: 'Plat le plus regardé', value: 'Burger Gourmet', progress: 92 },
];