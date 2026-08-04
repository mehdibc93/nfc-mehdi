// "Pages protégées par le code PIN" : plutôt qu'un vrai système de comptes/rôles (chantier
// séparé, plus lourd), le patron choisit quelles pages du dashboard demandent le code PIN
// (restaurant.servicePin) à l'ouverture, sans connexion complète. Cocher une page dans la liste
// suffit à la protéger. Le code est redemandé à chaque ouverture de la page — volontairement pas
// mémorisé, pour qu'une personne qui quitte puis revient sur une page protégée doive le
// retaper à chaque fois.

export type StaffSection =
  | 'service'
  | 'stats'
  | 'rentabilite'
  | 'menu'
  | 'restaurant'
  | 'payments'
  | 'configuration';

export const STAFF_SECTIONS: { key: StaffSection; label: string }[] = [
  { key: 'service', label: 'Mode Service' },
  { key: 'menu', label: 'Gestion de la carte (menu)' },
  { key: 'stats', label: 'Statistiques' },
  { key: 'rentabilite', label: 'Rentabilité' },
  { key: 'restaurant', label: 'Paramètres restaurant' },
  { key: 'payments', label: 'Paiements' },
  { key: 'configuration', label: 'Configuration (PIN, NFC, avis)' },
];

type GatedRestaurant = {
  pinProtectedSections: string[];
  servicePin: string | null;
};

export function isSectionLocked(restaurant: GatedRestaurant, section: StaffSection): boolean {
  return Boolean(restaurant.servicePin) && restaurant.pinProtectedSections.includes(section);
}

export function verifyPin(restaurant: GatedRestaurant, pin: string): boolean {
  return pin === restaurant.servicePin;
}
