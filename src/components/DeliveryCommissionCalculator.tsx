import { useState } from 'react';
import { formatEuros, monthlyCommission } from '../lib/commission';

// Simulateur de la page d'accueil : ce qu'un restaurant reverse chaque mois à une plateforme de
// livraison, comparé à Nourevo (aucune commission). Les deux valeurs sont saisies par le
// visiteur — on n'affiche pas un taux de plateforme présenté comme un fait.
export function DeliveryCommissionCalculator() {
  const [revenue, setRevenue] = useState(3000);
  const [percent, setPercent] = useState(25);

  const perMonth = monthlyCommission(revenue, percent);
  const perYear = perMonth * 12;

  return (
    <div className="rounded-3xl bg-white p-6 text-stone-900 shadow-card sm:p-8">
      <p className="font-display text-lg font-bold">💸 Combien vous coûte une plateforme de livraison ?</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-stone-600">
          Vos ventes en livraison par mois
          <span className="mt-1 block font-display text-2xl font-bold text-navy-800">{formatEuros(revenue)}</span>
          <input
            type="range"
            min={500}
            max={20000}
            step={500}
            value={revenue}
            onChange={(event) => setRevenue(Number(event.target.value))}
            className="mt-2 w-full accent-navy-700"
          />
        </label>
        <label className="block text-sm font-semibold text-stone-600">
          Commission de votre plateforme
          <span className="mt-1 block font-display text-2xl font-bold text-navy-800">{percent} %</span>
          <input
            type="range"
            min={5}
            max={40}
            step={1}
            value={percent}
            onChange={(event) => setPercent(Number(event.target.value))}
            className="mt-2 w-full accent-navy-700"
          />
        </label>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-rose-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">Avec la plateforme</p>
          <p className="mt-1 font-display text-3xl font-bold text-rose-700">{formatEuros(perMonth)}</p>
          <p className="text-sm text-rose-700/80">de commission par mois, soit {formatEuros(perYear)} par an</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Avec Nourevo</p>
          <p className="mt-1 font-display text-3xl font-bold text-emerald-700">0 €</p>
          <p className="text-sm text-emerald-700/80">de commission : abonnement fixe dès 49 €/mois, tout compris</p>
        </div>
      </div>
      <p className="mt-4 text-xs leading-5 text-stone-500">
        Simulation indicative à partir de vos chiffres. Les paiements par carte restent soumis aux frais bancaires de
        Stripe, prélevés directement par Stripe. Avec Nourevo, la livraison est assurée par votre propre équipe.
      </p>
    </div>
  );
}
