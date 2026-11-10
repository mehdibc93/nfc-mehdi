import { useEffect, useState } from 'react';
import { WHO_OF_US_PROMPTS, WOULD_YOU_RATHER } from './content';
import { buzz, Card, PartyHeader, PrimaryButton, shuffled } from './ui';

// Deux jeux de cartes « à questions », joués d'un seul téléphone posé au milieu de la table.

/** Qui de nous ? — une question, compte à rebours, et tout le monde pointe quelqu'un en même temps. */
export function WhoOfUs({ onQuit }: { onQuit: () => void }) {
  const [deck] = useState(() => shuffled(WHO_OF_US_PROMPTS));
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState<number | null>(null);

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
      <PartyHeader emoji="👉" title="Qui de nous ?" onQuit={onQuit} />
      <Card className="flex min-h-[360px] flex-col items-center justify-center text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Carte {index + 1}</p>
        <p key={index} className="mt-4 animate-fadeIn font-display text-2xl font-bold leading-snug">
          {prompt}
        </p>
        <div className="mt-8 h-24">
          {count === null ? (
            <PrimaryButton onClick={() => setCount(3)}>3, 2, 1… pointez !</PrimaryButton>
          ) : count > 0 ? (
            <p key={count} className="animate-pop font-display text-7xl font-black text-navy-700">
              {count}
            </p>
          ) : (
            <p className="animate-pop font-display text-5xl font-black">👉 Pointez !</p>
          )}
        </div>
      </Card>
      <PrimaryButton
        onClick={() => {
          setIndex(index + 1);
          setCount(null);
        }}
        tone="amber" className="mt-4 w-full"
      >
        Carte suivante →
      </PrimaryButton>
      <p className="mt-3 text-center text-xs text-stone-400">La personne la plus désignée raconte pourquoi… ou choisit la carte suivante !</p>
    </div>
  );
}

/** Tu préfères ? — deux choix, chacun vote d'un tap, et on découvre le camp majoritaire. */
export function WouldYouRather({ onQuit }: { onQuit: () => void }) {
  const [deck] = useState(() => shuffled(WOULD_YOU_RATHER));
  const [index, setIndex] = useState(0);
  const [votes, setVotes] = useState<[number, number]>([0, 0]);
  const [shown, setShown] = useState(false);

  const [left, right] = deck[index % deck.length];
  const total = votes[0] + votes[1];
  const percent = (side: 0 | 1) => (total === 0 ? 50 : Math.round((votes[side] / total) * 100));

  const vote = (side: 0 | 1) => {
    buzz(20);
    setVotes((current) => (side === 0 ? [current[0] + 1, current[1]] : [current[0], current[1] + 1]));
  };

  const side = (label: string, which: 0 | 1, color: string) => (
    <button
      type="button"
      onClick={() => vote(which)}
      className="relative flex min-h-[150px] flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl p-5 text-center text-white shadow-card transition-transform active:scale-[0.97]"
      style={{ background: color }}
    >
      {shown && <span className="absolute inset-x-0 bottom-0 bg-black/20 transition-all duration-700" style={{ height: `${percent(which)}%` }} />}
      <span className="relative font-display text-xl font-bold leading-snug">{label}</span>
      <span className="relative mt-2 text-sm font-semibold text-white/80">{shown ? `${percent(which)} %` : `${votes[which]} vote${votes[which] > 1 ? 's' : ''}`}</span>
    </button>
  );

  return (
    <div>
      <PartyHeader emoji="⚖️" title="Tu préfères ?" onQuit={onQuit} />
      <p className="mb-3 text-center text-sm text-stone-500">Chacun tape sur son choix, puis on révèle !</p>
      <div className="flex flex-col gap-3">
        {side(left, 0, 'linear-gradient(135deg, #e5383b, #b5179e)')}
        <p className="text-center font-display text-sm font-black text-stone-400">OU</p>
        {side(right, 1, 'linear-gradient(135deg, #1e6fd9, #0fb5ae)')}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <PrimaryButton onClick={() => setShown(true)} disabled={total === 0 || shown}>
          Révéler
        </PrimaryButton>
        <PrimaryButton
          onClick={() => {
            setIndex(index + 1);
            setVotes([0, 0]);
            setShown(false);
          }}
          tone="amber"
        >
          Suivant →
        </PrimaryButton>
      </div>
    </div>
  );
}
