import { Link, useNavigate } from 'react-router-dom';
import { PhonePreview } from '../components/PhonePreview';
import { DashboardPreview } from '../components/DashboardPreview';
import { Reveal, Transition } from '../components/Reveal';
import { useAuth } from '../hooks/useAuth';
import logoHorizontal from '../assets/logo-horizontal.png';

const DEMO_SLUG = 'le-jardin-parisien';
const WHATSAPP_HREF =
  'https://wa.me/33753924902?text=Bonjour%2C%20je%20souhaite%20commander%20une%20carte%20NFC%20pour%20mon%20restaurant.';

const HERO_STATS = ['0% commission sur les paiements', 'Configuré en moins de 15 min', '5 langues disponibles'];

const COMPARISON = [
  { label: 'Modifier un prix', paper: 'Réimpression nécessaire', nourevo: 'Modifié en quelques secondes' },
  { label: 'Photos des plats', paper: 'Aucune', nourevo: 'Une photo pour chaque plat' },
  { label: 'Suivi des ventes', paper: 'Aucun', nourevo: 'Statistiques en temps réel' },
  { label: 'Rentabilité par plat', paper: 'Impossible à connaître', nourevo: 'Calculée automatiquement' },
  { label: 'Paiement', paper: 'À la caisse uniquement', nourevo: 'Carte, Apple Pay, Google Pay à table' },
  { label: 'Langues proposées', paper: 'Une seule', nourevo: '5 langues, traduites en un clic' },
];

const STEPS = [
  {
    number: '1',
    title: 'Configurez votre carte',
    description: 'Ajoutez vos plats, vos photos et vos prix depuis votre dashboard — aucune compétence technique requise.',
  },
  {
    number: '2',
    title: 'Recevez vos cartes NFC',
    description: 'Déjà configurées pour votre restaurant, livrées chez vous, prêtes à poser sur vos tables.',
  },
  {
    number: '3',
    title: 'Vos clients commandent',
    description: 'Ils scannent, consultent la carte, commandent et paient — sans rien installer sur leur téléphone.',
  },
];

const TIMELINE = [
  { time: '08h00', icon: '🔓', text: 'Ouverture du restaurant. Le menu du jour est déjà en ligne, à jour.' },
  { time: '11h30', icon: '🍽️', text: 'Le menu du midi s\'active automatiquement, sans intervention.' },
  { time: '12h15', icon: '🧾', text: 'Les premières commandes arrivent directement en cuisine via le Mode Service.' },
  { time: '14h00', icon: '📊', text: 'Un coup d\'œil aux statistiques : plats les plus commandés, panier moyen du service.' },
  { time: '18h30', icon: '🌙', text: 'Bascule automatique vers le menu du soir.' },
  { time: '20h30', icon: '⭐', text: 'Un client laisse un avis Google pendant qu\'il patiente.' },
  { time: '22h00', icon: '🔒', text: 'Fermeture. La journée est déjà résumée dans le dashboard, sans rien noter à la main.' },
];

const FEATURE_HIGHLIGHTS = [
  {
    icon: '📊',
    color: '#0072B2',
    title: 'Sachez ce qui marche vraiment',
    description: 'Suivez les plats les plus consultés, les plus commandés et votre taux de conversion — pour décider avec des chiffres, pas au feeling.',
  },
  {
    icon: '💰',
    color: '#009E73',
    title: 'Repérez vos plats les plus rentables',
    description: 'La marge de chaque plat est calculée automatiquement, plat par plat, pour ajuster votre carte en connaissance de cause.',
  },
  {
    icon: '🍽️',
    color: '#E69F00',
    title: 'Un menu toujours à jour',
    description: 'Programmez vos menus du midi, du soir ou de la journée : ils changent automatiquement, sans y penser.',
  },
  {
    icon: '📱',
    color: '#56B4E9',
    title: 'Zéro attente, zéro erreur',
    description: 'Vos clients consultent la carte, commandent et paient directement depuis leur téléphone, sans intermédiaire.',
  },
  {
    icon: '📈',
    color: '#D55E00',
    title: 'Un panier moyen plus élevé',
    description: 'Suggestion automatique de boisson et dessert, suppléments, mise en avant des best-sellers — pensé pour augmenter naturellement chaque commande.',
  },
  {
    icon: '⭐',
    color: '#CC79A7',
    title: "Plus d'avis, plus de visibilité",
    description: "Invitez vos clients à laisser un avis Google au bon moment, pendant l'attente de leur commande.",
  },
  {
    icon: '🌍',
    color: '#4338CA',
    title: 'Accueillez une clientèle internationale',
    description: 'Votre menu traduit en 5 langues en un clic, pour ne perdre aucun client de passage.',
  },
];

const PRICING_INCLUDED = [
  'Paiement Stripe, Apple Pay, Google Pay',
  'Mode Service en direct',
  'Statistiques et rentabilité',
  'Gestion des stocks',
  'Planning des menus',
  'Code PIN sécurisé',
  'Filtres allergènes',
  'Personnalisation complète',
];

export function LandingPage() {
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-stone-900">
      <header className="sticky top-0 z-40 border-b border-stone-900/5 bg-[#f6f8fb]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div>
            <img src={logoHorizontal} alt="Nourevo" className="h-9 w-auto sm:h-10" />
            <p className="mt-1 text-xs uppercase tracking-[0.32em] text-stone-400">Carte digitale pour restaurants</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              to="/decouvrir-dashboard"
              className="hidden px-2 text-sm font-semibold text-stone-600 transition-colors duration-300 hover:text-navy-700 sm:inline-block"
            >
              Dashboard
            </Link>
            <Link
              to="/tarifs"
              className="hidden px-2 text-sm font-semibold text-stone-600 transition-colors duration-300 hover:text-navy-700 sm:inline-block"
            >
              Tarifs
            </Link>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
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
                  Aller à mon dashboard
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
                  Créer mon compte
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Découverte */}
        <section className="relative mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl items-center overflow-hidden px-4 py-14 sm:px-8 sm:py-20 lg:px-10">
          <div className="pointer-events-none absolute -left-32 -top-24 h-[380px] w-[380px] rounded-full bg-navy-300/10 blur-3xl" />
          <div className="relative grid w-full gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
            <div className="space-y-8 sm:space-y-10">
              <div className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.32em] text-stone-500">
                <span className="h-1.5 w-1.5 rounded-full bg-navy-400" />
                Votre restaurant mérite mieux qu'un simple QR Code
              </div>
              <div className="space-y-5 sm:space-y-6">
                <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-stone-900 sm:text-5xl lg:text-7xl">
                  La plateforme tout-en-un pour votre restaurant.
                </h1>
                <p className="max-w-xl text-base leading-7 text-stone-500 sm:text-lg sm:leading-8">
                  Nourevo réunit la prise de commande, le paiement, les statistiques, la rentabilité, les avis
                  clients et la gestion de votre carte — accessible d'un simple tap NFC.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Link
                  to={isAuthenticated ? '/dashboard' : '/inscription'}
                  className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-8 py-[1.125rem] text-center text-sm font-bold text-white shadow-glow transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {isAuthenticated ? 'Aller à mon dashboard' : 'Créer mon compte'}
                </Link>
                <Link
                  to={`/r/${DEMO_SLUG}?demo=1`}
                  className="rounded-full border border-stone-200/70 bg-white/60 px-6 py-4 text-center text-sm text-stone-500 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700"
                >
                  Voir la démo « Le Jardin Parisien »
                </Link>
              </div>

              <p className="text-sm text-stone-400">
                Plan <Link to="/tarifs" className="font-semibold text-navy-700 underline-offset-2 hover:underline">sans engagement</Link> disponible dès 59€/mois.
              </p>

              <Link
                to="/decouvrir-dashboard"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 underline-offset-2 hover:underline"
              >
                🔎 Découvrir le dashboard restaurateur
              </Link>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-stone-400">
                {HERO_STATS.map((label) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-navy-400" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute inset-0 mx-auto h-[320px] w-[320px] rounded-full bg-navy-300/8 blur-3xl sm:h-[430px] sm:w-[430px]" />
              <div className="relative w-full max-w-[420px]">
                <PhonePreview restaurantName="Votre Restaurant" />
              </div>
            </div>
          </div>
        </section>

        <Transition>Voici ce que ça change, concrètement.</Transition>

        {/* Menu papier VS Nourevo */}
        <div className="bg-gradient-to-b from-stone-50 to-transparent">
          <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-16 sm:px-8 lg:px-10">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">La différence Nourevo</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
                  Le menu papier a fait son temps.
                </h2>
                <p className="mt-3 text-sm leading-6 text-stone-500 sm:text-base">
                  Prix à réimprimer, plats rentables inconnus, service interrompu pour prendre une commande à la
                  voix : la carte papier vous coûte du temps et de l'argent, chaque jour.
                </p>
              </div>
            </Reveal>
            <Reveal delayMs={100}>
              <div className="mt-10 overflow-hidden rounded-3xl border border-stone-200/70 bg-white shadow-soft">
                <div className="hidden grid-cols-3 gap-4 border-b border-stone-200/70 bg-stone-50 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-stone-400 sm:grid">
                  <span />
                  <span>Menu papier</span>
                  <span>Avec Nourevo</span>
                </div>
                <div className="divide-y divide-stone-100">
                  {COMPARISON.map((row) => (
                    <div key={row.label} className="grid grid-cols-1 gap-2 px-6 py-5 sm:grid-cols-3 sm:items-center sm:gap-4">
                      <span className="text-sm font-bold text-stone-800">{row.label}</span>
                      <span className="flex items-center gap-2 text-sm text-stone-400">
                        <span className="text-rose-400">✕</span> {row.paper}
                      </span>
                      <span className="flex items-center gap-2 rounded-xl bg-emerald-50/60 px-3 py-1.5 text-sm font-semibold text-navy-700 sm:bg-transparent sm:px-0 sm:py-0">
                        <span className="text-emerald-600">✓</span> {row.nourevo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </section>
        </div>

        <Transition>Passer à Nourevo prend moins de 15 minutes.</Transition>

        {/* Configuration en 3 étapes */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-4 pt-16 sm:px-8 lg:px-10">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">Comment ça fonctionne</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
                Configuration en 3 étapes
              </h2>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <Reveal key={step.number} delayMs={index * 100}>
                <div className="h-full rounded-3xl border border-stone-200/70 bg-white p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(17,30,48,0.1)]">
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

        <Transition>Une fois configuré, voici à quoi ressemble une journée type.</Transition>

        {/* Une journée avec Nourevo */}
        <section className="mx-auto w-full max-w-4xl px-4 pb-4 pt-16 sm:px-8 lg:px-10">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">En pratique</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
                Une journée avec Nourevo
              </h2>
            </div>
          </Reveal>
          <div className="relative mt-12 border-l-2 border-stone-200 pl-8 sm:pl-10">
            {TIMELINE.map((item, index) => (
              <Reveal key={item.time} delayMs={index * 60}>
                <div className="relative pb-9 last:pb-0">
                  <span className="absolute -left-[45px] top-0 flex h-8 w-8 items-center justify-center rounded-full border-4 border-[#f6f8fb] bg-white text-sm shadow-soft sm:-left-[53px]">
                    {item.icon}
                  </span>
                  <span className="font-display text-sm font-bold text-navy-700">{item.time}</span>
                  <p className="mt-1 text-sm leading-6 text-stone-600 sm:text-base">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <Transition>Tout ça, piloté depuis un seul endroit : votre dashboard.</Transition>

        {/* Dashboard */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-4 pt-16 sm:px-8 lg:px-10">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">Votre espace de gestion</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
                Un dashboard pensé pour les restaurateurs
              </h2>
              <p className="mt-3 text-sm leading-6 text-stone-500 sm:text-base">
                Carte, commandes, paiements, statistiques, rentabilité : tout se pilote au même endroit, sans jongler
                entre plusieurs outils.
              </p>
            </div>
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
                className="rounded-full border border-stone-200/70 bg-white px-6 py-3.5 text-sm font-bold text-navy-700 shadow-soft transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-navy-300/40 hover:shadow-lg"
              >
                🔎 Découvrir tout le dashboard →
              </Link>
            </div>
          </Reveal>
        </section>

        <Transition>Chaque espace du dashboard a un rôle précis.</Transition>

        {/* Pourquoi choisir Nourevo */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-4 pt-16 sm:px-8 lg:px-10">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">Pourquoi choisir Nourevo</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
                Une plateforme, pas juste une carte.
              </h2>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_HIGHLIGHTS.map((feature, index) => (
              <Reveal key={feature.title} delayMs={(index % 3) * 80}>
                <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200/70 bg-gradient-to-b from-white to-stone-50/70 p-6 shadow-[0_2px_14px_rgba(17,30,48,0.05)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_44px_rgba(17,30,48,0.13)]">
                  <span className="absolute inset-x-0 top-0 h-1" style={{ background: feature.color }} />
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${feature.color}3d, ${feature.color}12)` }}
                  >
                    {feature.icon}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-stone-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-500">{feature.description}</p>
                  <Link
                    to="/decouvrir-dashboard"
                    className="mt-auto pt-4 text-sm font-semibold text-navy-700 underline-offset-2 hover:underline"
                  >
                    En savoir plus →
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <Transition>Reste la question du prix.</Transition>

        {/* Tarif */}
        <section className="mx-auto w-full max-w-4xl px-4 pb-4 pt-16 sm:px-8 lg:px-10">
          <Reveal>
            <div className="rounded-3xl border border-stone-200/70 bg-white p-8 text-center shadow-soft sm:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">Tarif</p>
              <div className="mt-3 flex items-end justify-center gap-1.5">
                <span className="font-display text-6xl font-bold leading-none text-navy-800 sm:text-7xl">54€</span>
                <span className="pb-1.5 text-lg font-semibold text-stone-400 sm:pb-2">/mois</span>
              </div>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-navy-700">
                Soit moins de 2€ par jour
              </p>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-stone-500 sm:text-base">
                Le prix d'un café, pour toute une plateforme de gestion.
              </p>
              <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-3 text-left sm:grid-cols-2">
                {PRICING_INCLUDED.map((item) => (
                  <span key={item} className="flex items-center gap-2 text-sm text-stone-600">
                    <span className="text-emerald-600">✅</span>
                    {item}
                  </span>
                ))}
              </div>
              <Link
                to="/tarifs"
                className="mt-8 inline-flex rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-8 py-4 text-sm font-bold text-white shadow-glow transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
              >
                Voir tous les tarifs
              </Link>
            </div>
          </Reveal>
        </section>

        {/* CTA final */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-20 pt-16 sm:px-8 lg:px-10">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-600 via-navy-700 to-navy-900 p-10 text-center shadow-glow sm:p-14">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
              <div className="relative flex flex-col items-center gap-5">
                <h2 className="font-display text-2xl font-bold text-white sm:text-4xl">
                  Tout ce dont votre restaurant a besoin, dans une seule plateforme.
                </h2>
                <p className="max-w-xl text-sm text-white/80 sm:text-base">
                  Créez votre compte et composez votre carte en quelques minutes.
                </p>
                <Link
                  to={isAuthenticated ? '/dashboard' : '/inscription'}
                  className="rounded-full bg-white px-8 py-4 text-sm font-bold text-navy-800 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {isAuthenticated ? 'Aller à mon dashboard' : 'Créer mon restaurant'}
                </Link>
                <Link to="/faq" className="text-xs font-semibold text-white/70 underline-offset-2 hover:underline">
                  Une question ? Consultez notre FAQ →
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Carte NFC physique */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-8 lg:px-10">
          <Reveal>
            <div className="flex flex-col items-start gap-6 rounded-3xl border border-stone-200/70 bg-white p-8 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">Carte NFC physique</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-stone-900 sm:text-3xl">
                  Prêt à équiper vos tables ?
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-stone-500 sm:text-base">
                  Recevez vos cartes déjà configurées pour votre restaurant — il ne vous reste plus qu'à les poser
                  sur vos tables.
                </p>
                <div className="mt-3 flex flex-col gap-1 text-sm leading-6 text-stone-500 sm:text-base">
                  <span>📦 Livraison en France sous 2 à 4 jours ouvrés.</span>
                  <span>🤝 Remise en main propre possible en Île-de-France.</span>
                </div>
              </div>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noreferrer"
                className="flex shrink-0 items-center gap-2.5 rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-6 py-4 text-sm font-bold text-white shadow-glow transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
              >
                💬 Commander sur WhatsApp
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-stone-900/5 px-4 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-stone-400 sm:flex-row">
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
