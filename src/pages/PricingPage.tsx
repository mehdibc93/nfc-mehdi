 import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoHorizontal from '../assets/logo-horizontal.png';
import { setPageMeta } from '../lib/seo';

const PLANS = [
  {
    id: 'monthly',
    name: 'Liberté',
    icon: '',
    price: '59€/mois',
    subPrice: null as string | null,
    highlight: false,
    advantages: ['Sans engagement', 'Résiliation à tout moment', 'Idéal pour découvrir le service'],
  },
  {
    id: 'annual_monthly',
    name: 'Pro',
    icon: '⭐',
    price: '54€/mois',
    subPrice: null as string | null,
    highlight: true,
    advantages: ['Engagement 12 mois', 'Paiement mensuel', "Économisez 60€ par an par rapport à l'offre Liberté"],
  },
  {
    id: 'annual_upfront',
    name: 'Annuelle',
    icon: '💎',
    price: '49€/mois',
    subPrice: '(588€ payés en une fois)',
    highlight: false,
    advantages: ['Paiement unique pour 12 mois', 'Le meilleur tarif', "Économisez 120€ par an par rapport à l'offre Liberté"],
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

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
          🎉 7 jours d'essai gratuit sur votre premier abonnement, quel que soit le plan choisi — annulez avant la
          fin de l'essai et vous ne serez jamais débité.
        </div>

        <div className="mt-8 overflow-x-auto rounded-3xl border border-stone-200/70 bg-white shadow-card">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Offre</th>
                <th className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Tarif</th>
                <th className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
                  Avantages
                </th>
                <th className="px-6 py-5" />
              </tr>
            </thead>
            <tbody>
              {PLANS.map((plan) => (
                <tr
                  key={plan.id}
                  className={`border-b border-stone-100 align-middle last:border-0 ${
                    plan.highlight ? 'relative bg-navy-300/8' : ''
                  }`}
                >
                  <td className={`px-6 py-7 align-top ${plan.highlight ? 'border-l-4 border-navy-600' : ''}`}>
                    <p className="flex items-center gap-2 font-display text-xl font-bold text-stone-900">
                      {plan.name} {plan.icon && <span className="text-lg">{plan.icon}</span>}
                    </p>
                    {plan.highlight && (
                      <span className="mt-2 inline-block rounded-full bg-navy-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                        Recommandée
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-7 align-top tabular-nums">
                    <p className="font-display text-2xl font-bold text-stone-900">{plan.price}</p>
                    {plan.subPrice && <p className="mt-0.5 text-xs italic text-stone-400">{plan.subPrice}</p>}
                  </td>
                  <td className="px-6 py-7 align-top">
                    <ul className="space-y-2">
                      {plan.advantages.map((advantage) => (
                        <li key={advantage} className="flex items-start gap-2 text-sm text-stone-600">
                          <span className="mt-0.5 shrink-0 text-navy-600">✓</span>
                          {advantage}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-7 align-top">
                    <Link
                      to="/inscription"
                      className={`inline-block whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 ease-out hover:-translate-y-0.5 ${
                        plan.highlight
                          ? 'bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 text-white shadow-glow hover:shadow-lg'
                          : 'border border-stone-200 text-stone-700 hover:border-navy-300/40'
                      }`}
                    >
                      Choisir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
