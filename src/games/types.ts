// Types communs aux mini-jeux proposés aux clients pendant l'attente de leur commande.
// Chaque jeu est un « réducteur » pur : `apply` reçoit l'état, l'index du joueur qui agit et son
// action, et renvoie le nouvel état (ou null si l'action est refusée). Le même code tourne en
// local (plusieurs joueurs sur un téléphone) et en ligne (le créateur de la partie fait autorité).

export type GameId = 'billiards' | 'cards' | 'connect4' | 'tictactoe';

/** null tant que la partie continue ; winner null = match nul. */
export type GameResult = { winner: number | null } | null;

export interface GameLogic<S, A> {
  minPlayers: number;
  maxPlayers: number;
  init: (players: number, random?: () => number) => S;
  apply: (state: S, player: number, action: A) => S | null;
  turnOf: (state: S) => number;
  resultOf: (state: S) => GameResult;
}

export type GamePlayer = { id: string; name: string; table: string; bot?: boolean };
