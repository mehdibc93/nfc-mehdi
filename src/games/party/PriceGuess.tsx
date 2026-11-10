import { useState } from 'react';
import { money } from '../../lib/format';
import { Confetti } from '../Confetti';
import { useParty } from './i18n';
import type { PartyDish } from './types';
import { Card, PartyHeader, PlayerPicker, PlayersSetup, PrimaryButton, ProgressBar, Scoreboard, SecondaryButton, shuffled } from './ui';

// Devine le prix : un plat de la carte du restaurant s'affiche, chacun annonce son prix à voix
// haute, puis on révèle le vrai. Le plus proche marque le point. Fait découvrir la carte !

const ROUNDS = 8;

export function PriceGuess({ firstName, dishes, onQuit }: { firstName: string; dishes: PartyDish[]; onQuit: () => void }) {
  const { t } = useParty();
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

  const award = (player: number) => {
    setScores((list) => list.map((value, i) => (i === player ? value + 1 : value)));
    setRevealed(false);
    setIndex((value) => value + 1);
  };

  const header = <PartyHeader onQuit={onQuit} />;

  if (!players) {
    return (
      <div>
        {header}
        <PlayersSetup min={2} max={10} firstName={firstName} onStart={start} intro={t('price.intro')} />
      </div>
    );
  }

  if (index >= rounds.length) {
    const best = Math.max(...scores);
    const winners = players.filter((_, i) => scores[i] === best);
    return (
      <div>
        {header}
        <Confetti />
        <Card className="text-center">
          <p className="animate-pop text-6xl">🏆</p>
          <p className="mt-3 font-display text-2xl font-bold">
            {winners.length > 1 ? t('winMany', { names: winners.join(t('and')) }) : t('wins', { name: winners[0] })}
          </p>
          <p className="mt-1 text-sm text-stone-500">{t('price.pro')}</p>
          <Scoreboard players={players} scores={scores} />
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <PrimaryButton onClick={() => start(players)}>{t('replay')}</PrimaryButton>
            <SecondaryButton onClick={() => setPlayers(null)}>{t('changePlayers')}</SecondaryButton>
          </div>
        </Card>
      </div>
    );
  }

  const dish = rounds[index];
  return (
    <div>
      {header}
      <ProgressBar value={index + 1} total={rounds.length} label={t('price.dish', { n: index + 1, total: rounds.length })} />
      <Card className="overflow-hidden p-0 text-center">
        {dish.image ? (
          <img key={dish.name} src={dish.image} alt="" className="h-52 w-full animate-fadeIn object-cover" />
        ) : (
          <div className="flex h-32 items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 text-6xl">🍽️</div>
        )}
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{dish.category}</p>
          <p className="mt-1 font-display text-2xl font-bold">{dish.name}</p>
          <div className="mx-auto mt-5 flex h-20 max-w-[14rem] items-center justify-center rounded-3xl border-2 border-dashed border-stone-200">
            {revealed ? (
              <p className="animate-pop font-display text-5xl font-black text-emerald-600">{money(dish.price)}</p>
            ) : (
              <p className="font-display text-5xl font-black text-stone-200">? €</p>
            )}
          </div>
          {!revealed ? (
            <PrimaryButton onClick={() => setRevealed(true)} className="mt-5 w-full">
              {t('price.reveal')}
            </PrimaryButton>
          ) : (
            <>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{t('price.who')}</p>
              <PlayerPicker players={players} scores={scores} onPick={award} />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
