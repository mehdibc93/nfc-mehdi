import { useEffect, useState } from 'react';
import type { RestaurantWithMenu } from '../lib/types';
import { useDt } from '../lib/dashboardLocale';
import { DEFAULT_TIP_PERCENTAGES, normalizeTipPercentages } from '../lib/tips';

type Props = {
  restaurant: RestaurantWithMenu;
  updateRestaurantField: (patch: Partial<RestaurantWithMenu>) => void;
};

// Réglages « Pourboires » (onglet Restaurant du dashboard). Proposés au paiement, en ligne ou sur
// place (ajoutés au montant à encaisser) ; le pourboire « après le repas » nécessite Stripe.
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
          ({dt('facultatif', 'optional')})
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
                "Sans paiement en ligne, le pourboire est proposé uniquement au paiement sur place. Activez le paiement en ligne (onglet Paiements) pour le proposer aussi par carte et après le repas.",
                'Without online payment, tips are only offered when paying on site. Enable online payment (Payments tab) to also offer them by card and after the meal.',
              )}
            </p>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-stone-500">
        {dt(
          "Proposé au moment de payer : par carte, il est encaissé avec la commande ; à la caisse, au retrait ou à la livraison, il s'ajoute au montant à encaisser. Avec le paiement en ligne, un bouton « Laisser un pourboire » est aussi proposé après le repas. Le pourboire est affiché à part dans le Mode Service et n'est pas compté dans votre chiffre d'affaires.",
          'Offered at checkout: by card it is charged with the order; at the counter, on pickup or on delivery it is added to the amount to collect. With online payment, a "Leave a tip" button is also offered after the meal. Tips are shown separately in Service Mode and are not counted in your revenue.',
        )}
      </p>
    </div>
  );
}
