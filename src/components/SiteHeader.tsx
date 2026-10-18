import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import logoHorizontal from '../assets/logo-horizontal.png';
import { useAuth } from '../hooks/useAuth';

const WHATSAPP_HREF =
  'https://wa.me/33753924902?text=Bonjour%2C%20je%20souhaite%20en%20savoir%20plus%20sur%20Nourevo.';

export const SITE_NAV = [
  { to: '/fonctionnalites', label: 'Fonctionnalités' },
  { to: '/emporter-livraison', label: 'Emporter & livraison' },
  { to: '/carte-nfc', label: 'Carte NFC' },
  { to: '/tarifs', label: 'Tarifs' },
  { to: '/faq', label: 'FAQ' },
];

// En-tête commun aux pages publiques : navigation entre les pages, et menu déroulant sur mobile.
export function SiteHeader() {
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-300 ${
      isActive ? 'bg-navy-50 text-navy-700' : 'text-stone-600 hover:text-navy-700'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-900/5 bg-[#f6f8fb]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-8 lg:px-10">
        <Link to="/" aria-label="Nourevo — accueil" className="shrink-0">
          <img src={logoHorizontal} alt="Nourevo" className="h-8 w-auto sm:h-9" />
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
          {SITE_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 xl:flex"
          >
            💬 WhatsApp
          </a>
          {isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700 sm:block"
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
                className="hidden rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700 sm:block"
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
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 lg:hidden"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              {menuOpen ? '✕' : '☰'}
            </span>
          </button>
        </div>
      </div>

      {/* Menu mobile : présent dans le HTML (masqué) pour que les liens restent visibles des moteurs. */}
      <nav
        id="site-menu"
        aria-label="Navigation principale (mobile)"
        hidden={!menuOpen}
        className="border-t border-stone-900/5 bg-white px-4 pb-5 pt-2 sm:px-8 lg:hidden"
      >
        <ul className="space-y-1">
          {SITE_NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-base font-semibold ${isActive ? 'bg-navy-50 text-navy-700' : 'text-stone-700'}`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-col gap-2 border-t border-stone-100 pt-4">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-stone-200 px-4 py-3 text-sm font-semibold text-stone-700"
            >
              Déconnexion
            </button>
          ) : (
            <Link
              to="/connexion"
              onClick={() => setMenuOpen(false)}
              className="rounded-full border border-stone-200 px-4 py-3 text-center text-sm font-semibold text-stone-700"
            >
              Se connecter
            </Link>
          )}
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#25D366] px-4 py-3 text-center text-sm font-bold text-white"
          >
            💬 Nous écrire sur WhatsApp
          </a>
        </div>
      </nav>
    </header>
  );
}
