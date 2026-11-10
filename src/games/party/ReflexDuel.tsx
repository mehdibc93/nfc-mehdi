import { useEffect, useRef, useState } from 'react';
import { Confetti } from '../Confetti';
import { useParty } from './i18n';
import { buzz, PartyHeader, PrimaryButton } from './ui';

// Duel de réflexes : le téléphone est posé à plat entre deux joueurs, face à face. Quand l'écran
// passe au vert, le premier qui tape sur sa moitié gagne la manche. Taper trop tôt = manche perdue.

const TARGET = 5;
type Phase = 'idle' | 'wait' | 'go' | 'result';

export function ReflexDuel({ onQuit }: { onQuit: () => void }) {
  const { t } = useParty();
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

  const finish = (winner: 0 | 1, early: boolean, ms: number | null) => {
    roundOpen.current = false;
    buzz(early ? [80, 40, 80] : 60);
    setScores((current) => (winner === 0 ? [current[0] + 1, current[1]] : [current[0], current[1] + 1]));
    setLast({ winner, early, ms });
    setPhase('result');
  };

  const tap = (player: 0 | 1) => {
    if (!roundOpen.current) return;
    if (phaseRef.current === 'wait') {
      window.clearTimeout(timer.current);
      finish((1 - player) as 0 | 1, true, null);
    } else if (phaseRef.current === 'go') {
      finish(player, false, Math.round(performance.now() - goAt.current));
    }
  };

  const champion = scores[0] >= TARGET ? 0 : scores[1] >= TARGET ? 1 : null;
  const background = phase === 'go' ? 'bg-emerald-500' : phase === 'wait' ? 'bg-red-600' : 'bg-navy-800';

  const half = (player: 0 | 1) => {
    const won = last?.winner === player;
    let message = t('reflex.ready');
    if (phase === 'wait') message = t('reflex.wait');
    if (phase === 'go') message = t('reflex.tap');
    if (phase === 'result' && last) {
      if (won) message = last.early ? t('reflex.winEarly') : t('reflex.win', { ms: last.ms ?? 0 });
      else message = last.early ? t('reflex.early') : t('reflex.slow');
    }
    if (champion !== null) message = champion === player ? t('reflex.champ') : t('reflex.lost');
    const highlight = phase === 'result' && won;
    return (
      <button
        type="button"
        onPointerDown={() => tap(player)}
        className={`relative flex flex-1 flex-col items-center justify-center gap-2 text-white transition-colors ${player === 0 ? 'rotate-180' : ''} ${
          highlight ? 'bg-white/10' : ''
        }`}
      >
        <span className="flex gap-1.5">
          {Array.from({ length: TARGET }).map((_, i) => (
            <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < scores[player] ? 'bg-amber-300' : 'bg-white/20'}`} />
          ))}
        </span>
        <span key={scores[player]} className="animate-pop font-display text-6xl font-black tabular-nums">
          {scores[player]}
        </span>
        <span className={`px-6 text-center font-display font-bold ${phase === 'go' ? 'animate-pulse text-5xl' : 'text-xl'}`}>{message}</span>
      </button>
    );
  };

  if (phase === 'idle') {
    return (
      <div>
        <PartyHeader onQuit={onQuit} />
        <div className="rounded-3xl border border-stone-200/70 bg-white p-6 text-center shadow-soft">
          <div className="mx-auto flex h-40 w-24 flex-col overflow-hidden rounded-2xl border-4 border-stone-900 shadow-card">
            <span className="flex flex-1 rotate-180 items-center justify-center bg-red-500 text-2xl">👆</span>
            <span className="flex flex-1 items-center justify-center bg-emerald-500 text-2xl">👆</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-stone-500">{t('reflex.intro', { n: TARGET })}</p>
          <PrimaryButton onClick={startRound} className="mt-6 w-full">
            {t('reflex.start')}
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[90] flex touch-none select-none flex-col transition-colors duration-150 ${background}`}>
      {champion !== null && <Confetti />}
      {half(0)}
      <div className="flex items-center justify-center gap-2 border-y border-white/20 bg-black/25 py-2">
        {phase === 'result' && (
          <button
            type="button"
            onClick={() => {
              if (champion !== null) setScores([0, 0]);
              startRound();
            }}
            className="rounded-full bg-white px-5 py-2 text-sm font-bold text-stone-900"
          >
            {champion !== null ? t('reflex.rematch') : t('reflex.next')}
          </button>
        )}
        <button type="button" onClick={onQuit} className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white">
          {t('quit')}
        </button>
      </div>
      {half(1)}
    </div>
  );
}
