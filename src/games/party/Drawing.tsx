import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { FOREHEAD_DECKS } from './content';
import { buzz, Card, PartyHeader, pick, PrimaryButton, SecondaryButton, TimerBadge, useCountdown } from './ui';

// Le dessin : le dessinateur découvre un mot en secret, puis le dessine sur l'écran pendant que la
// table crie ses propositions. Pas de lettres ni de chiffres !

const ROUND_SECONDS = 75;
const INKS = ['#111111', '#e5383b', '#1e6fd9', '#2a9d4b', '#f2b705'];
const WORDS = FOREHEAD_DECKS.filter((deck) => ['animaux', 'cuisine', 'objets', 'voyage'].includes(deck.id)).flatMap((deck) => deck.words);

type Phase = 'secret' | 'draw' | 'found' | 'timeout';

export function Drawing({ onQuit }: { onQuit: () => void }) {
  const [word, setWord] = useState(() => pick(WORDS));
  const [phase, setPhase] = useState<Phase>('secret');
  const [shown, setShown] = useState(false);
  const [ink, setInk] = useState(INKS[0]);
  const [score, setScore] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const { left, reset } = useCountdown(ROUND_SECONDS, phase === 'draw', () => {
    buzz([200, 100, 200]);
    setPhase('timeout');
  });

  const clear = () => {
    const element = canvas.current;
    const ctx = element?.getContext('2d');
    if (!element || !ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, element.width, element.height);
  };

  useEffect(() => {
    if (phase !== 'draw') return;
    const element = canvas.current;
    if (!element) return;
    const dpr = window.devicePixelRatio || 1;
    element.width = element.clientWidth * dpr;
    element.height = element.clientHeight * dpr;
    element.getContext('2d')?.scale(dpr, dpr);
    clear();
  }, [phase]);

  const point = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const stroke = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = ink;
    ctx.lineWidth = ink === '#ffffff' ? 22 : 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const nextRound = () => {
    setWord(pick(WORDS));
    setShown(false);
    setPhase('secret');
    reset();
  };

  const header = <PartyHeader emoji="✏️" title="Le dessin" onQuit={onQuit} />;

  if (phase === 'secret') {
    return (
      <div>
        {header}
        <Card className="text-center">
          {!shown ? (
            <>
              <p className="font-display text-2xl font-bold">Qui dessine ?</p>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Le dessinateur prend le téléphone et découvre son mot en secret. Ensuite, il dessine, la table devine. Interdit d’écrire des lettres ou des chiffres !
              </p>
              <PrimaryButton onClick={() => setShown(true)} className="mt-6 w-full">
                Je dessine, voir le mot
              </PrimaryButton>
            </>
          ) : (
            <>
              <p className="text-sm text-stone-500">Ton mot à faire deviner :</p>
              <p className="mt-2 font-display text-4xl font-black">{word}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <PrimaryButton onClick={() => setPhase('draw')}>Commencer à dessiner</PrimaryButton>
                <SecondaryButton onClick={() => setWord(pick(WORDS))}>Autre mot</SecondaryButton>
              </div>
            </>
          )}
          {score > 0 && <p className="mt-5 text-xs font-semibold text-stone-400">Dessins trouvés : {score}</p>}
        </Card>
      </div>
    );
  }

  if (phase === 'found' || phase === 'timeout') {
    return (
      <div>
        {header}
        <Card className="text-center">
          <p className="text-5xl">{phase === 'found' ? '🎉' : '⏰'}</p>
          <p className="mt-3 font-display text-2xl font-bold">{phase === 'found' ? 'Trouvé !' : 'Temps écoulé !'}</p>
          <p className="mt-2 text-sm text-stone-500">
            C’était : <strong className="text-stone-900">{word}</strong>
          </p>
          <PrimaryButton onClick={nextRound} className="mt-6 w-full">
            Au suivant de dessiner
          </PrimaryButton>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {header}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {[...INKS, '#ffffff'].map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setInk(color)}
              className={`h-9 w-9 rounded-full border-2 ${ink === color ? 'border-amber-400 ring-2 ring-amber-200' : 'border-stone-200'}`}
              style={{ background: color }}
              aria-label={color === '#ffffff' ? 'Gomme' : 'Couleur'}
            >
              {color === '#ffffff' ? '🧽' : ''}
            </button>
          ))}
        </div>
        <TimerBadge left={left} total={ROUND_SECONDS} />
      </div>
      <canvas
        ref={canvas}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          const p = point(event);
          last.current = p;
          stroke(p, { x: p.x + 0.1, y: p.y + 0.1 });
        }}
        onPointerMove={(event) => {
          if (!last.current) return;
          const p = point(event);
          stroke(last.current, p);
          last.current = p;
        }}
        onPointerUp={() => {
          last.current = null;
        }}
        className="h-[52vh] min-h-[300px] w-full touch-none rounded-3xl border border-stone-200 bg-white shadow-soft"
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <SecondaryButton onClick={clear}>Tout effacer</SecondaryButton>
        <button
          type="button"
          onClick={() => {
            setScore((value) => value + 1);
            buzz(60);
            setPhase('found');
          }}
          className="rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-bold text-white active:scale-95"
        >
          ✓ Trouvé !
        </button>
      </div>
    </div>
  );
}
