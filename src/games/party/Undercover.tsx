import { useState } from 'react';
import { Confetti } from '../Confetti';
import { useParty } from './i18n';
import { Avatar, Card, PartyHeader, PlayersSetup, pick, PrimaryButton, SecondaryButton } from './ui';

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
  const { t, content } = useParty();
  const [game, setGame] = useState<Game | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'setup' });

  const start = (players: string[]) => {
    const pair = pick(content.undercover);
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

  const header = <PartyHeader onQuit={onQuit} />;

  if (phase.kind === 'setup' || !game) {
    return (
      <div>
        {header}
        <PlayersSetup min={3} max={10} firstName={firstName} onStart={start} intro={t('uc.intro')} />
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
        <div className="mb-3 flex justify-center gap-1.5">
          {game.players.map((_, i) => (
            <span key={i} className={`h-2 rounded-full transition-all ${i === phase.index ? 'w-6 bg-violet-500' : i < phase.index ? 'w-2 bg-violet-300' : 'w-2 bg-stone-200'}`} />
          ))}
        </div>
        <Card className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{t('uc.playerOf', { n: phase.index + 1, total: game.players.length })}</p>
          {!phase.revealed ? (
            <>
              <div className="mt-4 flex justify-center">
                <Avatar index={phase.index} name={name} />
              </div>
              <p className="mt-3 font-display text-2xl font-bold">{t('uc.handTo', { name })}</p>
              <p className="mt-2 text-sm text-stone-500">{t('uc.noPeek')}</p>
              <PrimaryButton onClick={() => setPhase({ ...phase, revealed: true })} className="mt-6 w-full">
                {t('uc.reveal', { name })}
              </PrimaryButton>
            </>
          ) : (
            <>
              <div className="mx-auto mt-4 flex h-44 w-full max-w-[16rem] animate-pop flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-800 p-5 text-white shadow-card">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{t('uc.yourWord')}</p>
                <p className="mt-2 font-display text-4xl font-black">{game.words[phase.index]}</p>
              </div>
              <p className="mt-3 text-xs text-stone-400">{t('uc.remember')}</p>
              <PrimaryButton onClick={next} className="mt-5 w-full">
                {t('uc.hide')}
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
          <p className="font-display text-xl font-bold">{t('uc.talkTitle')}</p>
          <p className="mt-2 text-sm leading-6 text-stone-500">{t('uc.talk', { name: game.players[starter] })}</p>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{t('uc.vote')}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {game.players.map((name, index) => (
              <button
                key={index}
                type="button"
                disabled={!game.alive[index]}
                onClick={() => {
                  const alive = game.alive.map((value, i) => (i === index ? false : value));
                  setGame({ ...game, alive, starter: (index + 1) % game.players.length });
                  setPhase({ kind: 'eliminated', index });
                }}
                className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2.5 text-left text-sm font-bold text-stone-800 transition-transform active:scale-95 disabled:border-transparent disabled:bg-stone-50 disabled:text-stone-300 disabled:line-through"
              >
                <Avatar index={index} name={name} size="sm" />
                <span className="min-w-0 truncate">{name}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (phase.kind === 'eliminated') {
    const caught = phase.index === game.undercover;
    const undercoverWins = !caught && aliveCount <= 2;
    const name = game.players[phase.index];
    return (
      <div>
        {header}
        <Card className="text-center">
          <p className="animate-pop text-6xl">{caught ? '🎯' : '😬'}</p>
          <p className="mt-3 font-display text-2xl font-bold">{caught ? t('uc.was', { name }) : t('uc.wasNot', { name })}</p>
          {!caught && !undercoverWins && <p className="mt-2 text-sm text-stone-500">{t('uc.still')}</p>}
          <PrimaryButton
            onClick={() => (caught || undercoverWins ? setPhase({ kind: 'end', undercoverWins }) : setPhase({ kind: 'talk' }))}
            className="mt-6 w-full"
          >
            {caught || undercoverWins ? t('uc.result') : t('uc.nextRound')}
          </PrimaryButton>
        </Card>
      </div>
    );
  }

  const civilianWord = game.words[(game.undercover + 1) % game.players.length];
  return (
    <div>
      {header}
      <Confetti />
      <Card className="text-center">
        <p className="animate-pop text-6xl">{phase.undercoverWins ? '🕵️' : '🎉'}</p>
        <p className="mt-3 font-display text-2xl font-bold">
          {phase.undercoverWins ? t('uc.ucWins', { name: game.players[game.undercover] }) : t('uc.tableWins')}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-stone-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-stone-400">{t('uc.tableWord')}</p>
            <p className="mt-1 font-display text-lg font-bold">{civilianWord}</p>
          </div>
          <div className="rounded-2xl bg-violet-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-violet-500">{t('uc.ucWord')}</p>
            <p className="mt-1 font-display text-lg font-bold text-violet-800">{game.words[game.undercover]}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <PrimaryButton onClick={() => start(game.players)}>{t('replay')}</PrimaryButton>
          <SecondaryButton onClick={() => setPhase({ kind: 'setup' })}>{t('changePlayers')}</SecondaryButton>
        </div>
      </Card>
    </div>
  );
}
