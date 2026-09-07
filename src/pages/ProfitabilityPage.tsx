import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { mapRestaurantWithMenu } from '../lib/mappers';
import type { Dish, RestaurantWithMenu } from '../lib/types';
import type { DishEventRow } from '../lib/analytics';
import { money } from '../lib/format';
import { LoadingScreen } from '../components/LoadingScreen';
import { PinSectionGate } from '../components/PinSectionGate';
import { DashboardLanguageSwitch } from '../components/DashboardLanguageSwitch';
import { useDt } from '../lib/dashboardLocale';
import { useOrderNotifications } from '../hooks/useOrderNotifications';
import {
  PROFITABILITY_TIER_EMOJI,
  PROFITABILITY_TIER_LABEL,
  getDishMargin,
  getDishMarginRate,
  getDishTotalCost,
  getProfitabilityTier,
} from '../lib/profitability';

type AnalyzedDish = {
  dish: Dish;
  categoryName: string;
  totalCost: number;
  margin: number;
  marginRate: number;
  tier: 'high' | 'medium' | 'low';
  purchaseCount: number;
  estimatedProfit: number;
};

export function ProfitabilityPage() {
  const dt = useDt();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<RestaurantWithMenu | null>(null);
  const [events, setEvents] = useState<DishEventRow[]>([]);

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
        .eq('event_type', 'purchase')
        .limit(20000);
      if (cancelled) return;
      setEvents((eventRows ?? []) as DishEventRow[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const analyzed = useMemo<AnalyzedDish[]>(() => {
    if (!restaurant) return [];
    const purchaseCounts = new Map<string, number>();
    events.forEach((event) => {
      if (!event.dish_id) return;
      purchaseCounts.set(event.dish_id, (purchaseCounts.get(event.dish_id) ?? 0) + 1);
    });

    const list: AnalyzedDish[] = [];
    restaurant.categories.forEach((category) => {
      category.dishes.forEach((dish) => {
        if (!dish.costEnabled) return;
        const totalCost = getDishTotalCost(dish);
        const margin = getDishMargin(dish);
        const marginRate = getDishMarginRate(dish);
        const purchaseCount = purchaseCounts.get(dish.id) ?? 0;
        list.push({
          dish,
          categoryName: category.name,
          totalCost,
          margin,
          marginRate,
          tier: getProfitabilityTier(marginRate),
          purchaseCount,
          estimatedProfit: margin * purchaseCount,
        });
      });
    });
    return list;
  }, [restaurant, events]);

  const sortedByMargin = useMemo(() => [...analyzed].sort((a, b) => b.marginRate - a.marginRate), [analyzed]);
  const mostProfitable = sortedByMargin.slice(0, 3);
  const leastProfitable = [...sortedByMargin].reverse().slice(0, 3);
  const sortedByProfit = useMemo(() => [...analyzed].sort((a, b) => b.estimatedProfit - a.estimatedProfit), [analyzed]);

  const overview = useMemo(() => {
    if (analyzed.length === 0) return null;
    const avgMarginRate = analyzed.reduce((sum, item) => sum + item.marginRate, 0) / analyzed.length;
    const totalProfit = analyzed.reduce((sum, item) => sum + item.estimatedProfit, 0);
    return { avgMarginRate, totalProfit };
  }, [analyzed]);

  const recommendations = useMemo(() => {
    if (analyzed.length < 3) return [];
    const counts = analyzed.map((item) => item.purchaseCount).sort((a, b) => a - b);
    const median = counts[Math.floor(counts.length / 2)];
    const messages: string[] = [];
    analyzed.forEach((item) => {
      const name = item.dish.name || dt('Ce plat', 'This dish');
      if (item.purchaseCount > median && item.tier === 'low') {
        messages.push(
          dt(
            `Votre plat "${name}" est populaire mais possède une marge faible — vérifiez son coût de fabrication.`,
            `Your dish "${name}" is popular but has a low margin — check its production cost.`,
          ),
        );
      } else if (item.purchaseCount <= median && item.tier === 'high') {
        messages.push(
          dt(
            `Votre plat "${name}" possède une excellente rentabilité mais semble peu commandé. Le mettre davantage en avant (suggestion du chef, position en haut de carte) pourrait augmenter votre rentabilité.`,
            `Your dish "${name}" has excellent profitability but seems rarely ordered. Featuring it more (chef's suggestion, top-of-menu position) could increase your profitability.`,
          ),
        );
      }
    });
    return messages.slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyzed]);

  useOrderNotifications(restaurant);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-stone-900">{dt('Aucun restaurant', 'No restaurant')}</h1>
        <p className="text-stone-500">{dt("Créez votre restaurant avant de consulter l'analyse de rentabilité.", 'Create your restaurant before viewing the profitability analysis.')}</p>
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
    <PinSectionGate restaurant={restaurant} section="rentabilite">
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 border-b border-stone-900/5 bg-[#f6f8fb]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link to="/dashboard" className="text-xs font-semibold uppercase tracking-[0.3em] text-navy-700">
              {dt('← Retour au dashboard', '← Back to dashboard')}
            </Link>
            <DashboardLanguageSwitch />
          </div>
          <p className="font-display text-lg font-semibold text-stone-900">{dt('Analyse de rentabilité', 'Profitability analysis')} — {restaurant.name}</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-8">
        {analyzed.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50/60 p-10 text-center">
            <p className="text-3xl">💰</p>
            <h1 className="mt-4 font-display text-xl font-bold text-stone-900">
              {dt('Découvrez quels plats vous rapportent vraiment', 'Discover which dishes actually make you money')}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-500">
              {dt(
                'Cette fonctionnalité est facultative. Activez "Analyse de rentabilité" sur un ou plusieurs plats (onglet Carte de votre dashboard) en renseignant leur coût de fabrication, et retrouvez ici votre marge réelle, vos plats les plus rentables, et des recommandations simples.',
                'This feature is optional. Enable "Profitability analysis" on one or more dishes (Menu tab of your dashboard) by entering their production cost, and find here your real margin, your most profitable dishes, and simple recommendations.',
              )}
            </p>
            <Link
              to="/dashboard"
              className="mt-6 inline-block rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5"
            >
              {dt('Aller à ma carte', 'Go to my menu')}
            </Link>
          </div>
        ) : (
          <>
            {overview && (
              <section className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-400">{dt('Plats analysés', 'Dishes analyzed')}</p>
                  <p className="mt-2 text-3xl font-bold text-stone-900">{analyzed.length}</p>
                </div>
                <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-400">{dt('Marge moyenne', 'Average margin')}</p>
                  <p className="mt-2 text-3xl font-bold text-stone-900">{Math.round(overview.avgMarginRate * 100)}%</p>
                </div>
                <div className="rounded-3xl border border-navy-300/25 bg-navy-300/8 p-6">
                  <p className="text-xs uppercase tracking-[0.28em] text-navy-700">{dt('Bénéfice estimé (total)', 'Estimated profit (total)')}</p>
                  <p className="mt-2 text-3xl font-bold text-navy-700">{money(overview.totalProfit)}</p>
                </div>
              </section>
            )}

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
                <h2 className="font-display text-lg font-bold text-stone-900">{dt('🏆 Plats les plus rentables', '🏆 Most profitable dishes')}</h2>
                <div className="mt-4 space-y-2">
                  {mostProfitable.map((item) => (
                    <div key={item.dish.id} className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50/70 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-stone-900">{item.dish.name || dt('Sans nom', 'Unnamed')}</p>
                        <p className="text-xs text-stone-400">{dt('Marge', 'Margin')} {Math.round(item.marginRate * 100)}%</p>
                      </div>
                      <span className="shrink-0 text-lg">{PROFITABILITY_TIER_EMOJI[item.tier]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
                <h2 className="font-display text-lg font-bold text-stone-900">{dt('📉 Plats les moins rentables', '📉 Least profitable dishes')}</h2>
                <div className="mt-4 space-y-2">
                  {leastProfitable.map((item) => (
                    <div key={item.dish.id} className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50/70 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-stone-900">{item.dish.name || dt('Sans nom', 'Unnamed')}</p>
                        <p className="text-xs text-stone-400">{dt('Marge', 'Margin')} {Math.round(item.marginRate * 100)}%</p>
                      </div>
                      <span className="shrink-0 text-lg">{PROFITABILITY_TIER_EMOJI[item.tier]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {recommendations.length > 0 && (
              <section className="rounded-3xl border border-navy-300/25 bg-navy-300/8 p-6">
                <h2 className="font-display text-lg font-bold text-stone-900">{dt('💡 Recommandations', '💡 Recommendations')}</h2>
                <ul className="mt-4 space-y-2">
                  {recommendations.map((message, index) => (
                    <li key={index} className="text-sm leading-6 text-stone-700">
                      • {message}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h2 className="font-display text-xl font-bold text-stone-900">{dt('Détail par plat', 'Detail by dish')}</h2>
              <div className="mt-4 overflow-x-auto rounded-3xl border border-stone-200/70 bg-white shadow-soft">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-xs uppercase tracking-[0.2em] text-stone-400">
                      <th className="px-5 py-4">{dt('Plat', 'Dish')}</th>
                      <th className="px-5 py-4">{dt('Prix', 'Price')}</th>
                      <th className="px-5 py-4">{dt('Coût', 'Cost')}</th>
                      <th className="px-5 py-4">{dt('Marge', 'Margin')}</th>
                      <th className="px-5 py-4">{dt('Taux', 'Rate')}</th>
                      <th className="px-5 py-4">{dt('Rentabilité', 'Profitability')}</th>
                      <th className="px-5 py-4">{dt('Commandé', 'Ordered')}</th>
                      <th className="px-5 py-4">{dt('Bénéfice estimé', 'Estimated profit')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedByProfit.map((item) => (
                      <tr key={item.dish.id} className="border-b border-stone-100 last:border-0">
                        <td className="px-5 py-4 font-semibold text-stone-900">
                          {item.dish.name || dt('Sans nom', 'Unnamed')}
                          <p className="text-xs font-normal text-stone-400">{item.categoryName}</p>
                        </td>
                        <td className="px-5 py-4 text-stone-600">{money(item.dish.price)}</td>
                        <td className="px-5 py-4 text-stone-600">{money(item.totalCost)}</td>
                        <td className="px-5 py-4 font-semibold text-stone-900">{money(item.margin)}</td>
                        <td className="px-5 py-4 text-stone-600">{Math.round(item.marginRate * 100)}%</td>
                        <td className="px-5 py-4">
                          {PROFITABILITY_TIER_EMOJI[item.tier]} {dt(PROFITABILITY_TIER_LABEL[item.tier].fr, PROFITABILITY_TIER_LABEL[item.tier].en)}
                        </td>
                        <td className="px-5 py-4 text-stone-600">{item.purchaseCount}</td>
                        <td className="px-5 py-4 font-semibold text-navy-700">{money(item.estimatedProfit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-stone-400">
                {dt(
                  '"Commandé" est basé sur les achats enregistrés depuis votre carte publique. "Bénéfice estimé" = marge × nombre de fois commandé.',
                  '"Ordered" is based on purchases recorded from your public menu. "Estimated profit" = margin × number of times ordered.',
                )}
              </p>
            </section>
          </>
        )}
      </main>
    </div>
    </PinSectionGate>
  );
}
