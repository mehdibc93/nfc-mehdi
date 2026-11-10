import { useEffect, useState } from 'react';
import type { RestaurantWithMenu } from '../lib/types';
import { useDt } from '../lib/dashboardLocale';
import { supabase } from '../lib/supabaseClient';
import { CLASSIC_CATALOG, PARTY_CATALOG } from '../games/catalog';

type Props = {
  restaurant: RestaurantWithMenu;
  updateRestaurantField: (patch: Partial<RestaurantWithMenu>) => void;
};

type Usage = { opens: number; starts: number; top: { id: string; count: number }[] };

const DAYS = 30;

// Réglages « Salle de jeux » (onglet Restaurant du dashboard) : activer/couper la salle, masquer
// certains jeux, et voir si les clients l'utilisent vraiment (30 derniers jours).
export function GamesSettings({ restaurant, updateRestaurantField }: Props) {
  const dt = useDt();
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    let cancelled = false;
    const since = new Date(Date.now() - DAYS * 24 * 3600 * 1000).toISOString();
    supabase
      .from('game_events')
      .select('game, event')
      .eq('restaurant_id', restaurant.id)
      .gte('created_at', since)
      .limit(10000)
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const counts = new Map<string, number>();
        let opens = 0;
        let starts = 0;
        for (const row of data as { game: string; event: string }[]) {
          if (row.event === 'open') opens += 1;
          else {
            starts += 1;
            counts.set(row.game, (counts.get(row.game) ?? 0) + 1);
          }
        }
        const top = [...counts.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count).slice(0, 3);
        setUsage({ opens, starts, top });
      });
    return () => {
      cancelled = true;
    };
  }, [restaurant.id]);

  const hidden = new Set(restaurant.gamesHidden);
  const toggleGame = (id: string) => {
    const next = new Set(hidden);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    updateRestaurantField({ gamesHidden: [...next] });
  };

  const nameOf = (id: string) => {
    const party = PARTY_CATALOG.find((game) => game.id === id);
    if (party) return `${party.emoji} ${dt(party.title.fr, party.title.en)}`;
    const classic = CLASSIC_CATALOG.find((game) => game.id === id);
    return classic ? `${classic.emoji} ${dt(classic.fr, classic.en)}` : id;
  };

  const chip = (id: string, label: string) => {
    const on = !hidden.has(id);
    return (
      <button
        key={id}
        type="button"
        onClick={() => toggleGame(id)}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
          on ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-stone-200 bg-white text-stone-400 line-through'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="sm:col-span-2">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
        {dt('Salle de jeux', 'Game room')}{' '}
        <span className="font-normal normal-case tracking-normal text-stone-500">({dt('facultatif', 'optional')})</span>
      </p>
      <div className="mt-2 rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-stone-700">{dt('🎮 Proposer des jeux à vos clients', '🎮 Offer games to your customers')}</p>
            <p className="mt-0.5 text-xs text-stone-500">
              {dt(
                'Quiz, cartes, billard… à jouer à table en attendant les plats ou les amis. Coupez-la si vous préférez des tables qui tournent vite.',
                'Quiz, cards, pool… to play at the table while waiting for food or friends. Turn it off if you prefer a fast table turnover.',
              )}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={restaurant.gamesEnabled}
            onClick={() => updateRestaurantField({ gamesEnabled: !restaurant.gamesEnabled })}
            className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-300 ${
              restaurant.gamesEnabled ? 'justify-end bg-emerald-500' : 'justify-start bg-red-400'
            }`}
          >
            <span className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300" />
          </button>
        </div>

        <div className={`mt-4 transition-opacity duration-300 ${restaurant.gamesEnabled ? '' : 'pointer-events-none opacity-40'}`}>
          <p className="text-xs font-semibold text-stone-600">{dt('Jeux proposés (touchez pour masquer ou afficher)', 'Games offered (tap to hide or show)')}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PARTY_CATALOG.map((game) => chip(game.id, `${game.emoji} ${dt(game.title.fr, game.title.en)}`))}
            {CLASSIC_CATALOG.map((game) => chip(game.id, `${game.emoji} ${dt(game.fr, game.en)}`))}
          </div>

          {usage && (
            <div className="mt-4 rounded-xl bg-stone-50 px-3 py-3">
              <p className="text-xs font-semibold text-stone-600">{dt(`Utilisation sur ${DAYS} jours`, `Usage over ${DAYS} days`)}</p>
              {usage.opens === 0 ? (
                <p className="mt-1 text-xs text-stone-500">{dt('Aucun client n’a encore ouvert la salle de jeux.', 'No customer has opened the game room yet.')}</p>
              ) : (
                <>
                  <p className="mt-1 text-sm text-stone-700">
                    <strong>{usage.opens}</strong> {dt('ouverture(s) de la salle', 'game room visit(s)')} · <strong>{usage.starts}</strong>{' '}
                    {dt('partie(s) lancée(s)', 'game(s) started')}
                  </p>
                  {usage.top.length > 0 && (
                    <p className="mt-1 text-xs text-stone-500">
                      {dt('Les plus joués', 'Most played')} : {usage.top.map((item) => `${nameOf(item.id)} (${item.count})`).join(' · ')}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
