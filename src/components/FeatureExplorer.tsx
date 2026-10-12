import { useState } from 'react';
import { DashboardPreview } from './DashboardPreview';
import { BrowserFrame, PhoneFrame } from './LandingVisuals';

type Feature = {
  title: string;
  text: string;
  /** Capture côté client (téléphone) ou restaurant (navigateur), ou l'aperçu du dashboard. */
  visual: { kind: 'phone' | 'browser'; src: string } | { kind: 'dashboard' };
};

type Audience = { id: string; icon: string; label: string; features: Feature[] };

// Les fonctionnalités, regroupées par public : un clic sur une fonctionnalité affiche l'écran
// correspondant (vraies captures, données de démonstration).
const AUDIENCES: Audience[] = [
  {
    id: 'clients',
    icon: '📱',
    label: 'Pour vos clients',
    features: [
      {
        title: 'Un menu en photos, dans 5 langues',
        text: 'Chaque plat avec sa photo, sa description et ses allergènes, traduit en un clic en anglais, espagnol, chinois et russe.',
        visual: { kind: 'phone', src: '/images/landing/client-langues.jpg' },
      },
      {
        title: 'Des suggestions et la réalité augmentée',
        text: 'Boisson et dessert proposés au bon moment, suppléments, et certains plats à voir en 3D sur la table.',
        visual: { kind: 'phone', src: '/images/landing/client-suggestion.jpg' },
      },
      {
        title: 'Le paiement à table, pourboire compris',
        text: 'Carte, Apple Pay ou Google Pay, avec la possibilité de laisser un pourboire à l’équipe, sans attendre l’addition.',
        visual: { kind: 'phone', src: '/images/landing/client-pourboire.jpg' },
      },
      {
        title: 'Le suivi de la commande en direct',
        text: 'Le client voit sa commande passer de « reçue » à « en préparation » puis « prête », avec le temps estimé.',
        visual: { kind: 'phone', src: '/images/landing/client-suivi.jpg' },
      },
    ],
  },
  {
    id: 'equipe',
    icon: '🧑‍🍳',
    label: 'Pour votre équipe',
    features: [
      {
        title: 'Les commandes en temps réel',
        text: 'Le Mode Service affiche chaque commande avec la table, les instructions, le paiement et le pourboire, avec une alerte sonore.',
        visual: { kind: 'browser', src: '/images/landing/resto-service.jpg' },
      },
      {
        title: 'Les tables et les demandes en un coup d’œil',
        text: 'Une table demande l’addition ou un serveur ? Elle s’allume dans la vue des tables : plus besoin de guetter la salle.',
        visual: { kind: 'browser', src: '/images/landing/resto-tables.jpg' },
      },
      {
        title: 'Toute votre gestion au même endroit',
        text: 'Carte, horaires, paiements, stocks, code PIN pour le personnel : un seul dashboard, sur ordinateur ou tablette.',
        visual: { kind: 'dashboard' },
      },
    ],
  },
  {
    id: 'ventes',
    icon: '📈',
    label: 'Pour piloter votre activité',
    features: [
      {
        title: 'Ce que vos clients regardent et commandent',
        text: 'Vues, ajouts au panier, achats et taux de conversion, plat par plat : vous décidez avec des chiffres.',
        visual: { kind: 'browser', src: '/images/landing/resto-stats.jpg' },
      },
      {
        title: 'La rentabilité de chaque plat',
        text: 'Votre marge calculée plat par plat, les plus et les moins rentables, et des recommandations pour ajuster votre carte.',
        visual: { kind: 'browser', src: '/images/landing/resto-rentabilite.jpg' },
      },
      {
        title: 'La vente à emporter et la livraison',
        text: 'Un lien de commande à votre nom : vos habitués commandent depuis chez eux, sans commission Nourevo.',
        visual: { kind: 'phone', src: '/images/landing/client-modes.jpg' },
      },
    ],
  },
];

export function FeatureExplorer() {
  const [audienceId, setAudienceId] = useState(AUDIENCES[0].id);
  const [featureIndex, setFeatureIndex] = useState(0);
  const audience = AUDIENCES.find((item) => item.id === audienceId) ?? AUDIENCES[0];
  const feature = audience.features[Math.min(featureIndex, audience.features.length - 1)];

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Fonctionnalités par public">
        {AUDIENCES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === audienceId}
            onClick={() => {
              setAudienceId(item.id);
              setFeatureIndex(0);
            }}
            className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
              item.id === audienceId
                ? 'bg-navy-700 text-white shadow-glow'
                : 'border border-stone-200 bg-white text-stone-600 hover:border-navy-300'
            }`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      <div className="mt-10 grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]" role="tabpanel">
        {/* Les trois listes restent dans le HTML (référencement) ; seule celle de l'onglet actif s'affiche. */}
        <div>
          {AUDIENCES.map((group) => (
            <ul key={group.id} hidden={group.id !== audienceId} className="space-y-3">
              {group.features.map((item, index) => {
                const isActive = item === feature;
                return (
                  <li key={item.title}>
                    <button
                      type="button"
                      onClick={() => setFeatureIndex(index)}
                      aria-pressed={isActive}
                      className={`w-full rounded-2xl border p-5 text-left transition-all duration-300 ${
                        isActive ? 'border-navy-300 bg-white shadow-soft' : 'border-stone-200/70 bg-white/50 hover:bg-white'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className={`font-display font-bold ${isActive ? 'text-stone-900' : 'text-stone-600'}`}>{item.title}</span>
                        <span className={`text-navy-500 transition-transform duration-300 ${isActive ? 'translate-x-1' : ''}`}>→</span>
                      </span>
                      <span className={`mt-1.5 text-sm leading-6 text-stone-500 ${isActive ? 'block' : 'hidden'}`}>{item.text}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ))}
        </div>

        <div className="relative order-first flex min-h-[380px] items-center justify-center sm:min-h-[520px] lg:order-none">
          <div className="absolute inset-0 m-auto h-[360px] w-[360px] rounded-full bg-navy-300/20 blur-3xl" />
          <div key={feature.title} className="relative w-full animate-fadeIn">
            {feature.visual.kind === 'phone' ? (
              <div className="mx-auto h-[380px] w-full max-w-[220px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_85%,transparent)] sm:h-[520px] sm:max-w-[270px]">
                <PhoneFrame src={feature.visual.src} alt={feature.title} />
              </div>
            ) : feature.visual.kind === 'browser' ? (
              <BrowserFrame src={feature.visual.src} alt={feature.title} />
            ) : (
              <DashboardPreview />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
