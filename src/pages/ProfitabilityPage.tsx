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
      const name = item.dish.name || 'Ce plat';
      if (item.purchaseCount > median && item.tier === 'low') {
        messages.push(`Votre plat "${name}" est populaire mais possède une marge faible — vérifiez son coût de fabrication.`);
      } else if (item.purchaseCount <= median && item.tier === 'high') {
        messages.push(
          `Votre plat "${name}" possède une excellente rentabilité mais semble peu commandé. Le mettre davantage en avant (suggestion du chef, position en haut de carte) pourrait augmenter votre rentabilité.`,
        );
      }
    });
    return messages.slice(0, 6);
  }, [analyzed]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-stone-900">Aucun restaurant</h1>
        <p className="text-stone-500">Créez votre restaurant avant de consulter l'analyse de rentabilité.</p>
        <Link
          to="/dashboard"
          className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-6 py-3 text-sm font-bold text-white"
        >
          Aller au dashboard
        </Link>
      </div>
    );
  }

  return (
    <PinSectionGate restaurant={restaurant} section="rentabilite">
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 border-b border-stone-900/5 bg-[#f6f8fb]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-5 sm:px-8">
          <Link to="/dashboard" className="text-xs font-semibold uppercase tracking-[0.3em] text-navy-700">
            ← Retour au dashboard
          </Link>
          <p className="font-display text-lg font-semibold text-stone-900">Analyse de rentabilité — {restaurant.name}</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-8">
        {analyzed.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50/60 p-10 text-center">
            <p className="text-3xl">💰</p>
            <h1 className="mt-4 font-display text-xl font-bold text-stone-900">
              Découvrez quels plats vous rapportent vraiment
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-500">
              Cette fonctionnalité est facultative. Activez "Analyse de rentabilité" sur un ou plusieurs plats
              (onglet Carte de votre dashboard) en renseignant leur coût de fabrication, et retrouvez ici votre
              marge réelle, vos plats les plus rentables, et des recommandations simples.
            </p>
            <Link
              to="/dashboard"
              className="mt-6 inline-block rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5"
            >
              Aller à ma carte
            </Link>
          </div>
        ) : (
          <>
            {overview && (
              <section className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Plats analysés</p>
                  <p className="mt-2 text-3xl font-bold text-stone-900">{analyzed.length}</p>
                </div>
                <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Marge moyenne</p>
                  <p className="mt-2 text-3xl font-bold text-stone-900">{Math.round(overview.avgMarginRate * 100)}%</p>
                </div>
                <div className="rounded-3xl border border-navy-300/25 bg-navy-300/8 p-6">
                  <p className="text-xs uppercase tracking-[0.28em] text-navy-700">Bénéfice estimé (total)</p>
                  <p className="mt-2 text-3xl font-bold text-navy-700">{money(overview.totalProfit)}</p>
                </div>
              </section>
            )}

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
                <h2 className="font-display text-lg font-bold text-stone-900">🏆 Plats les plus rentables</h2>
                <div className="mt-4 space-y-2">
                  {mostProfitable.map((item) => (
                    <div key={item.dish.id} className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50/70 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-stone-900">{item.dish.name || 'Sans nom'}</p>
                        <p className="text-xs text-stone-400">Marge {Math.round(item.marginRate * 100)}%</p>
                      </div>
                      <span className="shrink-0 text-lg">{PROFITABILITY_TIER_EMOJI[item.tier]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
                <h2 className="font-display text-lg font-bold text-stone-900">📉 Plats les moins rentables</h2>
                <div className="mt-4 space-y-2">
                  {leastProfitable.map((item) => (
                    <div key={item.dish.id} className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50/70 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-stone-900">{item.dish.name || 'Sans nom'}</p>
                        <p className="text-xs text-stone-400">Marge {Math.round(item.marginRate * 100)}%</p>
                      </div>
                      <span className="shrink-0 text-lg">{PROFITABILITY_TIER_EMOJI[item.tier]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {recommendations.length > 0 && (
              <section className="rounded-3xl border border-navy-300/25 bg-navy-300/8 p-6">
                <h2 className="font-display text-lg font-bold text-stone-900">💡 Recommandations</h2>
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
              <h2 className="font-display text-xl font-bold text-stone-900">Détail par plat</h2>
              <div className="mt-4 overflow-x-auto rounded-3xl border border-stone-200/70 bg-white shadow-soft">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-xs uppercase tracking-[0.2em] text-stone-400">
                      <th className="px-5 py-4">Plat</th>
                      <th className="px-5 py-4">Prix</th>
                      <th className="px-5 py-4">Coût</th>
                      <th className="px-5 py-4">Marge</th>
                      <th className="px-5 py-4">Taux</th>
                      <th className="px-5 py-4">Rentabilité</th>
                      <th className="px-5 py-4">Commandé</th>
                      <th className="px-5 py-4">Bénéfice estimé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedByProfit.map((item) => (
                      <tr key={item.dish.id} className="border-b border-stone-100 last:border-0">
                        <td className="px-5 py-4 font-semibold text-stone-900">
                          {item.dish.name || 'Sans nom'}
                          <p className="text-xs font-normal text-stone-400">{item.categoryName}</p>
                        </td>
                        <td className="px-5 py-4 text-stone-600">{money(item.dish.price)}</td>
                        <td className="px-5 py-4 text-stone-600">{money(item.totalCost)}</td>
                        <td className="px-5 py-4 font-semibold text-stone-900">{money(item.margin)}</td>
                        <td className="px-5 py-4 text-stone-600">{Math.round(item.marginRate * 100)}%</td>
                        <td className="px-5 py-4">
                          {PROFITABILITY_TIER_EMOJI[item.tier]} {PROFITABILITY_TIER_LABEL[item.tier]}
                        </td>
                        <td className="px-5 py-4 text-stone-600">{item.purchaseCount}</td>
                        <td className="px-5 py-4 font-semibold text-navy-700">{money(item.estimatedProfit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-stone-400">
                "Commandé" est basé sur les achats enregistrés depuis votre carte publique. "Bénéfice estimé" = marge
                × nombre de fois commandé.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
    </PinSectionGate>
  );
}
