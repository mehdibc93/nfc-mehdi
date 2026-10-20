import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { BrowserFrame, NfcCard, PhoneFrame } from '../components/LandingVisuals';
import { ProductTour } from '../components/ProductTour';
import { Reveal } from '../components/Reveal';
import { CtaBand, SectionHeading, usePrimaryCta } from '../components/MarketingBlocks';
import { useAuth } from '../hooks/useAuth';
import { setPublicPageMeta } from '../lib/seo';
import { PLANS } from '../lib/plans';
import { FAQ_ITEMS } from '../lib/faq';
import { PAYMENT_LOGOS, STRIPE_LOGO } from '../lib/paymentLogos';
import { DEMO_HREF } from '../lib/site';
import { TESTIMONIALS } from '../lib/testimonials';

// Accueil pensé pour convertir : la promesse, la preuve (vidéo, vraies captures), les bénéfices,
// le fonctionnement, des mises en situation, le prix, les objections, puis l'appel à l'action.
// Les pages détaillées (avantages, fonctionnalités, emporter & livraison, carte NFC) prennent le relais.

// Réassurance sous les boutons. L'essai de 7 jours ne vaut que pour le premier abonnement et la
// carte bancaire est demandée à l'inscription (voir billing-create-checkout et la FAQ).
const HERO_TRUST = ['7 jours offerts sur votre premier abonnement', 'Aucune commission sur vos ventes', 'Aucune application pour vos clients'];

// Repères chiffrés : uniquement des faits sur l'offre, pas de résultats annoncés chez les clients.
const KEY_FACTS = [
  { value: '0 %', label: 'de commission Nourevo sur vos ventes' },
  { value: '5', label: 'langues proposées à vos clients' },
  { value: '7 jours', label: 'd’essai gratuit' },
  { value: '0', label: 'application à installer' },
];

// Bénéfices, chacun relié à des fonctionnalités réelles et à la page qui les détaille.
const BENEFITS = [
  {
    eyebrow: 'Vendre mieux',
    title: 'Plus envie de commander',
    text: 'Photos, suggestion d’une boisson puis d’un dessert au bon moment, réductions programmées.',
    image: '/images/landing/client-suggestion.jpg',
    to: '/avantages#vendre',
  },
  {
    eyebrow: 'Servir plus vite',
    title: 'Un service sans allers-retours',
    text: 'Les commandes arrivent en cuisine en temps réel, le client paie depuis sa table.',
    image: '/images/landing/resto-service.jpg',
    to: '/avantages#service',
  },
  {
    eyebrow: 'Ravir vos clients',
    title: 'Une carte que chacun comprend',
    text: 'Cinq langues, les allergènes de chaque plat, le suivi de la commande en direct.',
    image: '/images/landing/client-langues.jpg',
    to: '/avantages#clients',
  },
  {
    eyebrow: 'Vendre en direct',
    title: 'À emporter et en livraison',
    text: 'Vos habitués commandent chez vous, sans commission, avec le même lien.',
    image: '/images/landing/client-modes.jpg',
    to: '/emporter-livraison',
  },
];

const DASHBOARD_POINTS = [
  'Les commandes du jour et votre chiffre d’affaires en un coup d’œil',
  'Le Mode Service pour suivre chaque table en temps réel',
  'Votre carte, vos prix et vos stocks modifiables à tout moment',
];

// Mises en situation : des scènes types du service, présentées comme des exemples (pas des avis
// clients). Chacune ne décrit que ce que l'application fait réellement.
const SCENES = [
  {
    icon: '🌍',
    who: 'Des touristes espagnols',
    when: 'Samedi, 20 h',
    story: 'Ils ouvrent la carte en espagnol, regardent les photos, vérifient les allergènes et commandent sans appeler le serveur.',
    feature: 'Carte en 5 langues',
  },
  {
    icon: '⏱️',
    who: 'Un client en pause déjeuner',
    when: 'Mardi, 12 h 40',
    story: 'Il commande dès qu’il s’assoit et règle depuis sa table avec Apple Pay. Il repart à l’heure, sans attendre l’addition.',
    feature: 'Paiement à table',
  },
  {
    icon: '🍷',
    who: 'Une table qui hésite',
    when: 'Vendredi, 21 h',
    story: 'Au moment de valider, la carte lui suggère un verre de vin pour accompagner le plat, puis un dessert maison.',
    feature: 'Suggestions au bon moment',
  },
  {
    icon: '🧑‍🍳',
    who: 'Un serveur, un soir de rush',
    when: 'Samedi, 21 h 30',
    story: 'La table 7 demande l’addition : la demande s’affiche dans le Mode Service. Il y va directement, sans faire le tour de la salle.',
    feature: 'Mode Service',
  },
  {
    icon: '🏠',
    who: 'Un habitué du quartier',
    when: 'Dimanche, 19 h',
    story: 'Il commande à emporter depuis le lien partagé sur Instagram et choisit le créneau de 20 h 15. La commande arrive en cuisine.',
    feature: 'Emporter & livraison',
  },
  {
    icon: '📊',
    who: 'La gérante',
    when: 'Lundi, 10 h',
    story: 'Elle voit quels plats ont été les plus regardés et commandés, et ce que chacun lui rapporte. Elle ajuste un prix en une minute.',
    feature: 'Statistiques et rentabilité',
  },
];

const GUARANTEES = ['7 jours d’essai gratuit', 'Sans engagement avec l’offre Liberté', 'Cartes NFC fournies et configurées', 'Aucune commission sur vos ventes'];

// Les objections les plus fréquentes avant de se lancer (la liste complète est sur /faq).
const HOME_FAQ_QUESTIONS = [
  'Vos clients doivent-ils télécharger une application ?',
  "Ai-je besoin d'un matériel spécial ?",
  'Comment mes clients paient-ils leur commande ?',
  'Y a-t-il un engagement ?',
  'Est-ce compatible avec tous les téléphones ?',
];
const HOME_FAQ = HOME_FAQ_QUESTIONS.map((question) => FAQ_ITEMS.find((item) => item.question === question)).filter(
  (item): item is (typeof FAQ_ITEMS)[number] => Boolean(item),
);

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
        <span className={`shrink-0 text-xl text-navy-700 transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {/* Toujours dans le HTML (masqué si fermé) pour rester lisible par les moteurs de recherche. */}
      <p id={`home-faq-${index}`} hidden={!open} className="px-6 pb-5 text-sm leading-6 text-stone-500">
        {answer}
      </p>
    </div>
  );
}

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const primaryCta = usePrimaryCta();

  useEffect(() => {
    setPublicPageMeta('/');
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="relative overflow-hidden text-stone-900">
        {/* 1. La promesse + le concept montré (carte NFC + vraie carte client) */}
        <section className="relative mx-auto w-full max-w-7xl px-4 pb-12 pt-12 sm:px-8 sm:pt-16 lg:px-10 lg:pb-16">
          <div className="pointer-events-none absolute -left-32 -top-24 h-[380px] w-[380px] rounded-full bg-navy-300/15 blur-3xl" />
          <div className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10">
            <div className="space-y-7">
              <p className="inline-flex items-center gap-2 rounded-full border border-navy-300/30 bg-white/70 px-4 py-1.5 text-xs font-semibold text-navy-700">
                Carte digitale · Commande et paiement à table · Gestion du service
              </p>
              <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-stone-900 sm:text-5xl lg:text-[3.5rem]">
                Une expérience à table qui ressemble à votre restaurant.
              </h1>
              <p className="max-w-xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">
                Vos clients découvrent votre carte, commandent et paient depuis leur table, d’un simple geste sur une carte
                NFC. Vous suivez tout le service depuis un seul espace.
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
                  Essayer la démo comme un client
                </Link>
              </div>

              <div className="space-y-2">
                <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-stone-600">
                  {HERO_TRUST.map((label) => (
                    <li key={label} className="flex items-center gap-1.5">
                      <span aria-hidden="true" className="text-emerald-600">✓</span>
                      {label}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-stone-500">
                  Carte bancaire demandée à l’inscription, aucun prélèvement avant la fin de l’essai.
                </p>
              </div>
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
              <div className="absolute -right-4 bottom-24 hidden rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow-card lg:block">
                💳 Payé à table · 42,50 €
              </div>
            </div>
          </div>
        </section>

        {/* 2. Repères chiffrés */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-8 lg:px-10">
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {KEY_FACTS.map((fact) => (
              <div key={fact.label} className="rounded-3xl border border-stone-200/70 bg-white px-6 py-5 text-center shadow-soft">
                <dt className="sr-only">{fact.label}</dt>
                <dd>
                  <span className="block font-display text-3xl font-bold text-navy-800 sm:text-4xl">{fact.value}</span>
                  <span className="mt-1 block text-sm leading-5 text-stone-500">{fact.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 3. Moyens de paiement */}
        <section className="border-y border-stone-200/70 bg-white/70">
          <div className="mx-auto max-w-7xl px-4 py-10 text-center sm:px-8 lg:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Vos clients règlent comme ils en ont l’habitude
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
              <strong className="font-semibold text-stone-700">Stripe</strong>· les paiements arrivent directement sur
              votre compte
            </p>
          </div>
        </section>

        {/* 4. Les bénéfices, chacun illustré et relié à sa page détaillée */}
        <section className="mx-auto w-full max-w-7xl px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="Ce que vous y gagnez" title="Vendre mieux, servir plus vite, ravir vos clients">
              Tout ce qui se passe entre l’arrivée du client et l’encaissement, en plus simple.
            </SectionHeading>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {BENEFITS.map((item, index) => (
              <Reveal key={item.title} delayMs={(index % 2) * 100}>
                <Link
                  to={item.to}
                  className="group grid h-full overflow-hidden rounded-3xl border border-stone-200/70 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-navy-300/50 hover:shadow-card lg:grid-cols-[1fr_0.8fr]"
                >
                  <span className="flex flex-col p-7 sm:p-8">
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-navy-500">{item.eyebrow}</span>
                    <span className="mt-2 font-display text-2xl font-bold leading-tight text-stone-900">{item.title}</span>
                    <span className="mt-3 flex-1 text-sm leading-6 text-stone-500">{item.text}</span>
                    <span className="mt-6 text-sm font-bold text-navy-700">
                      En savoir plus{' '}
                      <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </span>
                  </span>
                  {/* Le haut de la capture, coupé en bas comme un écran qui dépasse de la carte. */}
                  {/* Positionnée en absolu : la capture ne fixe pas la hauteur de la carte, c'est le texte. */}
                  <span
                    aria-hidden="true"
                    className="relative h-56 overflow-hidden bg-gradient-to-br from-navy-50 via-white to-navy-100/60 lg:h-auto lg:min-h-[17rem]"
                  >
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className={`absolute top-7 max-w-none shadow-card transition-transform duration-500 group-hover:-translate-y-1 ${
                        item.image.includes('/resto-')
                          ? 'left-[8%] w-[190%] rounded-tl-xl border border-stone-200/80 sm:w-[260%] lg:w-[230%]'
                          : 'left-1/2 w-[46%] -translate-x-1/2 rounded-t-[1.6rem] border-[5px] border-b-0 border-stone-900 sm:w-[52%] lg:w-[68%]'
                      }`}
                    />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* 5. La preuve en vidéo */}
        <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <div className="relative grid items-center gap-10 overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy-600 via-navy-700 to-navy-900 p-6 shadow-glow sm:p-10 lg:grid-cols-[1fr_auto] lg:gap-16">
              <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <div className="relative text-center lg:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-navy-200">En vidéo</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Nourevo en 37 secondes</h2>
                <p className="mt-3 text-sm leading-6 text-white/75 sm:text-base">
                  Le plus simple pour comprendre, c’est de le voir. Lancez la vidéo, puis essayez la démonstration
                  vous-même, comme un client à table.
                </p>
                <div className="mt-6 flex justify-center lg:justify-start">
                  <Link
                    to={DEMO_HREF}
                    className="rounded-full bg-white px-7 py-4 text-sm font-bold text-navy-800 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Essayer la démonstration
                  </Link>
                </div>
              </div>
              <div className="relative mx-auto w-full max-w-[260px] rounded-[2.4rem] bg-stone-900 p-2 shadow-card ring-1 ring-white/10">
                {/* `#t=0.1` : affiche la première image comme aperçu, y compris sur iPhone. */}
                <video
                  src="/videos/nourevo-presentation.mp4#t=0.1"
                  controls
                  playsInline
                  preload="metadata"
                  width={720}
                  height={1280}
                  aria-label="Vidéo de présentation de Nourevo"
                  className="block aspect-[9/16] h-auto w-full rounded-[2rem] bg-stone-800 object-cover"
                />
              </div>
            </div>
          </Reveal>
        </section>

        {/* 6. Le fonctionnement, étape par étape */}
        <section id="comment-ca-marche" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="Comment ça marche" title="Un service, de la table à la cuisine">
              Ce que vivent vos clients et votre équipe, étape par étape.
            </SectionHeading>
          </Reveal>
          <div className="mt-12">
            <ProductTour />
          </div>
        </section>

        {/* 7. L'espace restaurateur, en vraie capture */}
        <section className="mx-auto w-full max-w-7xl px-4 pt-24 sm:px-8 lg:px-10">
          <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <Reveal>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-navy-500">Votre espace</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
                  Tout votre restaurant, sur un seul écran
                </h2>
                <ul className="mt-6 space-y-3">
                  {DASHBOARD_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-base leading-7 text-stone-600">
                      <span aria-hidden="true" className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                        ✓
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/decouvrir-dashboard"
                  className="mt-8 inline-flex rounded-full border border-stone-300 bg-white px-7 py-4 text-sm font-bold text-stone-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-300 hover:text-navy-700"
                >
                  Découvrir l’espace restaurateur
                </Link>
              </div>
            </Reveal>
            <Reveal delayMs={100}>
              <div className="relative">
                <div className="absolute -inset-6 rounded-[2.5rem] bg-navy-300/15 blur-3xl" />
                <BrowserFrame
                  src="/images/landing/resto-dashboard.jpg"
                  alt="L’accueil de l’espace restaurateur : commandes du jour, chiffre d’affaires, panier moyen et dernières commandes"
                  className="relative"
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* 8. Mises en situation : à quoi ressemble un service avec Nourevo (exemples, pas des avis). */}
        <section className="mx-auto w-full max-w-7xl px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="Mises en situation" title="Une semaine avec Nourevo">
              Six moments du quotidien d’un restaurant, et ce que Nourevo y change.
            </SectionHeading>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SCENES.map((scene, index) => (
              <Reveal key={scene.who} delayMs={(index % 3) * 80}>
                <figure className="flex h-full flex-col rounded-3xl border border-stone-200/70 bg-white p-7 shadow-soft">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-50 to-navy-100 text-2xl">
                      {scene.icon}
                    </span>
                    <figcaption>
                      <span className="block font-display font-bold text-stone-900">{scene.who}</span>
                      <span className="block text-xs text-stone-400">{scene.when}</span>
                    </figcaption>
                  </div>
                  <p className="mt-5 flex-1 text-[15px] leading-7 text-stone-600">{scene.story}</p>
                  <span className="mt-5 inline-flex w-fit rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-700">
                    {scene.feature}
                  </span>
                </figure>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-stone-400">
            Situations types, à titre d’illustration, sur la base des fonctionnalités de Nourevo.
          </p>
        </section>

        {/* Avis de restaurateurs : affichés seulement quand de vrais avis existent (src/lib/testimonials.ts). */}
        {TESTIMONIALS.length > 0 && (
          <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:px-8 lg:px-10">
            <Reveal>
              <SectionHeading eyebrow="Ils utilisent Nourevo" title="Ce qu’en disent les restaurateurs" />
            </Reveal>
            <div
              className={`mt-12 grid gap-5 ${TESTIMONIALS.length === 1 ? 'mx-auto max-w-2xl' : TESTIMONIALS.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}
            >
              {TESTIMONIALS.map((item, index) => (
                <Reveal key={item.name + item.restaurant} delayMs={(index % 3) * 80}>
                  <figure className="flex h-full flex-col justify-between rounded-3xl border border-stone-200/70 bg-white p-7 shadow-soft">
                    <blockquote className="text-base leading-7 text-stone-700">
                      « {item.quote} »
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3 border-t border-stone-100 pt-5">
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt=""
                          width={48}
                          height={48}
                          loading="lazy"
                          className="h-12 w-12 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800 font-display text-lg font-bold text-white"
                        >
                          {item.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span>
                        <span className="block font-semibold text-stone-900">{item.name}</span>
                        <span className="block text-sm text-stone-500">
                          {item.role}, {item.restaurant}
                          {item.city ? ` · ${item.city}` : ''}
                        </span>
                        {item.since && <span className="block text-xs text-stone-400">{item.since}</span>}
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* 9. Le prix, avec les garanties juste au-dessus des formules */}
        <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="Tarifs" title="Une offre claire, sans commission">
              Toutes les fonctionnalités dans chaque formule.
            </SectionHeading>
          </Reveal>
          <ul className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-2">
            {GUARANTEES.map((label) => (
              <li key={label} className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-sm font-semibold text-emerald-800">
                <span aria-hidden="true">✓</span>
                {label}
              </li>
            ))}
          </ul>
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
          <p className="mt-6 text-center text-sm">
            <Link to="/tarifs" className="font-semibold text-navy-700 underline-offset-2 hover:underline">
              Comparer les offres en détail →
            </Link>
          </p>
        </section>

        {/* 10. Les objections les plus fréquentes */}
        <section className="mx-auto w-full max-w-3xl px-4 pt-24 sm:px-8">
          <Reveal>
            <SectionHeading eyebrow="Questions fréquentes" title="Avant de vous lancer" />
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

        {/* 11. L'appel à l'action */}
        <CtaBand />
      </main>
      <SiteFooter />
    </>
  );
}
