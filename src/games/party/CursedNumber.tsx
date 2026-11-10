import { useState } from 'react';
import { buzz, Card, PartyHeader, PlayersSetup, PrimaryButton, SecondaryButton } from './ui';

// Le nombre maudit : un nombre secret entre 1 et 100. Chacun à son tour propose un nombre ;
// l'intervalle se resserre… et celui qui tombe sur le nombre maudit a perdu (et reçoit un gage).

const DARES = [
  'Imite un serveur qui présente le plat du jour.',
  'Raconte ton pire rendez-vous.',
  'Fais un compliment sincère à chaque personne de la table.',
  'Parle avec un accent pendant le prochain tour.',
  'Chante le refrain d’une chanson choisie par la table.',
  'Dis ce que tu commanderais si tout était gratuit.',
  'Raconte ton souvenir d’enfance le plus gênant.',
  'Fais deviner un film en mime, sans parler.',
  'Choisis qui commande le dessert pour toute la table.',
  'Raconte une anecdote que personne à la table ne connaît.',
];

export function CursedNumber({ firstName, onQuit }: { firstName: string; onQuit: () => void }) {
  const [players, setPlayers] = useState<string[] | null>(null);
  const [secret, setSecret] = useState(0);
  const [low, setLow] = useState(1);
  const [high, setHigh] = useState(100);
  const [turn, setTurn] = useState(0);
  const [guess, setGuess] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [loser, setLoser] = useState<number | null>(null);
  const [dare, setDare] = useState('');

  const start = (names: string[]) => {
    setPlayers(names);
    setSecret(1 + Math.floor(Math.random() * 100));
    setLow(1);
    setHigh(100);
    setTurn(Math.floor(Math.random() * names.length));
    setGuess('');
    setHint(null);
    setLoser(null);
  };

  const header = <PartyHeader emoji="🔮" title="Le nombre maudit" onQuit={onQuit} />;

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
              Un nombre maudit se cache entre 1 et 100. Chacun propose un nombre à son tour, l’intervalle se resserre… <strong>Celui qui tombe dessus a perdu</strong> et reçoit un gage !
            </>
          }
        />
      </div>
    );
  }

  if (loser !== null) {
    return (
      <div>
        {header}
        <Card className="text-center">
          <p className="animate-pop text-6xl">😱</p>
          <p className="mt-3 font-display text-2xl font-bold">{players[loser]} est tombé sur le {secret} !</p>
          <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Ton gage</p>
            <p className="mt-1 font-semibold text-stone-900">{dare}</p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <PrimaryButton onClick={() => start(players)}>Rejouer</PrimaryButton>
            <SecondaryButton onClick={() => setPlayers(null)}>Changer les joueurs</SecondaryButton>
          </div>
        </Card>
      </div>
    );
  }

  const value = Number(guess);
  const valid = Number.isInteger(value) && value >= low && value <= high && guess !== '';

  const submit = () => {
    if (!valid) return;
    if (value === secret) {
      buzz([200, 80, 200]);
      setDare(DARES[Math.floor(Math.random() * DARES.length)]);
      setLoser(turn);
      return;
    }
    buzz(30);
    if (value < secret) {
      setLow(value + 1);
      setHint(`${value}, c’est trop petit !`);
    } else {
      setHigh(value - 1);
      setHint(`${value}, c’est trop grand !`);
    }
    setGuess('');
    setTurn((turn + 1) % players.length);
  };

  return (
    <div>
      {header}
      <Card className="text-center">
        <p className="text-sm font-semibold text-stone-500">À {players[turn]} de choisir</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Le nombre maudit est entre</p>
        <p className="mt-1 font-display text-5xl font-black tabular-nums">
          {low} <span className="text-stone-300">et</span> {high}
        </p>
        {hint && <p className="mt-3 text-sm font-semibold text-amber-700">{hint}</p>}
        <input
          type="number"
          inputMode="numeric"
          value={guess}
          onChange={(event) => setGuess(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && submit()}
          placeholder={`${low} – ${high}`}
          className="mt-5 w-full rounded-2xl border border-stone-200 px-4 py-4 text-center font-display text-3xl font-bold outline-none focus:border-navy-300"
        />
        <PrimaryButton onClick={submit} disabled={!valid} className="mt-3 w-full">
          Je tente ma chance
        </PrimaryButton>
      </Card>
    </div>
  );
}
