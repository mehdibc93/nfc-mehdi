import { useEffect, useState } from 'react';
import type { RestaurantWithMenu } from '../lib/types';
import { useDt } from '../lib/dashboardLocale';
import { supabase } from '../lib/supabaseClient';
import { ALL_GAME_IDS, CLASSIC_CATALOG, PARTY_CATALOG } from '../games/catalog';

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

  const activeCount = ALL_GAME_IDS.filter((id) => !hidden.has(id)).length;

  // Une ligne par jeu : icône, nom, description et interrupteur.
  const row = (id: string, emoji: string, title: string, text: string) => {
    const on = !hidden.has(id);
    return (
      <li key={id} className={`flex items-center gap-3 rounded-xl px-2 py-2 transition-colors ${on ? '' : 'opacity-60'}`}>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${on ? 'bg-amber-50' : 'bg-stone-100 grayscale'}`}>{emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-stone-800">{title}</span>
          <span className="block truncate text-xs text-stone-500">{text}</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={title}
          onClick={() => toggleGame(id)}
          className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 ${on ? 'justify-end bg-emerald-500' : 'justify-start bg-stone-300'}`}
        >
          <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
        </button>
      </li>
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-stone-600">
              {dt('Choisissez les jeux proposés', 'Choose which games to offer')} · {activeCount}/{ALL_GAME_IDS.length}
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => updateRestaurantField({ gamesHidden: [] })}
                className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600 hover:border-stone-400"
              >
                {dt('Tout activer', 'Enable all')}
              </button>
              <button
                type="button"
                onClick={() => updateRestaurantField({ gamesHidden: [...ALL_GAME_IDS] })}
                className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600 hover:border-stone-400"
              >
                {dt('Tout désactiver', 'Disable all')}
              </button>
            </div>
          </div>
          {activeCount === 0 && (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              {dt('Aucun jeu activé : la salle de jeux n’apparaîtra pas chez vos clients.', 'No game enabled: your customers won’t see the game room.')}
            </p>
          )}
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">{dt('Jeux d’ambiance', 'Party games')}</p>
          <ul className="mt-1 divide-y divide-stone-100">
            {PARTY_CATALOG.map((game) => row(game.id, game.emoji, dt(game.title.fr, game.title.en), dt(game.text.fr, game.text.en)))}
          </ul>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">{dt('Jeux classiques', 'Classic games')}</p>
          <ul className="mt-1 divide-y divide-stone-100">
            {CLASSIC_CATALOG.map((game) => row(game.id, game.emoji, dt(game.fr, game.en), dt(game.textFr, game.textEn)))}
          </ul>

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
