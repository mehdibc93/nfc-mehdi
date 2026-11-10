import { useState } from 'react';
import { UNDERCOVER_PAIRS } from './content';
import { Card, PartyHeader, PlayersSetup, pick, PrimaryButton, SecondaryButton } from './ui';

// Undercover : tout le monde reçoit le même mot, sauf un joueur qui en a un proche. Chacun décrit
// son mot en un mot, puis la table vote pour éliminer celui qu'elle soupçonne. L'undercover gagne
// s'il reste parmi les deux derniers joueurs.

type Game = {
  players: string[];
  words: string[];
  undercover: number;
  alive: boolean[];
  starter: number;
};

type Phase =
  | { kind: 'setup' }
  | { kind: 'handoff'; index: number; revealed: boolean }
  | { kind: 'talk' }
  | { kind: 'eliminated'; index: number }
  | { kind: 'end'; undercoverWins: boolean };

export function Undercover({ firstName, onQuit }: { firstName: string; onQuit: () => void }) {
  const [game, setGame] = useState<Game | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'setup' });

  const start = (players: string[]) => {
    const pair = pick(UNDERCOVER_PAIRS);
    const flip = Math.random() < 0.5;
    const civilian = flip ? pair[0] : pair[1];
    const secret = flip ? pair[1] : pair[0];
    const undercover = Math.floor(Math.random() * players.length);
    setGame({
      players,
      words: players.map((_, index) => (index === undercover ? secret : civilian)),
      undercover,
      alive: players.map(() => true),
      starter: Math.floor(Math.random() * players.length),
    });
    setPhase({ kind: 'handoff', index: 0, revealed: false });
  };

  const header = <PartyHeader emoji="🕵️" title="Undercover" onQuit={onQuit} />;

  if (phase.kind === 'setup' || !game) {
    return (
      <div>
        {header}
        <PlayersSetup
          min={3}
          max={10}
          firstName={firstName}
          onStart={start}
          intro={
            <>
              Tout le monde reçoit <strong>le même mot secret… sauf un</strong>, l’undercover, qui a un mot proche. Décrivez votre mot à tour de rôle, puis votez pour démasquer l’intrus !
            </>
          }
        />
      </div>
    );
  }

  const aliveCount = game.alive.filter(Boolean).length;

  if (phase.kind === 'handoff') {
    const name = game.players[phase.index];
    const next = () =>
      phase.index + 1 < game.players.length ? setPhase({ kind: 'handoff', index: phase.index + 1, revealed: false }) : setPhase({ kind: 'talk' });
    return (
      <div>
        {header}
        <Card className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
            Joueur {phase.index + 1} / {game.players.length}
          </p>
          {!phase.revealed ? (
            <>
              <p className="mt-4 font-display text-2xl font-bold">Passe le téléphone à {name}</p>
              <p className="mt-2 text-sm text-stone-500">Les autres, ne regardez pas ! 🙈</p>
              <PrimaryButton onClick={() => setPhase({ ...phase, revealed: true })} className="mt-6 w-full">
                Je suis {name}, voir mon mot
              </PrimaryButton>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm text-stone-500">Ton mot secret :</p>
              <p className="mt-2 font-display text-4xl font-black">{game.words[phase.index]}</p>
              <p className="mt-3 text-xs text-stone-400">Retiens-le bien, sans réagir.</p>
              <PrimaryButton onClick={next} className="mt-6 w-full">
                C’est retenu, cacher
              </PrimaryButton>
            </>
          )}
        </Card>
      </div>
    );
  }

  if (phase.kind === 'talk') {
    let starter = game.starter;
    while (!game.alive[starter]) starter = (starter + 1) % game.players.length;
    return (
      <div>
        {header}
        <Card>
          <p className="font-display text-xl font-bold">À vous de parler 🗣️</p>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Chacun à son tour dit <strong>un seul mot</strong> pour décrire son mot secret, en commençant par <strong>{game.players[starter]}</strong>. Ni trop précis, ni trop vague ! Puis votez : qui est l’undercover ?
          </p>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Qui éliminez-vous ?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {game.players.map((name, index) =>
              game.alive[index] ? (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    const alive = game.alive.map((value, i) => (i === index ? false : value));
                    setGame({ ...game, alive, starter: (index + 1) % game.players.length });
                    setPhase({ kind: 'eliminated', index });
                  }}
                  className="rounded-2xl border border-stone-200 bg-white px-3 py-3 text-sm font-bold text-stone-800 transition-transform active:scale-95"
                >
                  {name}
                </button>
              ) : null,
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (phase.kind === 'eliminated') {
    const caught = phase.index === game.undercover;
    const undercoverWins = !caught && aliveCount <= 2;
    return (
      <div>
        {header}
        <Card className="text-center">
          <p className="text-5xl">{caught ? '🎯' : '😬'}</p>
          <p className="mt-3 font-display text-2xl font-bold">
            {game.players[phase.index]} {caught ? 'était l’undercover !' : 'n’était pas l’undercover…'}
          </p>
          {!caught && !undercoverWins && <p className="mt-2 text-sm text-stone-500">L’intrus court toujours. Un nouveau tour de parole !</p>}
          <PrimaryButton
            onClick={() => (caught || undercoverWins ? setPhase({ kind: 'end', undercoverWins }) : setPhase({ kind: 'talk' }))}
            className="mt-6 w-full"
          >
            {caught || undercoverWins ? 'Voir le résultat' : 'Tour suivant'}
          </PrimaryButton>
        </Card>
      </div>
    );
  }

  const civilianWord = game.words[(game.undercover + 1) % game.players.length];
  return (
    <div>
      {header}
      <Card className="text-center">
        <p className="text-5xl">{phase.undercoverWins ? '🕵️' : '🎉'}</p>
        <p className="mt-3 font-display text-2xl font-bold">
          {phase.undercoverWins ? `${game.players[game.undercover]}, l’undercover, a gagné !` : 'La table a démasqué l’intrus !'}
        </p>
        <p className="mt-4 text-sm text-stone-500">
          Mot de la table : <strong className="text-stone-900">{civilianWord}</strong>
          <br />
          Mot de l’undercover : <strong className="text-stone-900">{game.words[game.undercover]}</strong>
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <PrimaryButton onClick={() => start(game.players)}>Rejouer</PrimaryButton>
          <SecondaryButton onClick={() => setPhase({ kind: 'setup' })}>Changer les joueurs</SecondaryButton>
        </div>
      </Card>
    </div>
  );
}
