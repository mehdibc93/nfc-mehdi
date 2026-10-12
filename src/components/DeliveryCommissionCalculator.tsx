import { useState } from 'react';
import { NOUREVO_YEARLY_PRICE, formatEuros, monthlyCommission, yearlySavings } from '../lib/commission';

// Taux de commission indicatifs (HT) d'Uber Eats et Deliveroo en France, utilisés comme
// préréglages du simulateur. Aucune grille officielle publique n'existe (taux fixés par contrat,
// formule et zone) : ces valeurs reprennent les fourchettes publiées par Fooderise (mai 2026) et,
// pour les 15 % d'Uber Eats quand le restaurant livre lui-même, l'annonce d'Uber Eats de 2021.
// Toujours présentées comme « indicatives », avec les sources sous le simulateur.
// À revoir si ces plateformes publient une grille officielle ou si les taux évoluent.
//
// Préréglage par défaut : « Uber Eats, vous livrez » — la comparaison équitable, puisqu'avec
// Nourevo aussi c'est le restaurant qui livre (les plateformes qui livrent fournissent en plus
// les livreurs et de la visibilité, ce que Nourevo ne remplace pas).
const PLATFORM_PRESETS = [
  { id: 'ubereats-own', label: 'Uber Eats', detail: 'vous livrez', percent: 15 },
  { id: 'ubereats-delivery', label: 'Uber Eats', detail: 'Uber livre', percent: 25 },
  { id: 'deliveroo', label: 'Deliveroo', detail: 'offre standard', percent: 25 },
];

// Simulateur de la page d'accueil, présenté comme un complément aux plateformes (commandes en
// direct des clients fidèles) : commission évitée, abonnement Nourevo déduit, coût de la
// livraison du restaurant exclu et signalé comme tel.
export function DeliveryCommissionCalculator() {
  const [revenue, setRevenue] = useState(3000);
  const [percent, setPercent] = useState(PLATFORM_PRESETS[0].percent);
  const [presetId, setPresetId] = useState<string | null>(PLATFORM_PRESETS[0].id);

  const perMonth = monthlyCommission(revenue, percent);
  const savings = yearlySavings(perMonth);
  const nourevoMonthly = NOUREVO_YEARLY_PRICE / 12;
  // Barres de comparaison : la plus grande des deux dépenses mensuelles occupe toute la largeur.
  const barMax = Math.max(perMonth, nourevoMonthly, 1);
  const platformLabel = PLATFORM_PRESETS.find((preset) => preset.id === presetId)?.label ?? 'Votre plateforme';

  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-navy-500">Simulateur</p>
          <h3 className="mt-1 font-display text-xl font-bold text-stone-900 sm:text-2xl">
            Et si vos clients fidèles commandaient en direct ?
          </h3>
        </div>
        <p className="text-sm text-stone-500 sm:max-w-xs sm:text-right">
          En complément d’Uber Eats ou Deliveroo, qui prélèvent environ 15 à 30 % HT selon la formule¹.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Comparer avec une plateforme">
        {PLATFORM_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-pressed={presetId === preset.id}
            onClick={() => {
              setPresetId(preset.id);
              setPercent(preset.percent);
            }}
            className={`rounded-full border px-4 py-1.5 text-sm transition-all duration-300 ${
              presetId === preset.id
                ? 'border-navy-400 bg-navy-50 font-semibold text-navy-800'
                : 'border-stone-200 bg-white text-stone-600 hover:border-navy-300'
            }`}
          >
            {preset.label} · {preset.detail} (≈ {preset.percent} %)
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className="flex items-baseline justify-between gap-4 text-sm font-semibold text-stone-600">
            Commandes en direct, par mois
            <span className="shrink-0 whitespace-nowrap font-display text-xl font-bold text-navy-800">{formatEuros(revenue)}</span>
          </span>
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
        <label className="block">
          <span className="flex items-baseline justify-between gap-4 text-sm font-semibold text-stone-600">
            Commission de la plateforme (HT)
            <span className="shrink-0 whitespace-nowrap font-display text-xl font-bold text-navy-800">{percent} %</span>
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
            className="mt-2 w-full accent-navy-700"
          />
        </label>
      </div>

      <div className="mt-6 grid items-center gap-6 sm:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-stone-700">{platformLabel}</span>
              <span className="font-bold text-rose-600">{formatEuros(perMonth)} / mois</span>
            </div>
            <div className="mt-1 h-2.5 rounded-full bg-stone-100">
              <div className="h-2.5 rounded-full bg-rose-400 transition-all duration-500" style={{ width: `${(perMonth / barMax) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-stone-700">Nourevo, tout compris</span>
              <span className="font-bold text-emerald-600">{formatEuros(nourevoMonthly)} / mois</span>
            </div>
            <div className="mt-1 h-2.5 rounded-full bg-stone-100">
              <div
                className="h-2.5 rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(nourevoMonthly / barMax) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-navy-600 via-navy-700 to-navy-900 px-6 py-5 text-white sm:min-w-[240px]">
          <p className="text-xs font-semibold text-white/70">Vous gardez environ</p>
          <p className="font-display text-4xl font-bold text-emerald-300">+{formatEuros(savings)}</p>
          <p className="text-sm font-semibold">par an</p>
          <p className="mt-1 text-xs text-white/60">abonnement Nourevo déduit</p>
        </div>
      </div>

      <p className="mt-5 text-xs leading-5 text-stone-500">
        Simulation indicative à partir de vos chiffres : commission évitée moins l’abonnement Nourevo (
        {formatEuros(NOUREVO_YEARLY_PRICE)}/an), <strong className="font-semibold text-stone-600">hors coût de votre propre livraison</strong>{' '}
        et hors frais bancaires Stripe sur les paiements par carte. Les plateformes apportent aussi des livreurs et de la
        visibilité : Nourevo est idéal pour les commandes que vos clients habitués peuvent passer en direct.
      </p>
      <p className="mt-2 text-xs leading-5 text-stone-500">
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
  );
}
