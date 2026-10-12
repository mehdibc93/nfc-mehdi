import { useEffect, useState } from 'react';
import { BrowserFrame, NfcCard, PhoneFrame } from './LandingVisuals';

type TourStep = {
  side: 'client' | 'restaurant';
  title: string;
  text: string;
  /** Capture dans public/images/landing, ou 'nfc' pour l'illustration du tap. */
  visual: string;
};

// Le parcours complet, des deux côtés, pour comprendre Nourevo sans explication : vraies captures
// de l'application (données de démonstration du restaurant Le Jardin Parisien).
const STEPS: TourStep[] = [
  {
    side: 'client',
    title: 'Le client approche son téléphone de la carte',
    text: 'Une carte NFC est posée sur chaque table. Un simple geste ouvre votre carte, sans application ni QR code à viser.',
    visual: 'nfc',
  },
  {
    side: 'client',
    title: 'Votre menu s’ouvre, dans sa langue',
    text: 'Photos, descriptions, allergènes… et une traduction en 5 langues pour vos clients étrangers.',
    visual: '/images/landing/client-langues.jpg',
  },
  {
    side: 'client',
    title: 'Vos suggestions, au bon moment',
    text: 'Une boisson ou un dessert proposé au moment du choix, et certains plats présentés en réalité augmentée.',
    visual: '/images/landing/client-suggestion.jpg',
  },
  {
    side: 'client',
    title: 'Il paie depuis sa table',
    text: 'Carte, Apple Pay ou Google Pay, avec la possibilité de laisser un pourboire à l’équipe, ou à la caisse si vous le préférez.',
    visual: '/images/landing/client-pourboire.jpg',
  },
  {
    side: 'restaurant',
    title: 'La commande arrive aussitôt en cuisine',
    text: 'Le Mode Service affiche chaque commande en temps réel, avec la table, les instructions et le paiement.',
    visual: '/images/landing/resto-service.jpg',
  },
  {
    side: 'restaurant',
    title: 'Vous pilotez avec vos chiffres',
    text: 'Plats les plus commandés, marge plat par plat et recommandations pour faire évoluer votre carte.',
    visual: '/images/landing/resto-rentabilite.jpg',
  },
];

const STEP_DURATION_MS = 5000;

export function ProductTour() {
  const [active, setActive] = useState(0);
  // Lecture automatique, arrêtée dès que le visiteur choisit une étape lui-même (et jamais lancée
  // si l'utilisateur a demandé à limiter les animations). Démarre après l'hydratation : le HTML
  // pré-rendu et le premier rendu client restent identiques.
  const [autoplay, setAutoplay] = useState(false);
  useEffect(() => {
    setAutoplay(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);
  useEffect(() => {
    if (!autoplay) return undefined;
    const timer = window.setTimeout(() => setActive((step) => (step + 1) % STEPS.length), STEP_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [autoplay, active]);

  const choose = (index: number) => {
    setAutoplay(false);
    setActive(index);
  };

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
      <ol className="space-y-2">
        {STEPS.map((step, index) => {
          const isActive = index === active;
          const firstOfSide = index === 0 || STEPS[index - 1].side !== step.side;
          return (
            <li key={step.title}>
              {firstOfSide && (
                <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.25em] ${index === 0 ? '' : 'mt-6'} text-navy-500`}>
                  {step.side === 'client' ? '📱 Côté client' : '🧑‍🍳 Côté restaurant'}
                </p>
              )}
              <button
                type="button"
                onClick={() => choose(index)}
                aria-current={isActive ? 'step' : undefined}
                className={`relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${
                  isActive ? 'border-navy-300 bg-white shadow-soft' : 'border-transparent hover:bg-white/60'
                }`}
              >
                <span className="flex items-start gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold transition-colors duration-300 ${
                      isActive ? 'bg-navy-700 text-white' : 'bg-stone-200/70 text-stone-500'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span>
                    <span className={`block font-display font-bold ${isActive ? 'text-stone-900' : 'text-stone-600'}`}>{step.title}</span>
                    {/* Texte toujours présent dans le HTML (référencement), affiché pour l'étape active. */}
                    <span className={`mt-1 text-sm leading-6 text-stone-500 ${isActive ? 'block' : 'hidden'}`}>{step.text}</span>
                  </span>
                </span>
                {isActive && autoplay && (
                  <span
                    key={active}
                    className="absolute bottom-0 left-0 h-0.5 bg-navy-500"
                    style={{ animation: `tourProgress ${STEP_DURATION_MS}ms linear forwards` }}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>

      {/* Toutes les vues sont empilées et se succèdent en fondu (pas de saut de mise en page). */}
      <div className="relative order-first mx-auto h-[440px] w-full max-w-[560px] sm:h-[560px] lg:order-none">
        <div className="absolute inset-0 m-auto h-[380px] w-[380px] rounded-full bg-navy-300/20 blur-3xl" />
        {STEPS.map((step, index) => (
          <div
            key={step.title}
            aria-hidden={index !== active}
            className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
              index === active ? 'opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
            }`}
          >
            {step.visual === 'nfc' ? (
              <div className="relative w-full max-w-[420px]">
                <PhoneFrame src="/images/landing/client-menu.jpg" alt="" className="ml-auto w-[62%]" />
                <div className="absolute bottom-10 left-0 w-[58%] -rotate-6">
                  <NfcCard />
                </div>
              </div>
            ) : step.side === 'client' ? (
              <div className="h-full w-full max-w-[260px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_85%,transparent)]">
                <PhoneFrame src={step.visual} alt={step.title} />
              </div>
            ) : (
              <BrowserFrame src={step.visual} alt={step.title} className="w-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
