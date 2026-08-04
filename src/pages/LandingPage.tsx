import { Link, useNavigate } from 'react-router-dom';
import { PhonePreview } from '../components/PhonePreview';
import { useAuth } from '../hooks/useAuth';
import logoHorizontal from '../assets/logo-horizontal.png';

const DEMO_SLUG = 'le-jardin-parisien';

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
                Nourevo
              </div>
              <div className="space-y-5 sm:space-y-6">
                <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-stone-900 sm:text-5xl lg:text-7xl">
                  Une carte digitale que vos clients scannent en un geste.
                </h1>
                <p className="max-w-xl text-base leading-7 text-stone-500 sm:text-lg sm:leading-8">
                  Composez votre carte, associez-la à un tag, et laissez vos clients commander en scannant.
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
