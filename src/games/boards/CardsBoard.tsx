import { useEffect, useState } from 'react';
import { CARD_COLORS, canPlay, topCard, type Card, type CardColor, type CardsAction, type CardsState } from '../cards';
import type { BoardProps } from './boardProps';

const COLOR_HEX: Record<CardColor, string> = { r: '#e5383b', y: '#f2b705', g: '#2a9d4b', b: '#1e6fd9' };
const WILD_BG = `conic-gradient(${COLOR_HEX.r} 0 25%, ${COLOR_HEX.y} 0 50%, ${COLOR_HEX.g} 0 75%, ${COLOR_HEX.b} 0)`;
const AVATAR_COLORS = ['#1c2f47', '#b5179e', '#0f766e', '#c2410c'];

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

/** Petite rotation stable par carte, pour une défausse « en vrac ». */
const tilt = (id: number) => ((id * 47) % 21) - 10;

const SIZES = {
  sm: 'h-16 w-11 rounded-lg border-2 text-lg',
  md: 'h-[104px] w-[70px] rounded-xl border-[3px] text-3xl',
  lg: 'h-32 w-[88px] rounded-2xl border-4 text-4xl',
};

function CardFace({ card, size = 'md', dim = false }: { card: Card; size?: keyof typeof SIZES; dim?: boolean }) {
  const label = cardLabel(card);
  return (
    <div
      className={`relative flex shrink-0 select-none items-center justify-center overflow-hidden border-white font-black text-white shadow-card ${SIZES[size]} ${
        dim ? 'brightness-90 grayscale-[75%]' : ''
      }`}
      style={{ background: card.color === 'w' ? WILD_BG : COLOR_HEX[card.color] }}
    >
      <span className="absolute inset-x-[12%] inset-y-[16%] rotate-[25deg] rounded-[50%] bg-white" />
      <span className="relative" style={{ color: card.color === 'w' ? '#111' : COLOR_HEX[card.color] }}>
        {label}
      </span>
      {size !== 'sm' && (
        <>
          <span className="absolute left-1.5 top-1 text-[11px] leading-none">{label}</span>
          <span className="absolute bottom-1 right-1.5 rotate-180 text-[11px] leading-none">{label}</span>
        </>
      )}
    </div>
  );
}

function CardBack({ size = 'md' }: { size?: keyof typeof SIZES }) {
  return (
    <div className={`relative flex shrink-0 items-center justify-center overflow-hidden border-white bg-stone-900 shadow-card ${SIZES[size]}`}>
      <span className="absolute inset-[14%] rotate-[25deg] rounded-[50%] bg-gradient-to-br from-red-500 via-amber-400 to-blue-500 opacity-90" />
      {size !== 'sm' && <span className="relative rotate-[-25deg] font-display text-[12px] font-black tracking-tight text-white drop-shadow">Couleurs</span>}
    </div>
  );
}

export function CardsBoard({ state, players, me, canAct, onAction, tx }: BoardProps<CardsState, CardsAction>) {
  const [pendingWild, setPendingWild] = useState<number | null>(null);
  const [shout, setShout] = useState(false);
  // Mode local : on cache la main tant que le bon joueur n'a pas pris le téléphone.
  const [revealedFor, setRevealedFor] = useState<number | null>(me === null ? null : me);
  const viewer = me ?? state.turn;
  const handHidden = me === null && revealedFor !== state.turn && !state.result;

  useEffect(() => {
    setPendingWild(null);
    setShout(false);
  }, [state.turn]);

  const top = topCard(state);
  const hand = state.hands[viewer] ?? [];
  const recent = state.discard.slice(-3);
  const event = state.event;
  const nameOf = (index: number | undefined | null) => (index == null ? '' : players[index]?.name ?? '');
  const eventText = !event
    ? null
    : event.kind === 'skip'
      ? `⊘ ${tx('cards.skip', { name: nameOf(event.target) })}`
      : event.kind === 'reverse'
        ? `⇄ ${tx('cards.reverse')}`
        : event.kind === 'plus2'
          ? `+2 · ${tx('cards.plus2', { name: nameOf(event.target) })}`
          : event.kind === 'plus4'
            ? `+4 · ${tx('cards.plus4', { name: nameOf(event.target) })}`
            : event.kind === 'draw'
              ? tx('cards.drew', { name: nameOf(event.player) })
              : `★ ${tx('cards.color')}`;

  const play = (card: Card) => {
    if (!canAct || handHidden || !canPlay(state, card)) return;
    if (card.color === 'w') {
      setPendingWild(card.id);
      return;
    }
    onAction({ type: 'play', cardId: card.id, shout });
  };

  const opponents = players.map((player, index) => ({ player, index })).filter(({ index }) => index !== viewer || handHidden);
  const fan = hand.length <= 9;
  // Chevauchement des cartes pour que la main tienne dans ~330 px (cartes de 70 px).
  const overlap = fan ? Math.max(20, Math.ceil((70 * hand.length - 300) / Math.max(1, hand.length - 1))) : 20;
  const mustShout = canAct && !handHidden && hand.length === 2;

  return (
    <div className="flex flex-col gap-4">
      {/* Adversaires */}
      <div className="flex flex-wrap justify-center gap-4">
        {opponents.map(({ player, index }) => {
          const count = state.hands[index]?.length ?? 0;
          const active = state.turn === index && !state.result;
          return (
            <div key={player.id} className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full font-display text-lg font-bold text-white transition-shadow ${
                    active ? 'ring-4 ring-amber-300 ring-offset-2 ring-offset-[#f7f4ee]' : ''
                  }`}
                  style={{ background: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
                >
                  {player.name.slice(0, 1).toUpperCase()}
                </span>
                {count === 1 && (
                  <span className="absolute -right-4 -top-2 animate-pulse whitespace-nowrap rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                    {tx('cards.lastCard')}
                  </span>
                )}
              </div>
              <p className="max-w-[84px] truncate text-xs font-semibold text-stone-700">{player.name}</p>
              <div className="flex h-6 items-end">
                {Array.from({ length: Math.min(count, 7) }).map((_, i) => (
                  <span
                    key={i}
                    className="-ml-2.5 h-6 w-4 rounded-[4px] border border-white bg-stone-900 shadow first:ml-0"
                    style={{ transform: `rotate(${(i - 3) * 6}deg)` }}
                  />
                ))}
                <span className="ml-1.5 text-[11px] font-bold tabular-nums text-stone-500">{count}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tapis */}
      <div className="relative flex items-center justify-center gap-10 overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_50%_40%,#1f8a55,#0c4a2d)] px-4 pb-8 pt-9 shadow-inner">
        <span
          className="pointer-events-none absolute left-4 top-3 text-3xl text-white/35 transition-transform duration-500"
          style={{ transform: `scaleX(${state.dir})` }}
        >
          ↻
        </span>
        <button
          type="button"
          onClick={() => onAction({ type: 'draw' })}
          disabled={!canAct || handHidden || state.drew}
          className="relative transition-transform duration-200 enabled:hover:-translate-y-1 enabled:active:scale-95"
          aria-label={tx('cards.draw')}
        >
          <span className="absolute left-1.5 top-1.5">
            <CardBack />
          </span>
          <span className="absolute left-0.5 top-0.5">
            <CardBack />
          </span>
          <span className="relative block">
            <CardBack />
          </span>
          <span className="absolute -bottom-2 -right-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-stone-700 shadow">{state.pile.length}</span>
          {canAct && !handHidden && !state.drew && (
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-white/80">
              {tx('cards.draw')}
            </span>
          )}
        </button>
        <div className="relative h-32 w-[88px]">
          {recent.map((card, i) => (
            <div key={card.id} className={`absolute inset-0 ${i === recent.length - 1 ? 'animate-pop' : ''}`} style={{ transform: `rotate(${tilt(card.id)}deg)` }}>
              <CardFace card={card} size="lg" />
            </div>
          ))}
          <span
            className="absolute -bottom-3 -right-3 h-9 w-9 rounded-full border-4 border-white shadow-card transition-colors duration-300"
            style={{ background: COLOR_HEX[state.color] }}
            title={top.color}
          />
        </div>
      </div>

      {(eventText || state.forgot != null) && (
        <div className="flex flex-col items-center gap-1">
          {state.forgot != null && (
            <p className="animate-pop rounded-full bg-red-50 px-4 py-1.5 text-center text-sm font-bold text-red-600">
              📣 {tx('cards.forgot', { name: nameOf(state.forgot) })}
            </p>
          )}
          {eventText && <p className="text-center text-sm font-semibold text-stone-500">{eventText}</p>}
        </div>
      )}

      {handHidden ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-soft">
          <p className="text-4xl">🙈</p>
          <p className="mt-2 font-display text-lg font-bold text-stone-900">{tx('cards.handOff', { name: nameOf(state.turn) })}</p>
          <button type="button" onClick={() => setRevealedFor(state.turn)} className="mt-4 rounded-full bg-stone-900 px-6 py-3 text-sm font-bold text-white">
            {tx('cards.reveal', { name: nameOf(state.turn) })}
          </button>
        </div>
      ) : (
        <>
          {/* Ma main, en éventail */}
          <div className={fan ? 'flex justify-center pb-2 pt-6' : '-mx-4 overflow-x-auto px-4 pb-2 pt-6'}>
            <div className={`flex ${fan ? '' : 'w-max'}`}>
              {hand.map((card, i) => {
                const playable = canAct && canPlay(state, card);
                const offset = i - (hand.length - 1) / 2;
                const angle = fan ? offset * Math.min(7, 40 / Math.max(1, hand.length)) : 0;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => play(card)}
                    disabled={!playable}
                    aria-label={cardLabel(card)}
                    className="animate-dealIn"
                    style={{ zIndex: i, marginLeft: i === 0 ? 0 : -overlap, animationDelay: `${i * 25}ms` }}
                  >
                    <span
                      className={`block transition-transform duration-200 ${playable ? 'hover:-translate-y-3' : ''}`}
                      style={{
                        transform: `rotate(${angle}deg) translateY(${(fan ? Math.abs(offset) * 3 : 0) - (playable ? 12 : 0)}px)`,
                      }}
                    >
                      <CardFace card={card} dim={canAct && !playable} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {canAct && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {mustShout && (
                <button
                  type="button"
                  onClick={() => setShout((value) => !value)}
                  className={`rounded-full px-5 py-2.5 text-sm font-black text-white transition-all ${shout ? 'bg-emerald-500' : 'animate-pulse bg-red-500 shadow-card'}`}
                >
                  {shout ? `✓ ${tx('cards.shoutArmed')}` : tx('cards.shout')}
                </button>
              )}
              <button
                type="button"
                onClick={() => onAction(state.drew ? { type: 'pass' } : { type: 'draw' })}
                className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-bold text-stone-700"
              >
                {state.drew ? tx('cards.pass') : tx('cards.draw')}
              </button>
            </div>
          )}
          {mustShout && !shout && <p className="text-center text-xs font-semibold text-red-500">{tx('cards.shoutHint')}</p>}
        </>
      )}

      {pendingWild !== null && (
        <div className="fixed inset-0 z-[85] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center" onClick={() => setPendingWild(null)}>
          <div className="w-full max-w-sm animate-slideUp rounded-3xl bg-white p-6 text-center shadow-card" onClick={(event) => event.stopPropagation()}>
            <p className="font-display text-lg font-bold text-stone-900">{tx('cards.chooseColor')}</p>
            <div className="mx-auto mt-5 grid w-56 grid-cols-2 gap-3">
              {CARD_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    onAction({ type: 'play', cardId: pendingWild, color, shout });
                    setPendingWild(null);
                  }}
                  className="aspect-square rounded-3xl border-4 border-white shadow-card transition-transform hover:scale-105 active:scale-95"
                  style={{ background: COLOR_HEX[color] }}
                  aria-label={color}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-xs leading-5 text-stone-400">{tx('cards.rules')}</p>
    </div>
  );
}
