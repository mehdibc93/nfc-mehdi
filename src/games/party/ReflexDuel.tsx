import { useEffect, useRef, useState } from 'react';
import { buzz, PartyHeader, PrimaryButton } from './ui';

// Duel de réflexes : le téléphone est posé à plat entre deux joueurs, face à face. Quand l'écran
// passe au vert, le premier qui tape sur sa moitié gagne la manche. Taper trop tôt = manche perdue.

const TARGET = 5;
type Phase = 'idle' | 'wait' | 'go' | 'result';

export function ReflexDuel({ onQuit }: { onQuit: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [last, setLast] = useState<{ winner: 0 | 1; early: boolean; ms: number | null } | null>(null);
  const goAt = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  // Une seule victoire par manche, même si les deux joueurs tapent dans la même milliseconde.
  const roundOpen = useRef(false);
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const startRound = () => {
    setLast(null);
    roundOpen.current = true;
    phaseRef.current = 'wait';
    setPhase('wait');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      goAt.current = performance.now();
      phaseRef.current = 'go';
      setPhase('go');
      buzz(30);
    }, 1500 + Math.random() * 3500);
  };

  const tap = (player: 0 | 1) => {
    if (!roundOpen.current) return;
    if (phaseRef.current === 'wait') {
      window.clearTimeout(timer.current);
      const winner = (1 - player) as 0 | 1;
      finish(winner, true, null);
    } else if (phaseRef.current === 'go') {
      finish(player, false, Math.round(performance.now() - goAt.current));
    }
  };

  const finish = (winner: 0 | 1, early: boolean, ms: number | null) => {
    roundOpen.current = false;
    buzz(early ? [80, 40, 80] : 60);
    setScores((current) => (winner === 0 ? [current[0] + 1, current[1]] : [current[0], current[1] + 1]));
    setLast({ winner, early, ms });
    setPhase('result');
  };

  const champion = scores[0] >= TARGET ? 0 : scores[1] >= TARGET ? 1 : null;
  const background = phase === 'go' ? 'bg-emerald-500' : phase === 'wait' ? 'bg-red-600' : 'bg-navy-800';

  const half = (player: 0 | 1) => {
    const won = last?.winner === player;
    let message = 'Prêt ?';
    if (phase === 'wait') message = 'Attendez le vert…';
    if (phase === 'go') message = 'TAPEZ !';
    if (phase === 'result' && last) {
      if (won) message = last.early ? 'Gagné : l’autre a tapé trop tôt !' : `Gagné ! ${last.ms} ms ⚡`;
      else message = last.early ? 'Trop tôt ! 😅' : 'Trop lent…';
    }
    if (champion !== null) message = champion === player ? '🏆 Champion !' : 'Perdu… revanche ?';
    return (
      <button
        type="button"
        onPointerDown={() => tap(player)}
        className={`flex flex-1 flex-col items-center justify-center gap-2 text-white ${player === 0 ? 'rotate-180' : ''}`}
      >
        <span className="font-display text-6xl font-black tabular-nums">{scores[player]}</span>
        <span className={`font-display font-bold ${phase === 'go' ? 'text-4xl' : 'text-xl'}`}>{message}</span>
      </button>
    );
  };

  if (phase === 'idle') {
    return (
      <div>
        <PartyHeader emoji="⚡" title="Duel de réflexes" onQuit={onQuit} />
        <div className="rounded-3xl border border-stone-200/70 bg-white p-6 text-center shadow-soft">
          <p className="text-5xl">🤠</p>
          <p className="mt-3 text-sm leading-6 text-stone-500">
            Posez le téléphone à plat entre deux joueurs, face à face. Chacun garde un doigt prêt au-dessus de sa moitié. Quand l’écran devient <strong className="text-emerald-600">vert</strong>, tapez le plus vite possible ! Trop tôt, et la manche est perdue. Premier à {TARGET} points.
          </p>
          <PrimaryButton onClick={startRound} className="mt-6 w-full">
            Commencer le duel
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[90] flex touch-none select-none flex-col transition-colors duration-150 ${background}`}>
      {half(0)}
      <div className="flex items-center justify-center gap-2 border-y border-white/20 bg-black/20 py-2">
        {phase === 'result' && (
          <button
            type="button"
            onClick={() => {
              if (champion !== null) setScores([0, 0]);
              startRound();
            }}
            className="rounded-full bg-white px-5 py-2 text-sm font-bold text-stone-900"
          >
            {champion !== null ? 'Revanche' : 'Manche suivante'}
          </button>
        )}
        <button type="button" onClick={onQuit} className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white">
          Quitter
        </button>
      </div>
      {half(1)}
    </div>
  );
}
