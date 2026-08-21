import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { mapRestaurantWithMenu } from '../lib/mappers';
import type { RestaurantWithMenu } from '../lib/types';
import type { DishEventRow } from '../lib/analytics';
import { LoadingScreen } from '../components/LoadingScreen';
import { PinSectionGate } from '../components/PinSectionGate';
import { DashboardLanguageSwitch } from '../components/DashboardLanguageSwitch';
import { useDt } from '../lib/dashboardLocale';

type DishStat = {
  key: string;
  name: string;
  views: number;
  addToCart: number;
  removedFromCart: number;
  purchases: number;
};

type DateFilter = '7' | '30' | 'all';

const DATE_FILTERS: { key: DateFilter; label: { fr: string; en: string } }[] = [
  { key: '7', label: { fr: '7 jours', en: '7 days' } },
  { key: '30', label: { fr: '30 jours', en: '30 days' } },
  { key: 'all', label: { fr: 'Tout', en: 'All' } },
];

export function StatsPage() {
  const dt = useDt();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<RestaurantWithMenu | null>(null);
  const [events, setEvents] = useState<DishEventRow[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data: restaurantRow } = await supabase
        .from('restaurants')
        .select('*, categories(*, dishes(*))')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!restaurantRow) {
        setLoading(false);
        return;
      }
      const mapped = mapRestaurantWithMenu(restaurantRow);
      setRestaurant(mapped);
      const { data: eventRows } = await supabase
        .from('dish_events')
        .select('*')
        .eq('restaurant_id', mapped.id)
        .order('created_at', { ascending: false })
        .limit(5000);
      if (cancelled) return;
      setEvents((eventRows ?? []) as DishEventRow[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filteredEvents = useMemo(() => {
    if (dateFilter === 'all') return events;
    const days = dateFilter === '7' ? 7 : 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return events.filter((event) => new Date(event.created_at).getTime() >= cutoff);
  }, [events, dateFilter]);

  const stats = useMemo(() => {
    if (!restaurant) return [] as DishStat[];
    const map = new Map<string, DishStat>();
    restaurant.categories.forEach((category) => {
      category.dishes.forEach((dish) => {
        map.set(dish.id, { key: dish.id, name: dish.name, views: 0, addToCart: 0, removedFromCart: 0, purchases: 0 });
      });
    });
    filteredEvents.forEach((event) => {
      const key = event.dish_id ?? `deleted:${event.dish_name}`;
      let stat = map.get(key);
      if (!stat) {
        stat = { key, name: dt(`${event.dish_name} (supprimé)`, `${event.dish_name} (deleted)`), views: 0, addToCart: 0, removedFromCart: 0, purchases: 0 };
        map.set(key, stat);
      }
      if (event.event_type === 'view') stat.views += 1;
      else if (event.event_type === 'add_to_cart') stat.addToCart += 1;
      else if (event.event_type === 'remove_from_cart') stat.removedFromCart += 1;
      else if (event.event_type === 'purchase') stat.purchases += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.views - a.views || b.addToCart - a.addToCart);
  }, [restaurant, filteredEvents]);

  const totals = useMemo(
    () =>
      stats.reduce(
        (acc, stat) => ({
          views: acc.views + stat.views,
          addToCart: acc.addToCart + stat.addToCart,
          purchases: acc.purchases + stat.purchases,
        }),
        { views: 0, addToCart: 0, purchases: 0 },
      ),
    [stats],
  );

  if (loading) {
    return <LoadingScreen />;
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-stone-900">{dt('Aucun restaurant', 'No restaurant')}</h1>
        <p className="text-stone-500">{dt('Créez votre restaurant avant de consulter les statistiques.', 'Create your restaurant before viewing statistics.')}</p>
        <Link
          to="/dashboard"
          className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-6 py-3 text-sm font-bold text-white"
        >
          {dt('Aller au dashboard', 'Go to dashboard')}
        </Link>
      </div>
    );
  }

  return (
    <PinSectionGate restaurant={restaurant} section="stats">
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 border-b border-stone-900/5 bg-[#f6f8fb]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link to="/dashboard" className="text-xs font-semibold uppercase tracking-[0.3em] text-navy-700">
              {dt('← Retour au dashboard', '← Back to dashboard')}
            </Link>
            <DashboardLanguageSwitch />
          </div>
          <p className="font-display text-lg font-semibold text-stone-900">{dt('Statistiques', 'Statistics')} — {restaurant.name}</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-8">
        <div className="flex flex-wrap gap-2">
          {DATE_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setDateFilter(filter.key)}
              className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all duration-300 ${
                dateFilter === filter.key
                  ? 'border-navy-400 bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 text-white'
                  : 'border-stone-200 bg-white text-stone-500 hover:-translate-y-0.5'
              }`}
            >
              {dt(filter.label.fr, filter.label.en)}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-400">{dt('Vues de plats', 'Dish views')}</p>
            <p className="mt-2 text-3xl font-bold text-stone-900">{totals.views}</p>
          </div>
          <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-400">{dt('Ajouts au panier', 'Added to cart')}</p>
            <p className="mt-2 text-3xl font-bold text-stone-900">{totals.addToCart}</p>
          </div>
          <div className="rounded-3xl border border-navy-300/25 bg-navy-300/8 p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-navy-700">{dt('Commandes payées', 'Paid orders')}</p>
            <p className="mt-2 text-3xl font-bold text-navy-700">{totals.purchases}</p>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50/60 p-8 text-center text-sm text-stone-500">
            {events.length === 0
              ? dt(
                  'Pas encore de données. Les statistiques apparaissent dès que des clients consultent votre carte publique (page « Voir ma page publique »).',
                  'No data yet. Statistics appear as soon as customers view your public menu (the "View my public page" link).',
                )
              : dt('Aucune donnée sur cette période.', 'No data for this period.')}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-stone-200/70 bg-white shadow-soft">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs uppercase tracking-[0.2em] text-stone-400">
                  <th className="px-5 py-4">{dt('Plat', 'Dish')}</th>
                  <th className="px-5 py-4">{dt('Vues', 'Views')}</th>
                  <th className="px-5 py-4">{dt('Ajouts panier', 'Added to cart')}</th>
                  <th className="px-5 py-4">{dt('Retirés du panier', 'Removed from cart')}</th>
                  <th className="px-5 py-4">{dt('Achetés', 'Purchased')}</th>
                  <th className="px-5 py-4">{dt('Abandonnés', 'Abandoned')}</th>
                  <th className="px-5 py-4">{dt('Conversion', 'Conversion')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat) => {
                  const abandoned = Math.max(0, stat.addToCart - stat.purchases);
                  const conversion = stat.addToCart > 0 ? Math.round((stat.purchases / stat.addToCart) * 100) : null;
                  return (
                    <tr key={stat.key} className="border-b border-stone-100 last:border-0">
                      <td className="px-5 py-4 font-semibold text-stone-900">{stat.name}</td>
                      <td className="px-5 py-4 text-stone-600">{stat.views}</td>
                      <td className="px-5 py-4 text-stone-600">{stat.addToCart}</td>
                      <td className="px-5 py-4 text-stone-600">{stat.removedFromCart}</td>
                      <td className="px-5 py-4 font-semibold text-navy-700">{stat.purchases}</td>
                      <td className={`px-5 py-4 font-semibold ${abandoned > 0 ? 'text-red-500' : 'text-stone-400'}`}>
                        {abandoned}
                      </td>
                      <td className="px-5 py-4 text-stone-600">{conversion === null ? '—' : `${conversion}%`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-stone-400">
          {dt(
            "« Abandonnés » = ajouts au panier qui n'ont pas abouti à un paiement (peut inclure des commandes encore en cours). Basé sur les 5000 derniers événements enregistrés.",
            '"Abandoned" = added to cart but never paid for (may include orders still in progress). Based on the last 5,000 recorded events.',
          )}
        </p>
      </main>
    </div>
    </PinSectionGate>
  );
}
