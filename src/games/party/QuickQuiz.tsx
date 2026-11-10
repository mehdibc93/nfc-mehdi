import { useState } from 'react';
import { Confetti } from '../Confetti';
import type { QuizQuestion } from './content';
import { useParty } from './i18n';
import { Card, PartyHeader, PlayerPicker, PlayersSetup, PrimaryButton, ProgressBar, Scoreboard, SecondaryButton, shuffled } from './ui';

// Quiz éclair : la question s'affiche, le premier qui crie la bonne réponse marque le point.
// On révèle la réponse, puis on touche le prénom de celui qui l'a trouvée en premier.

const QUESTIONS_PER_GAME = 10;
const OPTION_COLORS = ['#e5383b', '#1e6fd9', '#f2b705', '#2a9d4b'];

type Asked = QuizQuestion & { order: number[] };

export function QuickQuiz({ firstName, onQuit }: { firstName: string; onQuit: () => void }) {
  const { t, content } = useParty();
  const [players, setPlayers] = useState<string[] | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [questions, setQuestions] = useState<Asked[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const start = (names: string[]) => {
    setPlayers(names);
    setScores(names.map(() => 0));
    setQuestions(
      shuffled(content.quiz)
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

  const header = <PartyHeader onQuit={onQuit} />;

  if (!players) {
    return (
      <div>
        {header}
        <PlayersSetup min={2} max={10} firstName={firstName} onStart={start} intro={t('quiz.intro', { n: QUESTIONS_PER_GAME })} />
      </div>
    );
  }

  if (index >= questions.length) {
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
          <Scoreboard players={players} scores={scores} />
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <PrimaryButton onClick={() => start(players)}>{t('replay')}</PrimaryButton>
            <SecondaryButton onClick={() => setPlayers(null)}>{t('changePlayers')}</SecondaryButton>
          </div>
        </Card>
      </div>
    );
  }

  const question = questions[index];
  return (
    <div>
      {header}
      <ProgressBar value={index + 1} total={questions.length} label={t('quiz.question', { n: index + 1, total: questions.length })} />
      <Card>
        <p key={index} className="animate-fadeIn font-display text-xl font-bold leading-snug">
          {question.q}
        </p>
        <div className="mt-5 grid gap-2">
          {question.order.map((option, position) => {
            const correct = option === question.answer;
            return (
              <div
                key={option}
                className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  revealed ? (correct ? 'scale-[1.02] border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-stone-100 text-stone-300') : 'border-stone-200 text-stone-800'
                }`}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-display text-sm font-black text-white transition-opacity"
                  style={{ background: OPTION_COLORS[position], opacity: revealed && !correct ? 0.3 : 1 }}
                >
                  {'ABCD'[position]}
                </span>
                <span className="min-w-0 flex-1">{question.options[option]}</span>
                {revealed && correct && <span className="animate-pop text-lg">✓</span>}
              </div>
            );
          })}
        </div>
        {!revealed ? (
          <PrimaryButton onClick={() => setRevealed(true)} className="mt-5 w-full">
            {t('quiz.reveal')}
          </PrimaryButton>
        ) : (
          <>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{t('quiz.who')}</p>
            <PlayerPicker players={players} scores={scores} onPick={award} />
            <button type="button" onClick={() => award(null)} className="mt-2 w-full rounded-2xl border border-stone-200 py-3 text-sm font-semibold text-stone-500">
              {t('nobody')}
            </button>
          </>
        )}
      </Card>
    </div>
  );
}
