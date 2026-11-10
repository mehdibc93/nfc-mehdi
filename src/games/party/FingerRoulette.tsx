import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useParty } from './i18n';
import { buzz, PartyHeader } from './ui';

// « Qui paie ? » : chacun pose un doigt sur l'écran ; après quelques secondes sans changement, le
// hasard en désigne un. À la souris (ordinateur), chaque clic pose un « doigt » qui reste.

type Finger = { id: number; x: number; y: number; color: string };
const COLORS = ['#e5383b', '#1e6fd9', '#2a9d4b', '#f2b705', '#8b5cf6', '#f77f00', '#0fb5ae', '#e83e8c', '#6b7280', '#14b8a6'];
const SETTLE_MS = 2500;

export function FingerRoulette({ onQuit }: { onQuit: () => void }) {
  const { t, content } = useParty();
  const [fingers, setFingers] = useState<Finger[]>([]);
  const [winner, setWinner] = useState<number | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [arming, setArming] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  const colorIndex = useRef(0);
  const question = content.roulette[questionIndex % content.roulette.length];

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
  };

  return (
    <div>
      <PartyHeader onQuit={onQuit} />
      <div className="-mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {content.roulette.map((item, index) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setQuestionIndex(index);
              restart();
            }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              questionIndex === index ? 'bg-stone-900 text-white' : 'border border-stone-200 bg-white text-stone-600'
            }`}
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
        className="relative h-[60vh] min-h-[340px] touch-none select-none overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_50%_30%,#334155,#0f172a)]"
      >
        {fingers.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center text-white">
            <p className="animate-float text-6xl">🖐️</p>
            <p className="mt-4 font-display text-2xl font-bold">{question}</p>
            <p className="mt-2 text-sm text-white/60">{t('roulette.place')}</p>
          </div>
        )}
        {fingers.length === 1 && winner === null && (
          <p className="pointer-events-none absolute inset-x-0 top-6 text-center text-sm font-semibold text-white/70">{t('roulette.min')}</p>
        )}
        {arming && <p className="pointer-events-none absolute inset-x-0 top-6 animate-pulse text-center text-sm font-bold text-amber-300">{t('roulette.drawing')}</p>}
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
                width: isWinner ? 160 : 90,
                height: isWinner ? 160 : 90,
                transform: 'translate(-50%, -50%)',
                background: finger.color,
                opacity: faded ? 0.12 : 1,
                boxShadow: `0 0 0 ${isWinner ? 16 : 6}px ${finger.color}55, 0 0 40px ${finger.color}`,
              }}
            />
          );
        })}
        {winner !== null && (
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-black/75 to-transparent px-6 pb-6 pt-16 text-center text-white">
            <p className="animate-pop font-display text-3xl font-black">{t('roulette.you')}</p>
            <p className="text-sm text-white/70">{question}</p>
            <button type="button" onClick={restart} className="rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-stone-900">
              {t('replay')}
            </button>
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-stone-400">{t('roulette.footer')}</p>
    </div>
  );
}
