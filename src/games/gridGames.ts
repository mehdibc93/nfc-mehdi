import type { GameLogic, GameResult } from './types';

// ---------- Morpion (3 × 3) ----------

export type TicTacToeState = { board: (number | null)[]; turn: number; result: GameResult; line: number[] | null };
export type TicTacToeAction = { cell: number };

const TTT_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export const ticTacToe: GameLogic<TicTacToeState, TicTacToeAction> = {
  minPlayers: 2,
  maxPlayers: 2,
  init: () => ({ board: Array(9).fill(null), turn: 0, result: null, line: null }),
  apply: (state, player, { cell }) => {
    if (state.result || player !== state.turn) return null;
    if (!Number.isInteger(cell) || cell < 0 || cell > 8 || state.board[cell] !== null) return null;
    const board = [...state.board];
    board[cell] = player;
    const line = TTT_LINES.find((cells) => cells.every((index) => board[index] === player)) ?? null;
    const result: GameResult = line ? { winner: player } : board.every((value) => value !== null) ? { winner: null } : null;
    return { board, turn: result ? state.turn : 1 - player, result, line };
  },
  turnOf: (state) => state.turn,
  resultOf: (state) => state.result,
};

// ---------- Puissance 4 (7 colonnes × 6 lignes) ----------

export const C4_COLS = 7;
export const C4_ROWS = 6;

/** board[row * 7 + col], row 0 = ligne du haut. */
export type Connect4State = {
  board: (number | null)[];
  turn: number;
  result: GameResult;
  line: number[] | null;
  last: number | null;
};
export type Connect4Action = { col: number };

function connect4Line(board: (number | null)[], index: number): number[] | null {
  const player = board[index];
  const row = Math.floor(index / C4_COLS);
  const col = index % C4_COLS;
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    const cells = [index];
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < C4_ROWS && c >= 0 && c < C4_COLS && board[r * C4_COLS + c] === player) {
        cells.push(r * C4_COLS + c);
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (cells.length >= 4) return cells;
  }
  return null;
}

export const connect4: GameLogic<Connect4State, Connect4Action> = {
  minPlayers: 2,
  maxPlayers: 2,
  init: () => ({ board: Array(C4_COLS * C4_ROWS).fill(null), turn: 0, result: null, line: null, last: null }),
  apply: (state, player, { col }) => {
    if (state.result || player !== state.turn) return null;
    if (!Number.isInteger(col) || col < 0 || col >= C4_COLS) return null;
    let row = C4_ROWS - 1;
    while (row >= 0 && state.board[row * C4_COLS + col] !== null) row -= 1;
    if (row < 0) return null;
    const index = row * C4_COLS + col;
    const board = [...state.board];
    board[index] = player;
    const line = connect4Line(board, index);
    const result: GameResult = line ? { winner: player } : board.every((value) => value !== null) ? { winner: null } : null;
    return { board, turn: result ? state.turn : 1 - player, result, line, last: index };
  },
  turnOf: (state) => state.turn,
  resultOf: (state) => state.result,
};
