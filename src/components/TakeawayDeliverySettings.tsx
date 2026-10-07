import { useState } from 'react';
import type { ReactNode } from 'react';
import type { RestaurantWithMenu } from '../lib/types';
import { useDt } from '../lib/dashboardLocale';

type Props = {
  restaurant: RestaurantWithMenu;
  updateRestaurantField: (patch: Partial<RestaurantWithMenu>) => void;
};

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-300 ${
        checked ? 'justify-end bg-emerald-500' : 'justify-start bg-red-400'
      }`}
    >
      <span className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300" />
    </button>
  );
}

function EuroInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  hint?: ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold text-stone-600">
      {label}
      <div className="mt-1.5 flex items-center rounded-xl border border-stone-200 bg-white pr-3 focus-within:border-navy-300">
        <input
          type="number"
          min={0}
          step={0.5}
          inputMode="decimal"
          value={value === null || value === 0 ? '' : value}
          placeholder={placeholder ?? '0'}
          onChange={(event) => {
            const parsed = Number.parseFloat(event.target.value.replace(',', '.'));
            onChange(Number.isNaN(parsed) || parsed < 0 ? null : parsed);
          }}
          className="w-full rounded-xl bg-transparent px-3 py-2 text-sm font-normal text-stone-700 outline-none"
        />
        <span className="text-sm text-stone-400">€</span>
      </div>
      {hint && <span className="mt-1 block text-xs font-normal text-stone-400">{hint}</span>}
    </label>
  );
}

// Réglages « À emporter » et « Livraison » (onglet Restaurant du dashboard). La livraison est
// assurée par le restaurant lui-même : pas de zone automatique, le restaurant refuse depuis le
// Mode Service une commande dont l'adresse est trop loin.
export function TakeawayDeliverySettings({ restaurant, updateRestaurantField }: Props) {
  const dt = useDt();
  const [copiedMode, setCopiedMode] = useState<string | null>(null);

  const orderLink = (mode: 'emporter' | 'livraison') => `${window.location.origin}/r/${restaurant.slug}?mode=${mode}`;
  const copyLink = (mode: 'emporter' | 'livraison') => {
    navigator.clipboard?.writeText(orderLink(mode)).then(() => {
      setCopiedMode(mode);
      window.setTimeout(() => setCopiedMode(null), 2000);
    });
  };

  const noPaymentMethod = (payOnSite: boolean) => !restaurant.stripeOnboarded && !payOnSite;

  const linkBox = (mode: 'emporter' | 'livraison') => (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-stone-50 p-2">
      <code className="min-w-0 flex-1 truncate text-xs text-stone-500">{orderLink(mode)}</code>
      <button
        type="button"
        onClick={() => copyLink(mode)}
        className="shrink-0 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 hover:border-navy-300/40 hover:text-navy-700"
      >
        {copiedMode === mode ? dt('Copié ✓', 'Copied ✓') : dt('Copier le lien', 'Copy link')}
      </button>
    </div>
  );

  return (
    <div className="sm:col-span-2">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
        {dt('À emporter & livraison', 'Takeaway & delivery')}{' '}
        <span className="font-normal normal-case tracking-normal text-stone-500">
          ({dt('facultatif — la commande sur place reste toujours disponible', 'optional — dine-in ordering is always available')})
        </span>
      </p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-stone-700">{dt('🥡 À emporter', '🥡 Takeaway')}</p>
            <Switch
              checked={restaurant.takeawayEnabled}
              onChange={() => updateRestaurantField({ takeawayEnabled: !restaurant.takeawayEnabled })}
            />
          </div>
          <div className={`mt-3 space-y-3 transition-opacity duration-300 ${restaurant.takeawayEnabled ? '' : 'pointer-events-none opacity-40'}`}>
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-stone-600">
              {dt('Autoriser le paiement au retrait', 'Allow payment on pickup')}
              <Switch
                checked={restaurant.takeawayPayOnSite}
                onChange={() => updateRestaurantField({ takeawayPayOnSite: !restaurant.takeawayPayOnSite })}
              />
            </div>
            {restaurant.takeawayEnabled && noPaymentMethod(restaurant.takeawayPayOnSite) && (
              <p className="rounded-xl bg-amber-50 p-2 text-xs text-amber-700">
                {dt(
                  "Aucun moyen de paiement : activez le paiement en ligne (onglet Paiements) ou le paiement au retrait, sinon l'option n'apparaîtra pas.",
                  'No payment method: enable online payment (Payments tab) or payment on pickup, otherwise the option will not appear.',
                )}
              </p>
            )}
            <div>
              <p className="text-xs font-semibold text-stone-600">{dt('Lien de commande à emporter', 'Takeaway ordering link')}</p>
              {linkBox('emporter')}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-stone-700">{dt('🛵 Livraison', '🛵 Delivery')}</p>
            <Switch
              checked={restaurant.deliveryEnabled}
              onChange={() => updateRestaurantField({ deliveryEnabled: !restaurant.deliveryEnabled })}
            />
          </div>
          <div className={`mt-3 space-y-3 transition-opacity duration-300 ${restaurant.deliveryEnabled ? '' : 'pointer-events-none opacity-40'}`}>
            <div className="grid gap-3 sm:grid-cols-3">
              <EuroInput
                label={dt('Frais', 'Fee')}
                value={restaurant.deliveryFee}
                onChange={(value) => updateRestaurantField({ deliveryFee: value ?? 0 })}
              />
              <EuroInput
                label={dt('Minimum', 'Minimum')}
                value={restaurant.deliveryMinOrder}
                onChange={(value) => updateRestaurantField({ deliveryMinOrder: value ?? 0 })}
              />
              <EuroInput
                label={dt('Offerte dès', 'Free from')}
                value={restaurant.deliveryFreeFrom}
                placeholder={dt('Jamais', 'Never')}
                onChange={(value) => updateRestaurantField({ deliveryFreeFrom: value })}
              />
            </div>
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-stone-600">
              {dt('Autoriser le paiement à la livraison', 'Allow payment on delivery')}
              <Switch
                checked={restaurant.deliveryPayOnDelivery}
                onChange={() => updateRestaurantField({ deliveryPayOnDelivery: !restaurant.deliveryPayOnDelivery })}
              />
            </div>
            {restaurant.deliveryEnabled && noPaymentMethod(restaurant.deliveryPayOnDelivery) && (
              <p className="rounded-xl bg-amber-50 p-2 text-xs text-amber-700">
                {dt(
                  "Aucun moyen de paiement : activez le paiement en ligne (onglet Paiements) ou le paiement à la livraison, sinon l'option n'apparaîtra pas.",
                  'No payment method: enable online payment (Payments tab) or payment on delivery, otherwise the option will not appear.',
                )}
              </p>
            )}
            <div>
              <p className="text-xs font-semibold text-stone-600">{dt('Lien de commande en livraison', 'Delivery ordering link')}</p>
              {linkBox('livraison')}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-stone-500">
        {dt(
          "Partagez ces liens sur vos réseaux, votre fiche Google ou votre site. Le client y choisit « dès que possible » ou un créneau dans vos horaires d'ouverture ; vous pouvez refuser une commande (adresse trop loin...) depuis le Mode Service.",
          'Share these links on social media, your Google profile or your website. Customers choose "as soon as possible" or a time slot within your opening hours; you can decline an order (address too far...) from Service Mode.',
        )}
      </p>
    </div>
  );
}
