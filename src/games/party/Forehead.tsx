import { useState } from 'react';
import { Confetti } from '../Confetti';
import { useParty } from './i18n';
import { buzz, Card, PartyHeader, PrimaryButton, SecondaryButton, shuffled, useCountdown } from './ui';

// « Le mot sur le front » : un joueur tient le téléphone sur son front, écran vers la table. Les
// autres font deviner le mot sans le dire. Touchez à droite si c'est trouvé, à gauche pour passer.

const ROUND_SECONDS = 60;
const DECK_COLORS = ['#fde68a', '#bfdbfe', '#fecaca', '#bbf7d0', '#ddd6fe', '#fed7aa'];

type Phase = { kind: 'menu' } | { kind: 'ready'; deck: string } | { kind: 'play'; deck: string } | { kind: 'end'; deck: string };

export function Forehead({ onQuit }: { onQuit: () => void }) {
  const { t, content } = useParty();
  const [phase, setPhase] = useState<Phase>({ kind: 'menu' });
  const [words, setWords] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<{ word: string; found: boolean }[]>([]);
  const [flash, setFlash] = useState<'found' | 'pass' | null>(null);
  const { left, reset } = useCountdown(ROUND_SECONDS, phase.kind === 'play', () => {
    buzz([200, 100, 200]);
    setPhase((current) => (current.kind === 'play' ? { kind: 'end', deck: current.deck } : current));
  });

  const deckOf = (id: string) => content.forehead.find((deck) => deck.id === id) ?? content.forehead[0];

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
        <PartyHeader onQuit={onQuit} />
        <Card>
          <p className="text-sm leading-6 text-stone-500">{t('front.intro')}</p>
        </Card>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {content.forehead.map((deck, i) => (
            <button
              key={deck.id}
              type="button"
              onClick={() => setPhase({ kind: 'ready', deck: deck.id })}
              className="flex flex-col items-start rounded-3xl p-4 text-left shadow-soft transition-transform active:scale-95"
              style={{ background: `radial-gradient(circle at 20% 15%, #ffffff, ${DECK_COLORS[i % DECK_COLORS.length]})` }}
            >
              <span className="text-4xl drop-shadow">{deck.emoji}</span>
              <span className="mt-3 font-display text-lg font-bold text-stone-900">{deck.label}</span>
              <span className="text-xs font-semibold text-stone-500">{deck.words.length} ✦</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase.kind === 'ready') {
    const deck = deckOf(phase.deck);
    return (
      <div>
        <PartyHeader onQuit={onQuit} />
        <Card className="text-center">
          <p className="animate-float text-6xl">{deck.emoji}</p>
          <p className="mt-3 font-display text-2xl font-bold">{deck.label}</p>
          <p className="mt-4 text-sm leading-6 text-stone-500">
            {t('front.ready')}
            <br />
            {t('front.howto')}
          </p>
          <PrimaryButton onClick={() => start(phase.deck)} className="mt-6 w-full">
            {t('front.go')}
          </PrimaryButton>
        </Card>
      </div>
    );
  }

  if (phase.kind === 'end') {
    const score = results.filter((item) => item.found).length;
    return (
      <div>
        <PartyHeader onQuit={onQuit} />
        {score > 0 && <Confetti pieces={40} />}
        <Card className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-400">{t('front.score')}</p>
          <p className="mt-1 animate-pop font-display text-7xl font-black">{score}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-1.5">
            {results.map((item, i) => (
              <span key={i} className={`rounded-full px-3 py-1 text-xs font-semibold ${item.found ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-400 line-through'}`}>
                {item.word}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <PrimaryButton onClick={() => setPhase({ kind: 'ready', deck: phase.deck })}>{t('front.next')}</PrimaryButton>
            <SecondaryButton onClick={() => setPhase({ kind: 'menu' })}>{t('front.otherTheme')}</SecondaryButton>
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
        <span className={`font-display text-2xl font-bold tabular-nums ${left <= 10 ? 'animate-pulse text-amber-300' : ''}`}>{left}s</span>
        <button type="button" onClick={() => setPhase({ kind: 'end', deck: phase.deck })} className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
          {t('front.stop')}
        </button>
      </div>
      <div className="mx-5 mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full bg-amber-300 transition-all duration-1000 ease-linear" style={{ width: `${(left / ROUND_SECONDS) * 100}%` }} />
      </div>
      <div className="relative flex flex-1">
        <button type="button" onClick={() => answer(false)} className="flex flex-1 items-end justify-start p-5 text-left text-sm font-bold text-white/50">
          {t('front.pass')}
        </button>
        <button type="button" onClick={() => answer(true)} className="flex flex-1 items-end justify-end p-5 text-right text-sm font-bold text-white/50">
          {t('front.found')}
        </button>
        <p
          key={index}
          className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 animate-pop text-center font-display text-5xl font-black leading-tight text-white sm:text-7xl"
        >
          {words[index]}
        </p>
      </div>
    </div>
  );
}
