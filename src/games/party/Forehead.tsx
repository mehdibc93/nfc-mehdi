import { useState } from 'react';
import { FOREHEAD_DECKS } from './content';
import { buzz, Card, PartyHeader, PrimaryButton, SecondaryButton, shuffled, useCountdown } from './ui';

// « Le mot sur le front » : un joueur tient le téléphone sur son front, écran vers la table. Les
// autres font deviner le mot sans le dire. Touchez à droite si c'est trouvé, à gauche pour passer.

const ROUND_SECONDS = 60;

type Phase = { kind: 'menu' } | { kind: 'ready'; deck: string } | { kind: 'play'; deck: string } | { kind: 'end'; deck: string };

export function Forehead({ onQuit }: { onQuit: () => void }) {
  const [phase, setPhase] = useState<Phase>({ kind: 'menu' });
  const [words, setWords] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<{ word: string; found: boolean }[]>([]);
  const [flash, setFlash] = useState<'found' | 'pass' | null>(null);
  const { left, reset } = useCountdown(ROUND_SECONDS, phase.kind === 'play', () => {
    buzz([200, 100, 200]);
    setPhase((current) => (current.kind === 'play' ? { kind: 'end', deck: current.deck } : current));
  });

  const deckOf = (id: string) => FOREHEAD_DECKS.find((deck) => deck.id === id)!;

  const start = (deck: string) => {
    setWords(shuffled(deckOf(deck).words));
    setIndex(0);
    setResults([]);
    reset();
    setPhase({ kind: 'play', deck });
    buzz(40);
  };

  const answer = (found: boolean) => {
    if (phase.kind !== 'play') return;
    setResults((list) => [...list, { word: words[index], found }]);
    setFlash(found ? 'found' : 'pass');
    buzz(found ? 40 : [20, 40, 20]);
    window.setTimeout(() => setFlash(null), 350);
    if (index + 1 >= words.length) setPhase({ kind: 'end', deck: phase.deck });
    else setIndex(index + 1);
  };

  if (phase.kind === 'menu') {
    return (
      <div>
        <PartyHeader emoji="🤔" title="Le mot sur le front" onQuit={onQuit} />
        <Card>
          <p className="text-sm leading-6 text-stone-500">
            Un joueur pose le téléphone sur son front, écran tourné vers la table. Les autres lui font deviner le mot, sans le prononcer. 60 secondes pour en trouver un maximum !
          </p>
        </Card>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {FOREHEAD_DECKS.map((deck) => (
            <button
              key={deck.id}
              type="button"
              onClick={() => setPhase({ kind: 'ready', deck: deck.id })}
              className="rounded-3xl border border-stone-200/70 bg-white p-4 text-left shadow-soft transition-transform active:scale-95"
            >
              <p className="text-3xl">{deck.emoji}</p>
              <p className="mt-2 font-display font-bold">{deck.label}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase.kind === 'ready') {
    return (
      <div>
        <PartyHeader emoji="🤔" title="Le mot sur le front" onQuit={onQuit} />
        <Card className="text-center">
          <p className="text-5xl">{deckOf(phase.deck).emoji}</p>
          <p className="mt-3 font-display text-xl font-bold">{deckOf(phase.deck).label}</p>
          <p className="mt-4 text-sm leading-6 text-stone-500">
            Mettez le téléphone sur votre front, écran vers la table.
            <br />
            👉 Touchez la <strong>moitié droite</strong> quand c’est trouvé, la <strong>moitié gauche</strong> pour passer.
          </p>
          <PrimaryButton onClick={() => start(phase.deck)} className="mt-6 w-full">
            Je suis prêt·e, go !
          </PrimaryButton>
        </Card>
      </div>
    );
  }

  if (phase.kind === 'end') {
    const score = results.filter((item) => item.found).length;
    return (
      <div>
        <PartyHeader emoji="🤔" title="Le mot sur le front" onQuit={onQuit} />
        <Card className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-400">Score</p>
          <p className="mt-1 font-display text-6xl font-bold">{score}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-1.5">
            {results.map((item, i) => (
              <span key={i} className={`rounded-full px-3 py-1 text-xs font-semibold ${item.found ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-400 line-through'}`}>
                {item.word}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <PrimaryButton onClick={() => setPhase({ kind: 'ready', deck: phase.deck })}>Joueur suivant</PrimaryButton>
            <SecondaryButton onClick={() => setPhase({ kind: 'menu' })}>Autre thème</SecondaryButton>
          </div>
        </Card>
      </div>
    );
  }

  // En jeu : plein écran, mot énorme, deux grandes zones tactiles.
  return (
    <div
      className={`fixed inset-0 z-[90] flex select-none flex-col transition-colors duration-200 ${
        flash === 'found' ? 'bg-emerald-500' : flash === 'pass' ? 'bg-red-500' : 'bg-navy-800'
      }`}
    >
      <div className="flex items-center justify-between px-5 pt-5 text-white">
        <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold">✓ {results.filter((item) => item.found).length}</span>
        <span className={`font-display text-2xl font-bold tabular-nums ${left <= 10 ? 'text-amber-300' : ''}`}>{left}s</span>
        <button type="button" onClick={() => setPhase({ kind: 'end', deck: phase.deck })} className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
          Stop
        </button>
      </div>
      <div className="relative flex flex-1">
        <button type="button" onClick={() => answer(false)} className="flex flex-1 items-end justify-start p-5 text-left text-sm font-bold text-white/50">
          ← Passer
        </button>
        <button type="button" onClick={() => answer(true)} className="flex flex-1 items-end justify-end p-5 text-right text-sm font-bold text-white/50">
          Trouvé →
        </button>
        <p className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 text-center font-display text-5xl font-black leading-tight text-white sm:text-7xl">
          {words[index]}
        </p>
      </div>
    </div>
  );
}
