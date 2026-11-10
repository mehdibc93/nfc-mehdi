import type { GameId, GameLogic } from './types';
import { billiards } from './billiards';
import { cards } from './cards';
import { connect4, ticTacToe } from './gridGames';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GAME_LOGIC: Record<GameId, GameLogic<any, any>> = {
  billiards,
  cards,
  connect4,
  tictactoe: ticTacToe,
};

export const GAME_ORDER: GameId[] = ['billiards', 'cards', 'connect4', 'tictactoe'];

export const GAME_EMOJI: Record<GameId, string> = {
  billiards: '🎱',
  cards: '🃏',
  connect4: '🔴',
  tictactoe: '❌',
};
