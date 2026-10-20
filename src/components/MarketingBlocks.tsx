import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DEMO_HREF } from '../lib/site';
import { Reveal } from './Reveal';

// Briques partagées par les pages publiques (accueil, fonctionnalités, emporter & livraison,
// carte NFC) : titres de section, en-tête de page et bandeau d'appel à l'action.

export function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-navy-500">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-bold text-stone-900 sm:text-4xl">{title}</h2>
      {children && <p className="mt-3 text-sm leading-6 text-stone-500 sm:text-base">{children}</p>}
    </div>
  );
}

// Haut d'une page secondaire : le seul <h1> de la page.
export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <section className="relative mx-auto w-full max-w-4xl px-4 pb-4 pt-14 text-center sm:px-8 sm:pt-20">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-navy-300/15 blur-3xl" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-navy-500">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-[1.1] tracking-tight text-stone-900 sm:text-5xl">{title}</h1>
        {children && <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">{children}</p>}
      </div>
    </section>
  );
}

// Bouton « démo » : une seule apparence partout sur le site (ambre + ▶), pour qu'il se remarque à
// côté du bouton principal d'essai gratuit (bleu marine).
export function DemoButton({
  label = 'Essayer la démo',
  size = 'lg',
  className = '',
}: {
  label?: string;
  size?: 'sm' | 'lg';
  className?: string;
}) {
  return (
    <Link
      to={DEMO_HREF}
      className={`group inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-amber-300 font-bold text-amber-950 shadow-[0_10px_30px_-10px_rgba(245,158,11,0.7)] ring-1 ring-amber-400/60 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-amber-200 ${
        size === 'lg' ? 'px-7 py-4 text-sm' : 'px-4 py-2 text-sm'
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center rounded-full bg-amber-950 text-amber-300 transition-transform duration-300 group-hover:scale-110 ${
          size === 'lg' ? 'h-6 w-6 text-[10px]' : 'h-5 w-5 text-[9px]'
        }`}
      >
        ▶
      </span>
      {label}
    </Link>
  );
}

export function usePrimaryCta() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated
    ? { to: '/dashboard', label: 'Aller à mon dashboard' }
    : { to: '/inscription', label: 'Commencer l’essai gratuit' };
}

// Bandeau final : essai gratuit + démonstration.
export function CtaBand({ title = 'Et si vous découvriez Nourevo avec votre propre carte ?' }: { title?: string }) {
  const primaryCta = usePrimaryCta();
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-20 pt-24 sm:px-8 lg:px-10">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-600 via-navy-700 to-navy-900 p-10 text-center shadow-glow sm:p-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col items-center gap-5">
            <h2 className="max-w-3xl font-display text-2xl font-bold text-white sm:text-4xl">{title}</h2>
            <p className="max-w-xl text-sm text-white/80 sm:text-base">
              7 jours d’essai gratuit, ou la démonstration de notre restaurant Le Jardin Parisien.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={primaryCta.to}
                className="rounded-full bg-white px-8 py-4 text-sm font-bold text-navy-800 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
              >
                {primaryCta.label}
              </Link>
              <DemoButton label="Essayer la démo, sans inscription" />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
