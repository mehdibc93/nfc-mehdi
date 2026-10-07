// Métadonnées des pages PUBLIQUES (pré-rendues au build) — source unique utilisée à la fois :
// - par scripts/prerender.mjs, qui les écrit dans le <head> du HTML statique de chaque page ;
// - par chaque page au runtime (setPageMeta), pour mettre le <head> à jour lors d'une
//   navigation côté client.
// Ajouter une page publique : une entrée ici + une route dans src/publicRoutes.tsx.
import { FAQ_ITEMS } from './faq';
import { DEFAULT_OG_IMAGE, SITE_URL } from './site';

export type JsonLd = Record<string, unknown> | Record<string, unknown>[];

export type PublicPageMeta = {
  path: string;
  title: string;
  description: string;
  jsonLd?: JsonLd;
  changefreq: 'weekly' | 'monthly' | 'yearly';
  priority: number;
};

const ORGANIZATION = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Nourevo',
  url: `${SITE_URL}/`,
  logo: DEFAULT_OG_IMAGE,
};

const SOFTWARE_APPLICATION = {
  '@type': 'SoftwareApplication',
  '@id': `${SITE_URL}/#software`,
  name: 'Nourevo',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: `${SITE_URL}/`,
  image: DEFAULT_OG_IMAGE,
  description:
    "Plateforme tout-en-un pour restaurants : carte digitale, prise de commande et paiement à table, statistiques, rentabilité et avis clients, accessible d'un simple tap NFC.",
  publisher: { '@id': `${SITE_URL}/#organization` },
  offers: [
    {
      '@type': 'Offer',
      name: 'Liberté — sans engagement',
      price: '59.00',
      priceCurrency: 'EUR',
      url: `${SITE_URL}/tarifs`,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '59.00',
        priceCurrency: 'EUR',
        unitCode: 'MON',
        billingDuration: 'P1M',
      },
    },
    {
      '@type': 'Offer',
      name: 'Pro — engagement 12 mois',
      description: 'Abonnement mensuel avec engagement de 12 mois.',
      price: '54.00',
      priceCurrency: 'EUR',
      url: `${SITE_URL}/tarifs`,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '54.00',
        priceCurrency: 'EUR',
        unitCode: 'MON',
        billingDuration: 'P1M',
      },
    },
    {
      '@type': 'Offer',
      name: 'Annuelle — paiement unique',
      description: '588 € payés en une fois pour 12 mois (soit 49 €/mois).',
      price: '588.00',
      priceCurrency: 'EUR',
      url: `${SITE_URL}/tarifs`,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '588.00',
        priceCurrency: 'EUR',
        unitCode: 'ANN',
        billingDuration: 'P1Y',
      },
    },
  ],
};

export const PUBLIC_PAGES: PublicPageMeta[] = [
  {
    path: '/',
    title: 'Nourevo — La plateforme tout-en-un pour votre restaurant',
    description:
      "Nourevo réunit la prise de commande, le paiement, les statistiques, la rentabilité, les avis clients et la gestion de votre carte — accessible d'un simple tap NFC.",
    jsonLd: { '@context': 'https://schema.org', '@graph': [ORGANIZATION, SOFTWARE_APPLICATION] },
    changefreq: 'weekly',
    priority: 1.0,
  },
  {
    path: '/tarifs',
    title: 'Tarifs — Nourevo',
    description:
      'Un seul abonnement, toutes les fonctionnalités incluses : 59 €/mois sans engagement, 54 €/mois sur 12 mois ou 588 €/an. Sans commission sur vos ventes.',
    jsonLd: { '@context': 'https://schema.org', '@graph': [ORGANIZATION, SOFTWARE_APPLICATION] },
    changefreq: 'monthly',
    priority: 0.9,
  },
  {
    path: '/faq',
    title: 'FAQ — Nourevo',
    description:
      'Les réponses aux questions les plus fréquentes sur Nourevo : paiement, matériel NFC, abonnement, langues, sécurité.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
    changefreq: 'monthly',
    priority: 0.8,
  },
  {
    path: '/decouvrir-dashboard',
    title: 'Découvrir le dashboard — Nourevo',
    description:
      "Un aperçu concret du dashboard Nourevo avant de créer votre compte : vue d'ensemble, personnalisation, Mode Service, statistiques et rentabilité.",
    changefreq: 'monthly',
    priority: 0.8,
  },
  {
    path: '/contact',
    title: 'Contact — Nourevo',
    description: 'Une question sur Nourevo, votre abonnement ou un problème technique ? Contactez-nous directement.',
    changefreq: 'yearly',
    priority: 0.5,
  },
  {
    path: '/mentions-legales',
    title: 'Mentions légales — Nourevo',
    description: 'Mentions légales du site Nourevo.',
    changefreq: 'yearly',
    priority: 0.2,
  },
  {
    path: '/cgu',
    title: "Conditions générales d'utilisation — Nourevo",
    description: "Conditions générales d'utilisation de la plateforme Nourevo.",
    changefreq: 'yearly',
    priority: 0.2,
  },
  {
    path: '/confidentialite',
    title: 'Politique de confidentialité — Nourevo',
    description: 'Politique de confidentialité et protection des données personnelles sur Nourevo.',
    changefreq: 'yearly',
    priority: 0.2,
  },
];

export function getPublicPageMeta(path: string): PublicPageMeta {
  const meta = PUBLIC_PAGES.find((page) => page.path === path);
  if (!meta) throw new Error(`Aucune métadonnée publique pour ${path} (voir src/lib/pageMeta.ts)`);
  return meta;
}

// <head> du shell SPA (app.html / 404.html) servi pour le dashboard, l'auth et les menus
// /r/:slug : jamais indexé, chaque page affine ensuite ses balises via setPageMeta.
export const SHELL_META = {
  title: 'Nourevo',
  description: 'Nourevo — la plateforme tout-en-un pour votre restaurant.',
  noindex: true,
};
