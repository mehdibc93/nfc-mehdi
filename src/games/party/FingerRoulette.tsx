import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { buzz, PartyHeader } from './ui';

// « Qui paie ? » : chacun pose un doigt sur l'écran ; après quelques secondes sans changement, le
// hasard en désigne un. À la souris (ordinateur), chaque clic pose un « doigt » qui reste.

type Finger = { id: number; x: number; y: number; color: string };
const COLORS = ['#e5383b', '#1e6fd9', '#2a9d4b', '#f2b705', '#8b5cf6', '#f77f00', '#0fb5ae', '#e83e8c', '#6b7280', '#14b8a6'];
const SETTLE_MS = 2500;
const QUESTIONS = ['Qui paie l’addition ?', 'Qui choisit le dessert ?', 'Qui commande en premier ?', 'Qui raconte une anecdote ?', 'Qui lance le prochain jeu ?'];

export function FingerRoulette({ onQuit }: { onQuit: () => void }) {
  const [fingers, setFingers] = useState<Finger[]>([]);
  const [winner, setWinner] = useState<number | null>(null);
  const [question, setQuestion] = useState(QUESTIONS[0]);
  const [arming, setArming] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  const colorIndex = useRef(0);

  // Dès que les doigts ne bougent plus (ni ajout ni retrait) pendant 2,5 s, on tire au sort.
  const fingerKey = fingers.map((finger) => finger.id).join(',');
  useEffect(() => {
    if (winner !== null || fingers.length < 2) {
      setArming(false);
      return undefined;
    }
    setArming(true);
    const timer = window.setTimeout(() => {
      const chosen = fingers[Math.floor(Math.random() * fingers.length)];
      setWinner(chosen.id);
      setArming(false);
      buzz([80, 60, 200]);
    }, SETTLE_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerKey, winner]);

  const position = (event: ReactPointerEvent) => {
    const rect = area.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const down = (event: ReactPointerEvent) => {
    if (winner !== null) return;
    const { x, y } = position(event);
    const id = event.pointerType === 'mouse' ? Date.now() : event.pointerId;
    const color = COLORS[colorIndex.current % COLORS.length];
    colorIndex.current += 1;
    setFingers((list) => [...list, { id, x, y, color }]);
    buzz(20);
  };
  const move = (event: ReactPointerEvent) => {
    if (event.pointerType === 'mouse' || winner !== null) return;
    const { x, y } = position(event);
    setFingers((list) => list.map((finger) => (finger.id === event.pointerId ? { ...finger, x, y } : finger)));
  };
  const up = (event: ReactPointerEvent) => {
    if (event.pointerType === 'mouse' || winner !== null) return;
    setFingers((list) => list.filter((finger) => finger.id !== event.pointerId));
  };

  const restart = () => {
    setFingers([]);
    setWinner(null);
    setQuestion(QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]);
  };

  return (
    <div>
      <PartyHeader emoji="👆" title="Qui paie ?" onQuit={onQuit} />
      <div className="mb-3 flex flex-wrap gap-1.5">
        {QUESTIONS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setQuestion(item)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${question === item ? 'bg-stone-900 text-white' : 'bg-white text-stone-600'}`}
          >
            {item}
          </button>
        ))}
      </div>
      <div
        ref={area}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onContextMenu={(event) => event.preventDefault()}
        className="relative h-[60vh] min-h-[340px] touch-none select-none overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 to-navy-800"
      >
        {fingers.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center text-white">
            <p className="text-5xl">🖐️</p>
            <p className="mt-3 font-display text-xl font-bold">{question}</p>
            <p className="mt-2 text-sm text-white/60">Posez tous un doigt sur l’écran et ne bougez plus…</p>
          </div>
        )}
        {fingers.length === 1 && winner === null && (
          <p className="pointer-events-none absolute inset-x-0 top-6 text-center text-sm font-semibold text-white/70">Il faut au moins 2 doigts</p>
        )}
        {arming && <p className="pointer-events-none absolute inset-x-0 top-6 animate-pulse text-center text-sm font-bold text-amber-300">Tirage au sort…</p>}
        {fingers.map((finger) => {
          const isWinner = winner === finger.id;
          const faded = winner !== null && !isWinner;
          return (
            <span
              key={finger.id}
              className={`pointer-events-none absolute rounded-full transition-all duration-500 ${arming ? 'animate-pulse' : ''}`}
              style={{
                left: finger.x,
                top: finger.y,
                width: isWinner ? 150 : 90,
                height: isWinner ? 150 : 90,
                transform: 'translate(-50%, -50%)',
                background: finger.color,
                opacity: faded ? 0.12 : 1,
                boxShadow: `0 0 0 ${isWinner ? 14 : 6}px ${finger.color}55`,
              }}
            />
          );
        })}
        {winner !== null && (
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-6 pb-6 pt-16 text-center text-white">
            <p className="font-display text-2xl font-bold">C’est toi ! 🎉</p>
            <button type="button" onClick={restart} className="rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-stone-900">
              Rejouer
            </button>
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-stone-400">Le hasard est impartial… ou presque 😉</p>
    </div>
  );
}
