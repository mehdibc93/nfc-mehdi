// URL publique du site — SEULE source de vérité pour les URLs absolues (canonical, Open Graph,
// sitemap, robots.txt, JSON-LD). Pour passer sur un domaine perso, il suffit de définir
// VITE_SITE_URL (ex: https://nourevo.fr) dans les variables d'environnement Vercel, puis de
// redéployer : rien d'autre à modifier dans le code.
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://nourevo.vercel.app').replace(/\/+$/, '');

export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo512.png`;
