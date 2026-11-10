import { useEffect, useMemo, useState } from 'react';
import { useParty } from './i18n';
import { buzz, PartyHeader, PrimaryButton, shuffled } from './ui';

// Deux jeux de cartes « à questions », joués d'un seul téléphone posé au milieu de la table.

/** Qui de nous ? — une question, compte à rebours, et tout le monde pointe quelqu'un en même temps. */
export function WhoOfUs({ onQuit }: { onQuit: () => void }) {
  const { t, content, lang } = useParty();
  const deck = useMemo(() => shuffled(content.whoOfUs), [content]);
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    setIndex(0);
    setCount(null);
  }, [lang]);

  useEffect(() => {
    if (count === null || count === 0) return undefined;
    const timer = window.setTimeout(() => {
      setCount(count - 1);
      buzz(count === 1 ? 200 : 30);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [count]);

  const prompt = deck[index % deck.length];
  return (
    <div>
      <PartyHeader onQuit={onQuit} />
      {/* Paquet de cartes : deux cartes décalées derrière la carte du dessus. */}
      <div className="relative mx-1 mt-2">
        <div className="absolute inset-0 translate-y-3 rotate-[3deg] rounded-[2rem] bg-teal-100" />
        <div className="absolute inset-0 translate-y-1.5 -rotate-[2deg] rounded-[2rem] bg-teal-50" />
        <div className="relative flex min-h-[360px] flex-col items-center justify-center rounded-[2rem] border border-stone-200/70 bg-white p-7 text-center shadow-card">
          <p className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">{t('who.card', { n: index + 1 })}</p>
          <p key={index} className="mt-5 animate-fadeIn font-display text-2xl font-bold leading-snug text-stone-900">
            {prompt}
          </p>
          <div className="mt-8 flex h-24 items-center">
            {count === null ? (
              <PrimaryButton onClick={() => setCount(3)}>{t('who.count')}</PrimaryButton>
            ) : count > 0 ? (
              <p key={count} className="animate-pop font-display text-7xl font-black text-teal-700">
                {count}
              </p>
            ) : (
              <p className="animate-pop font-display text-5xl font-black">{t('who.point')}</p>
            )}
          </div>
        </div>
      </div>
      <PrimaryButton
        onClick={() => {
          setIndex(index + 1);
          setCount(null);
        }}
        tone="amber"
        className="mt-6 w-full"
      >
        {t('who.next')}
      </PrimaryButton>
      <p className="mt-3 text-center text-xs text-stone-400">{t('who.footer')}</p>
    </div>
  );
}

/** Tu préfères ? — deux choix, chacun vote d'un tap, et on découvre le camp majoritaire. */
export function WouldYouRather({ onQuit }: { onQuit: () => void }) {
  const { t, content } = useParty();
  const deck = useMemo(() => shuffled(content.rather), [content]);
  const [index, setIndex] = useState(0);
  const [votes, setVotes] = useState<[number, number]>([0, 0]);
  const [shown, setShown] = useState(false);

  const [left, right] = deck[index % deck.length];
  const total = votes[0] + votes[1];
  const percent = (side: 0 | 1) => (total === 0 ? 50 : Math.round((votes[side] / total) * 100));
  const winner = shown && total > 0 && votes[0] !== votes[1] ? (votes[0] > votes[1] ? 0 : 1) : null;

  const vote = (side: 0 | 1) => {
    if (shown) return;
    buzz(20);
    setVotes((current) => (side === 0 ? [current[0] + 1, current[1]] : [current[0], current[1] + 1]));
  };

  const side = (label: string, which: 0 | 1, color: string) => (
    <button
      type="button"
      onClick={() => vote(which)}
      className={`relative flex min-h-[150px] flex-1 flex-col items-center justify-center overflow-hidden rounded-[2rem] p-5 text-center text-white shadow-card transition-all duration-300 active:scale-[0.97] ${
        winner !== null && winner !== which ? 'opacity-60 saturate-50' : ''
      } ${winner === which ? 'ring-4 ring-amber-300' : ''}`}
      style={{ background: color }}
    >
      {shown && <span className="absolute inset-x-0 bottom-0 bg-black/20 transition-all duration-700" style={{ height: `${percent(which)}%` }} />}
      {winner === which && <span className="absolute right-3 top-3 animate-pop text-2xl">👑</span>}
      <span key={`${index}-${which}`} className="relative animate-fadeIn font-display text-xl font-bold leading-snug">
        {label}
      </span>
      <span className="relative mt-2 rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
        {shown ? `${percent(which)} %` : t(votes[which] > 1 ? 'rather.votes' : 'rather.vote', { n: votes[which] })}
      </span>
    </button>
  );

  return (
    <div>
      <PartyHeader onQuit={onQuit} />
      <p className="mb-3 text-center text-sm text-stone-500">{t('rather.hint')}</p>
      <div className="relative flex flex-col gap-3">
        {side(left, 0, 'linear-gradient(135deg, #e5383b, #b5179e)')}
        <span className="absolute left-1/2 top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-[#f7f4ee] bg-stone-900 font-display text-xs font-black text-white">
          {t('rather.or')}
        </span>
        {side(right, 1, 'linear-gradient(135deg, #1e6fd9, #0fb5ae)')}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <PrimaryButton onClick={() => setShown(true)} disabled={total === 0 || shown}>
          {t('rather.reveal')}
        </PrimaryButton>
        <PrimaryButton
          onClick={() => {
            setIndex(index + 1);
            setVotes([0, 0]);
            setShown(false);
          }}
          tone="amber"
        >
          {t('rather.next')}
        </PrimaryButton>
      </div>
    </div>
  );
}
