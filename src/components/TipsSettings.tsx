import { useEffect, useState } from 'react';
import type { RestaurantWithMenu } from '../lib/types';
import { useDt } from '../lib/dashboardLocale';
import { DEFAULT_TIP_PERCENTAGES, normalizeTipPercentages } from '../lib/tips';

type Props = {
  restaurant: RestaurantWithMenu;
  updateRestaurantField: (patch: Partial<RestaurantWithMenu>) => void;
};

// Réglages « Pourboires » (onglet Restaurant du dashboard). Les pourboires passent uniquement
// par le paiement en ligne Stripe : sans compte Stripe actif, l'option n'est pas proposée.
export function TipsSettings({ restaurant, updateRestaurantField }: Props) {
  const dt = useDt();
  // Saisie libre « 5, 10, 15 » : enregistrée normalisée dès qu'elle est valide.
  const [percentagesInput, setPercentagesInput] = useState(restaurant.tipPercentages.join(', '));
  useEffect(() => {
    setPercentagesInput(restaurant.tipPercentages.join(', '));
    // Resynchronise seulement au chargement d'un autre restaurant, pas à chaque frappe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant.id]);

  const parsed = normalizeTipPercentages(
    percentagesInput
      .split(/[,;\s]+/)
      .filter(Boolean)
      .map((value) => Number(value.replace('%', ''))),
  );
  const invalid = parsed.length === 0 || parsed.length > 4;

  return (
    <div className="sm:col-span-2">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
        {dt('Pourboires', 'Tips')}{' '}
        <span className="font-normal normal-case tracking-normal text-stone-500">
          ({dt('facultatif — paiement en ligne uniquement', 'optional — online payment only')})
        </span>
      </p>
      <div className="mt-2 rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-stone-700">{dt('💝 Proposer un pourboire', '💝 Offer tipping')}</p>
          <button
            type="button"
            role="switch"
            aria-checked={restaurant.tipsEnabled}
            onClick={() => updateRestaurantField({ tipsEnabled: !restaurant.tipsEnabled })}
            className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-300 ${
              restaurant.tipsEnabled ? 'justify-end bg-emerald-500' : 'justify-start bg-red-400'
            }`}
          >
            <span className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300" />
          </button>
        </div>
        <div className={`mt-3 transition-opacity duration-300 ${restaurant.tipsEnabled ? '' : 'pointer-events-none opacity-40'}`}>
          <label className="block text-xs font-semibold text-stone-600">
            {dt('Pourcentages proposés (1 à 4, séparés par des virgules)', 'Suggested percentages (1 to 4, comma-separated)')}
            <input
              type="text"
              value={percentagesInput}
              placeholder={DEFAULT_TIP_PERCENTAGES.join(', ')}
              onChange={(event) => {
                setPercentagesInput(event.target.value);
                const next = normalizeTipPercentages(
                  event.target.value
                    .split(/[,;\s]+/)
                    .filter(Boolean)
                    .map((value) => Number(value.replace('%', ''))),
                );
                if (next.length > 0 && next.length <= 4) updateRestaurantField({ tipPercentages: next });
              }}
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-normal text-stone-700 outline-none focus:border-navy-300 sm:max-w-xs"
            />
          </label>
          {invalid ? (
            <p className="mt-1 text-xs text-red-600">
              {dt('Entrez 1 à 4 pourcentages entre 1 et 50 (ex : 5, 10, 15).', 'Enter 1 to 4 percentages between 1 and 50 (e.g. 5, 10, 15).')}
            </p>
          ) : (
            <p className="mt-1 text-xs text-stone-400">
              {dt('Vos clients verront', 'Your customers will see')} : {parsed.map((value) => `${value} %`).join(' · ')} · {dt('Autre montant', 'Other amount')}
            </p>
          )}
          {restaurant.tipsEnabled && !restaurant.stripeOnboarded && (
            <p className="mt-3 rounded-xl bg-amber-50 p-2 text-xs text-amber-700">
              {dt(
                "Les pourboires passent par le paiement en ligne : activez-le dans l'onglet Paiements, sinon l'option n'apparaîtra pas à vos clients.",
                'Tips go through online payment: enable it in the Payments tab, otherwise customers will not see the option.',
              )}
            </p>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-stone-500">
        {dt(
          "Proposé au moment de payer par carte, puis via un bouton « Laisser un pourboire » sur l'écran de suivi de la commande. Le pourboire est versé sur votre compte Stripe et affiché à part dans le Mode Service — il n'est pas compté dans votre chiffre d'affaires.",
          'Offered when paying by card, then through a "Leave a tip" button on the order tracking screen. Tips go to your Stripe account and are shown separately in Service Mode — they are not counted in your revenue.',
        )}
      </p>
    </div>
  );
}
