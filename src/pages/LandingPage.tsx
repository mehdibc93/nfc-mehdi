import { Link, useNavigate } from 'react-router-dom';
import { PhonePreview } from '../components/PhonePreview';
import { useAuth } from '../hooks/useAuth';
import logoHorizontal from '../assets/logo-horizontal.png';

const DEMO_SLUG = 'le-jardin-parisien';

const FEATURE_HIGHLIGHTS = [
  {
    icon: '📊',
    title: 'Statistiques détaillées',
    description: 'Suivez les plats les plus consultés, les plus commandés et votre taux de conversion.',
  },
  {
    icon: '💰',
    title: 'Analyse de rentabilité',
    description: 'Visualisez la marge de chaque plat et identifiez les plus rentables.',
  },
  {
    icon: '🍽️',
    title: 'Menus intelligents',
    description: 'Programmez automatiquement vos menus du midi, du soir ou toute la journée.',
  },
  {
    icon: '📱',
    title: 'Commande à table',
    description: 'Vos clients consultent la carte, commandent et paient directement depuis leur téléphone.',
  },
  {
    icon: '⭐',
    title: "Plus d'avis Google",
    description: 'Invitez vos clients à laisser un avis au bon moment, pendant l\'attente de leur commande.',
  },
  {
    icon: '🌍',
    title: 'Traduction automatique',
    description: 'Votre menu disponible en plusieurs langues pour accueillir une clientèle internationale.',
  },
];

const FEATURE_CHECKLIST = [
  'Paiement Stripe',
  'Apple Pay',
  'Google Pay',
  'Mode Service en direct',
  'Gestion des tables',
  'Suivi des commandes',
  'Gestion des stocks',
  'Planning des menus',
  'Code PIN sécurisé',
  'Filtres allergènes',
  'Export des commandes',
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
        <section className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl items-center px-4 py-14 sm:px-8 sm:py-20 lg:px-10">
          <div className="grid w-full gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
            <div className="space-y-8 sm:space-y-10">
              <div className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.32em] text-stone-500">
                <span className="h-1.5 w-1.5 rounded-full bg-navy-400" />
                Bien plus qu'un simple menu digital
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
                  to={`/r/${DEMO_SLUG}`}
                  className="rounded-full border border-stone-200/70 bg-white/60 px-6 py-4 text-center text-sm text-stone-500 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700"
                >
                  Voir la démo « Le Jardin Parisien »
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-stone-400">
                {['Inscription rapide', 'Carte gérée par vous', 'Lien unique par tag NFC'].map((label) => (
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

        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">Pourquoi choisir Nourevo</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
              Une plateforme, pas juste une carte.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_HIGHLIGHTS.map((feature) => (
              <div key={feature.title} className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
                <span className="text-2xl">{feature.icon}</span>
                <h3 className="mt-3 font-display text-lg font-bold text-stone-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-8 lg:px-10">
          <div className="rounded-3xl border border-stone-200/70 bg-white p-8 shadow-soft sm:p-10">
            <h2 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">
              Tout ce dont votre restaurant a besoin
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {FEATURE_CHECKLIST.map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm text-stone-600 sm:text-base">
                  <span className="text-emerald-600">✅</span>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-8 lg:px-10">
          <div className="flex flex-col items-center gap-5 rounded-3xl bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 p-10 text-center shadow-glow sm:p-14">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Prêt à passer à l'étape suivante ?
            </h2>
            <p className="max-w-xl text-sm text-white/80 sm:text-base">
              Créez votre compte et composez votre carte en quelques minutes — sans engagement pour commencer.
            </p>
            <Link
              to={isAuthenticated ? '/dashboard' : '/inscription'}
              className="rounded-full bg-white px-8 py-4 text-sm font-bold text-navy-800 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
            >
              {isAuthenticated ? 'Aller à mon dashboard' : 'Créer mon compte'}
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-8 lg:px-10">
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
              href="https://wa.me/33753924902?text=Bonjour%2C%20je%20souhaite%20commander%20une%20carte%20NFC%20pour%20mon%20restaurant."
              target="_blank"
              rel="noreferrer"
              className="flex shrink-0 items-center gap-2.5 rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-6 py-4 text-sm font-bold text-white shadow-glow transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
            >
              💬 Commander sur WhatsApp
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-900/5 px-4 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-stone-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Nourevo</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
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
