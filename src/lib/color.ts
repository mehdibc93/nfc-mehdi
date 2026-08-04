// Petits utilitaires pour dériver un dégradé de bouton + une couleur de texte lisible
// à partir d'une seule couleur hexadécimale choisie par le restaurateur.

function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

function shade(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const adjust = (channel: number) => {
    const amount = percent < 0 ? channel * (percent / 100) : (255 - channel) * (percent / 100);
    return Math.max(0, Math.min(255, Math.round(channel + amount)));
  };
  const [r, g, b] = rgb.map(adjust);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function isValidHexColor(hex: string): boolean {
  return hexToRgb(hex) !== null;
}

// Dégradé clair -> couleur -> foncé, dans le même esprit que le dégradé marine par défaut.
export function accentGradient(hex: string): string {
  return `linear-gradient(to right, ${shade(hex, 14)}, ${hex}, ${shade(hex, -18)})`;
}

// Blanc ou noir selon la luminosité perçue de la couleur, pour rester lisible.
export function accentTextColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#ffffff';
  const [r, g, b] = rgb;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#161c26' : '#ffffff';
}
