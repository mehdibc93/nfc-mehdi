// Offres d’abonnement, affichées sur la page d’accueil et sur la page Tarifs (mêmes prix partout).
export const PLANS = [
  {
    id: 'monthly',
    name: 'Liberté',
    icon: '',
    price: '59€/mois',
    subPrice: null as string | null,
    highlight: false,
    advantages: ['Sans engagement', 'Résiliation à tout moment', 'Idéal pour découvrir le service'],
  },
  {
    id: 'annual_monthly',
    name: 'Pro',
    icon: '⭐',
    price: '54€/mois',
    subPrice: null as string | null,
    highlight: true,
    advantages: ['Engagement 12 mois', 'Paiement mensuel', "Économisez 60€ par an par rapport à l'offre Liberté"],
  },
  {
    id: 'annual_upfront',
    name: 'Annuelle',
    icon: '💎',
    price: '49€/mois',
    subPrice: '(588€ payés en une fois)',
    highlight: false,
    advantages: ['Paiement unique pour 12 mois', 'Le meilleur tarif', "Économisez 120€ par an par rapport à l'offre Liberté"],
  },
];
