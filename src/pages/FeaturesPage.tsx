import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { FeatureExplorer } from '../components/FeatureExplorer';
import { BrowserFrame, PhoneFrame } from '../components/LandingVisuals';
import { Reveal } from '../components/Reveal';
import { CtaBand, PageIntro, SectionHeading } from '../components/MarketingBlocks';
import { setPublicPageMeta } from '../lib/seo';

// « Ce qui change au quotidien » : avant / avec Nourevo. Pas des avis : des situations du service,
// chacune liée à une fonctionnalité réelle (Mode Service, demandes de table, stock, rentabilité...).
const DAILY_CHANGES = [
  {
    icon: '🔔',
    before: 'Les commandes passent de main en main avant d’arriver en cuisine.',
    after: 'Les commandes arrivent directement dans le Mode Service, avec une alerte sonore.',
  },
  {
    icon: '💳',
    before: 'Vos clients attendent l’addition pour pouvoir partir.',
    after: 'Vos clients règlent depuis leur table, par carte ou à la caisse, quand ils le souhaitent.',
  },
  {
    icon: '🙋',
    before: 'On fait le tour de la salle pour savoir qui a besoin de quoi.',
    after: 'Une demande d’addition ou de serveur s’affiche aussitôt dans le Mode Service.',
  },
  {
    icon: '📦',
    before: 'Un plat épuisé est annoncé au client après sa commande.',
    after: 'Le stock se met à jour à chaque commande ; à zéro, le plat n’est plus proposé.',
  },
  {
    icon: '✏️',
    before: 'Un prix ou un plat qui change, et la carte papier est à réimprimer.',
    after: 'Vous modifiez votre carte en quelques secondes, en ligne aussitôt.',
  },
  {
    icon: '📈',
    before: 'Difficile de savoir quels plats rapportent vraiment.',
    after: 'Les plats les plus consultés, les plus commandés et leur marge, au même endroit.',
  },
];

export function FeaturesPage() {
  useEffect(() => {
    setPublicPageMeta('/fonctionnalites');
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="overflow-x-clip text-stone-900">
        <PageIntro eyebrow="Fonctionnalités" title="Tout le service, au même endroit">
          Une carte à vos couleurs pour vos clients, un espace simple pour votre équipe, et aucune commission sur vos
          ventes.
        </PageIntro>

        {/* Les deux côtés de Nourevo : l'espace restaurateur et la carte client */}
        <div className="mx-auto w-full max-w-5xl px-4 pt-10 sm:px-8">
          <div className="relative pb-10 pr-[18%] sm:pr-[14%]">
            <div className="absolute inset-x-10 top-10 h-3/4 rounded-full bg-navy-300/20 blur-3xl" />
            <BrowserFrame
              src="/images/landing/resto-dashboard.jpg"
              alt="L’espace restaurateur Nourevo : commandes du jour, chiffre d’affaires et dernières commandes"
              className="relative"
            />
            <PhoneFrame
              src="/images/landing/client-menu.jpg"
              alt="La carte client sur téléphone"
              className="absolute bottom-0 right-0 w-[30%] sm:w-[24%]"
            />
          </div>
        </div>

        <section className="mx-auto w-full max-w-7xl px-4 pt-20 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="Au quotidien" title="Ce qui change pour votre équipe">
              Moins d’allers-retours, moins de ressaisie, plus de temps pour vos clients.
            </SectionHeading>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DAILY_CHANGES.map((item, index) => (
              <Reveal key={item.icon} delayMs={(index % 3) * 80}>
                <div className="flex h-full flex-col rounded-3xl border border-stone-200/70 bg-white p-7 shadow-soft">
                  <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-2xl">
                    {item.icon}
                  </span>
                  <p className="mt-5 text-sm leading-6 text-stone-400">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">Avant · </span>
                    {item.before}
                  </p>
                  <p className="mt-3 font-display text-lg font-bold leading-snug text-stone-900">{item.after}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="explorer" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="En détail" title="Chaque fonctionnalité, en image">
              Choisissez un point de vue, puis une fonctionnalité : l’écran correspondant s’affiche.
            </SectionHeading>
          </Reveal>
          <div className="mt-10">
            <FeatureExplorer />
          </div>
          <p className="mt-8 text-center text-sm">
            <Link to="/decouvrir-dashboard" className="font-semibold text-navy-700 underline-offset-2 hover:underline">
              Voir l’espace restaurateur en détail →
            </Link>
          </p>
        </section>

        <CtaBand />
      </main>
      <SiteFooter />
    </>
  );
}
