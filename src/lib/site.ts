// URL publique du site — SEULE source de vérité pour les URLs absolues (canonical, Open Graph,
// sitemap, robots.txt, JSON-LD). Pour changer de domaine, il suffit de définir VITE_SITE_URL
// dans les variables d'environnement Vercel puis de redéployer, ou de modifier la valeur par
// défaut ci-dessous.
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://nourevo.fr').replace(/\/+$/, '');

export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo512.png`;

// Adresse de contact affichée sur le site (accueil, contact, pages légales) et dans le JSON-LD.
export const CONTACT_EMAIL = 'contact.nourevo@gmail.com';

// Démonstration publique (restaurant Le Jardin Parisien), proposée sur toutes les pages publiques.
export const DEMO_HREF = '/r/le-jardin-parisien?demo=1';

// Commande de cartes NFC par WhatsApp (message pré-rempli).
export const WHATSAPP_NFC_HREF =
  'https://wa.me/33753924902?text=Bonjour%2C%20je%20souhaite%20commander%20une%20carte%20NFC%20pour%20mon%20restaurant.';
