import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Locale } from '../lib/i18n';
import { gameTx, type GameTx } from './gameText';
import { GAME_EMOJI, GAME_LOGIC, GAME_ORDER } from './registry';
import type { GameId, GamePlayer } from './types';
import { useGameLobby, type Reaction } from './useGameLobby';
import type { BoardProps } from './boards/boardProps';
import { BilliardsBoard } from './boards/BilliardsBoard';
import { CardsBoard } from './boards/CardsBoard';
import { Connect4Board, TicTacToeBoard } from './boards/GridBoards';
import { PARTY_GAMES, type PartyDish } from './party';
import { PartyHeader, PartyTheme } from './party/ui';
import { botAction, cards, type CardsState } from './cards';
import { Confetti } from './Confetti';

const CLASSIC_TINTS: Record<GameId, string> = { billiards: '#e5e7eb', cards: '#fde2e4', connect4: '#e0ecff', tictactoe: '#fff4cc' };

type Filter = 'all' | 'fun' | 'brain' | 'classic';
const FILTERS: Filter[] = ['all', 'fun', 'brain', 'classic'];
const PARTY_KIND: Record<string, Filter> = {
  rather: 'fun',
  roulette: 'fun',
  potato: 'fun',
  undercover: 'fun',
  forehead: 'fun',
  whoofus: 'fun',
  reflex: 'fun',
  price: 'brain',
  quiz: 'brain',
  cursed: 'brain',
  letters: 'brain',
};
const BOT_DELAY_MS = 1100;

function GameIcon({ emoji, tint }: { emoji: string; tint: string }) {
  return (
    <span
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl shadow-inner"
      style={{ background: `radial-gradient(circle at 30% 25%, #ffffff 0%, ${tint} 70%)` }}
    >
      <span className="drop-shadow-[0_4px_4px_rgba(0,0,0,0.18)]">{emoji}</span>
    </span>
  );
}

// Salle de jeux proposée au client après sa commande sur place : mini-jeux à plusieurs sur le
// même téléphone, ou en ligne avec les autres tables du restaurant (voir useGameLobby).

const NAME_KEY = 'nourevo-player-name';
const ID_KEY = 'nourevo-player-id';
const TABLE_KEY = 'nourevo-player-table';
const REACTIONS = ['👏', '😂', '😱', '🔥', '😎'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BOARDS: Record<GameId, (props: BoardProps<any, any>) => JSX.Element> = {
  billiards: BilliardsBoard,
  cards: CardsBoard,
  connect4: Connect4Board,
  tictactoe: TicTacToeBoard,
};

function readStorage(storage: 'local' | 'session', key: string): string | null {
  try {
    return (storage === 'local' ? window.localStorage : window.sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: 'local' | 'session', key: string, value: string) {
  try {
    (storage === 'local' ? window.localStorage : window.sessionStorage).setItem(key, value);
  } catch {
    // Navigation privée : tant pis, on redemandera le prénom.
  }
}

function playerId(): string {
  const existing = readStorage('session', ID_KEY);
  if (existing) return existing;
  const id = Math.random().toString(36).slice(2, 12);
  writeStorage('session', ID_KEY, id);
  return id;
}

const gameName = (tx: GameTx, game: GameId) => tx(`game.${game}`);
const gameText = (tx: GameTx, game: GameId) => tx(`game.${game}Text`);

type LocalGame = { game: GameId; players: GamePlayer[]; state: unknown };

export function GameLounge({
  restaurantId,
  table,
  tableCount,
  dishes,
  defaultName,
  locale,
  joinRoomId,
  onClose,
}: {
  restaurantId: string;
  /** Table de la commande, si le client a déjà commandé ; sinon il la choisit en entrant. */
  table: string | null;
  tableCount: number;
  /** Plats de la carte, pour « Devine le prix ». */
  dishes: PartyDish[];
  defaultName: string;
  locale: Locale;
  /** Défi accepté depuis l'écran de commande : partie à rejoindre dès la connexion. */
  joinRoomId?: string | null;
  onClose: () => void;
}) {
  const tx = useMemo(() => gameTx(locale), [locale]);
  const [name, setName] = useState(() => readStorage('local', NAME_KEY) ?? '');
  const [draftName, setDraftName] = useState(() => readStorage('local', NAME_KEY) ?? defaultName.trim().split(' ')[0] ?? '');
  // Chaque joueur indique sa table (déjà connue s'il a commandé) : c'est elle qui permet de
  // défier une table précise ou d'être défié.
  const [myTable, setMyTable] = useState(() => table ?? readStorage('session', TABLE_KEY) ?? '');
  const [draftTable, setDraftTable] = useState(myTable);
  const [editingProfile, setEditingProfile] = useState(false);
  const [tab, setTab] = useState<'online' | 'local'>(joinRoomId ? 'online' : 'local');
  const [party, setParty] = useState<string | null>(null);
  const [cardsMode, setCardsMode] = useState<'bots' | 'friends' | null>(null);
  const [localCount, setLocalCount] = useState(2);
  const [filter, setFilter] = useState<Filter>('all');
  const [local, setLocal] = useState<LocalGame | null>(null);
  // Revanche demandée par un invité : mémorisée pour la version de partie en cours seulement.
  const [rematchAsked, setRematchAsked] = useState<string | null>(null);
  const [id] = useState(playerId);
  const me = useMemo<GamePlayer>(() => ({ id, name: name || '?', table: myTable }), [id, name, myTable]);
  const profileReady = Boolean(name && myTable) && !editingProfile;
  const lobby = useGameLobby(restaurantId, me, Boolean(name && myTable));
  const partyGames = useMemo(() => PARTY_GAMES.filter((game) => !game.available || game.available(dishes)), [dishes]);
  // Création en ligne : jeu choisi, puis table défiée (null : toutes les tables).
  const [creating, setCreating] = useState<GameId | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const tables = useMemo(() => Array.from({ length: Math.max(1, tableCount) }, (_, index) => String(index + 1)), [tableCount]);

  const autoJoined = useRef(false);
  const { status: lobbyStatus, room: lobbyRoom, joinRoom } = lobby;
  useEffect(() => {
    if (!joinRoomId || autoJoined.current || lobbyStatus !== 'online' || lobbyRoom) return;
    autoJoined.current = true;
    joinRoom(joinRoomId);
  }, [joinRoomId, lobbyStatus, lobbyRoom, joinRoom]);

  // Adversaires robots (jeu de cartes) : ils jouent seuls, après une courte pause.
  useEffect(() => {
    if (!local || local.game !== 'cards') return undefined;
    const state = local.state as CardsState;
    if (state.result || !local.players[state.turn]?.bot) return undefined;
    const timer = window.setTimeout(() => {
      setLocal((current) => {
        if (!current) return current;
        const now = current.state as CardsState;
        if (now.result || !current.players[now.turn]?.bot) return current;
        const next = cards.apply(now, now.turn, botAction(now, now.turn));
        return next ? { ...current, state: next } : current;
      });
    }, BOT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [local]);

  const submitName = (event: FormEvent) => {
    event.preventDefault();
    const value = draftName.trim().slice(0, 16);
    if (!value || !draftTable) return;
    writeStorage('local', NAME_KEY, value);
    writeStorage('session', TABLE_KEY, draftTable);
    setName(value);
    setMyTable(draftTable);
    setEditingProfile(false);
  };

  const startLocal = (game: GameId, humans: number, bots = 0) => {
    const players: GamePlayer[] = [
      ...Array.from({ length: humans }, (_, index) => ({
        id: `local-${index}`,
        name: index === 0 ? name : tx('local.player', { n: index + 1 }),
        table: myTable,
      })),
      ...Array.from({ length: bots }, (_, index) => ({ id: `bot-${index}`, name: tx('local.bot', { n: index + 1 }), table: myTable, bot: true })),
    ];
    setCardsMode(null);
    setLocal({ game, players, state: GAME_LOGIC[game].init(players.length) });
  };

  const header = (
    <div className="sticky top-0 z-20 -mx-4 mb-5 flex items-center justify-between gap-3 border-b border-stone-200/70 bg-[#f7f4ee]/95 px-4 py-3 backdrop-blur">
      <p className="font-display text-lg font-bold text-stone-900">🎮 {tx('lounge.title')}</p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600"
      >
        {tx('lounge.close')}
      </button>
    </div>
  );

  const shell = (content: JSX.Element) => (
    <div className="fixed inset-0 z-[70] overflow-y-auto overflow-x-hidden bg-[#f7f4ee] text-stone-900">
      <div className="mx-auto w-full max-w-lg px-4 pb-12">
        {header}
        {content}
      </div>
    </div>
  );

  // ---------- Prénom et table ----------
  if (!profileReady) {
    return shell(
      <form onSubmit={submitName} className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
        <p className="text-sm leading-6 text-stone-500">{tx('lounge.subtitle')}</p>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{tx('name.table')}</p>
        <div className="mt-2 grid max-h-52 grid-cols-5 gap-2 overflow-y-auto">
          {tables.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDraftTable(value)}
              className={`rounded-2xl py-2.5 text-sm font-bold transition-colors ${
                draftTable === value ? 'bg-stone-900 text-white' : 'border border-stone-200 bg-white text-stone-700'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-stone-400">{tx('name.tableHint')}</p>
        <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
          {tx('name.label')}
          <input
            autoFocus
            value={draftName}
            maxLength={16}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder={tx('name.placeholder')}
            className="mt-1.5 w-full rounded-2xl border border-stone-200 px-4 py-3 text-base font-normal normal-case tracking-normal text-stone-800 outline-none focus:border-navy-300"
          />
        </label>
        <p className="mt-2 text-xs text-stone-400">{tx('name.hint')}</p>
        <button
          type="submit"
          disabled={!draftName.trim() || !draftTable}
          className="mt-5 w-full rounded-full bg-stone-900 px-5 py-3.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {tx('name.continue')}
        </button>
      </form>,
    );
  }

  // ---------- Jeu d'ambiance ----------
  const partyGame = PARTY_GAMES.find((game) => game.id === party);
  if (partyGame) {
    const Party = partyGame.Component;
    return shell(
      <PartyTheme.Provider value={{ tint: partyGame.tint, text: partyGame.text, players: partyGame.players }}>
        <Party firstName={name} dishes={dishes} onQuit={() => setParty(null)} />
      </PartyTheme.Provider>,
    );
  }

  // ---------- Partie locale ----------
  if (local) {
    const logic = GAME_LOGIC[local.game];
    // Contre des robots, ce téléphone est celui du seul joueur humain ; sinon il passe de main en main.
    const vsBots = local.players.some((player) => player.bot);
    const humanIndex = local.players.findIndex((player) => !player.bot);
    return shell(
      <GameView
        tx={tx}
        game={local.game}
        state={local.state}
        players={local.players}
        me={vsBots ? humanIndex : null}
        onAction={(action) => {
          const turn = logic.turnOf(local.state);
          if (local.players[turn]?.bot) return;
          const next = logic.apply(local.state, turn, action);
          if (next) setLocal({ ...local, state: next });
        }}
        onRematch={() => {
          const players = [...local.players.slice(1), local.players[0]];
          setLocal({ ...local, players, state: logic.init(players.length) });
        }}
        onQuit={() => setLocal(null)}
      />,
    );
  }

  // ---------- Partie en ligne ----------
  const room = lobby.room;
  if (room) {
    const logic = GAME_LOGIC[room.game];
    const isHost = room.hostId === id;
    if (room.closed) {
      return shell(
        <div className="rounded-3xl border border-stone-200/70 bg-white p-6 text-center shadow-soft">
          <p className="font-display text-xl font-bold">{tx(room.closed === 'host-left' ? 'play.hostLeft' : 'play.playerLeft')}</p>
          <button type="button" onClick={lobby.leaveRoom} className="mt-5 rounded-full bg-stone-900 px-6 py-3 text-sm font-bold text-white">
            {tx('lounge.back')}
          </button>
        </div>,
      );
    }
    if (room.state === null) {
      const enough = room.players.length >= logic.minPlayers;
      return shell(
        <div className="rounded-3xl border border-stone-200/70 bg-white p-6 text-center shadow-soft">
          <p className="text-4xl">{GAME_EMOJI[room.game]}</p>
          <p className="mt-2 font-display text-xl font-bold">{gameName(tx, room.game)}</p>
          <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-stone-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            {tx('online.waiting')}
          </p>
          {isHost && (
            <p className="mt-2 text-xs leading-5 text-stone-400">
              {room.target ? tx('online.waitingTable', { table: room.target }) : tx('online.waitingText')}
            </p>
          )}
          <ul className="mt-5 space-y-2 text-left">
            {room.players.map((player) => (
              <li key={player.id} className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-2.5 text-sm">
                <span className="font-semibold">
                  {player.name}
                  {player.id === id ? ` (${tx('play.you')})` : ''}
                </span>
                <span className="text-xs text-stone-400">{tx('online.table', { table: player.table })}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {isHost && logic.maxPlayers > 2 && (
              <button
                type="button"
                onClick={lobby.start}
                disabled={!enough}
                className="rounded-full bg-stone-900 px-6 py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                {enough ? tx('online.launch') : tx('online.needMore', { n: logic.minPlayers })}
              </button>
            )}
            <button type="button" onClick={lobby.leaveRoom} className="rounded-full border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-600">
              {tx('online.cancel')}
            </button>
          </div>
        </div>,
      );
    }
    const myIndex = room.players.findIndex((player) => player.id === id);
    return shell(
      <GameView
        tx={tx}
        game={room.game}
        state={room.state}
        players={room.players}
        me={myIndex}
        onAction={lobby.act}
        onRematch={() => {
          if (!isHost) setRematchAsked(`${room.id}:${room.version}`);
          lobby.rematch();
        }}
        rematchPending={rematchAsked === `${room.id}:${room.version}`}
        onQuit={lobby.leaveRoom}
        reactions={lobby.reactions}
        onReact={lobby.react}
      />,
    );
  }

  // ---------- Création : choix de la table ----------
  if (creating) {
    const chip = (value: string | null, label: string, wide = false) => (
      <button
        key={value ?? 'all'}
        type="button"
        onClick={() => setTarget(value)}
        className={`rounded-2xl px-3 py-3 text-sm font-bold transition-colors ${wide ? 'col-span-2' : ''} ${
          target === value ? 'bg-stone-900 text-white' : 'border border-stone-200 bg-white text-stone-700 hover:border-stone-400'
        }`}
      >
        {label}
      </button>
    );
    return shell(
      <div className="rounded-3xl border border-stone-200/70 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{GAME_EMOJI[creating]}</span>
          <div>
            <p className="font-display text-lg font-bold">{gameName(tx, creating)}</p>
            <p className="text-xs text-stone-500">{gameText(tx, creating)}</p>
          </div>
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{tx('create.title')}</p>
        <div className="mt-2">{chip(null, tx('create.anyTable'))}</div>
        <div className="mt-2 grid max-h-64 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-5">
          {tables.map((value) => (value === myTable ? chip(value, tx('create.myTable', { table: value }), true) : chip(value, value)))}
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => {
              lobby.createRoom(creating, target);
              setCreating(null);
            }}
            className="flex-1 rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-stone-900"
          >
            {tx('create.submit')}
            {target ? ` · ${tx('create.table', { table: target })}` : ''}
          </button>
          <button
            type="button"
            onClick={() => setCreating(null)}
            className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-600"
          >
            {tx('online.cancel')}
          </button>
        </div>
      </div>,
    );
  }

  // ---------- Accueil ----------
  return shell(
    <>
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft">
        <p className="min-w-0 truncate text-sm font-semibold text-stone-700">
          👋 {name} · {tx('online.table', { table: myTable })}
        </p>
        <button
          type="button"
          onClick={() => {
            setDraftName(name);
            setDraftTable(myTable);
            setEditingProfile(true);
          }}
          className="shrink-0 text-xs font-bold text-navy-700"
        >
          {tx('name.edit')}
        </button>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 rounded-full bg-stone-200/60 p-1">
        {(['local', 'online'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-full px-3 py-2.5 text-sm font-bold transition-colors ${tab === value ? 'bg-white text-stone-900 shadow' : 'text-stone-500'}`}
          >
            {tx(value === 'online' ? 'mode.online' : 'mode.local')}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-stone-400">{tx(tab === 'online' ? 'mode.onlineText' : 'mode.localText')}</p>

      {tab === 'local' ? (
        <div className="mt-5 space-y-6">
          {/* Jeu de cartes vedette */}
          <section className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_20%_10%,#2563eb,#1c2f47_55%,#0a1220)] p-5 text-white shadow-card">
            <div className="pointer-events-none absolute -right-4 -top-2 flex rotate-12 gap-1 opacity-90">
              {['#e5383b', '#f2b705', '#2a9d4b'].map((color, index) => (
                <span
                  key={color}
                  className="h-20 w-14 rounded-xl border-[3px] border-white shadow-card"
                  style={{ background: color, transform: `rotate(${(index - 1) * 12}deg) translateY(${Math.abs(index - 1) * 8}px)` }}
                />
              ))}
            </div>
            <span className="relative inline-flex rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-stone-900">
              {tx('feature.badge')}
            </span>
            <p className="relative mt-3 font-display text-3xl font-black">🃏 {gameName(tx, 'cards')}</p>
            <p className="relative mt-1 max-w-[16rem] text-sm leading-5 text-white/75">{tx('feature.text')}</p>
            <div className="relative mt-4 grid grid-cols-3 gap-2">
              {(['bots', 'friends'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCardsMode(cardsMode === mode ? null : mode)}
                  className={`rounded-2xl px-2 py-2.5 text-xs font-bold transition-colors ${cardsMode === mode ? 'bg-white text-stone-900' : 'bg-white/15 text-white'}`}
                >
                  {tx(mode === 'bots' ? 'feature.bots' : 'feature.friends')}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setTab('online');
                  setCreating('cards');
                  setTarget(null);
                }}
                className="rounded-2xl bg-white/15 px-2 py-2.5 text-xs font-bold text-white"
              >
                {tx('feature.online')}
              </button>
            </div>
            {cardsMode && (
              <div className="relative mt-3 animate-fadeIn rounded-2xl bg-white/10 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/70">
                  {tx(cardsMode === 'bots' ? 'local.bots' : 'local.players')}
                </p>
                <div className="mt-2 flex gap-1.5">
                  {(cardsMode === 'bots' ? [1, 2, 3] : [2, 3, 4]).map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setLocalCount(count)}
                      className={`h-9 flex-1 rounded-full text-sm font-bold ${localCount === count ? 'bg-amber-400 text-stone-900' : 'bg-white/15 text-white'}`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => (cardsMode === 'bots' ? startLocal('cards', 1, Math.min(3, localCount)) : startLocal('cards', Math.max(2, localCount)))}
                  className="mt-2 w-full rounded-full bg-amber-400 py-2.5 text-sm font-black text-stone-900"
                >
                  {tx('local.start')} →
                </button>
              </div>
            )}
          </section>

          {/* Filtres */}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {FILTERS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  filter === value ? 'bg-stone-900 text-white' : 'border border-stone-200 bg-white text-stone-600'
                }`}
              >
                {tx(`filter.${value}`)}
              </button>
            ))}
          </div>

          {filter !== 'classic' && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{tx('local.party')}</p>
              <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                {partyGames
                  .filter((game) => filter === 'all' || PARTY_KIND[game.id] === filter)
                  .map((game) => (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => setParty(game.id)}
                      className="flex items-center gap-4 rounded-3xl border border-stone-200/70 bg-white p-3.5 text-left shadow-soft transition-transform duration-200 active:scale-[0.98] sm:hover:-translate-y-0.5"
                    >
                      <GameIcon emoji={game.emoji} tint={game.tint} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-display font-bold leading-tight text-stone-900">{game.title}</span>
                        <span className="mt-0.5 block text-sm leading-snug text-stone-600">{game.text}</span>
                        <span className="mt-1 block text-xs text-stone-400">{game.players}</span>
                      </span>
                      <span className="shrink-0 text-lg text-stone-300">›</span>
                    </button>
                  ))}
              </div>
            </section>
          )}

          {(filter === 'all' || filter === 'classic') && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{tx('local.classics')}</p>
              <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                {GAME_ORDER.filter((game) => game !== 'cards').map((game) => (
                  <button
                    key={game}
                    type="button"
                    onClick={() => startLocal(game, 2)}
                    className="flex items-center gap-4 rounded-3xl border border-stone-200/70 bg-white p-3.5 text-left shadow-soft transition-transform duration-200 active:scale-[0.98] sm:hover:-translate-y-0.5"
                  >
                    <GameIcon emoji={GAME_EMOJI[game]} tint={CLASSIC_TINTS[game]} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-display font-bold leading-tight text-stone-900">{gameName(tx, game)}</span>
                      <span className="mt-0.5 block text-sm leading-snug text-stone-600">{gameText(tx, game)}</span>
                    </span>
                    <span className="shrink-0 text-lg text-stone-300">›</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {lobby.status === 'connecting' && <p className="text-center text-sm text-stone-500">{tx('online.connecting')}</p>}
          {lobby.status === 'offline' && (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p>{tx('online.offline')}</p>
              {lobby.lastError && <p className="mt-1 break-all text-[11px] text-amber-700/70">{lobby.lastError}</p>}
              <button
                type="button"
                onClick={lobby.retry}
                className="mt-3 rounded-full bg-amber-400 px-4 py-2 text-xs font-bold text-stone-900"
              >
                {tx('online.retry')}
              </button>
            </div>
          )}
          {lobby.status === 'online' && (
            <>
              <p className="flex items-center justify-center gap-2 text-xs font-semibold text-stone-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {lobby.peopleCount > 0 ? tx('online.people', { count: lobby.peopleCount }) : tx('online.nobody')}
              </p>
              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{tx('online.openRooms')}</p>
                {lobby.joinError && (
                  <p className="mt-2 rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
                    {tx(lobby.joinError === 'full' ? 'online.full' : 'online.timeout')}
                  </p>
                )}
                {lobby.openRooms.length === 0 ? (
                  <p className="mt-2 rounded-2xl border border-dashed border-stone-300 px-4 py-4 text-center text-sm text-stone-500">
                    {tx('online.noRooms')}
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {lobby.openRooms.map((open) => (
                      <li
                        key={open.id}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-soft ${
                          open.target === myTable ? 'border-amber-300 bg-amber-50' : 'border-stone-200/70 bg-white'
                        }`}
                      >
                        <span className="text-2xl">{GAME_EMOJI[open.game]}</span>
                        <div className="min-w-0 flex-1">
                          {open.target === myTable && (
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-700">{tx('online.challengeForYou')}</p>
                          )}
                          <p className="truncate text-sm font-bold">
                            {gameName(tx, open.game)} · {open.host.name}
                          </p>
                          <p className="text-xs text-stone-500">
                            {tx('online.table', { table: open.host.table })} · {open.count}/{open.max}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => lobby.joinRoom(open.id)}
                          disabled={lobby.joiningId !== null}
                          className="shrink-0 rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-stone-900 disabled:opacity-60"
                        >
                          {lobby.joiningId === open.id ? tx('online.joining') : tx('online.join')}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{tx('online.create')}</p>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {GAME_ORDER.map((game) => (
                    <button
                      key={game}
                      type="button"
                      onClick={() => {
                        setCreating(game);
                        setTarget(null);
                      }}
                      className="rounded-3xl border border-stone-200/70 bg-white p-4 text-left shadow-soft transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <p className="text-3xl">{GAME_EMOJI[game]}</p>
                      <p className="mt-2 font-display font-bold">{gameName(tx, game)}</p>
                      <p className="mt-0.5 text-xs text-stone-500">{gameText(tx, game)}</p>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      )}
    </>,
  );
}

function GameView({
  tx,
  game,
  state,
  players,
  me,
  onAction,
  onRematch,
  onQuit,
  rematchPending = false,
  reactions = [],
  onReact,
}: {
  tx: GameTx;
  game: GameId;
  state: unknown;
  players: GamePlayer[];
  me: number | null;
  onAction: (action: unknown) => void;
  onRematch: () => void;
  onQuit: () => void;
  rematchPending?: boolean;
  reactions?: Reaction[];
  onReact?: (emoji: string) => void;
}) {
  const logic = GAME_LOGIC[game];
  const Board = BOARDS[game];
  const result = logic.resultOf(state);
  const turn = logic.turnOf(state);
  const canAct = !result && (me === null || me === turn);

  const status = result
    ? result.winner === null
      ? tx('play.draw')
      : me !== null && result.winner === me
        ? tx('play.youWin')
        : tx('play.wins', { name: players[result.winner]?.name ?? '' })
    : me === null
      ? tx('play.turnOf', { name: players[turn]?.name ?? '' })
      : turn === me
        ? tx('play.yourTurn')
        : tx('play.turnOf', { name: players[turn]?.name ?? '' });

  return (
    <div className="relative">
      <PartyTheme.Provider value={{ tint: CLASSIC_TINTS[game], text: tx(`game.${game}Text`) }}>
        <PartyHeader emoji={GAME_EMOJI[game]} title={tx(`game.${game}`)} onQuit={onQuit} quitLabel={tx('play.quit')} />
      </PartyTheme.Provider>
      {result && result.winner !== null && (me === null || result.winner === me) && <Confetti />}

      <p
        className={`mb-4 rounded-2xl px-4 py-3 text-center text-sm font-bold transition-colors ${
          result ? 'bg-emerald-50 text-emerald-700' : canAct ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-300' : 'bg-white text-stone-600'
        }`}
      >
        {status}
      </p>

      {game !== 'billiards' && game !== 'cards' && (
        <div className="mb-4 flex justify-center gap-2 text-xs font-semibold">
          {players.map((player, index) => (
            <span key={player.id} className={`rounded-full px-3 py-1.5 ${turn === index && !result ? 'bg-stone-900 text-white' : 'bg-white text-stone-600'}`}>
              {game === 'tictactoe' ? (index === 0 ? '✕ ' : '◯ ') : index === 0 ? '🔴 ' : '🟡 '}
              {player.name}
              {me === index ? ` (${tx('play.you')})` : ''}
            </span>
          ))}
        </div>
      )}

      <Board state={state} players={players} me={me} canAct={canAct} onAction={onAction} tx={tx} />

      {result && (
        <div className="mt-5 flex justify-center gap-2">
          <button
            type="button"
            onClick={onRematch}
            disabled={rematchPending}
            className="rounded-full bg-stone-900 px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {rematchPending ? tx('play.waitRematch') : tx('play.rematch')}
          </button>
          <button type="button" onClick={onQuit} className="rounded-full border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-600">
            {tx('play.quit')}
          </button>
        </div>
      )}

      {onReact && (
        <div className="mt-5 flex justify-center gap-2">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(emoji)}
              className="h-11 w-11 rounded-full border border-stone-200 bg-white text-xl transition-transform active:scale-90"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex justify-center">
        {reactions.map((reaction, index) => (
          <span
            key={reaction.key}
            className="absolute flex animate-floatUp flex-col items-center"
            style={{ marginLeft: `${((index % 5) - 2) * 44}px` }}
          >
            <span className="text-4xl">{reaction.emoji}</span>
            <span className="rounded-full bg-white/90 px-2 text-[10px] font-bold text-stone-600 shadow">
              {players.find((player) => player.id === reaction.playerId)?.name ?? ''}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
