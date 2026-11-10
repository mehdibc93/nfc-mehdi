import type { GameTx } from '../gameText';
import type { GamePlayer } from '../types';

export type BoardProps<S, A> = {
  state: S;
  players: GamePlayer[];
  /** Index du joueur sur ce téléphone, ou null en mode local (le téléphone passe de main en main). */
  me: number | null;
  /** Vrai si ce téléphone peut jouer maintenant. */
  canAct: boolean;
  onAction: (action: A) => void;
  tx: GameTx;
};
