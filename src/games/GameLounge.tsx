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

// Salle de jeux proposée au client après sa commande sur place : mini-jeux à plusieurs sur le
// même téléphone, ou en ligne avec les autres tables du restaurant (voir useGameLobby).

const NAME_KEY = 'nourevo-player-name';
const ID_KEY = 'nourevo-player-id';
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
  defaultName,
  locale,
  joinRoomId,
  onClose,
}: {
  restaurantId: string;
  table: string;
  tableCount: number;
  defaultName: string;
  locale: Locale;
  /** Défi accepté depuis l'écran de commande : partie à rejoindre dès la connexion. */
  joinRoomId?: string | null;
  onClose: () => void;
}) {
  const tx = useMemo(() => gameTx(locale), [locale]);
  const [name, setName] = useState(() => readStorage('local', NAME_KEY) ?? '');
  const [draftName, setDraftName] = useState(() => readStorage('local', NAME_KEY) ?? defaultName.trim().split(' ')[0] ?? '');
  const [tab, setTab] = useState<'online' | 'local'>('online');
  const [localSetup, setLocalSetup] = useState<GameId | null>(null);
  const [localCount, setLocalCount] = useState(2);
  const [local, setLocal] = useState<LocalGame | null>(null);
  // Revanche demandée par un invité : mémorisée pour la version de partie en cours seulement.
  const [rematchAsked, setRematchAsked] = useState<string | null>(null);
  const [id] = useState(playerId);
  const me = useMemo<GamePlayer>(() => ({ id, name: name || '?', table }), [id, name, table]);
  const lobby = useGameLobby(restaurantId, me, Boolean(name));
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

  const submitName = (event: FormEvent) => {
    event.preventDefault();
    const value = draftName.trim().slice(0, 16);
    if (!value) return;
    writeStorage('local', NAME_KEY, value);
    setName(value);
  };

  const startLocal = (game: GameId, count: number) => {
    const players: GamePlayer[] = Array.from({ length: count }, (_, index) => ({
      id: `local-${index}`,
      name: index === 0 ? name : tx('local.player', { n: index + 1 }),
      table,
    }));
    setLocalSetup(null);
    setLocal({ game, players, state: GAME_LOGIC[game].init(count) });
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

  // ---------- Prénom ----------
  if (!name) {
    return shell(
      <form onSubmit={submitName} className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
        <p className="text-sm leading-6 text-stone-500">{tx('lounge.subtitle')}</p>
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
          disabled={!draftName.trim()}
          className="mt-5 w-full rounded-full bg-stone-900 px-5 py-3.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {tx('name.continue')}
        </button>
      </form>,
    );
  }

  // ---------- Partie locale ----------
  if (local) {
    const logic = GAME_LOGIC[local.game];
    return shell(
      <GameView
        tx={tx}
        game={local.game}
        state={local.state}
        players={local.players}
        me={null}
        onAction={(action) => {
          const next = logic.apply(local.state, logic.turnOf(local.state), action);
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
          {tables.map((value) => (value === table ? chip(value, tx('create.myTable', { table: value }), true) : chip(value, value)))}
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
      <p className="text-sm leading-6 text-stone-500">{tx('lounge.subtitle')}</p>
      <div className="mt-5 grid grid-cols-2 gap-2 rounded-full bg-stone-200/60 p-1">
        {(['online', 'local'] as const).map((value) => (
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
        <div className="mt-5 grid grid-cols-2 gap-3">
          {GAME_ORDER.map((game) => (
            <div key={game} className="rounded-3xl border border-stone-200/70 bg-white p-4 shadow-soft">
              <button
                type="button"
                onClick={() => (GAME_LOGIC[game].maxPlayers > 2 ? setLocalSetup(localSetup === game ? null : game) : startLocal(game, 2))}
                className="w-full text-left"
              >
                <p className="text-3xl">{GAME_EMOJI[game]}</p>
                <p className="mt-2 font-display font-bold">{gameName(tx, game)}</p>
                <p className="mt-0.5 text-xs text-stone-500">{gameText(tx, game)}</p>
              </button>
              {localSetup === game && (
                <div className="mt-3 border-t border-stone-100 pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-stone-400">{tx('local.players')}</p>
                  <div className="mt-2 flex gap-1.5">
                    {[2, 3, 4].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setLocalCount(count)}
                        className={`h-9 flex-1 rounded-full text-sm font-bold ${localCount === count ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => startLocal(game, localCount)}
                    className="mt-2 w-full rounded-full bg-amber-400 py-2 text-sm font-bold text-stone-900"
                  >
                    {tx('local.start')}
                  </button>
                </div>
              )}
            </div>
          ))}
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
                          open.target === table ? 'border-amber-300 bg-amber-50' : 'border-stone-200/70 bg-white'
                        }`}
                      >
                        <span className="text-2xl">{GAME_EMOJI[open.game]}</span>
                        <div className="min-w-0 flex-1">
                          {open.target === table && (
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="min-w-0 font-display text-lg font-bold">
          {GAME_EMOJI[game]} {tx(`game.${game}`)}
        </p>
        <button type="button" onClick={onQuit} className="shrink-0 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600">
          {tx('play.quit')}
        </button>
      </div>

      <p
        className={`mb-4 rounded-2xl px-4 py-3 text-center text-sm font-bold ${
          result ? 'bg-emerald-50 text-emerald-700' : canAct ? 'bg-amber-100 text-amber-900' : 'bg-white text-stone-600'
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
