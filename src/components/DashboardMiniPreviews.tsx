// Petites recréations visuelles (pas de vraies captures d'écran — pas d'outil pour ça ici) de
// chaque page du dashboard, utilisées comme miniatures sur la page "Découvrir le dashboard".
// Toutes les données sont fictives, à titre d'illustration uniquement.

export function CartePreview() {
  const dishes = [
    { name: 'Burger Gourmet', price: '21€' },
    { name: 'Risotto champignons', price: '23€' },
    { name: 'Fondant chocolat', price: '12€' },
  ];
  return (
    <div className="space-y-1.5">
      {dishes.map((dish) => (
        <div key={dish.name} className="flex items-center gap-2 rounded-lg bg-stone-50 px-2.5 py-1.5">
          <span className="h-5 w-5 shrink-0 rounded-md bg-[#E69F00]/25" />
          <span className="flex-1 truncate text-[11px] text-stone-700">{dish.name}</span>
          <span className="text-[11px] font-semibold text-stone-900">{dish.price}</span>
        </div>
      ))}
    </div>
  );
}

export function RestaurantPreview() {
  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <div className="h-1.5 w-16 rounded-full bg-stone-200" />
        <div className="h-6 w-full rounded-lg border border-stone-200 bg-white" />
      </div>
      <div className="flex items-center gap-1.5">
        {['#1c2f47', '#6b2737', '#2f5233', '#a5522d'].map((color) => (
          <span key={color} className="h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
        ))}
      </div>
    </div>
  );
}

export function PaiementsPreview() {
  return (
    <div className="space-y-2.5">
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
        ✓ Stripe connecté
      </span>
      <div className="flex flex-wrap gap-1.5">
        {['Carte', 'Apple Pay', 'Google Pay'].map((method) => (
          <span key={method} className="rounded-full border border-stone-200 bg-white px-2 py-1 text-[9px] text-stone-500">
            {method}
          </span>
        ))}
      </div>
    </div>
  );
}

export function StatistiquesPreview() {
  const steps = [100, 45, 22];
  return (
    <div className="space-y-1.5">
      {steps.map((pct, index) => (
        <div key={index} className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
          <div className="h-2 rounded-full bg-[#0072B2]" style={{ width: `${pct}%` }} />
        </div>
      ))}
    </div>
  );
}

export function RentabilitePreview() {
  const dishes = [
    { pct: 68, color: '#059669' },
    { pct: 42, color: '#D97706' },
  ];
  return (
    <div className="space-y-2">
      {dishes.map((dish, index) => (
        <div key={index}>
          <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
            <div className="h-2 rounded-full" style={{ width: `${dish.pct}%`, backgroundColor: dish.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ModeServicePreview() {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between rounded-lg bg-stone-50 px-2.5 py-1.5">
        <span className="text-[11px] font-semibold text-stone-700">Table 4</span>
        <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[9px] font-semibold text-red-600">
          Nouvelle
        </span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-stone-50 px-2.5 py-1.5">
        <span className="text-[11px] font-semibold text-stone-700">Table 9</span>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
          Servie
        </span>
      </div>
    </div>
  );
}

export function ConfigurationPreview() {
  return (
    <div className="space-y-2.5">
      <span className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-1 text-[10px] font-semibold text-navy-700">
        🔒 Code PIN activé
      </span>
      <div className="flex items-center justify-between rounded-lg bg-stone-50 px-2.5 py-1.5">
        <span className="text-[11px] text-stone-600">Mode Service protégé</span>
        <span className="h-4 w-8 rounded-full bg-emerald-500" />
      </div>
    </div>
  );
}
