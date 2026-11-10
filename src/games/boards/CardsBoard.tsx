import { useEffect, useState } from 'react';
import { CARD_COLORS, canPlay, topCard, type Card, type CardColor, type CardsAction, type CardsState } from '../cards';
import type { BoardProps } from './boardProps';

const COLOR_HEX: Record<CardColor, string> = { r: '#e5383b', y: '#f2b705', g: '#2a9d4b', b: '#1e6fd9' };
const WILD_BG = `conic-gradient(${COLOR_HEX.r} 0 25%, ${COLOR_HEX.y} 0 50%, ${COLOR_HEX.g} 0 75%, ${COLOR_HEX.b} 0)`;

function cardLabel(card: Card): string {
  switch (card.value) {
    case 'skip':
      return '⊘';
    case 'reverse':
      return '⇄';
    case 'plus2':
      return '+2';
    case 'plus4':
      return '+4';
    case 'wild':
      return '★';
    default:
      return card.value;
  }
}

function CardFace({ card, size = 'md', dim = false, raised = false }: { card: Card; size?: 'sm' | 'md' | 'lg'; dim?: boolean; raised?: boolean }) {
  const dims = size === 'lg' ? 'h-28 w-20 text-3xl' : size === 'sm' ? 'h-14 w-10 text-base' : 'h-24 w-16 text-2xl';
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-xl border-[3px] border-white font-black text-white shadow-card transition-all duration-200 ${dims} ${
        dim ? 'brightness-75 saturate-[.35]' : ''
      } ${raised ? '-translate-y-2' : ''}`}
      style={{ background: card.color === 'w' ? WILD_BG : COLOR_HEX[card.color] }}
    >
      <span className="absolute inset-[18%] rotate-[-20deg] rounded-[50%] bg-white/25" />
      <span className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]">{cardLabel(card)}</span>
    </div>
  );
}

function CardBack({ count }: { count: number }) {
  return (
    <div className="relative flex h-24 w-16 items-center justify-center rounded-xl border-[3px] border-white bg-stone-900 shadow-card">
      <span className="rotate-[-60deg] font-display text-[11px] font-black tracking-wide text-amber-300">Nourevo</span>
      <span className="absolute -bottom-2 -right-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-stone-700 shadow">{count}</span>
    </div>
  );
}

export function CardsBoard({ state, players, me, canAct, onAction, tx }: BoardProps<CardsState, CardsAction>) {
  const [pendingWild, setPendingWild] = useState<number | null>(null);
  // Mode local : on cache la main tant que le bon joueur n'a pas pris le téléphone.
  const [revealedFor, setRevealedFor] = useState<number | null>(me === null ? null : me);
  const viewer = me ?? state.turn;
  const handHidden = me === null && revealedFor !== state.turn && !state.result;

  useEffect(() => {
    setPendingWild(null);
  }, [state.turn]);

  const top = topCard(state);
  const hand = state.hands[viewer] ?? [];
  const event = state.event;
  const nameOf = (index: number | undefined) => (index === undefined ? '' : players[index]?.name ?? '');
  const eventText = !event
    ? null
    : event.kind === 'skip'
      ? tx('cards.skip', { name: nameOf(event.target) })
      : event.kind === 'reverse'
        ? tx('cards.reverse')
        : event.kind === 'plus2'
          ? tx('cards.plus2', { name: nameOf(event.target) })
          : event.kind === 'plus4'
            ? tx('cards.plus4', { name: nameOf(event.target) })
            : event.kind === 'draw'
              ? tx('cards.drew', { name: nameOf(event.player) })
              : tx('cards.color');

  const play = (card: Card) => {
    if (!canAct || handHidden || !canPlay(state, card)) return;
    if (card.color === 'w') {
      setPendingWild(card.id);
      return;
    }
    onAction({ type: 'play', cardId: card.id });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap justify-center gap-2">
        {players.map((player, index) =>
          index === viewer && !handHidden ? null : (
            <div
              key={player.id}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                state.turn === index ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-stone-200 bg-white text-stone-600'
              }`}
            >
              {player.name} · {tx('cards.count', { n: state.hands[index]?.length ?? 0 })}
            </div>
          ),
        )}
      </div>

      <div className="flex items-center justify-center gap-6 rounded-3xl bg-gradient-to-br from-emerald-800 to-emerald-950 px-4 py-6 shadow-inner">
        <button
          type="button"
          onClick={() => onAction({ type: 'draw' })}
          disabled={!canAct || handHidden || state.drew}
          className="transition-transform duration-200 enabled:hover:-translate-y-1 disabled:opacity-70"
          aria-label={tx('cards.draw')}
        >
          <CardBack count={state.pile.length} />
        </button>
        <div key={top.id} className="animate-pop">
          <CardFace card={top} size="lg" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="h-8 w-8 rounded-full border-[3px] border-white shadow" style={{ background: COLOR_HEX[state.color] }} />
          <span className="text-lg text-white">{state.dir === 1 ? '↻' : '↺'}</span>
        </div>
      </div>

      {eventText && <p className="text-center text-sm font-semibold text-stone-500">{eventText}</p>}

      {handHidden ? (
        <div className="rounded-3xl border border-stone-200 bg-stone-50 p-6 text-center">
          <p className="font-display text-lg font-bold text-stone-900">{tx('cards.handOff', { name: nameOf(state.turn) })}</p>
          <button
            type="button"
            onClick={() => setRevealedFor(state.turn)}
            className="mt-4 rounded-full bg-stone-900 px-6 py-3 text-sm font-bold text-white"
          >
            {tx('cards.reveal', { name: nameOf(state.turn) })}
          </button>
        </div>
      ) : (
        <>
          <div className="-mx-4 overflow-x-auto px-4 pb-2 pt-3">
            <div className="flex w-max">
              {hand.map((card) => {
                const playable = canAct && canPlay(state, card);
                return (
                  <button key={card.id} type="button" onClick={() => play(card)} disabled={!playable} aria-label={cardLabel(card)} className="-ml-4 first:ml-0">
                    <CardFace card={card} dim={canAct && !playable} raised={playable} />
                  </button>
                );
              })}
            </div>
          </div>
          {canAct && (
            <div className="flex justify-center gap-2">
              {!state.drew ? (
                <button
                  type="button"
                  onClick={() => onAction({ type: 'draw' })}
                  className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-bold text-stone-700"
                >
                  {tx('cards.draw')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onAction({ type: 'pass' })}
                  className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-bold text-stone-700"
                >
                  {tx('cards.pass')}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {pendingWild !== null && (
        <div className="rounded-3xl border border-stone-200 bg-white p-4 text-center shadow-soft">
          <p className="text-sm font-semibold text-stone-700">{tx('cards.chooseColor')}</p>
          <div className="mt-3 flex justify-center gap-3">
            {CARD_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onAction({ type: 'play', cardId: pendingWild, color });
                  setPendingWild(null);
                }}
                className="h-12 w-12 rounded-full border-4 border-white shadow-card transition-transform hover:scale-110"
                style={{ background: COLOR_HEX[color] }}
                aria-label={color}
              />
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-stone-400">{tx('cards.rules')}</p>
    </div>
  );
}
