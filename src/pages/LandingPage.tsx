import { useEffect } from 'react';
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
import { PAYMENT_LOGOS, STRIPE_LOGO } from '../lib/paymentLogos';
import { DEMO_HREF } from '../lib/site';
import { TESTIMONIALS } from '../lib/testimonials';

// L'accueil reste court : la promesse, le concept en vidéo et en images, puis une porte d'entrée
// vers chaque page détaillée (fonctionnalités, emporter & livraison, carte NFC) et les tarifs.

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

const DASHBOARD_POINTS = [
  'Les commandes du jour et votre chiffre d’affaires en un coup d’œil',
  'Le Mode Service pour suivre chaque table en temps réel',
  'Votre carte, vos prix et vos stocks modifiables à tout moment',
];

const EXPLORE = [
  {
    to: '/fonctionnalites',
    icon: '🧭',
    title: 'Fonctionnalités',
    text: 'Commandes, paiement, stocks, statistiques : ce qui change pour votre équipe.',
    image: '/images/landing/resto-service.jpg',
  },
  {
    to: '/emporter-livraison',
    icon: '🛵',
    title: 'Emporter & livraison',
    text: 'Vos clients commandent en direct, sans commission. Calculez vos économies.',
    image: '/images/landing/client-modes.jpg',
  },
  {
    to: '/carte-nfc',
    icon: '📲',
    title: 'La carte NFC',
    text: 'Un geste du téléphone, sans application ni QR code. Livrée prête à poser.',
    image: null,
  },
];

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
        {/* Haut de page : la promesse + le concept montré (carte NFC + vraie carte client) */}
        <section className="relative mx-auto w-full max-w-7xl px-4 pb-12 pt-12 sm:px-8 sm:pt-16 lg:px-10 lg:pb-16">
          <div className="pointer-events-none absolute -left-32 -top-24 h-[380px] w-[380px] rounded-full bg-navy-300/15 blur-3xl" />
          <div className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10">
            <div className="space-y-7">
              <p className="inline-flex items-center gap-2 rounded-full border border-navy-300/30 bg-white/70 px-4 py-1.5 text-xs font-semibold text-navy-700">
                Carte digitale · Commande à table · Gestion simplifiée
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
                  Découvrir la démonstration
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
            </div>
          </div>
        </section>

        {/* Repères chiffrés */}
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

        {/* Moyens de paiement */}
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

        {/* Vidéo de présentation (format vertical). Elle a du son : lecture à la demande. */}
        <section className="mx-auto w-full max-w-6xl px-4 pt-20 sm:px-8 lg:px-10">
          <Reveal>
            <div className="grid items-center gap-10 rounded-[2rem] border border-stone-200/70 bg-white p-6 shadow-soft sm:p-10 lg:grid-cols-[1fr_auto] lg:gap-16">
              <div className="text-center lg:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-navy-500">En vidéo</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-stone-900 sm:text-4xl">Nourevo en 37 secondes</h2>
                <p className="mt-3 text-sm leading-6 text-stone-500 sm:text-base">
                  Le plus simple pour comprendre, c’est de le voir. Lancez la vidéo, puis essayez la démonstration
                  vous-même, comme un client à table.
                </p>
                <div className="mt-6 flex justify-center lg:justify-start">
                  <Link
                    to={DEMO_HREF}
                    className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-7 py-4 text-sm font-bold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5"
                  >
                    Essayer la démonstration
                  </Link>
                </div>
              </div>
              <div className="mx-auto w-full max-w-[280px] rounded-[2.4rem] bg-stone-900 p-2 shadow-card ring-1 ring-black/10">
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

        {/* Démonstration : le principe, montré plutôt qu'expliqué */}
        <section id="comment-ca-marche" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 pt-20 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="Comment ça marche" title="Un service, de la table à la cuisine">
              Ce que vivent vos clients et votre équipe, étape par étape.
            </SectionHeading>
          </Reveal>
          <div className="mt-12">
            <ProductTour />
          </div>
        </section>

        {/* L'espace restaurateur, en vraie capture */}
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

        {/* Portes d'entrée vers les pages détaillées */}
        <section className="mx-auto w-full max-w-7xl px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="En savoir plus" title="Explorez Nourevo" />
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {EXPLORE.map((item, index) => (
              <Reveal key={item.to} delayMs={index * 80}>
                <Link
                  to={item.to}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200/70 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-navy-300/50 hover:shadow-card"
                >
                  {/* Aperçu visuel de la page */}
                  {/* Le haut de la capture, coupé en bas comme un écran qui dépasse de la carte. */}
                  <span
                    aria-hidden="true"
                    className={`relative flex h-48 justify-center overflow-hidden bg-gradient-to-br from-navy-50 via-white to-navy-100/60 ${
                      item.image ? 'items-start pt-7' : 'items-center'
                    }`}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className={`relative shadow-card transition-transform duration-500 group-hover:-translate-y-1 ${
                          item.image.includes('/resto-')
                            ? 'w-[88%] rounded-t-xl border border-stone-200/80'
                            : 'w-[50%] rounded-t-[1.6rem] border-[5px] border-b-0 border-stone-900'
                        }`}
                      />
                    ) : (
                      <span className="block w-[58%] -rotate-6 transition-transform duration-500 group-hover:-rotate-3">
                        <NfcCard compact />
                      </span>
                    )}
                  </span>
                  <span className="flex flex-1 flex-col p-7">
                    <span className="flex items-center gap-2 font-display text-xl font-bold text-stone-900">
                      <span aria-hidden="true">{item.icon}</span>
                      {item.title}
                    </span>
                    <span className="mt-2 flex-1 text-sm leading-6 text-stone-500">{item.text}</span>
                    <span className="mt-5 text-sm font-bold text-navy-700">
                      Découvrir <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
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

        {/* Tarifs */}
        <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="Tarifs" title="Une offre claire, sans commission">
              Toutes les fonctionnalités dans chaque formule, cartes NFC fournies, 7 jours d’essai gratuit.
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
            <span className="mx-2 text-stone-300">·</span>
            <Link to="/faq" className="font-semibold text-navy-700 underline-offset-2 hover:underline">
              Questions fréquentes →
            </Link>
          </p>
        </section>

        <CtaBand />
      </main>
      <SiteFooter />
    </>
  );
}
