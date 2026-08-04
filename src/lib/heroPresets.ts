// Sélection de photos prêtes à l'emploi pour la photo de fond du restaurant, pour les
// restaurateurs qui n'ont pas encore leurs propres photos professionnelles.

export type HeroPreset = { id: string; label: string; url: string };

function unsplash(id: string): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;
}

export const HERO_PRESETS: HeroPreset[] = [
  { id: 'moderne', label: 'Ambiance moderne', url: unsplash('1552566626-52f8b828add9') },
  { id: 'elegante', label: 'Salle élégante', url: unsplash('1550966871-3ed3cdb5ed0c') },
  { id: 'terrasse', label: 'Terrasse en bord d’eau', url: unsplash('1559339352-11d035aa65de') },
  { id: 'cafe', label: 'Café lumineux', url: unsplash('1555396273-367ea4eb4db5') },
  { id: 'gastronomie', label: 'Plat gastronomique', url: unsplash('1467003909585-2f8a72700288') },
];
