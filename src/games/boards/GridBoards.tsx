import { C4_COLS, type Connect4Action, type Connect4State, type TicTacToeAction, type TicTacToeState } from '../gridGames';
import type { BoardProps } from './boardProps';

export const PLAYER_COLORS = ['#e5383b', '#f2b705', '#2a9d4b', '#1e6fd9'];

export function TicTacToeBoard({ state, canAct, onAction }: BoardProps<TicTacToeState, TicTacToeAction>) {
  return (
    <div className="mx-auto grid aspect-square w-full max-w-[320px] grid-cols-3 gap-2 rounded-3xl bg-stone-900 p-2">
      {state.board.map((value, cell) => {
        const winning = state.line?.includes(cell);
        return (
          <button
            key={cell}
            type="button"
            disabled={!canAct || value !== null}
            onClick={() => onAction({ cell })}
            className={`flex items-center justify-center rounded-2xl text-5xl font-black transition-colors duration-200 ${
              winning ? 'bg-amber-100' : 'bg-white'
            } ${canAct && value === null ? 'hover:bg-stone-100' : ''}`}
            aria-label={`Case ${cell + 1}`}
          >
            {value === 0 && <span className="animate-pop" style={{ color: PLAYER_COLORS[0] }}>✕</span>}
            {value === 1 && <span className="animate-pop" style={{ color: PLAYER_COLORS[3] }}>◯</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Connect4Board({ state, canAct, onAction }: BoardProps<Connect4State, Connect4Action>) {
  return (
    <div className="mx-auto w-full max-w-[380px]">
      <div className="grid grid-cols-7 gap-1.5 rounded-3xl bg-[#1d4ed8] p-2 shadow-card">
        {state.board.map((value, index) => {
          const col = index % C4_COLS;
          const winning = state.line?.includes(index);
          return (
            <button
              key={index}
              type="button"
              disabled={!canAct}
              onClick={() => onAction({ col })}
              className="relative aspect-square rounded-full bg-[#0f2e7a] shadow-inner"
              aria-label={`Colonne ${col + 1}`}
            >
              {value !== null && (
                <span
                  className={`absolute inset-[6%] rounded-full ${state.last === index ? 'animate-dropIn' : ''} ${
                    winning ? 'ring-4 ring-white' : ''
                  }`}
                  style={{
                    background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), transparent 45%), ${value === 0 ? PLAYER_COLORS[0] : PLAYER_COLORS[1]}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
