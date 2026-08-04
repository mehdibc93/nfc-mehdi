import { Link } from 'react-router-dom';
import logoHorizontal from '../assets/logo-horizontal.png';

const CONTACT_EMAIL = 'contact.nourevo@gmail.com';

const REASONS = [
  {
    icon: '🛠️',
    title: 'Support technique',
    description: 'Un bug, une fonctionnalité qui ne marche pas comme prévu, un problème d’accès à votre dashboard.',
  },
  {
    icon: '💳',
    title: 'Facturation & abonnement',
    description: 'Une question sur votre abonnement, un paiement, ou votre compte Stripe connecté.',
  },
  {
    icon: '🤝',
    title: 'Autre demande',
    description: 'Partenariat, presse, question générale — écrivez-nous, on vous redirige si besoin.',
  },
];

export function ContactPage() {
  return (
    <div className="min-h-screen px-4 py-14">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition-colors duration-300 hover:text-navy-700"
        >
          ← Retour à l'accueil
        </Link>

        <div className="rounded-3xl border border-stone-200/70 bg-white p-8 shadow-soft sm:p-10">
          <img src={logoHorizontal} alt="Nourevo" className="h-7 w-auto" />
          <h1 className="mt-3 font-display text-3xl font-bold text-stone-900">Nous contacter</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-stone-500">
            Une question, un problème technique, ou simplement envie d'échanger ? Écrivez-nous directement, on vous
            répond au plus vite.
          </p>

          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
          >
            ✉️ {CONTACT_EMAIL}
          </a>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {REASONS.map((reason) => (
              <div key={reason.title} className="rounded-2xl border border-stone-200/70 bg-stone-50/60 p-5">
                <p className="text-2xl">{reason.icon}</p>
                <p className="mt-3 font-semibold text-stone-900">{reason.title}</p>
                <p className="mt-1.5 text-xs leading-5 text-stone-500">{reason.description}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-xs text-stone-400">
            Pour toute question relative à vos données personnelles, consultez notre{' '}
            <Link to="/confidentialite" className="font-semibold text-navy-700 underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
