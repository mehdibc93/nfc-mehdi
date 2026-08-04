// Recréation visuelle (chiffres fictifs) du dashboard réel, pour donner un aperçu concret aux
// prospects avant qu'ils créent un compte — pas une capture d'écran, mais une maquette fidèle
// au vrai design (mêmes composants/couleurs que DashboardPage.tsx).

const NAV_CARDS = [
  { icon: '📋', label: 'Carte', detail: '4 catégories · 32 plats' },
  { icon: '🏠', label: 'Restaurant', detail: 'Infos, photo, traductions' },
  { icon: '✅', label: 'Paiements', detail: 'Stripe connecté' },
  { icon: '📊', label: 'Statistiques', detail: 'Vues, paniers, conversions' },
  { icon: '💰', label: 'Rentabilité', detail: 'Marge et plats les plus rentables' },
  { icon: '🔔', label: 'Mode Service', detail: '2 demandes en attente' },
];

export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200/70 bg-white shadow-card">
      <div className="flex items-center gap-1.5 border-b border-stone-100 bg-stone-50/80 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <span className="ml-3 rounded-full bg-white px-3 py-1 text-[11px] text-stone-400">
          nourevo.vercel.app/dashboard
        </span>
      </div>

      <div className="p-5 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 via-navy-700 to-navy-800 font-display text-lg font-bold text-white">
            L
          </div>
          <div>
            <p className="font-display text-lg font-semibold leading-tight text-stone-900">Bonjour Léa 👋</p>
            <p className="text-xs text-stone-400">Le Jardin Parisien</p>
          </div>
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
          Vue d'ensemble — aujourd'hui
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-3xl border border-stone-200/70 bg-white p-4 shadow-soft">
            <p className="text-xl">👀</p>
            <p className="mt-2 text-xl font-bold text-stone-900">312</p>
            <p className="text-xs text-stone-400">Vues du menu</p>
          </div>
          <div className="rounded-3xl border border-stone-200/70 bg-white p-4 shadow-soft">
            <p className="text-xl">🍽️</p>
            <p className="mt-2 text-xl font-bold text-stone-900">47</p>
            <p className="text-xs text-stone-400">Commandes</p>
          </div>
          <div className="rounded-3xl border border-navy-300/25 bg-navy-300/8 p-4">
            <p className="text-xl">💰</p>
            <p className="mt-2 text-xl font-bold text-navy-700">1 284€</p>
            <p className="text-xs text-navy-700/70">Chiffre d'affaires</p>
          </div>
          <div className="rounded-3xl border border-stone-200/70 bg-white p-4 shadow-soft">
            <p className="text-xl">🔐</p>
            <p className="mt-2 text-sm font-semibold text-stone-900">Configuration</p>
            <p className="text-xs text-stone-400">🔒 PIN activé</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {NAV_CARDS.map((card) => (
            <div key={card.label} className="rounded-3xl border border-stone-200/70 bg-white p-4 shadow-soft">
              <span className="text-xl">{card.icon}</span>
              <p className="mt-2 text-sm font-semibold text-stone-900">{card.label}</p>
              <p className="text-[11px] text-stone-400">{card.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
