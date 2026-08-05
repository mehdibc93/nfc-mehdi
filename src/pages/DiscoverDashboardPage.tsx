import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import logoHorizontal from '../assets/logo-horizontal.png';
import { DashboardPreview } from '../components/DashboardPreview';
import { Reveal, Transition } from '../components/Reveal';
import {
  CartePreview,
  ConfigurationPreview,
  ModeServicePreview,
  PaiementsPreview,
  RentabilitePreview,
  RestaurantPreview,
  StatistiquesPreview,
} from '../components/DashboardMiniPreviews';
import { setPageMeta } from '../lib/seo';

type DashboardPage = {
  id: string;
  icon: string;
  color: string;
  title: string;
  description: string;
  statLine: string;
  preview: ReactNode;
};

// Palette catégorielle sans danger pour le daltonisme (Okabe-Ito + un indigo), validée avec
// scripts/validate_palette.js du skill dataviz avant utilisation.
const DASHBOARD_PAGES: DashboardPage[] = [
  {
    id: 'carte',
    icon: '📋',
    color: '#E69F00',
    title: 'Gestion de la carte',
    description: 'Créez et modifiez votre menu en quelques clics, sans jamais repartir de zéro.',
    statLine: '🍽️ 32 plats en ligne',
    preview: <CartePreview />,
  },
  {
    id: 'restaurant',
    icon: '🏠',
    color: '#56B4E9',
    title: 'Informations du restaurant',
    description: 'Personnalisez entièrement votre restaurant en quelques minutes.',
    statLine: '🎨 100% personnalisable',
    preview: <RestaurantPreview />,
  },
  {
    id: 'paiements',
    icon: '💳',
    color: '#009E73',
    title: 'Paiements & Encaissements',
    description: 'Encaissez vos clients directement, sans commission, sans intermédiaire.',
    statLine: '💳 0% de commission',
    preview: <PaiementsPreview />,
  },
  {
    id: 'stats',
    icon: '📊',
    color: '#0072B2',
    title: 'Statistiques',
    description: 'Sachez enfin quels plats intéressent vraiment vos clients.',
    statLine: '📈 +38% de vues ce mois',
    preview: <StatistiquesPreview />,
  },
  {
    id: 'rentabilite',
    icon: '💰',
    color: '#D55E00',
    title: 'Analyse de rentabilité',
    description: 'Ne devinez plus quels plats vous font gagner de l\'argent.',
    statLine: '🟢 68% de marge sur le best-seller',
    preview: <RentabilitePreview />,
  },
  {
    id: 'service',
    icon: '🔔',
    color: '#CC79A7',
    title: 'Mode Service',
    description: 'Votre équipe suit chaque commande en temps réel, sans courir entre les tables.',
    statLine: '⚡ Commandes en direct',
    preview: <ModeServicePreview />,
  },
  {
    id: 'configuration',
    icon: '🔐',
    color: '#4338CA',
    title: 'Configuration',
    description: 'Gardez le contrôle total sur qui accède à quoi.',
    statLine: '🔒 Accès 100% sécurisé',
    preview: <ConfigurationPreview />,
  },
];

const CUSTOMIZATION_ITEMS = [
  { icon: '🎨', color: '#E69F00', label: 'Couleur des boutons', description: "Vos couleurs, pas un thème générique." },
  { icon: '🖼️', color: '#56B4E9', label: 'Photo de couverture', description: "Une galerie prête à l'emploi, ou vos propres photos." },
  { icon: '🎬', color: '#009E73', label: "Vidéo d'introduction", description: 'Accueillez vos clients en vidéo dès leur arrivée.' },
  { icon: '👨‍🍳', color: '#0072B2', label: "Animation d'attente", description: "Occupez l'écran du client pendant la préparation." },
  { icon: '🌍', color: '#D55E00', label: '5 langues', description: 'Traduction automatique de toute votre carte, en un clic.' },
  { icon: '🕐', color: '#CC79A7', label: 'Horaires sur-mesure', description: 'Menus midi/soir qui se gèrent tout seuls.' },
];

function SectionBadge({ number }: { number: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-white">
      {number}
    </span>
  );
}

function FeatureCard({
  page,
  delayMs,
  onOpenPreview,
}: {
  page: DashboardPage;
  delayMs: number;
  onOpenPreview: (page: DashboardPage) => void;
}) {
  return (
    <Reveal delayMs={delayMs}>
      <div className="group flex h-full flex-col rounded-3xl border border-stone-200/70 bg-gradient-to-b from-white to-stone-50/70 p-6 shadow-[0_2px_14px_rgba(17,30,48,0.05)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_44px_rgba(17,30,48,0.13)]">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-sm transition-transform duration-300 ease-out group-hover:-rotate-3 group-hover:scale-110"
          style={{ background: `linear-gradient(135deg, ${page.color}3d, ${page.color}12)` }}
        >
          {page.icon}
        </span>
        <p className="mt-4 font-display text-base font-bold text-stone-900">{page.title}</p>
        <p className="mt-1.5 text-sm leading-5 text-stone-500">{page.description}</p>
        <p className="mt-2.5 text-xs font-bold" style={{ color: page.color }}>
          {page.statLine}
        </p>
        <div className="mt-4 rounded-2xl border border-stone-100 bg-white p-3.5">{page.preview}</div>
        <button
          type="button"
          onClick={() => onOpenPreview(page)}
          className="mt-4 pt-1 text-left text-xs font-bold text-navy-700 transition-colors duration-300 hover:text-navy-900"
        >
          Voir un aperçu →
        </button>
      </div>
    </Reveal>
  );
}

function PreviewModal({ page, onClose }: { page: DashboardPage | null; onClose: () => void }) {
  if (!page) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
            style={{ background: `linear-gradient(135deg, ${page.color}3d, ${page.color}12)` }}
          >
            {page.icon}
          </span>
          <p className="font-display text-lg font-bold text-stone-900">{page.title}</p>
        </div>
        <p className="mt-3 text-sm leading-6 text-stone-500">{page.description}</p>
        <div className="mt-4 rounded-2xl border border-stone-100 bg-stone-50/60 p-4">{page.preview}</div>
        <Link
          to="/inscription"
          className="mt-5 block rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-3 text-center text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5"
        >
          Créer mon compte
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 block w-full text-center text-xs font-semibold text-stone-400 hover:text-stone-600"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

export function DiscoverDashboardPage() {
  const [previewPage, setPreviewPage] = useState<DashboardPage | null>(null);

  useEffect(() => {
    setPageMeta({
      title: 'Découvrir le dashboard — Nourevo',
      description: "Un aperçu concret du dashboard Nourevo avant de créer votre compte : vue d'ensemble, personnalisation, Mode Service, statistiques et rentabilité.",
    });
  }, []);

  return (
    <div className="min-h-screen px-4 py-14 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition-colors duration-300 hover:text-navy-700"
        >
          ← Retour à l'accueil
        </Link>

        <img src={logoHorizontal} alt="Nourevo" className="h-8 w-auto" />
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Votre dashboard, avant même de créer un compte.
        </h1>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-navy-300/10 px-3.5 py-1.5 text-xs font-bold text-navy-700">
          ⏱ Configurez votre restaurant en moins de 15 minutes
        </p>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-500">
          Voici à quoi ressemble concrètement l'espace de gestion de votre restaurant sur Nourevo. Les chiffres
          ci-dessous sont fictifs, à titre d'exemple — mais l'interface est celle que vous utiliserez vraiment.
        </p>

        {/* 1. Vue d'ensemble */}
        <section className="mt-12">
          <Reveal>
            <div className="flex items-center gap-3">
              <SectionBadge number="1" />
              <div>
                <p className="font-display text-lg font-bold text-stone-900">L'accueil de votre espace</p>
                <p className="text-sm text-stone-500">
                  Vos ventes du jour en un coup d'œil, puis un accès direct à chaque outil.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delayMs={100}>
            <div className="mt-5">
              <DashboardPreview />
            </div>
          </Reveal>
        </section>

        <Transition>Une fois votre carte créée, personnalisez entièrement l'expérience de vos clients.</Transition>

        {/* 2. Les 7 espaces */}
        <section className="mt-8">
          <Reveal>
            <div className="flex items-center gap-3">
              <SectionBadge number="2" />
              <div>
                <p className="font-display text-lg font-bold text-stone-900">Les 7 espaces de votre dashboard</p>
                <p className="text-sm text-stone-500">Chaque fonctionnalité résout un vrai problème du quotidien.</p>
              </div>
            </div>
          </Reveal>
          <div className="mt-6 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DASHBOARD_PAGES.map((page, index) => (
              <FeatureCard key={page.id} page={page} delayMs={index * 60} onOpenPreview={setPreviewPage} />
            ))}
          </div>
        </section>

        <Transition>Votre restaurant est prêt. Il ne reste plus qu'à suivre vos performances en temps réel.</Transition>

        {/* 3. Personnalisation */}
        <section className="mt-8 rounded-[2.5rem] bg-navy-300/6 p-6 sm:p-10">
          <Reveal>
            <div className="flex items-center gap-3">
              <SectionBadge number="3" />
              <div>
                <p className="font-display text-lg font-bold text-stone-900">Personnalisation illimitée</p>
                <p className="text-sm text-stone-500">
                  Votre carte à l'image de votre restaurant, modifiable aussi souvent que vous voulez.
                </p>
              </div>
            </div>
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CUSTOMIZATION_ITEMS.map((item, index) => (
              <Reveal key={item.label} delayMs={index * 50}>
                <div className="group flex h-full flex-col rounded-3xl border border-stone-200/70 bg-gradient-to-b from-white to-stone-50/70 p-5 shadow-[0_2px_10px_rgba(17,30,48,0.05)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(17,30,48,0.1)]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg shadow-sm transition-transform duration-300 ease-out group-hover:-rotate-3 group-hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${item.color}3d, ${item.color}12)` }}
                  >
                    {item.icon}
                  </span>
                  <p className="mt-3 text-sm font-bold text-stone-900">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-stone-500">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Conclusion */}
        <section className="mt-16">
          <Reveal>
            <div className="flex flex-col items-center gap-5 rounded-[2.5rem] bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 p-10 text-center shadow-glow sm:p-16">
              <h2 className="max-w-2xl font-display text-2xl font-bold text-white sm:text-3xl">
                Tout ce dont votre restaurant a besoin, dans une seule plateforme.
              </h2>
              <p className="max-w-xl text-sm leading-6 text-white/80 sm:text-base">
                Créez votre carte, encaissez vos paiements, suivez vos performances, améliorez votre rentabilité et
                offrez une expérience moderne à vos clients — sans complexité.
              </p>
              <Link
                to="/inscription"
                className="rounded-full bg-white px-8 py-4 text-sm font-bold text-navy-800 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
              >
                Essayer Nourevo
              </Link>
            </div>
          </Reveal>
        </section>
      </div>

      <PreviewModal page={previewPage} onClose={() => setPreviewPage(null)} />
    </div>
  );
}
