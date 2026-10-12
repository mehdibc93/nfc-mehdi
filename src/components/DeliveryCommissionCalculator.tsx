import { useState } from 'react';
import { NOUREVO_YEARLY_PRICE, formatEuros, monthlyCommission, yearlySavings } from '../lib/commission';

// Taux de commission indicatifs (HT) d'Uber Eats et Deliveroo en France, utilisés comme
// préréglages du simulateur. Aucune grille officielle publique n'existe (taux fixés par contrat,
// formule et zone) : ces valeurs reprennent les fourchettes publiées par Fooderise (mai 2026) et,
// pour les 15 % d'Uber Eats quand le restaurant livre lui-même, l'annonce d'Uber Eats de 2021.
// Toujours présentées comme « indicatives », avec les sources sous le simulateur.
// À revoir si ces plateformes publient une grille officielle ou si les taux évoluent.
const PLATFORM_PRESETS = [
  { id: 'ubereats-delivery', label: 'Uber Eats', detail: 'Uber livre', percent: 25 },
  { id: 'ubereats-own', label: 'Uber Eats', detail: 'vous livrez', percent: 15 },
  { id: 'deliveroo', label: 'Deliveroo', detail: 'offre standard', percent: 25 },
];

// Simulateur de la page d'accueil : ce qu'un restaurant reverse chaque mois à une plateforme de
// livraison, comparé à Nourevo (aucune commission). Le taux part d'un préréglage indicatif (voir
// ci-dessus) que le visiteur peut ajuster à son propre contrat ; l'économie annoncée déduit
// l'abonnement Nourevo.
export function DeliveryCommissionCalculator() {
  const [revenue, setRevenue] = useState(3000);
  const [percent, setPercent] = useState(PLATFORM_PRESETS[0].percent);
  const [presetId, setPresetId] = useState<string | null>(PLATFORM_PRESETS[0].id);

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
            Combien vous coûtent Uber Eats et Deliveroo ?
          </h3>
          <p className="mt-2 text-sm text-stone-500">
            Selon la formule, ces plateformes prélèvent environ <strong className="text-stone-700">15 % à 30 % HT</strong>{' '}
            de chaque commande livrée¹. Faites le calcul avec vos chiffres.
          </p>

          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Choisir une plateforme">
            {PLATFORM_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                aria-pressed={presetId === preset.id}
                onClick={() => {
                  setPresetId(preset.id);
                  setPercent(preset.percent);
                }}
                className={`rounded-2xl border px-4 py-2 text-left text-sm transition-all duration-300 ${
                  presetId === preset.id
                    ? 'border-navy-400 bg-navy-50 text-navy-800'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-navy-300'
                }`}
              >
                <span className="block font-bold">{preset.label}</span>
                <span className="block text-xs text-stone-500">
                  {preset.detail} · ≈ {preset.percent} %
                </span>
              </button>
            ))}
          </div>

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
              Commission de votre plateforme (HT)
              <span className="shrink-0 whitespace-nowrap font-display text-2xl font-bold text-navy-800">{percent} %</span>
            </span>
            <input
              type="range"
              min={5}
              max={40}
              step={1}
              value={percent}
              onChange={(event) => {
                setPercent(Number(event.target.value));
                setPresetId(null);
              }}
              className="mt-3 w-full accent-navy-700"
            />
          </label>

          <div className="mt-8 space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-stone-700">
                  {PLATFORM_PRESETS.find((preset) => preset.id === presetId)?.label ?? 'Votre plateforme'}
                </span>
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
          <p className="mt-3 text-xs leading-5 text-white/55">
            ¹ Taux indicatifs hors TVA, variables selon la formule, la zone et le contrat — vérifiez le vôtre. Sources :{' '}
            <a
              href="https://www.fooderise.com/en/blog/commission-uber-eats-restaurant-france-pourcentage-2026"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Fooderise, Uber Eats 2026
            </a>
            ,{' '}
            <a
              href="https://www.fooderise.com/en/blog/commission-deliveroo-restaurant-france-pourcentage-2026"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Fooderise, Deliveroo 2026
            </a>
            ,{' '}
            <a
              href="https://www.uber.com/fr/newsroom/uber-eats-cree-et-met-a-disposition-des-restaurants-et-commercants-partenaires-un-nouveau-canal-de-vente"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Uber Eats, 2021
            </a>
            . Uber Eats et Deliveroo sont des marques de leurs propriétaires respectifs.
          </p>
        </div>
      </div>
    </div>
  );
}
