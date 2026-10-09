import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardPreview } from '../components/DashboardPreview';
import { Reveal } from '../components/Reveal';
import { useAuth } from '../hooks/useAuth';
import logoHorizontal from '../assets/logo-horizontal.png';
import logoMark from '../assets/logo-mark.png';
import { setPublicPageMeta } from '../lib/seo';
import { PLANS } from '../lib/plans';
import { FAQ_ITEMS } from '../lib/faq';
import { PAYMENT_LOGOS, STRIPE_LOGO } from '../lib/paymentLogos';
import { DeliveryCommissionCalculator } from '../components/DeliveryCommissionCalculator';

const DEMO_HREF = '/r/le-jardin-parisien?demo=1';
const WHATSAPP_HREF =
  'https://wa.me/33753924902?text=Bonjour%2C%20je%20souhaite%20commander%20une%20carte%20NFC%20pour%20mon%20restaurant.';

// Chiffres clés : uniquement des faits sur le produit ou des calculs exacts (offre annuelle :
// 588 € / 365 jours = 1,61 €), jamais de statistique de performance non mesurée.
const KEY_FIGURES = [
  { value: '1 tap', label: 'pour ouvrir votre carte, sans application' },
  { value: '0 %', label: 'de commission sur vos ventes' },
  { value: '5', label: 'langues, traduites en un clic' },
  { value: '15 min', label: 'pour mettre votre carte en ligne' },
  { value: '1,61 €', label: "par jour avec l'offre annuelle" },
];

const HERO_TRUST = ["7 jours d'essai gratuit", '0 % de commission sur vos ventes', 'Prêt en 15 minutes'];

// Parcours du client à table, illustré par de vraies captures de la carte de démonstration
// (public/images/landing, générées depuis /r/le-jardin-parisien).
const CUSTOMER_STEPS = [
  {
    number: '1',
    title: 'Il approche son téléphone',
    description:
      'Une carte NFC est posée sur chaque table. Un simple contact ouvre votre menu : pas d’application à installer, pas de QR code à viser.',
    visual: 'nfc' as const,
  },
  {
    number: '2',
    title: 'Il découvre votre carte',
    description:
      'Photos, descriptions, allergènes, 5 langues, suggestions du chef… et même certains plats en réalité augmentée.',
    visual: '/images/landing/client-plat.jpg',
  },
  {
    number: '3',
    title: 'Il commande et paie',
    description:
      'Sur place, à emporter ou en livraison ; par carte, Apple Pay, Google Pay ou à la caisse. La commande arrive aussitôt en cuisine.',
    visual: '/images/landing/client-modes.jpg',
  },
];

const NFC_VS_QR = [
  { label: 'Pour ouvrir le menu', qr: 'Ouvrir l’appareil photo, viser, attendre la mise au point', nfc: 'Un simple contact avec la carte' },
  { label: 'En salle sombre ou en terrasse', qr: 'Reflets et lumière faible gênent la lecture', nfc: 'Fonctionne quelle que soit la lumière' },
  { label: 'Image de votre établissement', qr: 'Autocollant générique, souvent abîmé', nfc: 'Carte élégante aux couleurs de Nourevo' },
  { label: 'Après l’ouverture du menu', qr: 'Souvent un simple PDF à faire défiler', nfc: 'Commande, paiement, pourboire et suivi en direct' },
];

const PILLARS: { icon: string; color: string; title: string; subtitle: string; items: string[] }[] = [
  {
    icon: '📱',
    color: '#0072B2',
    title: 'Pour vos clients',
    subtitle: 'Une expérience fluide, sans attendre un serveur.',
    items: [
      'Menu en photos, traduit en 5 langues',
      'Filtres allergènes et régimes alimentaires',
      'Paiement par carte, Apple Pay ou Google Pay',
      'Pourboire en un clic, au paiement ou après le repas',
      'Suivi de la commande en direct',
    ],
  },
  {
    icon: '🧑‍🍳',
    color: '#009E73',
    title: 'Pour votre équipe',
    subtitle: 'Moins d’allers-retours, plus de temps pour le service.',
    items: [
      'Mode Service : commandes reçues en temps réel',
      'Appel serveur et demande d’addition depuis la table',
      'Plat épuisé ? Il disparaît tout seul de la carte',
      'Menus midi et soir qui changent automatiquement',
      'Accès du personnel protégé par code PIN',
    ],
  },
  {
    icon: '📈',
    color: '#D55E00',
    title: 'Pour votre chiffre d’affaires',
    subtitle: 'Vendre plus, et savoir ce qui rapporte vraiment.',
    items: [
      'Vente à emporter et livraison, avec vos propres frais',
      'Suggestions boisson et dessert pour un panier plus élevé',
      'Avis Google demandés au bon moment',
      'Statistiques et rentabilité plat par plat',
      'Réductions programmées (happy hour, menu du midi…)',
    ],
  },
];

const COMPARISON = [
  { label: 'Modifier un prix', paper: 'Réimpression nécessaire', nourevo: 'Modifié en quelques secondes' },
  { label: 'Photos des plats', paper: 'Aucune', nourevo: 'Une photo pour chaque plat' },
  { label: 'Suivi des ventes', paper: 'Aucun', nourevo: 'Statistiques en temps réel' },
  { label: 'Rentabilité par plat', paper: 'Impossible à connaître', nourevo: 'Calculée automatiquement' },
  { label: 'Paiement', paper: 'À la caisse uniquement', nourevo: 'Carte, Apple Pay, Google Pay à table' },
  { label: 'Langues proposées', paper: 'Une seule', nourevo: '5 langues, traduites en un clic' },
];

const SETUP_STEPS = [
  {
    number: '1',
    title: 'Créez votre carte',
    description: 'Ajoutez vos plats, vos photos et vos prix depuis votre dashboard — aucune compétence technique requise.',
  },
  {
    number: '2',
    title: 'Recevez vos cartes NFC',
    description: 'Déjà configurées pour votre restaurant, livrées chez vous, prêtes à poser sur vos tables.',
  },
  {
    number: '3',
    title: 'Encaissez vos premières commandes',
    description: 'Connectez votre compte Stripe : l’argent arrive directement sur votre compte bancaire, sans commission.',
  },
];

// Questions les plus utiles à un restaurateur qui découvre Nourevo (la liste complète est sur /faq).
const HOME_FAQ_QUESTIONS = [
  "Vos clients doivent-ils télécharger une application ?",
  "Ai-je besoin d'un matériel spécial ?",
  'Comment mes clients paient-ils leur commande ?',
  'Y a-t-il un engagement ?',
  "Y a-t-il un essai gratuit ?",
];
const HOME_FAQ = HOME_FAQ_QUESTIONS.map((question) => FAQ_ITEMS.find((item) => item.question === question)).filter(
  (item): item is (typeof FAQ_ITEMS)[number] => Boolean(item),
);

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-navy-500">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-bold text-stone-900 sm:text-4xl">{title}</h2>
      {children && <p className="mt-3 text-sm leading-6 text-stone-500 sm:text-base">{children}</p>}
    </div>
  );
}

// Cadre de téléphone autour d'une vraie capture de la carte client.
function PhoneFrame({ src, alt, eager = false, className = '' }: { src: string; alt: string; eager?: boolean; className?: string }) {
  return (
    <div className={`rounded-[2.4rem] bg-stone-900 p-2 shadow-card ring-1 ring-black/10 ${className}`}>
      <div className="overflow-hidden rounded-[2rem] bg-white">
        <img
          src={src}
          alt={alt}
          width={780}
          height={1688}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="block h-auto w-full"
        />
      </div>
    </div>
  );
}

// Carte NFC posée sur la table, avec les ondes du « tap ». La largeur est donnée par
// `className` ; `compact` pour les petits formats (texte réduit au strict nécessaire).
function NfcCard({ className = 'w-full', compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div
      className={`relative aspect-[1.586] rounded-2xl bg-gradient-to-br from-navy-600 via-navy-700 to-navy-900 p-4 text-white shadow-glow ring-1 ring-white/10 sm:p-5 ${className}`}
    >
      <div className="flex items-center gap-2">
        <img src={logoMark} alt="" className={`rounded-md bg-white/90 p-0.5 ${compact ? 'h-5 w-5' : 'h-6 w-6'}`} />
        <span className={`font-bold uppercase ${compact ? 'text-[10px] tracking-[0.2em]' : 'text-xs tracking-[0.3em]'}`}>Nourevo</span>
      </div>
      <div className={compact ? 'absolute right-3 top-3' : 'absolute right-4 top-4 sm:right-5 sm:top-5'} aria-hidden="true">
        <span className="absolute inset-0 rounded-full bg-white/30 motion-safe:animate-ping" />
        <svg viewBox="0 0 24 24" className={`relative ${compact ? 'h-5 w-5' : 'h-7 w-7'}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M8.5 8.5a5 5 0 0 1 0 7" />
          <path d="M11.5 6a8.5 8.5 0 0 1 0 12" />
          <path d="M14.5 3.5a12 12 0 0 1 0 17" />
        </svg>
      </div>
      {compact ? (
        <p className="absolute bottom-3 left-4 right-4 text-xs font-semibold leading-snug">Approchez votre téléphone</p>
      ) : (
        <p className="absolute bottom-4 left-4 right-4 text-sm font-semibold leading-snug sm:bottom-5 sm:left-5 sm:text-base">
          Approchez votre téléphone
          <span className="block text-xs font-normal text-white/70">pour voir le menu et commander</span>
        </p>
      )}
    </div>
  );
}

function FaqItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="rounded-3xl border border-stone-200/70 bg-white shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={`home-faq-${index}`}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-display text-base font-bold text-stone-900">{question}</span>
        <span className={`shrink-0 text-navy-700 transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {/* Toujours dans le HTML (masqué si fermé) pour rester lisible par les moteurs de recherche. */}
      <p id={`home-faq-${index}`} hidden={!open} className="px-6 pb-5 text-sm leading-6 text-stone-500">
        {answer}
      </p>
    </div>
  );
}

export function LandingPage() {
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setPublicPageMeta('/');
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const primaryCta = isAuthenticated
    ? { to: '/dashboard', label: 'Aller à mon dashboard' }
    : { to: '/inscription', label: 'Essayer gratuitement 7 jours' };

  return (
    <div className="relative min-h-screen overflow-hidden text-stone-900">
      <header className="sticky top-0 z-40 border-b border-stone-900/5 bg-[#f6f8fb]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8 lg:px-10">
          <Link to="/" aria-label="Nourevo — accueil">
            <img src={logoHorizontal} alt="Nourevo" className="h-8 w-auto sm:h-9" />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            <a href="#comment-ca-marche" className="px-3 py-2 text-sm font-semibold text-stone-600 hover:text-navy-700">
              Comment ça marche
            </a>
            <a href="#fonctionnalites" className="px-3 py-2 text-sm font-semibold text-stone-600 hover:text-navy-700">
              Fonctionnalités
            </a>
            <Link to="/tarifs" className="px-3 py-2 text-sm font-semibold text-stone-600 hover:text-navy-700">
              Tarifs
            </Link>
            <Link to="/faq" className="px-3 py-2 text-sm font-semibold text-stone-600 hover:text-navy-700">
              FAQ
            </Link>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 sm:flex"
            >
              💬 WhatsApp
            </a>
            {isAuthenticated ? (
              <>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700"
                >
                  Déconnexion
                </button>
                <Link
                  to="/dashboard"
                  className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-4 py-2 text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5"
                >
                  Mon dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/connexion"
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700"
                >
                  Se connecter
                </Link>
                <Link
                  to="/inscription"
                  className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-4 py-2 text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5"
                >
                  Essai gratuit
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Haut de page : la promesse + le concept montré (carte NFC + vraie carte client) */}
        <section className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-12 sm:px-8 sm:pt-16 lg:px-10 lg:pb-24">
          <div className="pointer-events-none absolute -left-32 -top-24 h-[380px] w-[380px] rounded-full bg-navy-300/15 blur-3xl" />
          <div className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10">
            <div className="space-y-7">
              <p className="inline-flex items-center gap-2 rounded-full border border-navy-300/30 bg-white/70 px-4 py-1.5 text-xs font-semibold text-navy-700">
                📲 Carte NFC · Menu digital · Paiement à table
              </p>
              <h1 className="font-display text-4xl font-bold leading-[1.06] tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
                Vos clients commandent et paient à table, d’un simple tap.
              </h1>
              <p className="max-w-xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">
                Nourevo est la plateforme tout-en-un des restaurants : une carte NFC posée sur chaque table ouvre
                votre menu sur le téléphone du client, <strong className="font-semibold text-stone-800">sans application</strong>.
                Commande, paiement, pourboires, emporter, livraison et statistiques, au même endroit.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to={primaryCta.to}
                  className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-8 py-[1.125rem] text-center text-sm font-bold text-white shadow-glow transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {primaryCta.label}
                </Link>
                <Link
                  to={DEMO_HREF}
                  className="rounded-full border border-stone-300 bg-white px-7 py-4 text-center text-sm font-bold text-stone-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-300 hover:text-navy-700"
                >
                  ▶ Voir la démo en direct
                </Link>
              </div>

              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-500">
                {HERO_TRUST.map((label) => (
                  <li key={label} className="flex items-center gap-1.5">
                    <span className="text-emerald-600">✓</span>
                    {label}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-stone-500">
                À partir de <strong className="font-semibold text-stone-800">49 €/mois</strong>, soit{' '}
                <strong className="font-semibold text-stone-800">1,61 € par jour</strong> ·{' '}
                <Link to="/tarifs" className="font-semibold text-navy-700 underline-offset-2 hover:underline">
                  voir les offres
                </Link>
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-[420px]">
              <div className="absolute inset-0 m-auto h-[360px] w-[360px] rounded-full bg-navy-300/15 blur-3xl" />
              <PhoneFrame
                src="/images/landing/client-menu.jpg"
                alt="La carte digitale du restaurant de démonstration Le Jardin Parisien, ouverte sur un téléphone"
                eager
                className="relative ml-auto w-[72%] motion-safe:animate-float"
              />
              <div className="absolute -left-2 bottom-4 w-[50%] -rotate-6 sm:-left-4">
                <NfcCard compact />
              </div>
              <div className="absolute -right-2 top-10 hidden rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow-card sm:block">
                ✅ Commande envoyée en cuisine
              </div>
            </div>
          </div>
        </section>

        {/* Moyens de paiement */}
        <section className="border-y border-stone-200/70 bg-white/70">
          <div className="mx-auto max-w-7xl px-4 py-10 text-center sm:px-8 lg:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Vos clients paient comme ils en ont l’habitude
            </p>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
              {PAYMENT_LOGOS.map((logo) => (
                <li key={logo.name} title={logo.name}>
                  <svg role="img" viewBox="0 0 24 24" className="h-9 w-auto sm:h-10" fill={logo.color}>
                    <title>{logo.name}</title>
                    <path d={logo.path} />
                  </svg>
                </li>
              ))}
              <li className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-bold text-stone-600">CB</li>
            </ul>
            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-stone-500">
              Paiements sécurisés par
              <svg role="img" viewBox="0 0 24 24" className="h-5 w-5" fill={STRIPE_LOGO.color}>
                <title>Stripe</title>
                <path d={STRIPE_LOGO.path} />
              </svg>
              <strong className="font-semibold text-stone-700">Stripe</strong>· 0 % de commission Nourevo · l’argent
              arrive directement sur votre compte
            </p>
          </div>
        </section>

        {/* Chiffres clés */}
        <section className="mx-auto w-full max-w-7xl px-4 pt-14 sm:px-8 lg:px-10">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {KEY_FIGURES.map((figure) => (
              <div key={figure.value} className="rounded-3xl border border-stone-200/70 bg-white px-5 py-6 text-center shadow-soft">
                <dt className="sr-only">{figure.label}</dt>
                <dd>
                  <span className="block font-display text-3xl font-bold text-navy-800 sm:text-4xl">{figure.value}</span>
                  <span className="mt-1 block text-sm leading-5 text-stone-500">{figure.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Comment ça marche, côté client */}
        <section id="comment-ca-marche" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 pt-20 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="Comment ça marche" title="Pour vos clients, 3 gestes suffisent">
              Voici exactement ce que voit un client à votre table — ce sont de vraies captures de la carte de
              démonstration.
            </SectionHeading>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {CUSTOMER_STEPS.map((step, index) => (
              <Reveal key={step.number} delayMs={index * 100}>
                <div className="flex h-full flex-col rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800 font-display font-bold text-white">
                      {step.number}
                    </span>
                    <h3 className="font-display text-lg font-bold text-stone-900">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-stone-500">{step.description}</p>
                  <div className="mt-6 flex flex-1 items-end justify-center rounded-2xl bg-gradient-to-b from-stone-50 to-navy-50/60 px-6 pt-6">
                    {step.visual === 'nfc' ? (
                      <div className="mb-10 w-full max-w-[260px]">
                        <NfcCard />
                      </div>
                    ) : (
                      <div className="h-[340px] w-full max-w-[220px] overflow-hidden">
                        <PhoneFrame src={step.visual} alt={step.title} />
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delayMs={150}>
            <div className="mt-10 flex justify-center">
              <Link
                to={DEMO_HREF}
                className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-7 py-4 text-sm font-bold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5"
              >
                ▶ Essayer la démo comme un client
              </Link>
            </div>
          </Reveal>
        </section>

        {/* NFC ou QR code */}
        <section className="mx-auto w-full max-w-5xl px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="NFC ou QR code ?" title="Votre restaurant mérite mieux qu’un QR code">
              Le QR code a dépanné pendant des années. La carte NFC rend la même chose plus simple, plus rapide et plus
              élégante.
            </SectionHeading>
          </Reveal>
          <Reveal delayMs={100}>
            <div className="mt-10 overflow-hidden rounded-3xl border border-stone-200/70 bg-white shadow-soft">
              <div className="hidden grid-cols-3 gap-4 border-b border-stone-200/70 bg-stone-50 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-stone-500 sm:grid">
                <span />
                <span>QR code</span>
                <span>Carte NFC Nourevo</span>
              </div>
              <div className="divide-y divide-stone-100">
                {NFC_VS_QR.map((row) => (
                  <div key={row.label} className="grid grid-cols-1 gap-2 px-6 py-5 sm:grid-cols-3 sm:items-center sm:gap-4">
                    <span className="text-sm font-bold text-stone-800">{row.label}</span>
                    <span className="flex items-start gap-2 text-sm text-stone-500">
                      <span className="text-rose-400">✕</span> {row.qr}
                    </span>
                    <span className="flex items-start gap-2 rounded-xl bg-emerald-50/70 px-3 py-1.5 text-sm font-semibold text-navy-700 sm:bg-transparent sm:px-0 sm:py-0">
                      <span className="text-emerald-600">✓</span> {row.nfc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* Fonctionnalités, par public */}
        <section id="fonctionnalites" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="Fonctionnalités" title="Une plateforme, pas juste une carte">
              Tout ce qu’il faut pour servir, encaisser et piloter votre restaurant, sans jongler entre plusieurs
              outils.
            </SectionHeading>
          </Reveal>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PILLARS.map((pillar, index) => (
              <Reveal key={pillar.title} delayMs={index * 100}>
                <div className="relative h-full overflow-hidden rounded-3xl border border-stone-200/70 bg-white p-7 shadow-soft">
                  <span className="absolute inset-x-0 top-0 h-1" style={{ background: pillar.color }} />
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                    style={{ background: `linear-gradient(135deg, ${pillar.color}33, ${pillar.color}10)` }}
                  >
                    {pillar.icon}
                  </span>
                  <h3 className="mt-4 font-display text-xl font-bold text-stone-900">{pillar.title}</h3>
                  <p className="mt-1 text-sm text-stone-500">{pillar.subtitle}</p>
                  <ul className="mt-5 space-y-3">
                    {pillar.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-stone-700">
                        <span className="mt-0.5 text-emerald-600">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Plus de ventes : emporter, livraison, pourboires */}
        <section className="mx-auto w-full max-w-7xl px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <div className="grid items-center gap-10 overflow-hidden rounded-3xl bg-gradient-to-br from-navy-600 via-navy-700 to-navy-900 p-8 text-white shadow-glow sm:p-12 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Au-delà de la salle</p>
                <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                  Vendez à emporter et en livraison, sans reverser de commission.
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/80 sm:text-base">
                  Partagez votre lien de commande sur Instagram, votre fiche Google ou votre site. Vos clients
                  choisissent un créneau, paient en ligne ou au retrait, et la commande arrive dans votre Mode Service.
                  Contrairement aux plateformes de livraison, vous ne reversez aucun pourcentage : vous fixez vos frais
                  et votre minimum, et vous acceptez ou refusez chaque commande.
                </p>
                <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                  {[
                    '🥡 Vente à emporter avec créneaux',
                    '🛵 Livraison assurée par votre équipe',
                    '💝 Pourboires en ligne pour votre équipe',
                    '🔗 Un lien à partager, sans application',
                  ].map((item) => (
                    <li key={item} className="rounded-2xl bg-white/10 px-4 py-3 font-semibold">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mx-auto h-[420px] w-full max-w-[240px] overflow-hidden">
                <PhoneFrame src="/images/landing/client-modes.jpg" alt="Choix sur place, à emporter ou livraison" />
              </div>
              <div className="lg:col-span-2">
                <DeliveryCommissionCalculator />
              </div>
            </div>
          </Reveal>
        </section>

        {/* Menu papier VS Nourevo */}
        <section className="mx-auto w-full max-w-5xl px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="La différence Nourevo" title="Le menu papier a fait son temps">
              Prix à réimprimer, plats rentables inconnus, service interrompu pour prendre une commande à la voix : la
              carte papier vous coûte du temps et de l’argent, chaque jour.
            </SectionHeading>
          </Reveal>
          <Reveal delayMs={100}>
            <div className="mt-10 overflow-hidden rounded-3xl border border-stone-200/70 bg-white shadow-soft">
              <div className="hidden grid-cols-3 gap-4 border-b border-stone-200/70 bg-stone-50 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-stone-500 sm:grid">
                <span />
                <span>Menu papier</span>
                <span>Avec Nourevo</span>
              </div>
              <div className="divide-y divide-stone-100">
                {COMPARISON.map((row) => (
                  <div key={row.label} className="grid grid-cols-1 gap-2 px-6 py-5 sm:grid-cols-3 sm:items-center sm:gap-4">
                    <span className="text-sm font-bold text-stone-800">{row.label}</span>
                    <span className="flex items-center gap-2 text-sm text-stone-500">
                      <span className="text-rose-400">✕</span> {row.paper}
                    </span>
                    <span className="flex items-center gap-2 rounded-xl bg-emerald-50/70 px-3 py-1.5 text-sm font-semibold text-navy-700 sm:bg-transparent sm:px-0 sm:py-0">
                      <span className="text-emerald-600">✓</span> {row.nourevo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* Dashboard */}
        <section className="mx-auto w-full max-w-7xl px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="Votre espace de gestion" title="Tout se pilote depuis un seul dashboard">
              Carte, commandes, paiements, statistiques, rentabilité : un seul endroit, sur ordinateur, tablette ou
              téléphone.
            </SectionHeading>
          </Reveal>
          <Reveal delayMs={100}>
            <div className="mx-auto mt-10 max-w-4xl">
              <DashboardPreview />
            </div>
          </Reveal>
          <Reveal delayMs={150}>
            <div className="mt-8 flex justify-center">
              <Link
                to="/decouvrir-dashboard"
                className="rounded-full border border-stone-200/70 bg-white px-6 py-3.5 text-sm font-bold text-navy-700 shadow-soft transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-navy-300/40"
              >
                🔎 Visiter le dashboard en détail →
              </Link>
            </div>
          </Reveal>
        </section>

        {/* Mise en place */}
        <section className="mx-auto w-full max-w-7xl px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="Mise en place" title="Opérationnel en moins de 15 minutes" />
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {SETUP_STEPS.map((step, index) => (
              <Reveal key={step.number} delayMs={index * 100}>
                <div className="h-full rounded-3xl border border-stone-200/70 bg-white p-7 shadow-soft">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800 font-display text-base font-bold text-white shadow-glow">
                    {step.number}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-stone-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-500">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Tarifs */}
        <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="Tarifs" title="Un abonnement simple, tout inclus">
              Toutes les fonctionnalités dans chaque offre, cartes NFC fournies, 0 % de commission sur vos ventes et 7
              jours d’essai gratuit.
            </SectionHeading>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PLANS.map((plan, index) => (
              <Reveal key={plan.id} delayMs={index * 100}>
                <div
                  className={`relative flex h-full flex-col rounded-3xl border bg-white p-7 shadow-soft ${
                    plan.highlight ? 'border-navy-400 ring-2 ring-navy-300/40' : 'border-stone-200/70'
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-navy-700 px-3 py-1 text-xs font-bold text-white">
                      Recommandé
                    </span>
                  )}
                  <p className="font-display text-lg font-bold text-stone-900">
                    {plan.icon} {plan.name}
                  </p>
                  <p className="mt-3 font-display text-4xl font-bold text-navy-800">{plan.price}</p>
                  {plan.subPrice && <p className="mt-1 text-sm text-stone-500">{plan.subPrice}</p>}
                  <ul className="mt-5 space-y-2.5">
                    {plan.advantages.map((advantage) => (
                      <li key={advantage} className="flex items-start gap-2 text-sm text-stone-600">
                        <span className="text-emerald-600">✓</span>
                        {advantage}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-7">
                    <Link
                      to={isAuthenticated ? '/dashboard' : '/inscription'}
                      className={`block rounded-full px-5 py-3 text-center text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 ${
                        plan.highlight
                          ? 'bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 text-white shadow-glow'
                          : 'border border-stone-200 bg-white text-navy-700'
                      }`}
                    >
                      Commencer l’essai gratuit
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-stone-500">
            <Link to="/tarifs" className="font-semibold text-navy-700 underline-offset-2 hover:underline">
              Comparer les offres en détail →
            </Link>
          </p>
        </section>

        {/* FAQ */}
        <section className="mx-auto w-full max-w-3xl px-4 pt-24 sm:px-8">
          <Reveal>
            <SectionHeading eyebrow="Questions fréquentes" title="Vous vous posez sûrement ces questions" />
          </Reveal>
          <div className="mt-10 space-y-3">
            {HOME_FAQ.map((item, index) => (
              <FaqItem key={item.question} question={item.question} answer={item.answer} index={index} />
            ))}
          </div>
          <p className="mt-6 text-center text-sm">
            <Link to="/faq" className="font-semibold text-navy-700 underline-offset-2 hover:underline">
              Voir toutes les questions →
            </Link>
          </p>
        </section>

        {/* CTA final */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-600 via-navy-700 to-navy-900 p-10 text-center shadow-glow sm:p-14">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="relative flex flex-col items-center gap-5">
                <h2 className="max-w-3xl font-display text-2xl font-bold text-white sm:text-4xl">
                  Prêt à offrir une expérience moderne à vos clients ?
                </h2>
                <p className="max-w-xl text-sm text-white/80 sm:text-base">
                  Créez votre carte en quelques minutes et testez Nourevo gratuitement pendant 7 jours.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    to={primaryCta.to}
                    className="rounded-full bg-white px-8 py-4 text-sm font-bold text-navy-800 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {primaryCta.label}
                  </Link>
                  <Link
                    to={DEMO_HREF}
                    className="rounded-full border border-white/40 px-8 py-4 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10"
                  >
                    ▶ Voir la démo
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Carte NFC physique */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-8 lg:px-10">
          <Reveal>
            <div className="flex flex-col items-start gap-6 rounded-3xl border border-stone-200/70 bg-white p-8 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-10">
              <div className="flex items-center gap-6">
                <NfcCard compact className="hidden w-44 shrink-0 sm:block" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">Carte NFC physique</p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-stone-900 sm:text-3xl">Prêt à équiper vos tables ?</h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-stone-500 sm:text-base">
                    Vos cartes arrivent déjà configurées pour votre restaurant : il ne vous reste qu’à les poser sur vos
                    tables.
                  </p>
                  <div className="mt-3 flex flex-col gap-1 text-sm leading-6 text-stone-500">
                    <span>📦 Livraison en France sous 2 à 4 jours ouvrés.</span>
                    <span>🤝 Remise en main propre possible en Île-de-France.</span>
                  </div>
                </div>
              </div>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noreferrer"
                className="flex shrink-0 items-center gap-2.5 rounded-full bg-[#25D366] px-6 py-4 text-sm font-bold text-white shadow-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
              >
                💬 Commander sur WhatsApp
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-stone-900/5 px-4 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-stone-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Nourevo</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link to="/decouvrir-dashboard" className="hover:text-navy-700">
              Dashboard
            </Link>
            <Link to="/tarifs" className="hover:text-navy-700">
              Tarifs
            </Link>
            <Link to="/faq" className="hover:text-navy-700">
              FAQ
            </Link>
            <Link to="/contact" className="hover:text-navy-700">
              Contact
            </Link>
            <Link to="/mentions-legales" className="hover:text-navy-700">
              Mentions légales
            </Link>
            <Link to="/cgu" className="hover:text-navy-700">
              CGU
            </Link>
            <Link to="/confidentialite" className="hover:text-navy-700">
              Confidentialité
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
