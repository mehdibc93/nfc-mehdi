import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { BrowserFrame, PhoneFrame } from '../components/LandingVisuals';
import { Reveal } from '../components/Reveal';
import { CtaBand, PageIntro, SectionHeading, usePrimaryCta } from '../components/MarketingBlocks';
import { setPublicPageMeta } from '../lib/seo';

// Page « Avantages » : les bénéfices regroupés par objectif du restaurateur, chacun illustré par
// une vraie capture et rattaché à une fonctionnalité existante. Aucun chiffre de résultat annoncé.

type Visual = { kind: 'phone' | 'browser'; src: string; alt: string } | { kind: 'review' };

type Advantage = {
  id: string;
  goal: string;
  title: string;
  text: string;
  points: string[];
  visual: Visual;
  link?: { to: string; label: string };
};

const PILLARS = [
  { href: '#vendre', icon: '📈', label: 'Vendre mieux' },
  { href: '#service', icon: '⚡', label: 'Servir plus vite' },
  { href: '#clients', icon: '😊', label: 'Ravir vos clients' },
  { href: '#piloter', icon: '🧭', label: 'Piloter sereinement' },
];

const ADVANTAGES: Advantage[] = [
  {
    id: 'vendre',
    goal: 'Vendre mieux',
    title: 'Chaque plat présenté sous son meilleur jour',
    text: 'Une belle photo et une suggestion au bon moment donnent envie. Votre carte fait le travail d’un serveur attentif, à chaque table.',
    points: [
      'Une boisson, puis un dessert proposés au bon moment de la commande',
      'Photos, suppléments et certains plats en réalité augmentée',
      'Réductions programmées : happy hour, offre du mardi…',
    ],
    visual: { kind: 'phone', src: '/images/landing/client-suggestion.jpg', alt: 'Une suggestion de boisson proposée pendant la commande' },
  },
  {
    id: 'service',
    goal: 'Servir plus vite',
    title: 'Moins d’attente, plus de tables servies',
    text: 'Les commandes arrivent directement en cuisine et le client paie quand il le souhaite. Votre équipe se concentre sur l’accueil.',
    points: [
      'Commandes en temps réel dans le Mode Service, avec une alerte sonore',
      'Demande d’addition ou de serveur en un geste',
      'Paiement à table par carte, Apple Pay ou Google Pay, ou à la caisse',
    ],
    visual: { kind: 'browser', src: '/images/landing/resto-service.jpg', alt: 'Le Mode Service avec les commandes en cours' },
  },
  {
    id: 'pourboires',
    goal: 'Servir plus vite',
    title: 'Des pourboires pour votre équipe',
    text: 'Le pourboire est proposé au moment de payer, en pourcentage ou en montant libre, et même après le repas.',
    points: [
      'Par carte ou ajouté au montant à régler sur place',
      'Affiché à part dans le Mode Service, hors chiffre d’affaires',
      'Vous choisissez les pourcentages proposés',
    ],
    visual: { kind: 'phone', src: '/images/landing/client-pourboire.jpg', alt: 'Le choix du pourboire au moment du paiement' },
  },
  {
    id: 'clients',
    goal: 'Ravir vos clients',
    title: 'Une carte que chacun comprend',
    text: 'Vos clients étrangers lisent la carte dans leur langue, et chacun retrouve les allergènes de chaque plat.',
    points: [
      'Carte en 5 langues : français, anglais, espagnol, chinois, russe',
      'Allergènes et régimes alimentaires indiqués sur chaque plat',
      'Suivi de la commande en direct sur le téléphone',
    ],
    visual: { kind: 'phone', src: '/images/landing/client-langues.jpg', alt: 'Le choix de la langue sur la carte' },
  },
  {
    id: 'avis',
    goal: 'Ravir vos clients',
    title: 'Plus d’avis Google, au bon moment',
    text: 'Après sa commande, le client satisfait est invité à laisser un avis sur votre fiche Google, en un clic.',
    points: [
      'Le lien vers votre fiche s’ajoute en quelques secondes',
      'L’invitation arrive quand l’expérience est encore fraîche',
    ],
    visual: { kind: 'review' },
  },
  {
    id: 'piloter',
    goal: 'Piloter sereinement',
    title: 'Vos chiffres, enfin lisibles',
    text: 'Vous savez quels plats sont regardés, commandés, et ce qu’ils vous rapportent vraiment.',
    points: [
      'Plats consultés, ajoutés au panier et commandés',
      'Marge plat par plat, avec des recommandations',
      'Stocks mis à jour à chaque commande, export de vos commandes',
    ],
    visual: { kind: 'browser', src: '/images/landing/resto-rentabilite.jpg', alt: 'L’analyse de rentabilité plat par plat' },
  },
  {
    id: 'direct',
    goal: 'Piloter sereinement',
    title: 'Vendez aussi en direct, sans commission',
    text: 'À emporter et en livraison, vos habitués commandent directement chez vous, avec le même lien.',
    points: ['Créneaux de retrait ou de livraison', 'Vos frais, votre minimum, votre seuil de livraison offerte'],
    visual: { kind: 'phone', src: '/images/landing/client-modes.jpg', alt: 'Le choix sur place, à emporter ou en livraison' },
    link: { to: '/emporter-livraison', label: 'Calculer vos économies' },
  },
];

// Comparaison par type de solution (pas de concurrent nommé), lignes regroupées par thème.
// yes : oui, no : non, partial : selon les solutions.
type Support = 'yes' | 'no' | 'partial';
const COMPARISON: { group: string; rows: { label: string; paper: Support; qr: Support }[] }[] = [
  {
    group: 'Votre carte',
    rows: [
      { label: 'Prix et plats modifiables en un instant', paper: 'no', qr: 'yes' },
      { label: 'Photos et traduction en 5 langues', paper: 'no', qr: 'partial' },
      { label: 'Ouverture d’un simple geste, sans viser', paper: 'yes', qr: 'no' },
    ],
  },
  {
    group: 'Le service',
    rows: [
      { label: 'Commande depuis la table', paper: 'no', qr: 'partial' },
      { label: 'Paiement et pourboire à table', paper: 'no', qr: 'partial' },
      { label: 'Commandes en temps réel en cuisine', paper: 'no', qr: 'partial' },
    ],
  },
  {
    group: 'Votre gestion',
    rows: [
      { label: 'Statistiques et marge par plat', paper: 'no', qr: 'partial' },
      { label: 'Invitation à laisser un avis Google', paper: 'no', qr: 'partial' },
    ],
  },
];

const COMMITMENTS = [
  { icon: '🤝', title: 'Aucune commission', text: 'Nourevo ne prélève rien sur vos ventes. Les paiements arrivent sur votre compte.' },
  { icon: '🔓', title: 'Sans engagement', text: 'Avec l’offre Liberté, vous arrêtez quand vous voulez.' },
  { icon: '🔒', title: 'Paiements sécurisés', text: 'Les paiements par carte passent par Stripe : les numéros de carte ne transitent jamais par Nourevo.' },
  { icon: '📦', title: 'Cartes NFC fournies', text: 'Livrées déjà configurées pour votre établissement.' },
  { icon: '🎁', title: '7 jours d’essai', text: 'Toutes les fonctionnalités, sur votre premier abonnement.' },
  { icon: '💬', title: 'Un contact direct', text: 'Une question ? Écrivez-nous sur WhatsApp ou par email.' },
];

function ReviewMock() {
  // Reprend l'encart réellement affiché au client après sa commande (RestaurantExperience).
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-6 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="relative rounded-3xl border border-stone-200/80 bg-white p-6 shadow-card">
        <p className="font-semibold text-stone-900">⭐ Vous appréciez Le Jardin Parisien ?</p>
        <p className="mt-1 text-sm text-stone-500">Un avis prend 30 secondes et nous aide énormément.</p>
        <span className="mt-4 inline-flex rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-2.5 text-sm font-bold text-white">
          Laisser un avis
        </span>
      </div>
      <div className="relative mx-auto -mt-3 w-[85%] rounded-b-3xl bg-white/70 px-5 pb-3 pt-5 text-center text-xs text-stone-400 shadow-soft">
        Affiché sur l’écran de suivi, après la commande
      </div>
    </div>
  );
}

function AdvantageVisual({ visual }: { visual: Visual }) {
  if (visual.kind === 'review') return <ReviewMock />;
  if (visual.kind === 'browser') {
    return (
      <div className="relative">
        <div className="absolute -inset-6 rounded-[2.5rem] bg-navy-300/15 blur-3xl" />
        <BrowserFrame src={visual.src} alt={visual.alt} className="relative" />
      </div>
    );
  }
  return (
    <div className="relative mx-auto w-full max-w-[260px]">
      <div className="absolute inset-0 m-auto h-[280px] w-[280px] rounded-full bg-navy-300/15 blur-3xl" />
      {/* Téléphone en fondu vers le bas plutôt que coupé net. */}
      <div className="relative h-[440px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_80%,transparent)]">
        <PhoneFrame src={visual.src} alt={visual.alt} />
      </div>
    </div>
  );
}

function Mark({ value, highlight = false }: { value: Support; highlight?: boolean }) {
  if (value === 'yes') {
    return (
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
          highlight ? 'bg-white text-navy-700 shadow-soft' : 'bg-emerald-100 text-emerald-700'
        }`}
      >
        ✓<span className="sr-only"> oui</span>
      </span>
    );
  }
  if (value === 'no') {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-400">
        ✕<span className="sr-only"> non</span>
      </span>
    );
  }
  return (
    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-amber-50 px-2 text-xs font-semibold text-amber-700 ring-1 ring-amber-200/70">
      <span aria-hidden="true" className="sm:hidden">
        ~
      </span>
      <span className="hidden sm:inline">Selon l’outil</span>
      <span className="sr-only sm:hidden"> selon les solutions</span>
    </span>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm leading-6 text-stone-600 sm:text-base sm:leading-7">
      <span aria-hidden="true" className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
        ✓
      </span>
      {children}
    </li>
  );
}

export function AdvantagesPage() {
  const primaryCta = usePrimaryCta();
  useEffect(() => {
    setPublicPageMeta('/avantages');
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="overflow-x-clip text-stone-900">
        <PageIntro eyebrow="Avantages" title="Ce que Nourevo change pour votre restaurant">
          Vendre mieux, servir plus vite, ravir vos clients et garder la main sur vos chiffres.
        </PageIntro>

        {/* Raccourcis vers chaque objectif */}
        <nav aria-label="Objectifs" className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-2 px-4">
          {PILLARS.map((pillar) => (
            <a
              key={pillar.href}
              href={pillar.href}
              className="flex items-center gap-2 rounded-full border border-stone-200/80 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-300/50 hover:text-navy-700"
            >
              <span aria-hidden="true">{pillar.icon}</span>
              {pillar.label}
            </a>
          ))}
        </nav>

        {/* Avantages, en alternance texte / visuel */}
        <div className="mx-auto w-full max-w-6xl space-y-24 px-4 pt-20 sm:px-8 lg:space-y-28 lg:px-10">
          {ADVANTAGES.map((item, index) => (
            <section key={item.id} id={item.id} className="scroll-mt-28">
              <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <Reveal>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-navy-500">{item.goal}</p>
                    <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-stone-900 sm:text-4xl">{item.title}</h2>
                    <p className="mt-4 text-base leading-7 text-stone-600">{item.text}</p>
                    <ul className="mt-6 space-y-3">
                      {item.points.map((point) => (
                        <Bullet key={point}>{point}</Bullet>
                      ))}
                    </ul>
                    {item.link && (
                      <Link
                        to={item.link.to}
                        className="mt-7 inline-flex text-sm font-bold text-navy-700 underline-offset-2 hover:underline"
                      >
                        {item.link.label} →
                      </Link>
                    )}
                  </Reveal>
                </div>
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <Reveal delayMs={100}>
                    <AdvantageVisual visual={item.visual} />
                  </Reveal>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Comparaison par type de solution : la colonne Nourevo est mise en avant comme une carte. */}
        <section className="mx-auto w-full max-w-4xl px-4 pt-28 sm:px-8">
          <Reveal>
            <SectionHeading eyebrow="Comparatif" title="Carte papier, menu QR ou Nourevo ?">
              Ce que chaque solution permet vraiment, du premier coup d’œil au suivi de vos chiffres.
            </SectionHeading>
          </Reveal>
          <Reveal delayMs={100}>
            <div className="relative mt-16 rounded-3xl border border-stone-200/70 bg-white shadow-soft">
              {/* Colonne Nourevo, en relief derrière les cellules (même largeur que la 4e colonne). */}
              <div aria-hidden="true" className="absolute -bottom-4 -top-6 right-0 w-[19%] rounded-3xl bg-gradient-to-b from-navy-600 via-navy-700 to-navy-900 shadow-glow sm:w-[20%]" />
              <span className="absolute -top-10 right-0 z-10 flex w-[19%] justify-center sm:w-[20%]">
                <span className="whitespace-nowrap rounded-full bg-amber-300 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-950 shadow-soft sm:text-[11px]">
                  Le plus complet
                </span>
              </span>
              <table className="relative w-full table-fixed border-collapse text-left">
                <colgroup>
                  <col className="w-[43%] sm:w-[40%]" />
                  <col className="w-[19%] sm:w-[20%]" />
                  <col className="w-[19%] sm:w-[20%]" />
                  <col className="w-[19%] sm:w-[20%]" />
                </colgroup>
                <thead>
                  <tr className="text-center text-[11px] font-semibold uppercase tracking-wide sm:text-xs">
                    <th scope="col" className="px-4 pb-4 pt-6 sm:px-6">
                      <span className="sr-only">Fonctionnalité</span>
                    </th>
                    <th scope="col" className="px-1 pb-4 pt-6 text-stone-500">
                      <span aria-hidden="true" className="mb-1 block text-xl">📄</span>
                      Carte papier
                    </th>
                    <th scope="col" className="px-1 pb-4 pt-6 text-stone-500">
                      <span aria-hidden="true" className="mb-1 block text-xl">▦</span>
                      Menu QR
                    </th>
                    <th scope="col" className="px-1 pb-4 pt-6 text-white">
                      <span aria-hidden="true" className="mb-1 block text-xl">✨</span>
                      Nourevo
                    </th>
                  </tr>
                </thead>
                {COMPARISON.map((group) => (
                  <tbody key={group.group}>
                    <tr>
                      <th
                        scope="colgroup"
                        colSpan={3}
                        className="border-t border-stone-100 bg-stone-50/70 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-navy-500 sm:px-6"
                      >
                        {group.group}
                      </th>
                      <td aria-hidden="true" />
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.label}>
                        <th scope="row" className="border-t border-stone-100 px-4 py-4 text-[13px] font-semibold leading-5 text-stone-800 sm:px-6 sm:text-sm">
                          {row.label}
                        </th>
                        <td className="border-t border-stone-100 px-1 py-4 text-center">
                          <Mark value={row.paper} />
                        </td>
                        <td className="border-t border-stone-100 px-1 py-4 text-center">
                          <Mark value={row.qr} />
                        </td>
                        <td className="border-t border-white/10 px-1 py-4 text-center">
                          <Mark value="yes" highlight />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ))}
                <tfoot>
                  <tr>
                    <td colSpan={3} className="border-t border-stone-100 px-4 py-5 text-xs text-stone-400 sm:px-6">
                      <span className="sm:hidden">~ : selon les solutions</span>
                    </td>
                    <td className="px-1 py-5 text-center">
                      <Link
                        to={primaryCta.to}
                        className="inline-flex whitespace-nowrap rounded-full bg-white px-3 py-2 text-xs font-bold text-navy-800 transition-all duration-300 hover:-translate-y-0.5 sm:px-4 sm:text-sm"
                      >
                        Essayer
                      </Link>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Reveal>
        </section>

        {/* Engagements */}
        <section className="mx-auto w-full max-w-6xl px-4 pt-28 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="Nos engagements" title="Simple, transparent, sans surprise" />
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMMITMENTS.map((item, index) => (
              <Reveal key={item.title} delayMs={(index % 3) * 80}>
                <div className="flex h-full items-start gap-4 rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-xl">
                    {item.icon}
                  </span>
                  <span>
                    <span className="block font-display font-bold text-stone-900">{item.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-stone-500">{item.text}</span>
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <CtaBand title="Offrez cette expérience à vos clients" />
      </main>
      <SiteFooter />
    </>
  );
}
