import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { setPublicPageMeta } from '../lib/seo';
import { PLANS } from '../lib/plans';
import { FAQ_ITEMS } from '../lib/faq';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { PhoneFrame } from '../components/LandingVisuals';
import { Reveal } from '../components/Reveal';
import { CtaBand, DemoButton, PageIntro, SectionHeading, usePrimaryCta } from '../components/MarketingBlocks';

// Prix ramené à la journée (12 mois / 365 jours), pour rendre le coût concret.
const PER_DAY: Record<string, string> = {
  monthly: '1,94 €',
  annual_monthly: '1,78 €',
  annual_upfront: '1,61 €',
};

const INCLUDED = [
  { icon: '📋', label: 'Carte digitale illimitée : plats, catégories, photos' },
  { icon: '💳', label: 'Commande et paiement à table (carte, Apple Pay, Google Pay)' },
  { icon: '🤝', label: 'Aucune commission sur vos ventes' },
  { icon: '🔔', label: 'Mode Service en direct : commandes, tables, addition' },
  { icon: '🥡', label: 'Vente à emporter et livraison' },
  { icon: '💝', label: 'Pourboires, au paiement et après le repas' },
  { icon: '📊', label: 'Statistiques et analyse de rentabilité' },
  { icon: '🕐', label: 'Menus midi et soir programmables' },
  { icon: '📦', label: 'Gestion des stocks et des allergènes' },
  { icon: '🎨', label: 'Personnalisation : couleurs, vidéos, traductions' },
  { icon: '🔒', label: 'Code PIN pour votre équipe' },
  { icon: '📲', label: 'Cartes NFC fournies et déjà configurées' },
];

const PRICING_FAQ_QUESTIONS = [
  'Y a-t-il un essai gratuit ?',
  'Y a-t-il un engagement ?',
  'Puis-je annuler mon abonnement à tout moment ?',
  "Ai-je besoin d'un matériel spécial ?",
];
const PRICING_FAQ = PRICING_FAQ_QUESTIONS.map((question) => FAQ_ITEMS.find((item) => item.question === question)).filter(
  (item): item is (typeof FAQ_ITEMS)[number] => Boolean(item),
);

function FaqItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="rounded-3xl border border-stone-200/70 bg-white shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={`pricing-faq-${index}`}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-display text-base font-bold text-stone-900">{question}</span>
        <span className={`shrink-0 text-xl text-navy-700 transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      <p id={`pricing-faq-${index}`} hidden={!open} className="px-6 pb-5 text-sm leading-6 text-stone-500">
        {answer}
      </p>
    </div>
  );
}

export function PricingPage() {
  const primaryCta = usePrimaryCta();

  useEffect(() => {
    setPublicPageMeta('/tarifs');
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="overflow-x-clip text-stone-900">
        <PageIntro eyebrow="Tarifs" title="Un abonnement simple, tout inclus">
          Toutes les fonctionnalités dans chaque formule, sans version limitée. Nourevo ne prélève aucune commission
          sur vos ventes.
        </PageIntro>

        <div className="mx-auto mt-2 flex max-w-3xl justify-center px-4">
          <p className="rounded-full bg-emerald-50 px-4 py-2 text-center text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200/70">
            🎁 7 jours d’essai gratuit sur votre premier abonnement · annulez avant la fin, vous ne payez rien
          </p>
        </div>

        {/* Les trois formules */}
        <section className="mx-auto w-full max-w-6xl px-4 pt-14 sm:px-8 lg:px-10">
          <div className="grid items-stretch gap-5 md:grid-cols-3">
            {PLANS.map((plan, index) => (
              <Reveal key={plan.id} delayMs={index * 100}>
                <div
                  className={`relative flex h-full flex-col rounded-3xl p-7 sm:p-8 ${
                    plan.highlight
                      ? 'bg-gradient-to-b from-navy-600 via-navy-700 to-navy-900 text-white shadow-glow md:-my-4 md:py-11'
                      : 'border border-stone-200/70 bg-white shadow-soft'
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-950 shadow-soft">
                      Recommandé
                    </span>
                  )}
                  <p className={`flex items-center gap-2 font-display text-lg font-bold ${plan.highlight ? 'text-white' : 'text-stone-900'}`}>
                    {plan.icon && <span aria-hidden="true">{plan.icon}</span>}
                    {plan.name}
                  </p>
                  <p className={`mt-4 font-display text-5xl font-bold tracking-tight ${plan.highlight ? 'text-white' : 'text-navy-800'}`}>
                    {plan.price.replace('/mois', '')}
                    <span className={`ml-1 text-base font-semibold ${plan.highlight ? 'text-white/70' : 'text-stone-400'}`}>/mois</span>
                  </p>
                  <p className={`mt-1 text-sm ${plan.highlight ? 'text-white/70' : 'text-stone-500'}`}>
                    {plan.subPrice ? `${plan.subPrice.replace(/[()]/g, '')} · ` : ''}soit {PER_DAY[plan.id]} par jour
                  </p>
                  <ul className={`mt-6 space-y-3 border-t pt-6 ${plan.highlight ? 'border-white/15' : 'border-stone-100'}`}>
                    {plan.advantages.map((advantage) => (
                      <li key={advantage} className={`flex items-start gap-2.5 text-sm ${plan.highlight ? 'text-white/90' : 'text-stone-600'}`}>
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                            plan.highlight ? 'bg-white/15 text-white' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          ✓
                        </span>
                        {advantage}
                      </li>
                    ))}
                    <li className={`flex items-start gap-2.5 text-sm ${plan.highlight ? 'text-white/90' : 'text-stone-600'}`}>
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          plan.highlight ? 'bg-white/15 text-white' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        ✓
                      </span>
                      Toutes les fonctionnalités incluses
                    </li>
                  </ul>
                  <div className="mt-auto pt-8">
                    <Link
                      to={primaryCta.to}
                      className={`block rounded-full px-5 py-3.5 text-center text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 ${
                        plan.highlight
                          ? 'bg-white text-navy-800 hover:shadow-lg'
                          : 'bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 text-white shadow-glow'
                      }`}
                    >
                      Commencer l’essai gratuit
                    </Link>
                    <p className={`mt-2.5 text-center text-xs ${plan.highlight ? 'text-white/60' : 'text-stone-400'}`}>
                      7 jours gratuits, puis {plan.price}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-stone-400">
            Carte bancaire demandée à l’inscription, aucun prélèvement avant la fin de l’essai.
          </p>
        </section>

        {/* La démo, mise en avant pour ceux qui hésitent encore */}
        <section className="mx-auto w-full max-w-6xl px-4 pt-20 sm:px-8 lg:px-10">
          <Reveal>
            <div className="relative grid items-center gap-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-50 via-white to-navy-50 p-7 ring-1 ring-amber-200/60 sm:p-10 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">Avant de choisir</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
                  Essayez Nourevo comme un client, maintenant
                </h2>
                <p className="mt-3 max-w-xl text-base leading-7 text-stone-600">
                  Parcourez la carte de notre restaurant de démonstration, ajoutez des plats, choisissez sur place, à
                  emporter ou en livraison, jusqu’à l’écran de paiement. Sans inscription, sans carte bancaire.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <DemoButton label="Ouvrir la démo" />
                  <span className="text-sm text-stone-500">⏱ 2 minutes suffisent</span>
                </div>
              </div>
              <div className="relative mx-auto hidden w-full max-w-[230px] lg:block">
                <div className="relative h-[330px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_80%,transparent)]">
                  <PhoneFrame src="/images/landing/client-menu.jpg" alt="La carte du restaurant de démonstration" />
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Inclus partout */}
        <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="Inclus dans les 3 formules" title="Tout est compris, sans option payante" />
          </Reveal>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUDED.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-white px-5 py-4 shadow-soft">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-lg">
                  {item.icon}
                </span>
                <span className="text-sm font-semibold leading-5 text-stone-700">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Comparaison avec les commissions des plateformes */}
        <section className="mx-auto w-full max-w-4xl px-4 pt-20 sm:px-8">
          <Reveal>
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-stone-200/70 bg-white p-7 text-center shadow-soft sm:flex-row sm:p-8 sm:text-left">
              <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
                🛵
              </span>
              <div className="flex-1">
                <p className="font-display text-lg font-bold text-stone-900">Un prix fixe, pas un pourcentage de vos ventes</p>
                <p className="mt-1 text-sm leading-6 text-stone-500">
                  Comparez avec la commission des plateformes de livraison sur vos commandes à emporter et livrées.
                </p>
              </div>
              <Link
                to="/emporter-livraison"
                className="shrink-0 whitespace-nowrap rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-bold text-navy-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-300"
              >
                Calculer mes économies →
              </Link>
            </div>
          </Reveal>
        </section>

        {/* Questions sur l'abonnement */}
        <section className="mx-auto w-full max-w-3xl px-4 pt-24 sm:px-8">
          <Reveal>
            <SectionHeading eyebrow="Questions fréquentes" title="Abonnement et essai" />
          </Reveal>
          <div className="mt-10 space-y-3">
            {PRICING_FAQ.map((item, index) => (
              <FaqItem key={item.question} question={item.question} answer={item.answer} index={index} />
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-stone-500">
            Une autre question ?{' '}
            <Link to="/faq" className="font-semibold text-navy-700 underline-offset-2 hover:underline">
              Toute la FAQ
            </Link>{' '}
            ou{' '}
            <Link to="/contact" className="font-semibold text-navy-700 underline-offset-2 hover:underline">
              contactez-nous
            </Link>
            .
          </p>
        </section>

        <CtaBand title="Prêt à essayer avec votre propre carte ?" />
      </main>
      <SiteFooter />
    </>
  );
}
