import { useState } from 'react';
import { money } from '../../lib/format';
import type { PartyDish } from './types';
import { Card, PartyHeader, PlayersSetup, PrimaryButton, SecondaryButton, shuffled } from './ui';

// Devine le prix : un plat de la carte du restaurant s'affiche, chacun annonce son prix à voix
// haute, puis on révèle le vrai. Le plus proche marque le point. Fait découvrir la carte !

const ROUNDS = 8;

export function PriceGuess({ firstName, dishes, onQuit }: { firstName: string; dishes: PartyDish[]; onQuit: () => void }) {
  const [players, setPlayers] = useState<string[] | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [rounds, setRounds] = useState<PartyDish[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const start = (names: string[]) => {
    setPlayers(names);
    setScores(names.map(() => 0));
    setRounds(shuffled(dishes.filter((dish) => dish.price > 0)).slice(0, ROUNDS));
    setIndex(0);
    setRevealed(false);
  };

  const award = (player: number | null) => {
    if (player !== null) setScores((list) => list.map((value, i) => (i === player ? value + 1 : value)));
    setRevealed(false);
    setIndex((value) => value + 1);
  };

  const header = <PartyHeader emoji="🏷️" title="Devine le prix" onQuit={onQuit} />;

  if (!players) {
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
              Un plat de la carte s’affiche : chacun annonce son prix à voix haute. <strong>Le plus proche du vrai prix</strong> marque le point !
            </>
          }
        />
      </div>
    );
  }

  if (index >= rounds.length) {
    const best = Math.max(...scores);
    const winners = players.filter((_, i) => scores[i] === best);
    return (
      <div>
        {header}
        <Card className="text-center">
          <p className="text-5xl">🏆</p>
          <p className="mt-3 font-display text-2xl font-bold">
            {winners.join(' et ')} {winners.length > 1 ? 'gagnent' : 'gagne'} !
          </p>
          <p className="mt-2 text-sm text-stone-500">Un vrai pro de la carte 😄</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <PrimaryButton onClick={() => start(players)}>Rejouer</PrimaryButton>
            <SecondaryButton onClick={() => setPlayers(null)}>Changer les joueurs</SecondaryButton>
          </div>
        </Card>
      </div>
    );
  }

  const dish = rounds[index];
  return (
    <div>
      {header}
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
        Plat {index + 1} / {rounds.length}
      </p>
      <Card className="overflow-hidden p-0 text-center">
        {dish.image && <img src={dish.image} alt="" className="h-48 w-full object-cover" />}
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{dish.category}</p>
          <p className="mt-1 font-display text-2xl font-bold">{dish.name}</p>
          <div className="mt-5 h-16">
            {revealed ? (
              <p className="animate-pop font-display text-5xl font-black text-emerald-600">{money(dish.price)}</p>
            ) : (
              <p className="font-display text-5xl font-black text-stone-200">? €</p>
            )}
          </div>
          {!revealed ? (
            <PrimaryButton onClick={() => setRevealed(true)} className="mt-4 w-full">
              Tout le monde a parlé ? Révéler
            </PrimaryButton>
          ) : (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Qui était le plus proche ?</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {players.map((name, i) => (
                  <button key={i} type="button" onClick={() => award(i)} className="rounded-2xl bg-amber-400 px-3 py-3 text-sm font-bold text-stone-900 active:scale-95">
                    {name} <span className="text-xs font-semibold text-stone-700">({scores[i]})</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
