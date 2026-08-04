export const DIET_TAGS = [
  { key: 'vegetarien', label: 'Végétarien', icon: '🥕' },
  { key: 'vegan', label: 'Végan', icon: '🌱' },
  { key: 'halal', label: 'Halal', icon: '☪️' },
  { key: 'casher', label: 'Casher', icon: '✡️' },
  { key: 'sans_gluten', label: 'Sans gluten', icon: '🌾' },
] as const;

export const ALLERGENS = [
  { key: 'gluten', label: 'Gluten' },
  { key: 'crustaces', label: 'Crustacés' },
  { key: 'oeufs', label: 'Œufs' },
  { key: 'poisson', label: 'Poisson' },
  { key: 'arachides', label: 'Arachides' },
  { key: 'soja', label: 'Soja' },
  { key: 'lait', label: 'Lait' },
  { key: 'fruits_a_coque', label: 'Fruits à coque' },
  { key: 'celeri', label: 'Céleri' },
  { key: 'moutarde', label: 'Moutarde' },
  { key: 'sesame', label: 'Sésame' },
  { key: 'sulfites', label: 'Sulfites' },
  { key: 'lupin', label: 'Lupin' },
  { key: 'mollusques', label: 'Mollusques' },
] as const;

export function dietLabel(key: string) {
  return DIET_TAGS.find((tag) => tag.key === key)?.label ?? key;
}

export function dietIcon(key: string) {
  return DIET_TAGS.find((tag) => tag.key === key)?.icon ?? '';
}

export function allergenLabel(key: string) {
  return ALLERGENS.find((allergen) => allergen.key === key)?.label ?? key;
}
