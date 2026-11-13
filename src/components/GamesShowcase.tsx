import { Link } from 'react-router-dom';
import { PhoneFrame } from './LandingVisuals';
import { Reveal } from './Reveal';

// Présentation de la salle de jeux sur le site public (accueil, Fonctionnalités). Uniquement des
// fonctionnalités réelles, montrées avec de vraies captures de la carte de démonstration.

const POINTS = [
  {
    icon: '👥',
    title: 'Entre amis, à la même table',
    text: 'Un seul téléphone pour toute la table : Tu préfères ?, Undercover, quiz, Qui paie ?, Devine le prix avec les plats de votre carte… 11 jeux d’ambiance.',
  },
  {
    icon: '🎯',
    title: 'Contre les autres tables',
    text: 'Un client défie la table 7 aux cartes ou au billard. Le défi s’affiche sur leur téléphone, et chacun joue depuis le sien.',
  },
  {
    icon: '⏳',
    title: 'Avant et pendant le repas',
    text: 'Accessible dès l’ouverture de la carte pour ceux qui attendent leurs amis, puis pendant la préparation des plats.',
  },
  {
    icon: '🎛️',
    title: 'Vous gardez la main',
    text: 'Activez ou masquez chaque jeu depuis votre espace, et voyez combien de clients y jouent.',
  },
];

export function GamesShowcase({ compact = false }: { compact?: boolean }) {
  const points = compact ? POINTS.slice(0, 3) : POINTS;
  return (
    <section id="jeux" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 pt-24 sm:px-8 lg:px-10">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[radial-gradient(circle_at_15%_10%,#2b4266,#111e30_60%,#0a1220)] px-6 py-12 text-white shadow-card sm:px-10 lg:px-14 lg:py-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />

        <div className="relative grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-stone-900">
                🎮 Nouveau · Salle de jeux
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">L’attente devient un moment partagé</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/75">
                Vos clients jouent ensemble en attendant leurs amis ou leurs plats : entre eux, à leur table, ou en défiant
                les autres tables du restaurant. De quoi rire, faire connaissance et ne pas voir le temps passer.
              </p>
            </Reveal>

            <div className={`mt-8 grid gap-3 ${compact ? '' : 'sm:grid-cols-2'}`}>
              {points.map((point, index) => (
                <Reveal key={point.title} delayMs={index * 70}>
                  <div className="flex h-full gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                    <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
                      {point.icon}
                    </span>
                    <div>
                      <p className="font-display font-bold">{point.title}</p>
                      <p className="mt-1 text-sm leading-6 text-white/70">{point.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <p className="mt-6 text-xs text-white/50">Sans application · En français, anglais et chinois · Inclus dans l’abonnement</p>
            {compact && (
              <Link
                to="/fonctionnalites#jeux"
                className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-stone-900 transition-transform duration-300 hover:-translate-y-0.5"
              >
                Découvrir la salle de jeux →
              </Link>
            )}
          </div>

          {/* Trois vraies captures, en éventail. */}
          <Reveal delayMs={120}>
            <div className="relative mx-auto flex h-[340px] w-full max-w-md items-center justify-center sm:h-[520px]">
              <PhoneFrame
                src="/images/landing/jeux-dilemme.jpg"
                alt="Le jeu « Tu préfères ? » : deux choix, la table vote"
                className="absolute left-0 top-10 w-[38%] -rotate-[10deg] opacity-90"
              />
              <PhoneFrame
                src="/images/landing/jeux-cartes.jpg"
                alt="Le jeu de cartes Couleurs, contre deux robots"
                className="absolute right-0 top-10 w-[38%] rotate-[10deg] opacity-90"
              />
              <PhoneFrame
                src="/images/landing/jeux-salle.jpg"
                alt="La salle de jeux sur la carte du restaurant"
                className="relative z-10 w-[46%] shadow-2xl"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
