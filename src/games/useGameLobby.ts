import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { GAME_LOGIC } from './registry';
import type { GameId, GamePlayer } from './types';
import { gamesChannelName, openRoomsFor, type OpenRoom, type PresenceMeta } from './lobbyShared';

export type { OpenRoom };

// Salle de jeux en ligne d'un restaurant, sur un canal Supabase Realtime (Presence + Broadcast) :
// aucune table en base, rien n'est conservé. Chaque client annonce sa présence (prénom, table,
// partie en cours). Le créateur d'une partie en est l'hôte : il reçoit les actions des autres
// joueurs, les valide avec la logique du jeu et diffuse l'état à jour. Si l'hôte s'en va, la
// partie s'arrête.

export type RoomSnapshot = {
  id: string;
  game: GameId;
  hostId: string;
  players: GamePlayer[];
  state: unknown | null;
  version: number;
  /** Table défiée (null : ouverte à toutes les tables). */
  target: string | null;
  closed?: 'host-left' | 'player-left';
};

export type Reaction = { key: number; playerId: string; emoji: string };
export type LobbyStatus = 'connecting' | 'online' | 'offline';

const JOIN_TIMEOUT_MS = 6000;
// Délai avant d'afficher « connexion impossible » : la reconnexion automatique a le temps d'agir.
const OFFLINE_AFTER_MS = 12000;

function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function useGameLobby(restaurantId: string, me: GamePlayer, enabled: boolean) {
  const [status, setStatus] = useState<LobbyStatus>('connecting');
  const [people, setPeople] = useState<PresenceMeta[]>([]);
  const [room, setRoomState] = useState<RoomSnapshot | null>(null);
  const [joinError, setJoinError] = useState<'full' | 'timeout' | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const roomRef = useRef<RoomSnapshot | null>(null);
  const joiningRef = useRef<string | null>(null);
  const joinTimer = useRef<number | undefined>(undefined);
  const meRef = useRef(me);
  meRef.current = me;

  const send = useCallback((event: string, payload: unknown) => {
    channelRef.current?.send({ type: 'broadcast', event, payload });
  }, []);

  const track = useCallback(() => {
    const channel = channelRef.current;
    const current = roomRef.current;
    if (!channel) return;
    const max = current ? GAME_LOGIC[current.game].maxPlayers : 0;
    const presence: PresenceMeta = {
      ...meRef.current,
      room:
        current && !current.closed
          ? {
              id: current.id,
              game: current.game,
              host: current.hostId === meRef.current.id,
              open: current.state === null && current.players.length < max,
              count: current.players.length,
              max,
              target: current.target,
            }
          : null,
    };
    channel.track(presence);
  }, []);

  /** Met à jour la partie locale ; l'hôte la diffuse aux autres joueurs. */
  const commitRoom = useCallback(
    (next: RoomSnapshot | null, broadcast: boolean) => {
      roomRef.current = next;
      setRoomState(next);
      if (broadcast && next) send('room', next);
      track();
    },
    [send, track],
  );

  const isHost = () => roomRef.current?.hostId === meRef.current.id;

  const startGame = useCallback(
    (players: GamePlayer[]) => {
      const current = roomRef.current;
      if (!current) return;
      const logic = GAME_LOGIC[current.game];
      commitRoom({ ...current, players, state: logic.init(players.length), version: current.version + 1 }, true);
    },
    [commitRoom],
  );

  const applyAction = useCallback(
    (playerId: string, action: unknown) => {
      const current = roomRef.current;
      if (!current || current.state === null || current.closed) return;
      const index = current.players.findIndex((player) => player.id === playerId);
      if (index < 0) return;
      const next = GAME_LOGIC[current.game].apply(current.state, index, action);
      if (next) commitRoom({ ...current, state: next, version: current.version + 1 }, true);
    },
    [commitRoom],
  );

  useEffect(() => {
    if (!enabled) return undefined;
    setStatus('connecting');
    const channel = supabase.channel(gamesChannelName(restaurantId), {
      config: { presence: { key: meRef.current.id }, broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceMeta>();
        const list = Object.values(state)
          .map((metas) => metas[0])
          .filter((meta): meta is PresenceMeta & { presence_ref: string } => Boolean(meta?.id));
        const others = list.filter((meta) => meta.id !== meRef.current.id);
        setPeople(others);
        const present = new Set(list.map((meta) => meta.id));
        const current = roomRef.current;
        if (!current || current.closed) return;
        if (!isHost()) {
          if (!present.has(current.hostId)) commitRoom({ ...current, closed: 'host-left' }, false);
          return;
        }
        const missing = current.players.filter((player) => player.id !== meRef.current.id && !present.has(player.id));
        if (missing.length === 0) return;
        if (current.state === null) {
          const players = current.players.filter((player) => present.has(player.id));
          commitRoom({ ...current, players, version: current.version + 1 }, true);
        } else {
          commitRoom({ ...current, closed: 'player-left', version: current.version + 1 }, true);
        }
      })
      .on('broadcast', { event: 'join' }, ({ payload }) => {
        const { roomId, player } = payload as { roomId: string; player: GamePlayer };
        const current = roomRef.current;
        if (!current || current.id !== roomId || !isHost()) return;
        const logic = GAME_LOGIC[current.game];
        if (current.players.some((item) => item.id === player.id)) {
          send('room', current);
          return;
        }
        const wrongTable = current.target !== null && player.table !== current.target;
        if (wrongTable || current.state !== null || current.closed || current.players.length >= logic.maxPlayers) {
          send('full', { roomId, playerId: player.id });
          return;
        }
        const players = [...current.players, player];
        // Jeux à deux : la partie démarre dès que l'adversaire arrive.
        if (logic.maxPlayers === 2) {
          roomRef.current = { ...current, players };
          startGame(players);
        } else {
          commitRoom({ ...current, players, version: current.version + 1 }, true);
        }
      })
      .on('broadcast', { event: 'full' }, ({ payload }) => {
        const { roomId, playerId } = payload as { roomId: string; playerId: string };
        if (playerId !== meRef.current.id || joiningRef.current !== roomId) return;
        window.clearTimeout(joinTimer.current);
        joiningRef.current = null;
        setJoiningId(null);
        setJoinError('full');
      })
      .on('broadcast', { event: 'leave' }, ({ payload }) => {
        const { roomId, playerId } = payload as { roomId: string; playerId: string };
        const current = roomRef.current;
        if (!current || current.id !== roomId || !isHost() || current.closed) return;
        if (current.state === null) {
          const players = current.players.filter((player) => player.id !== playerId);
          commitRoom({ ...current, players, version: current.version + 1 }, true);
        } else {
          commitRoom({ ...current, closed: 'player-left', version: current.version + 1 }, true);
        }
      })
      .on('broadcast', { event: 'action' }, ({ payload }) => {
        const { roomId, playerId, action } = payload as { roomId: string; playerId: string; action: unknown };
        if (roomRef.current?.id === roomId && isHost()) applyAction(playerId, action);
      })
      .on('broadcast', { event: 'rematch' }, ({ payload }) => {
        const { roomId } = payload as { roomId: string };
        const current = roomRef.current;
        if (current?.id === roomId && isHost() && !current.closed) {
          // Le joueur suivant commence la revanche.
          startGame([...current.players.slice(1), current.players[0]]);
        }
      })
      .on('broadcast', { event: 'room' }, ({ payload }) => {
        const next = payload as RoomSnapshot;
        if (next.hostId === meRef.current.id) return;
        const current = roomRef.current;
        const mine = next.players.some((player) => player.id === meRef.current.id);
        if (joiningRef.current === next.id && mine) {
          window.clearTimeout(joinTimer.current);
          joiningRef.current = null;
          setJoiningId(null);
          commitRoom(next, false);
          return;
        }
        if (current?.id !== next.id || current.closed) return;
        if (!mine && !next.closed) {
          commitRoom(null, false);
          return;
        }
        if (next.version >= current.version) commitRoom(next, false);
      })
      .on('broadcast', { event: 'react' }, ({ payload }) => {
        const { roomId, playerId, emoji } = payload as { roomId: string; playerId: string; emoji: string };
        if (roomRef.current?.id !== roomId) return;
        const key = Date.now() + Math.random();
        setReactions((list) => [...list, { key, playerId, emoji }]);
        window.setTimeout(() => setReactions((list) => list.filter((item) => item.key !== key)), 2600);
      })
      .subscribe((state, err) => {
        // Rappel tardif d'un ancien canal (après un « Réessayer » par exemple) : ignoré.
        if (channelRef.current !== channel) return;
        if (state === 'SUBSCRIBED') {
          window.clearTimeout(offlineTimer);
          setLastError(null);
          setStatus('online');
          track();
        } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') {
          // Supabase retente tout seul : on ne déclare la salle injoignable qu'après un délai.
          setLastError(`${state}${err?.message ? ` : ${err.message}` : ''}`);
          setStatus((current) => (current === 'online' ? 'connecting' : current));
        }
      });
    const offlineTimer = window.setTimeout(() => {
      if (channelRef.current === channel) setStatus((current) => (current === 'online' ? current : 'offline'));
    }, OFFLINE_AFTER_MS);

    return () => {
      window.clearTimeout(offlineTimer);
      window.clearTimeout(joinTimer.current);
      const current = roomRef.current;
      if (current && !current.closed) {
        if (current.hostId === meRef.current.id) channel.send({ type: 'broadcast', event: 'room', payload: { ...current, closed: 'host-left' } });
        else channel.send({ type: 'broadcast', event: 'leave', payload: { roomId: current.id, playerId: meRef.current.id } });
      }
      roomRef.current = null;
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [enabled, restaurantId, attempt, applyAction, commitRoom, send, startGame, track]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  // Le prénom peut changer pendant que l'on est connecté.
  useEffect(() => {
    if (status === 'online') track();
  }, [me.name, status, track]);

  const createRoom = useCallback(
    (game: GameId, target: string | null) => {
      setJoinError(null);
      commitRoom({ id: randomId(), game, hostId: meRef.current.id, players: [meRef.current], state: null, version: 0, target }, false);
    },
    [commitRoom],
  );

  const joinRoom = useCallback(
    (roomId: string) => {
      setJoinError(null);
      joiningRef.current = roomId;
      setJoiningId(roomId);
      send('join', { roomId, player: meRef.current });
      window.clearTimeout(joinTimer.current);
      joinTimer.current = window.setTimeout(() => {
        if (joiningRef.current !== roomId) return;
        joiningRef.current = null;
        setJoiningId(null);
        setJoinError('timeout');
      }, JOIN_TIMEOUT_MS);
    },
    [send],
  );

  const leaveRoom = useCallback(() => {
    const current = roomRef.current;
    if (current && !current.closed) {
      if (current.hostId === meRef.current.id) send('room', { ...current, closed: 'host-left', version: current.version + 1 });
      else send('leave', { roomId: current.id, playerId: meRef.current.id });
    }
    commitRoom(null, false);
  }, [commitRoom, send]);

  const act = useCallback(
    (action: unknown) => {
      const current = roomRef.current;
      if (!current) return;
      if (current.hostId === meRef.current.id) applyAction(meRef.current.id, action);
      else send('action', { roomId: current.id, playerId: meRef.current.id, action });
    },
    [applyAction, send],
  );

  const start = useCallback(() => {
    const current = roomRef.current;
    if (current && current.hostId === meRef.current.id && current.players.length >= GAME_LOGIC[current.game].minPlayers) {
      startGame(current.players);
    }
  }, [startGame]);

  const rematch = useCallback(() => {
    const current = roomRef.current;
    if (!current || current.closed) return;
    if (current.hostId === meRef.current.id) startGame([...current.players.slice(1), current.players[0]]);
    else send('rematch', { roomId: current.id });
  }, [send, startGame]);

  const react = useCallback(
    (emoji: string) => {
      const current = roomRef.current;
      if (!current) return;
      const key = Date.now() + Math.random();
      setReactions((list) => [...list, { key, playerId: meRef.current.id, emoji }]);
      window.setTimeout(() => setReactions((list) => list.filter((item) => item.key !== key)), 2600);
      send('react', { roomId: current.id, playerId: meRef.current.id, emoji });
    },
    [send],
  );

  const openRooms = openRoomsFor(people, me.table);

  return {
    status,
    lastError,
    retry,
    peopleCount: people.length,
    openRooms,
    room,
    joiningId,
    joinError,
    reactions,
    createRoom,
    joinRoom,
    leaveRoom,
    act,
    start,
    rematch,
    react,
  };
}
