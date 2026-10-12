import { useState } from 'react';
import { NOUREVO_YEARLY_PRICE, formatEuros, monthlyCommission, yearlySavings } from '../lib/commission';

// Simulateur de la page d'accueil : ce qu'un restaurant reverse chaque mois à une plateforme de
// livraison, comparé à Nourevo (aucune commission). Les deux valeurs sont saisies par le
// visiteur — on n'affiche pas un taux de plateforme présenté comme un fait — et l'économie
// annoncée déduit l'abonnement Nourevo.
export function DeliveryCommissionCalculator() {
  const [revenue, setRevenue] = useState(3000);
  const [percent, setPercent] = useState(25);

  const perMonth = monthlyCommission(revenue, percent);
  const savings = yearlySavings(perMonth);
  const nourevoMonthly = NOUREVO_YEARLY_PRICE / 12;
  // Barres de comparaison : la plus grande des deux dépenses mensuelles occupe toute la largeur.
  const barMax = Math.max(perMonth, nourevoMonthly, 1);

  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200/70 bg-white shadow-card">
      <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-navy-500">Simulateur</p>
          <h3 className="mt-2 font-display text-2xl font-bold text-stone-900 sm:text-3xl">
            Combien vous coûtent les plateformes de livraison ?
          </h3>
          <p className="mt-2 text-sm text-stone-500">Faites le calcul avec vos propres chiffres.</p>

          <label className="mt-8 block">
            <span className="flex items-baseline justify-between gap-4 text-sm font-semibold text-stone-600">
              Vos ventes en livraison, par mois
              <span className="shrink-0 whitespace-nowrap font-display text-2xl font-bold text-navy-800">{formatEuros(revenue)}</span>
            </span>
            <input
              type="range"
              min={500}
              max={20000}
              step={500}
              value={revenue}
              onChange={(event) => setRevenue(Number(event.target.value))}
              className="mt-3 w-full accent-navy-700"
            />
          </label>
          <label className="mt-6 block">
            <span className="flex items-baseline justify-between gap-4 text-sm font-semibold text-stone-600">
              Commission prélevée par votre plateforme
              <span className="shrink-0 whitespace-nowrap font-display text-2xl font-bold text-navy-800">{percent} %</span>
            </span>
            <input
              type="range"
              min={5}
              max={40}
              step={1}
              value={percent}
              onChange={(event) => setPercent(Number(event.target.value))}
              className="mt-3 w-full accent-navy-700"
            />
          </label>

          <div className="mt-8 space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-stone-700">Plateforme de livraison</span>
                <span className="font-bold text-rose-600">{formatEuros(perMonth)} / mois</span>
              </div>
              <div className="mt-1.5 h-3 rounded-full bg-stone-100">
                <div
                  className="h-3 rounded-full bg-rose-400 transition-all duration-500"
                  style={{ width: `${(perMonth / barMax) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-stone-700">Nourevo, tout compris</span>
                <span className="font-bold text-emerald-600">{formatEuros(nourevoMonthly)} / mois</span>
              </div>
              <div className="mt-1.5 h-3 rounded-full bg-stone-100">
                <div
                  className="h-3 rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(nourevoMonthly / barMax) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center bg-gradient-to-br from-navy-600 via-navy-700 to-navy-900 p-6 text-white sm:p-10">
          <p className="text-sm font-semibold text-white/70">En vendant en direct avec Nourevo, vous gardez</p>
          <p className="mt-2 font-display text-5xl font-bold text-emerald-300 sm:text-6xl">+{formatEuros(savings)}</p>
          <p className="mt-1 text-base font-semibold text-white">par an dans votre caisse</p>
          <ul className="mt-6 space-y-2 text-sm text-white/80">
            <li>
              ✓ <strong className="text-white">{formatEuros(perMonth * 12)}</strong> de commissions évitées par an
            </li>
            <li>
              ✓ Abonnement Nourevo déjà déduit ({formatEuros(NOUREVO_YEARLY_PRICE)} / an)
            </li>
            <li>✓ Vos clients, vos données, vos prix</li>
          </ul>
          <p className="mt-6 text-xs leading-5 text-white/55">
            Simulation indicative à partir de vos chiffres. Les paiements par carte restent soumis aux frais bancaires de
            Stripe. Avec Nourevo, la livraison est assurée par votre propre équipe.
          </p>
        </div>
      </div>
    </div>
  );
}
