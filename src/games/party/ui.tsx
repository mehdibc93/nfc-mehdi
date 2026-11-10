import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useParty } from './i18n';

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

/** Couleur et accroche du jeu en cours, fournies par la salle de jeux. */
export const PartyTheme = createContext<{ tint: string; emoji?: string; title?: string; text?: string; players?: string }>({ tint: '#ece4d6' });

export function PartyHeader(props: { emoji?: string; title?: string; onQuit: () => void; quitLabel?: string }) {
  const theme = useContext(PartyTheme);
  const { onQuit, quitLabel } = props;
  const emoji = props.emoji ?? theme.emoji ?? '🎮';
  const title = props.title ?? theme.title ?? '';
  const { t } = useParty();
  return (
    <div
      className="relative mb-4 flex items-center gap-4 overflow-hidden rounded-3xl p-4 shadow-soft"
      style={{ background: `radial-gradient(circle at 15% 20%, #ffffff 0%, ${theme.tint} 75%)` }}
    >
      <span className="pointer-events-none absolute -bottom-6 -right-3 rotate-12 text-[92px] leading-none opacity-15">{emoji}</span>
      <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-3xl shadow-soft">{emoji}</span>
      <div className="relative min-w-0 flex-1">
        <p className="truncate font-display text-lg font-bold leading-tight text-stone-900">{title}</p>
        {theme.text && <p className="mt-0.5 truncate text-xs text-stone-600">{theme.text}</p>}
        {theme.players && <p className="mt-0.5 text-[11px] font-semibold text-stone-500">{theme.players}</p>}
      </div>
      <button
        type="button"
        onClick={onQuit}
        className="relative shrink-0 rounded-full bg-white/90 px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-sm"
      >
        {quitLabel ?? t('quit')}
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
  const { t } = useParty();
  const [names, setNames] = useState<string[]>(() => [firstName, ...Array(Math.max(0, min - 1)).fill('')]);
  const filled = names.map((name, index) => name.trim() || t('player', { n: index + 1 }));
  return (
    <Card>
      <div className="text-sm leading-6 text-stone-500">{intro}</div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{t('players')}</p>
      <div className="mt-2 space-y-2">
        {names.map((name, index) => (
          <div key={index} className="flex items-center gap-2">
            <Avatar index={index} name={filled[index]} />
            <input
              value={name}
              maxLength={14}
              onChange={(event) => setNames((list) => list.map((item, i) => (i === index ? event.target.value : item)))}
              placeholder={t('player', { n: index + 1 })}
              className="min-w-0 flex-1 rounded-2xl border border-stone-200 px-4 py-2.5 text-base outline-none focus:border-navy-300"
            />
            {names.length > min && (
              <button
                type="button"
                onClick={() => setNames((list) => list.filter((_, i) => i !== index))}
                className="h-11 w-11 shrink-0 rounded-full bg-stone-100 text-stone-500"
                aria-label={t('remove')}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      {names.length < max && (
        <button type="button" onClick={() => setNames((list) => [...list, ''])} className="mt-3 text-sm font-bold text-navy-700">
          {t('addPlayer')}
        </button>
      )}
      <PrimaryButton onClick={() => onStart(filled)} className="mt-5 w-full">
        {t('go')}
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

const AVATAR_COLORS = ['#1c2f47', '#b5179e', '#0f766e', '#c2410c', '#6d28d9', '#be123c', '#0369a1', '#4d7c0f', '#a16207', '#334155'];

export function Avatar({ index, name, size = 'md' }: { index: number; name: string; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white ${size === 'sm' ? 'h-7 w-7 text-xs' : 'h-10 w-10 text-sm'}`}
      style={{ background: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Progression dans une partie (question 3 sur 10…). */
export function ProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-xs font-semibold text-stone-400">
        <span className="uppercase tracking-[0.18em]">{label}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-200">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500" style={{ width: `${(value / total) * 100}%` }} />
      </div>
    </div>
  );
}

/** Classement final, avec médailles. */
export function Scoreboard({ players, scores }: { players: string[]; scores: number[] }) {
  const { t } = useParty();
  const ranking = players.map((name, index) => ({ name, index, score: scores[index] })).sort((a, b) => b.score - a.score);
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <ol className="mt-5 space-y-2 text-left">
      {ranking.map((item, position) => (
        <li
          key={item.index}
          className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${position === 0 ? 'bg-amber-50 ring-1 ring-amber-200' : 'bg-stone-50'}`}
        >
          <span className="w-7 text-center text-lg">{medals[position] ?? `${position + 1}.`}</span>
          <Avatar index={item.index} name={item.name} size="sm" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-800">{item.name}</span>
          <span className="font-display text-sm font-bold tabular-nums">{t(item.score > 1 ? 'ptsMany' : 'pts', { n: item.score })}</span>
        </li>
      ))}
    </ol>
  );
}

/** Choix « qui a trouvé ? » : un bouton par joueur, avec avatar et score. */
export function PlayerPicker({ players, scores, onPick }: { players: string[]; scores: number[]; onPick: (index: number) => void }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {players.map((name, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onPick(index)}
          className="flex items-center gap-2 rounded-2xl bg-amber-400 px-3 py-2.5 text-left text-sm font-bold text-stone-900 transition-transform active:scale-95"
        >
          <Avatar index={index} name={name} size="sm" />
          <span className="min-w-0 flex-1 truncate">{name}</span>
          <span className="text-xs font-semibold text-stone-700">{scores[index]}</span>
        </button>
      ))}
    </div>
  );
}
