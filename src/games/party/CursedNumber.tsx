import { useState } from 'react';
import { useParty } from './i18n';
import { Avatar, buzz, Card, PartyHeader, pick, PlayersSetup, PrimaryButton, SecondaryButton } from './ui';

// Le nombre maudit : un nombre secret entre 1 et 100. Chacun à son tour propose un nombre ;
// l'intervalle se resserre… et celui qui tombe sur le nombre maudit a perdu (et reçoit un gage).

export function CursedNumber({ firstName, onQuit }: { firstName: string; onQuit: () => void }) {
  const { t, content } = useParty();
  const [players, setPlayers] = useState<string[] | null>(null);
  const [secret, setSecret] = useState(0);
  const [low, setLow] = useState(1);
  const [high, setHigh] = useState(100);
  const [turn, setTurn] = useState(0);
  const [guess, setGuess] = useState('');
  const [hint, setHint] = useState<{ text: string; up: boolean } | null>(null);
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

  const header = <PartyHeader onQuit={onQuit} />;

  if (!players) {
    return (
      <div>
        {header}
        <PlayersSetup min={2} max={10} firstName={firstName} onStart={start} intro={t('cursed.intro')} />
      </div>
    );
  }

  if (loser !== null) {
    return (
      <div>
        {header}
        <Card className="text-center">
          <p className="animate-pop text-7xl">😱</p>
          <p className="mt-3 font-display text-2xl font-bold">{t('cursed.fell', { name: players[loser], n: secret })}</p>
          <div className="mt-5 rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 px-5 py-5 text-white shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{t('cursed.dare')}</p>
            <p className="mt-2 font-display text-lg font-bold">{dare}</p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <PrimaryButton onClick={() => start(players)}>{t('replay')}</PrimaryButton>
            <SecondaryButton onClick={() => setPlayers(null)}>{t('changePlayers')}</SecondaryButton>
          </div>
        </Card>
      </div>
    );
  }

  const value = Number(guess);
  const valid = Number.isInteger(value) && value >= low && value <= high && guess !== '';
  // Part de l'intervalle restant, pour la jauge de tension.
  const danger = 1 - (high - low) / 99;

  const submit = () => {
    if (!valid) return;
    if (value === secret) {
      buzz([200, 80, 200]);
      setDare(pick(content.dares));
      setLoser(turn);
      return;
    }
    buzz(30);
    if (value < secret) {
      setLow(value + 1);
      setHint({ text: t('cursed.small', { n: value }), up: true });
    } else {
      setHigh(value - 1);
      setHint({ text: t('cursed.big', { n: value }), up: false });
    }
    setGuess('');
    setTurn((turn + 1) % players.length);
  };

  return (
    <div>
      {header}
      <Card className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Avatar index={turn} name={players[turn]} size="sm" />
          <p className="text-sm font-semibold text-stone-600">{t('cursed.turn', { name: players[turn] })}</p>
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{t('cursed.between')}</p>
        <p className="mt-1 font-display text-5xl font-black tabular-nums">
          {low} <span className="text-2xl text-stone-300">{t('cursed.and')}</span> {high}
        </p>
        <div className="mx-auto mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-stone-100">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-red-500 transition-all duration-500" style={{ width: `${Math.max(4, danger * 100)}%` }} />
        </div>
        {hint && (
          <p key={hint.text} className="mt-3 animate-pop text-sm font-bold text-violet-700">
            {hint.up ? '⬆️' : '⬇️'} {hint.text}
          </p>
        )}
        <input
          type="number"
          inputMode="numeric"
          value={guess}
          onChange={(event) => setGuess(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && submit()}
          placeholder={`${low} – ${high}`}
          className="mt-5 w-full rounded-2xl border-2 border-stone-200 px-4 py-4 text-center font-display text-3xl font-bold outline-none focus:border-violet-400"
        />
        <PrimaryButton onClick={submit} disabled={!valid} className="mt-3 w-full">
          {t('cursed.try')}
        </PrimaryButton>
      </Card>
    </div>
  );
}
