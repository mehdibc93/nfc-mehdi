import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoHorizontal from '../assets/logo-horizontal.png';
import { setPageMeta } from '../lib/seo';

const PLANS = [
  {
    id: 'monthly',
    label: 'Mensuel',
    price: '59€',
    period: '/ mois',
    note: 'Sans engagement',
    highlight: false,
  },
  {
    id: 'annual_monthly',
    label: 'Annuel, payé au mois',
    price: '54€',
    period: '/ mois',
    note: 'Engagement 12 mois',
    highlight: true,
  },
  {
    id: 'annual_upfront',
    label: 'Annuel, payé en une fois',
    price: '588€',
    period: '/ an',
    note: 'Engagement 12 mois',
    highlight: false,
  },
];

const INCLUDED = [
  'Carte digitale illimitée (plats, catégories, photos)',
  'Commande et paiement en ligne (Stripe, Apple Pay, Google Pay)',
  'Zéro commission sur vos ventes',
  'Mode Service en direct (commandes, tables, addition)',
  'Statistiques et analyse de rentabilité',
  'Menus midi/soir programmables',
  'Gestion des stocks et des allergènes',
  'Personnalisation complète (couleurs, vidéos, traductions)',
  'Code PIN sécurisé et gestion des accès',
  'Carte NFC fournie et déjà configurée',
];

export function PricingPage() {
  useEffect(() => {
    setPageMeta({
      title: 'Tarifs — Nourevo',
      description: 'Un seul abonnement, toutes les fonctionnalités incluses. Sans commission sur vos ventes.',
    });
  }, []);

  return (
    <div className="min-h-screen px-4 py-14 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition-colors duration-300 hover:text-navy-700"
        >
          ← Retour à l'accueil
        </Link>

        <img src={logoHorizontal} alt="Nourevo" className="h-8 w-auto" />
        <h1 className="mt-4 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
          Un abonnement simple, tout inclus.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-stone-500">
          Pas de version limitée, pas de fonctionnalité cachée derrière un palier supérieur — toutes les
          fonctionnalités de Nourevo sont incluses, quel que soit le plan choisi. Et surtout : Nourevo ne prélève
          jamais de commission sur vos ventes, contrairement à beaucoup d'outils similaires.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl border p-6 ${
                plan.highlight
                  ? 'border-navy-400 bg-navy-300/8 shadow-card'
                  : 'border-stone-200/70 bg-white shadow-soft'
              }`}
            >
              {plan.highlight && (
                <span className="rounded-full bg-navy-700 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                  Le plus choisi
                </span>
              )}
              <p className="mt-3 text-sm font-semibold text-stone-500">{plan.label}</p>
              <p className="mt-2">
                <span className="font-display text-4xl font-bold text-stone-900">{plan.price}</span>
                <span className="text-sm text-stone-400">{plan.period}</span>
              </p>
              <p className="mt-1 text-xs text-stone-400">{plan.note}</p>
              <Link
                to="/inscription"
                className={`mt-6 block rounded-full px-5 py-3 text-center text-sm font-bold transition-all duration-300 ease-out hover:-translate-y-0.5 ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 text-white shadow-glow hover:shadow-lg'
                    : 'border border-stone-200 text-stone-700 hover:border-navy-300/40'
                }`}
              >
                Créer mon compte
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-3xl border border-stone-200/70 bg-white p-8 shadow-soft">
          <h2 className="font-display text-xl font-bold text-stone-900">Inclus dans les 3 plans</h2>
          <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <span key={item} className="flex items-center gap-2 text-sm text-stone-600">
                <span className="text-emerald-600">✅</span>
                {item}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-stone-400">
          Des questions sur les tarifs ?{' '}
          <Link to="/faq" className="font-semibold text-navy-700 underline">
            Consultez la FAQ
          </Link>{' '}
          ou{' '}
          <Link to="/contact" className="font-semibold text-navy-700 underline">
            contactez-nous
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
