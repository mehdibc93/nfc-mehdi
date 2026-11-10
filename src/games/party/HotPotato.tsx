import { useEffect, useRef, useState } from 'react';
import { LETTER_RUSH_CATEGORIES } from './content';
import { buzz, Card, PartyHeader, pick, PrimaryButton, SecondaryButton } from './ui';

// La patate chaude : une catégorie s'affiche, on dit un mot qui va dedans puis on passe le
// téléphone à son voisin. Une bombe à retardement (durée secrète) tictaque de plus en plus vite :
// celui qui l'a en main quand elle explose a perdu.

type Phase = 'intro' | 'play' | 'boom';

function beep(ctx: AudioContext | null, frequency: number, duration: number, volume = 0.15) {
  if (!ctx) return;
  try {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = 'square';
    gain.gain.value = volume;
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // son indisponible : le jeu continue en silence
  }
}

export function HotPotato({ onQuit }: { onQuit: () => void }) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [category, setCategory] = useState(() => pick(LETTER_RUSH_CATEGORIES));
  const [passes, setPasses] = useState(0);
  const [heat, setHeat] = useState(0);
  const audio = useRef<AudioContext | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const start = () => {
    clearTimers();
    if (!audio.current) {
      try {
        const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audio.current = new AudioCtor();
      } catch {
        audio.current = null;
      }
    }
    void audio.current?.resume();
    setCategory(pick(LETTER_RUSH_CATEGORIES));
    setPasses(0);
    setHeat(0);
    setPhase('play');
    const total = 15000 + Math.random() * 25000;
    const startedAt = performance.now();
    const tick = () => {
      const elapsed = performance.now() - startedAt;
      if (elapsed >= total) {
        beep(audio.current, 90, 0.7, 0.3);
        buzz([300, 100, 300]);
        setPhase('boom');
        return;
      }
      const progress = elapsed / total;
      setHeat(progress);
      beep(audio.current, 700 + progress * 500, 0.05);
      timers.current.push(window.setTimeout(tick, Math.max(120, 900 * (1 - progress))));
    };
    tick();
  };

  if (phase === 'intro') {
    return (
      <div>
        <PartyHeader emoji="💣" title="La patate chaude" onQuit={onQuit} />
        <Card className="text-center">
          <p className="text-6xl">💣</p>
          <p className="mt-4 text-sm leading-6 text-stone-500">
            Une catégorie s’affiche. Dites un mot qui va dedans, puis passez vite le téléphone à votre voisin. La bombe explose au bout d’un temps secret… et celui qui la tient a perdu ! Montez le son 🔊
          </p>
          <PrimaryButton onClick={start} className="mt-6 w-full">
            Allumer la mèche
          </PrimaryButton>
        </Card>
      </div>
    );
  }

  if (phase === 'boom') {
    return (
      <div>
        <PartyHeader emoji="💣" title="La patate chaude" onQuit={onQuit} />
        <Card className="text-center">
          <p className="animate-pop text-8xl">💥</p>
          <p className="mt-3 font-display text-3xl font-black">BOUM !</p>
          <p className="mt-2 text-sm text-stone-500">Celui qui tient le téléphone a perdu ! ({passes} passe{passes > 1 ? 's' : ''})</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <PrimaryButton onClick={start}>Rejouer</PrimaryButton>
            <SecondaryButton onClick={onQuit}>Changer de jeu</SecondaryButton>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex select-none flex-col items-center justify-center gap-6 px-6 text-center text-white" style={{ background: `hsl(${30 - heat * 30} 85% ${45 - heat * 12}%)` }}>
      <p className="text-8xl" style={{ animation: `pop ${Math.max(0.15, 0.9 * (1 - heat))}s ease-in-out infinite` }}>
        💣
      </p>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">Dites…</p>
        <p className="mt-2 font-display text-4xl font-black leading-tight">{category}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          setPasses((value) => value + 1);
          buzz(25);
        }}
        className="w-full max-w-xs rounded-full bg-white px-6 py-5 font-display text-xl font-black text-stone-900 shadow-card active:scale-95"
      >
        Dit ! Je passe ➜
      </button>
      <button type="button" onClick={() => setCategory(pick(LETTER_RUSH_CATEGORIES))} className="text-sm font-semibold text-white/80 underline">
        Changer de catégorie
      </button>
      <button
        type="button"
        onClick={() => {
          clearTimers();
          onQuit();
        }}
        className="absolute right-4 top-4 rounded-full bg-black/20 px-4 py-2 text-xs font-semibold"
      >
        Quitter
      </button>
    </div>
  );
}
