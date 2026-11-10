import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

// Briques communes des jeux d'ambiance (un seul téléphone posé au milieu de la table).

export function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function PartyHeader({ emoji, title, onQuit }: { emoji: string; title: string; onQuit: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <p className="min-w-0 font-display text-lg font-bold">
        {emoji} {title}
      </p>
      <button type="button" onClick={onQuit} className="shrink-0 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600">
        Quitter
      </button>
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft ${className}`}>{children}</div>;
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  tone = 'dark',
  className = '',
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'dark' | 'amber';
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-6 py-3.5 text-sm font-bold transition-transform active:scale-95 disabled:opacity-40 ${
        tone === 'amber' ? 'bg-amber-400 text-stone-900' : 'bg-stone-900 text-white'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, className = '' }: { children: ReactNode; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border border-stone-200 bg-white px-6 py-3.5 text-sm font-semibold text-stone-700 transition-transform active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}

/** Saisie des prénoms des joueurs autour de la table. */
export function PlayersSetup({
  min,
  max,
  firstName,
  intro,
  onStart,
}: {
  min: number;
  max: number;
  firstName: string;
  intro: ReactNode;
  onStart: (players: string[]) => void;
}) {
  const [names, setNames] = useState<string[]>(() => [firstName, ...Array(Math.max(0, min - 1)).fill('')]);
  const filled = names.map((name, index) => name.trim() || `Joueur ${index + 1}`);
  return (
    <Card>
      <div className="text-sm leading-6 text-stone-500">{intro}</div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Joueurs</p>
      <div className="mt-2 space-y-2">
        {names.map((name, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={name}
              maxLength={14}
              onChange={(event) => setNames((list) => list.map((item, i) => (i === index ? event.target.value : item)))}
              placeholder={`Joueur ${index + 1}`}
              className="min-w-0 flex-1 rounded-2xl border border-stone-200 px-4 py-2.5 text-base outline-none focus:border-navy-300"
            />
            {names.length > min && (
              <button
                type="button"
                onClick={() => setNames((list) => list.filter((_, i) => i !== index))}
                className="h-11 w-11 shrink-0 rounded-full bg-stone-100 text-stone-500"
                aria-label="Retirer"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      {names.length < max && (
        <button type="button" onClick={() => setNames((list) => [...list, ''])} className="mt-3 text-sm font-bold text-navy-700">
          + Ajouter un joueur
        </button>
      )}
      <PrimaryButton onClick={() => onStart(filled)} className="mt-5 w-full">
        C’est parti !
      </PrimaryButton>
    </Card>
  );
}

/** Compte à rebours en secondes ; `onEnd` est appelé une fois arrivé à zéro. */
export function useCountdown(seconds: number, running: boolean, onEnd: () => void) {
  const [left, setLeft] = useState(seconds);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;
  useEffect(() => {
    if (!running) return undefined;
    if (left <= 0) {
      endRef.current();
      return undefined;
    }
    const timer = window.setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [left, running]);
  return { left, reset: (value = seconds) => setLeft(value) };
}

export function TimerBadge({ left, total }: { left: number; total: number }) {
  const urgent = left <= 5;
  return (
    <div className="relative mx-auto h-16 w-16">
      <svg viewBox="0 0 40 40" className="h-16 w-16 -rotate-90">
        <circle cx="20" cy="20" r="17" fill="none" stroke="#ece5d6" strokeWidth="3.5" />
        <circle
          cx="20"
          cy="20"
          r="17"
          fill="none"
          stroke={urgent ? '#e5383b' : '#d4af37'}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={106.8}
          strokeDashoffset={106.8 * (1 - left / total)}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-display text-lg font-bold tabular-nums ${urgent ? 'text-red-600' : 'text-stone-900'}`}>
        {left}
      </span>
    </div>
  );
}

/** Petite vibration quand le téléphone le permet (Android ; ignoré ailleurs). */
export function buzz(pattern: number | number[] = 60) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // non pris en charge
  }
}
