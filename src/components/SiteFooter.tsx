import { Link } from 'react-router-dom';
import logoHorizontal from '../assets/logo-horizontal.png';
import { CONTACT_EMAIL } from '../lib/site';

const WHATSAPP_HREF =
  'https://wa.me/33753924902?text=Bonjour%2C%20je%20souhaite%20en%20savoir%20plus%20sur%20Nourevo.';

type FooterLink = { label: string; to: string; external?: boolean };

// Liens vers des ancres de la page d'accueil : simples <a> (Link de react-router ne fait pas
// défiler jusqu'à l'ancre quand on vient d'une autre page).
const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Produit',
    links: [
      { label: 'Comment ça marche', to: '/#comment-ca-marche', external: true },
      { label: 'Fonctionnalités', to: '/fonctionnalites' },
      { label: 'Emporter & livraison', to: '/emporter-livraison' },
      { label: 'Carte NFC', to: '/carte-nfc' },
      { label: 'Tarifs', to: '/tarifs' },
      { label: 'Découvrir le dashboard', to: '/decouvrir-dashboard' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'Démo en direct', to: '/r/le-jardin-parisien?demo=1' },
      { label: 'FAQ', to: '/faq' },
      { label: 'Contact', to: '/contact' },
      { label: 'Créer un compte', to: '/inscription' },
      { label: 'Connexion', to: '/connexion' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'Mentions légales', to: '/mentions-legales' },
      { label: 'CGU', to: '/cgu' },
      { label: 'Confidentialité', to: '/confidentialite' },
    ],
  },
];

// Pied de page commun aux pages publiques (accueil, tarifs, FAQ, contact, pages légales...).
export function SiteFooter() {
  return (
    <footer className="border-t border-stone-900/5 bg-white px-4 py-14 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 lg:col-span-1">
          <img src={logoHorizontal} alt="Nourevo" className="h-8 w-auto" />
          <p className="mt-2 text-sm text-stone-500">Carte NFC, menu digital et paiement à table pour restaurants.</p>

          <p className="mt-8 text-sm font-semibold text-stone-800">Nous contacter</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-3 flex w-full max-w-sm items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-800 transition-colors duration-300 hover:border-navy-300 hover:text-navy-700"
          >
            ✉️ {CONTACT_EMAIL}
          </a>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex w-full max-w-sm items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-800 transition-colors duration-300 hover:border-[#25D366] hover:text-[#128C7E]"
          >
            💬 WhatsApp : 07 53 92 49 02
          </a>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{column.title}</p>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a href={link.to} className="text-sm text-stone-600 transition-colors duration-300 hover:text-navy-700">
                      {link.label}
                    </a>
                  ) : (
                    <Link to={link.to} className="text-sm text-stone-600 transition-colors duration-300 hover:text-navy-700">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-2 border-t border-stone-900/5 pt-6 text-center text-xs text-stone-500 sm:flex-row sm:text-left">
        <p>© {new Date().getFullYear()} Nourevo. Tous droits réservés.</p>
        <p>Paiements sécurisés par Stripe · 0 % de commission sur vos ventes</p>
      </div>
    </footer>
  );
}
