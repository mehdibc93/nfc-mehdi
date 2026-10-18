import { useEffect } from 'react';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { PhoneFrame } from '../components/LandingVisuals';
import { Reveal } from '../components/Reveal';
import { DeliveryCommissionCalculator } from '../components/DeliveryCommissionCalculator';
import { CtaBand, PageIntro } from '../components/MarketingBlocks';
import { setPublicPageMeta } from '../lib/seo';

const TAKEAWAY_POINTS = [
  { icon: '🥡', title: 'À emporter, sur créneau', text: 'Le client choisit son heure de retrait et paie en ligne ou au comptoir.' },
  { icon: '🛵', title: 'Votre propre livraison', text: 'Vous fixez vos frais, votre minimum et le seuil de livraison offerte.' },
  { icon: '💝', title: 'Des pourboires pour l’équipe', text: 'Proposés au paiement, par carte ou à la caisse, et après le repas.' },
  { icon: '🔗', title: 'Un simple lien', text: 'À partager sur votre site, votre fiche Google ou vos réseaux. Aucune application.' },
];

export function TakeawayDeliveryPage() {
  useEffect(() => {
    setPublicPageMeta('/emporter-livraison');
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="text-stone-900">
        <PageIntro eyebrow="Vente à emporter & livraison" title="Vos clients commandent aussi depuis chez eux">
          En direct, sans commission, en complément des plateformes de livraison. Les commandes rejoignent votre Mode
          Service.
        </PageIntro>

        <section className="mx-auto w-full max-w-7xl px-4 pt-12 sm:px-8 lg:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal>
              {/* Téléphone en fondu vers le bas plutôt que coupé net. */}
              <div className="relative mx-auto w-full max-w-[280px]">
                <div className="absolute inset-0 m-auto h-[300px] w-[300px] rounded-full bg-navy-300/15 blur-3xl" />
                <div className="relative h-[460px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_75%,transparent)]">
                  <PhoneFrame src="/images/landing/client-modes.jpg" alt="Le client choisit sur place, à emporter ou en livraison" />
                </div>
              </div>
            </Reveal>
            <Reveal delayMs={100}>
              <ul className="grid gap-4 sm:grid-cols-2">
                {TAKEAWAY_POINTS.map((item) => (
                  <li key={item.title} className="flex gap-3 rounded-2xl border border-stone-200/70 bg-white p-5 shadow-soft">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-xl">{item.icon}</span>
                    <span>
                      <span className="block font-semibold text-stone-900">{item.title}</span>
                      <span className="mt-0.5 block text-sm leading-6 text-stone-500">{item.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pt-20 sm:px-8 lg:px-10">
          <Reveal>
            <DeliveryCommissionCalculator />
          </Reveal>
        </section>

        <CtaBand title="Proposez la commande en direct à vos clients" />
      </main>
      <SiteFooter />
    </>
  );
}
