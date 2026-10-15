import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SiteFooter } from '../components/SiteFooter';
import { NfcCard, PhoneFrame } from '../components/LandingVisuals';
import { ProductTour } from '../components/ProductTour';
import { FeatureExplorer } from '../components/FeatureExplorer';
import { Reveal } from '../components/Reveal';
import { useAuth } from '../hooks/useAuth';
import logoHorizontal from '../assets/logo-horizontal.png';
import { setPublicPageMeta } from '../lib/seo';
import { PLANS } from '../lib/plans';
import { FAQ_ITEMS } from '../lib/faq';
import { PAYMENT_LOGOS, STRIPE_LOGO } from '../lib/paymentLogos';
import { CONTACT_EMAIL } from '../lib/site';
import { DeliveryCommissionCalculator } from '../components/DeliveryCommissionCalculator';
import { TESTIMONIALS } from '../lib/testimonials';

const DEMO_HREF = '/r/le-jardin-parisien?demo=1';
const WHATSAPP_HREF =
  'https://wa.me/33753924902?text=Bonjour%2C%20je%20souhaite%20commander%20une%20carte%20NFC%20pour%20mon%20restaurant.';

// Ce que voit le visiteur juste sous la promesse : trois bénéfices concrets, sans chiffre de
// performance (aucune statistique non mesurée chez les clients Nourevo).
const HERO_BENEFITS = [
  { icon: '🎨', text: 'Une carte digitale à vos couleurs, avec vos photos et votre vidéo d’accueil.' },
  { icon: '✨', text: 'Vos plats, vos boissons et vos desserts mis en valeur au bon moment.' },
  { icon: '🧭', text: 'Les commandes, la carte et vos chiffres réunis dans un seul espace.' },
];

// Réassurance sous les boutons. L'essai de 7 jours ne vaut que pour le premier abonnement et la
// carte bancaire est demandée à l'inscription (voir billing-create-checkout et la FAQ).
const HERO_TRUST = ['7 jours offerts sur votre premier abonnement', 'Aucune commission sur vos ventes', 'Aucune application pour vos clients'];

// « Ce qui change au quotidien » : avant / avec Nourevo. Pas des avis : des situations du service,
// chacune liée à une fonctionnalité réelle (Mode Service, demandes de table, stock, rentabilité...).
const DAILY_CHANGES = [
  {
    icon: '🔔',
    before: 'Les commandes passent de main en main avant d’arriver en cuisine.',
    after: 'Les commandes arrivent directement dans le Mode Service, avec une alerte sonore.',
  },
  {
    icon: '💳',
    before: 'Vos clients attendent l’addition pour pouvoir partir.',
    after: 'Vos clients règlent depuis leur table, par carte ou à la caisse, quand ils le souhaitent.',
  },
  {
    icon: '🙋',
    before: 'On fait le tour de la salle pour savoir qui a besoin de quoi.',
    after: 'Une demande d’addition ou de serveur s’affiche aussitôt dans le Mode Service.',
  },
  {
    icon: '📦',
    before: 'Un plat épuisé est annoncé au client après sa commande.',
    after: 'Le stock se met à jour à chaque commande ; à zéro, le plat n’est plus proposé.',
  },
  {
    icon: '✏️',
    before: 'Un prix ou un plat qui change, et la carte papier est à réimprimer.',
    after: 'Vous modifiez votre carte en quelques secondes, en ligne aussitôt.',
  },
  {
    icon: '📈',
    before: 'Difficile de savoir quels plats rapportent vraiment.',
    after: 'Les plats les plus consultés, les plus commandés et leur marge, au même endroit.',
  },
];

const NFC_VS_QR = [
  { label: 'Pour ouvrir la carte', qr: 'Ouvrir l’appareil photo, viser, attendre la mise au point', nfc: 'Un simple geste du téléphone sur la carte' },
  { label: 'En salle peu éclairée ou en terrasse', qr: 'Les reflets et la pénombre gênent parfois la lecture', nfc: 'Fonctionne quelle que soit la lumière' },
  { label: 'Sur vos tables', qr: 'Souvent un autocollant standard', nfc: 'Une carte soignée, posée sur la table' },
  { label: 'Une fois la carte ouverte', qr: 'Selon les solutions, une simple carte à consulter', nfc: 'Commande, paiement, pourboire et suivi de la commande' },
];

// Mise en place, résumée au-dessus des tarifs.
const SETUP_STEPS = ['Composez votre carte', 'Recevez vos cartes NFC', 'Accueillez vos premières commandes'];

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
    : { to: '/inscription', label: 'Commencer l’essai gratuit' };

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
                Carte digitale · Commande à table · Gestion simplifiée
              </p>
              <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-stone-900 sm:text-5xl lg:text-[3.5rem]">
                Une expérience à table qui ressemble à votre restaurant.
              </h1>
              <p className="max-w-xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">
                Avec Nourevo, vos clients découvrent votre carte, commandent et paient depuis leur table, d’un simple geste
                sur une carte NFC et sans application à installer. Vous retrouvez, de votre côté, tout ce qu’il faut pour
                suivre le service et faire vivre votre carte.
              </p>

              <ul className="space-y-2.5">
                {HERO_BENEFITS.map((benefit) => (
                  <li key={benefit.icon} className="flex items-start gap-3 text-sm leading-6 text-stone-700 sm:text-base">
                    <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-soft">
                      {benefit.icon}
                    </span>
                    <span className="pt-1">{benefit.text}</span>
                  </li>
                ))}
              </ul>

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
              Voici, étape par étape, ce que vivent vos clients et votre équipe. Les images sont issues de
              l’application, sur notre restaurant de démonstration.
            </SectionHeading>
          </Reveal>
          <div className="mt-12">
            <ProductTour />
          </div>
          <div className="mt-8 flex justify-center">
            <Link
              to={DEMO_HREF}
              className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-7 py-4 text-sm font-bold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5"
            >
              Parcourir la démonstration comme un client
            </Link>
          </div>
        </section>

        {/* Ce qui change au quotidien */}
        <section className="mx-auto w-full max-w-7xl px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="Au quotidien" title="Ce qui change pour votre équipe">
              Une carte à vos couleurs, aucune commission sur vos ventes, et pour votre équipe : moins
              d’allers-retours, moins de ressaisie, plus de temps pour vos clients.
            </SectionHeading>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DAILY_CHANGES.map((item, index) => (
              <Reveal key={item.icon} delayMs={(index % 3) * 80}>
                <div className="flex h-full flex-col rounded-3xl border border-stone-200/70 bg-white p-7 shadow-soft">
                  <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-2xl">
                    {item.icon}
                  </span>
                  <p className="mt-5 text-sm leading-6 text-stone-400">
                    <span className="font-semibold uppercase tracking-[0.18em] text-[11px] text-stone-400">Avant · </span>
                    {item.before}
                  </p>
                  <p className="mt-3 font-display text-lg font-bold leading-snug text-stone-900">{item.after}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Fonctionnalités, à découvrir en cliquant */}
        <section id="fonctionnalites" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="Fonctionnalités" title="Un outil pensé pour le quotidien du service">
              Choisissez un point de vue, puis une fonctionnalité : l’écran correspondant s’affiche.
            </SectionHeading>
          </Reveal>
          <div className="mt-10">
            <FeatureExplorer />
          </div>
        </section>

        {/* Vente à emporter et livraison */}
        <section className="mx-auto w-full max-w-7xl px-4 pt-24 sm:px-8 lg:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal>
              {/* Téléphone en fondu vers le bas plutôt que coupé net. */}
              <div className="relative mx-auto w-full max-w-[280px]">
                <div className="absolute inset-0 m-auto h-[300px] w-[300px] rounded-full bg-navy-300/15 blur-3xl" />
                <div className="relative h-[460px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_75%,transparent)]">
                  <PhoneFrame src="/images/landing/client-modes.jpg" alt="Le client choisit sur place, à emporter ou en livraison" />
                </div>
              </div>
            </Reveal>
            <Reveal delayMs={100}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-navy-500">Vente à emporter & livraison</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
                  Votre carte, aussi pour ceux qui commandent depuis chez eux.
                </h2>
                <p className="mt-4 text-base leading-7 text-stone-600">
                  Partagez votre lien de commande sur votre site, votre fiche Google ou vos réseaux. Vos habitués
                  commandent en direct, en complément des plateformes de livraison, et les commandes rejoignent votre Mode
                  Service.
                </p>
                <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    { icon: '🥡', title: 'À emporter, sur créneau', text: 'Le client choisit son heure de retrait et paie en ligne ou au comptoir.' },
                    { icon: '🛵', title: 'Votre propre livraison', text: 'Vous fixez vos frais, votre minimum et le seuil de livraison offerte.' },
                    { icon: '💝', title: 'Des pourboires pour l’équipe', text: 'Proposés au paiement, par carte ou à la caisse, et après le repas.' },
                    { icon: '🔗', title: 'Un simple lien', text: 'Aucune application à télécharger pour vos clients.' },
                  ].map((item) => (
                    <li key={item.title} className="flex gap-3 rounded-2xl border border-stone-200/70 bg-white p-4 shadow-soft">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-xl">{item.icon}</span>
                      <span>
                        <span className="block font-semibold text-stone-900">{item.title}</span>
                        <span className="mt-0.5 block text-sm leading-6 text-stone-500">{item.text}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
          <Reveal delayMs={100}>
            <div className="mt-14">
              <DeliveryCommissionCalculator />
            </div>
          </Reveal>
        </section>

        {/* NFC ou QR code */}
        <section id="carte-nfc" className="mx-auto w-full max-w-5xl scroll-mt-24 px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="La carte NFC" title="Pourquoi une carte NFC sur vos tables ?">
              Le QR code a rendu de grands services. La carte NFC offre un geste plus simple et une présentation plus
              soignée.
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
          <Reveal delayMs={100}>
            <div className="mt-6 flex flex-col items-start gap-6 rounded-3xl bg-gradient-to-br from-navy-50 to-white p-7 ring-1 ring-navy-100 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="flex items-center gap-6">
                <NfcCard compact className="hidden w-40 shrink-0 sm:block" />
                <div>
                  <h3 className="font-display text-xl font-bold text-stone-900">Des cartes prêtes à poser sur vos tables</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Elles arrivent déjà configurées pour votre restaurant. Livraison en France sous 2 à 4 jours ouvrés,
                    remise en main propre possible en Île-de-France.
                  </p>
                </div>
              </div>
              <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:items-end">
                <a
                  href={WHATSAPP_HREF}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
                >
                  💬 Commander sur WhatsApp
                </a>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-center text-sm font-semibold text-navy-700 underline-offset-2 hover:underline sm:text-right"
                >
                  ou par email : {CONTACT_EMAIL}
                </a>
              </div>
            </div>
          </Reveal>
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
              Toutes les fonctionnalités dans chaque formule, cartes NFC fournies et 7 jours d’essai gratuit sur votre
              premier abonnement. Avec l’offre annuelle, cela représente environ 1,61 € par jour.
            </SectionHeading>
          </Reveal>
          <ol className="mx-auto mt-8 flex max-w-4xl flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center">
            {SETUP_STEPS.map((step, index) => (
              <li key={step} className="flex items-center gap-2 sm:contents">
                <span className="flex flex-1 items-center gap-2.5 rounded-full border border-stone-200/70 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-soft sm:flex-none">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  {step}
                </span>
                {index < SETUP_STEPS.length - 1 && (
                  <span aria-hidden="true" className="hidden text-stone-300 sm:inline">
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
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
            <SectionHeading eyebrow="Questions fréquentes" title="Les questions que l’on nous pose souvent" />
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
        <section className="mx-auto w-full max-w-7xl px-4 pb-20 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-600 via-navy-700 to-navy-900 p-10 text-center shadow-glow sm:p-14">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="relative flex flex-col items-center gap-5">
                <h2 className="max-w-3xl font-display text-2xl font-bold text-white sm:text-4xl">
                  Et si vous découvriez Nourevo avec votre propre carte ?
                </h2>
                <p className="max-w-xl text-sm text-white/80 sm:text-base">
                  Essayez-le gratuitement pendant 7 jours, ou parcourez d’abord la démonstration de notre restaurant Le
                  Jardin Parisien.
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
                    Découvrir la démonstration
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
