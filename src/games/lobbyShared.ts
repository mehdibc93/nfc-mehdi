import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { GameId, GamePlayer } from './types';

// Éléments de la salle de jeux partagés avec l'écran de commande : ce fichier reste léger (pas de
// logique de jeu) pour que l'écran de confirmation puisse afficher les défis reçus par la table.

export type PresenceRoom = { id: string; game: GameId; host: boolean; open: boolean; count: number; max: number; target: string | null };
export type PresenceMeta = GamePlayer & { room: PresenceRoom | null };
export type OpenRoom = { id: string; game: GameId; host: GamePlayer; count: number; max: number; target: string | null };

export function gamesChannelName(restaurantId: string): string {
  return `games-${restaurantId}`;
}

/** Parties ouvertes visibles par un client : celles ouvertes à toutes les tables, ou qui défient la sienne. */
export function openRoomsFor(people: PresenceMeta[], table: string): OpenRoom[] {
  return people
    .filter((meta) => meta.room?.host && meta.room.open && (meta.room.target == null || meta.room.target === table))
    .map((meta) => ({
      id: meta.room!.id,
      game: meta.room!.game,
      host: { id: meta.id, name: meta.name, table: meta.table },
      count: meta.room!.count,
      max: meta.room!.max,
      target: meta.room!.target ?? null,
    }))
    // Les défis adressés à ma table d'abord.
    .sort((a, b) => Number(b.target === table) - Number(a.target === table));
}

/**
 * Écoute (sans s'annoncer) les parties qui défient la table `table`, pour les signaler sur l'écran
 * de commande. À désactiver quand la salle de jeux est ouverte : elle utilise le même canal.
 */
export function useTableChallenges(restaurantId: string, table: string, enabled: boolean): OpenRoom[] {
  const [challenges, setChallenges] = useState<OpenRoom[]>([]);
  useEffect(() => {
    if (!enabled) {
      setChallenges([]);
      return undefined;
    }
    const channel = supabase.channel(gamesChannelName(restaurantId));
    channel
      .on('presence', { event: 'sync' }, () => {
        const people = Object.values(channel.presenceState<PresenceMeta>())
          .map((metas) => metas[0])
          .filter((meta) => Boolean(meta?.id));
        setChallenges(openRoomsFor(people, table).filter((room) => room.target === table && room.host.table !== table));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, table, enabled]);
  return challenges;
}
