import { Confetti } from '../Confetti';
import { useState } from 'react';
import { LETTER_RUSH_CATEGORIES, LETTER_RUSH_LETTERS } from './content';
import { buzz, Card, PartyHeader, PlayersSetup, pick, PrimaryButton, SecondaryButton, TimerBadge, useCountdown } from './ui';

// Petit bac express : à tour de rôle, une lettre et une catégorie s'affichent ; le joueur a
// quelques secondes pour donner un mot à voix haute. La table juge. Trois ratés et on est éliminé.

const TURN_SECONDS = 8;
const LIVES = 3;

type Turn = { player: number; letter: string; category: string };

export function LetterRush({ firstName, onQuit }: { firstName: string; onQuit: () => void }) {
  const [players, setPlayers] = useState<string[] | null>(null);
  const [lives, setLives] = useState<number[]>([]);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [running, setRunning] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);

  const nextAlive = (from: number, livesNow: number[]) => {
    let index = from;
    for (let i = 0; i < livesNow.length; i += 1) {
      index = (index + 1) % livesNow.length;
      if (livesNow[index] > 0) return index;
    }
    return from;
  };

  const newTurn = (player: number) => {
    setTurn({ player, letter: pick(LETTER_RUSH_LETTERS), category: pick(LETTER_RUSH_CATEGORIES) });
    reset();
    setRunning(false);
  };

  const resolve = (found: boolean) => {
    if (!turn || !players) return;
    setRunning(false);
    const livesNow = found ? lives : lives.map((value, index) => (index === turn.player ? value - 1 : value));
    if (!found) buzz([100, 50, 100]);
    setLives(livesNow);
    const alive = livesNow.filter((value) => value > 0).length;
    if (alive <= 1) {
      setWinner(livesNow.findIndex((value) => value > 0));
      return;
    }
    newTurn(nextAlive(turn.player, livesNow));
  };

  const { left, reset } = useCountdown(TURN_SECONDS, running, () => resolve(false));

  const start = (names: string[]) => {
    setPlayers(names);
    setLives(names.map(() => LIVES));
    setWinner(null);
    newTurn(Math.floor(Math.random() * names.length));
  };

  const header = <PartyHeader emoji="🔤" title="Petit bac express" onQuit={onQuit} />;

  if (!players || !turn) {
    return (
      <div>
        {header}
        <PlayersSetup
          min={2}
          max={10}
          firstName={firstName}
          onStart={start}
          intro={
            <>
              Une lettre, une catégorie, <strong>{TURN_SECONDS} secondes</strong> pour répondre à voix haute. La table juge si c’est bon. 3 ratés et c’est fini !
            </>
          }
        />
      </div>
    );
  }

  if (winner !== null) {
    return (
      <div>
        {header}
        <Card className="text-center">
          <Confetti />
          <p className="text-5xl">🏆</p>
          <p className="mt-3 font-display text-2xl font-bold">{players[winner]} gagne !</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <PrimaryButton onClick={() => start(players)}>Rejouer</PrimaryButton>
            <SecondaryButton onClick={() => setPlayers(null)}>Changer les joueurs</SecondaryButton>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {header}
      <div className="mb-4 flex flex-wrap justify-center gap-1.5">
        {players.map((name, index) => (
          <span
            key={index}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              lives[index] <= 0 ? 'bg-stone-100 text-stone-300 line-through' : index === turn.player ? 'bg-stone-900 text-white' : 'bg-white text-stone-600'
            }`}
          >
            {name} {lives[index] > 0 ? '❤️'.repeat(lives[index]) : ''}
          </span>
        ))}
      </div>
      <Card className="text-center">
        <p className="text-sm font-semibold text-stone-500">À {players[turn.player]} !</p>
        <p className="mt-3 font-display text-8xl font-black leading-none text-navy-700">{turn.letter}</p>
        <p className="mt-3 font-display text-2xl font-bold">{turn.category}</p>
        <div className="mt-5">
          {running ? (
            <>
              <TimerBadge left={left} total={TURN_SECONDS} />
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => resolve(false)} className="rounded-full bg-red-100 py-3.5 text-sm font-bold text-red-700 active:scale-95">
                  ✗ Raté
                </button>
                <button type="button" onClick={() => resolve(true)} className="rounded-full bg-emerald-500 py-3.5 text-sm font-bold text-white active:scale-95">
                  ✓ Validé
                </button>
              </div>
            </>
          ) : (
            <PrimaryButton onClick={() => setRunning(true)} className="w-full">
              Lancer le chrono
            </PrimaryButton>
          )}
        </div>
      </Card>
    </div>
  );
}
