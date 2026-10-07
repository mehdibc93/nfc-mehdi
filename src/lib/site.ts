// URL publique du site — SEULE source de vérité pour les URLs absolues (canonical, Open Graph,
// sitemap, robots.txt, JSON-LD). Pour changer de domaine, il suffit de définir VITE_SITE_URL
// dans les variables d'environnement Vercel puis de redéployer, ou de modifier la valeur par
// défaut ci-dessous.
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://nourevo.fr').replace(/\/+$/, '');

export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo512.png`;
