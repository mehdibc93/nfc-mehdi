import { Confetti } from '../Confetti';
import { useState } from 'react';
import { QUIZ_QUESTIONS, type QuizQuestion } from './content';
import { Card, PartyHeader, PlayersSetup, PrimaryButton, SecondaryButton, shuffled } from './ui';

// Quiz éclair : la question s'affiche, le premier qui crie la bonne réponse marque le point.
// On révèle la réponse, puis on touche le prénom de celui qui l'a trouvée en premier.

const QUESTIONS_PER_GAME = 10;

type Asked = QuizQuestion & { order: number[] };

export function QuickQuiz({ firstName, onQuit }: { firstName: string; onQuit: () => void }) {
  const [players, setPlayers] = useState<string[] | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [questions, setQuestions] = useState<Asked[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const start = (names: string[]) => {
    setPlayers(names);
    setScores(names.map(() => 0));
    setQuestions(
      shuffled(QUIZ_QUESTIONS)
        .slice(0, QUESTIONS_PER_GAME)
        .map((question) => ({ ...question, order: shuffled([0, 1, 2, 3]) })),
    );
    setIndex(0);
    setRevealed(false);
  };

  const award = (player: number | null) => {
    if (player !== null) setScores((list) => list.map((value, i) => (i === player ? value + 1 : value)));
    setRevealed(false);
    setIndex((value) => value + 1);
  };

  const header = <PartyHeader emoji="⚡" title="Quiz éclair" onQuit={onQuit} />;

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
              {QUESTIONS_PER_GAME} questions de culture générale. <strong>Le premier qui crie la bonne réponse</strong> marque le point !
            </>
          }
        />
      </div>
    );
  }

  if (index >= questions.length) {
    const best = Math.max(...scores);
    const ranking = players.map((name, i) => ({ name, score: scores[i] })).sort((a, b) => b.score - a.score);
    return (
      <div>
        {header}
        <Card className="text-center">
          <Confetti />
          <p className="text-5xl">🏆</p>
          <p className="mt-3 font-display text-2xl font-bold">
            {ranking.filter((item) => item.score === best).map((item) => item.name).join(' et ')} {ranking.filter((item) => item.score === best).length > 1 ? 'gagnent' : 'gagne'} !
          </p>
          <ol className="mt-5 space-y-1.5 text-left">
            {ranking.map((item, i) => (
              <li key={i} className="flex justify-between rounded-2xl bg-stone-50 px-4 py-2 text-sm">
                <span className="font-semibold">
                  {i + 1}. {item.name}
                </span>
                <span className="font-bold tabular-nums">{item.score} pt{item.score > 1 ? 's' : ''}</span>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <PrimaryButton onClick={() => start(players)}>Rejouer</PrimaryButton>
            <SecondaryButton onClick={() => setPlayers(null)}>Changer les joueurs</SecondaryButton>
          </div>
        </Card>
      </div>
    );
  }

  const question = questions[index];
  return (
    <div>
      {header}
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
        Question {index + 1} / {questions.length}
      </p>
      <Card>
        <p className="font-display text-xl font-bold leading-snug">{question.q}</p>
        <div className="mt-5 grid gap-2">
          {question.order.map((option, position) => {
            const correct = option === question.answer;
            return (
              <div
                key={option}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors duration-300 ${
                  revealed ? (correct ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-stone-100 text-stone-300') : 'border-stone-200 text-stone-800'
                }`}
              >
                <span className="mr-2 text-stone-400">{'ABCD'[position]}.</span>
                {question.options[option]} {revealed && correct ? '✓' : ''}
              </div>
            );
          })}
        </div>
        {!revealed ? (
          <PrimaryButton onClick={() => setRevealed(true)} className="mt-5 w-full">
            Voir la réponse
          </PrimaryButton>
        ) : (
          <>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Qui a trouvé en premier ?</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {players.map((name, i) => (
                <button key={i} type="button" onClick={() => award(i)} className="rounded-2xl bg-amber-400 px-3 py-3 text-sm font-bold text-stone-900 active:scale-95">
                  {name} <span className="text-xs font-semibold text-stone-700">({scores[i]})</span>
                </button>
              ))}
              <button type="button" onClick={() => award(null)} className="col-span-2 rounded-2xl border border-stone-200 py-3 text-sm font-semibold text-stone-500">
                Personne
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
