import { useEffect } from 'react';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { NfcCard } from '../components/LandingVisuals';
import { Reveal } from '../components/Reveal';
import { CtaBand, PageIntro, SectionHeading } from '../components/MarketingBlocks';
import { setPublicPageMeta } from '../lib/seo';
import { CONTACT_EMAIL, WHATSAPP_NFC_HREF } from '../lib/site';

const NFC_VS_QR = [
  { label: 'Pour ouvrir la carte', qr: 'Ouvrir l’appareil photo, viser, attendre la mise au point', nfc: 'Un simple geste du téléphone sur la carte' },
  { label: 'En salle peu éclairée ou en terrasse', qr: 'Les reflets et la pénombre gênent parfois la lecture', nfc: 'Fonctionne quelle que soit la lumière' },
  { label: 'Sur vos tables', qr: 'Souvent un autocollant standard', nfc: 'Une carte soignée, posée sur la table' },
  { label: 'Une fois la carte ouverte', qr: 'Selon les solutions, une simple carte à consulter', nfc: 'Commande, paiement, pourboire et suivi de la commande' },
];

const SETUP_STEPS = [
  { title: 'Composez votre carte', text: 'Plats, photos, prix et couleurs, depuis votre espace. Aucune compétence technique.' },
  { title: 'Recevez vos cartes NFC', text: 'Elles arrivent déjà configurées : il ne reste qu’à les poser sur vos tables.' },
  { title: 'Accueillez vos premières commandes', text: 'Connectez Stripe pour le paiement en ligne : l’argent arrive sur votre compte.' },
];

export function NfcCardPage() {
  useEffect(() => {
    setPublicPageMeta('/carte-nfc');
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="text-stone-900">
        <PageIntro eyebrow="La carte NFC" title="Un geste, et votre carte s’ouvre">
          Le client approche son téléphone de la carte posée sur la table : votre carte s’ouvre, sans application et
          sans scanner.
        </PageIntro>

        <div className="mx-auto mt-8 flex w-56 justify-center sm:w-64">
          <NfcCard className="w-full -rotate-3" />
        </div>

        <section className="mx-auto w-full max-w-5xl px-4 pt-20 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="NFC ou QR code" title="Pourquoi pas un simple QR code ?">
              Le QR code a rendu de grands services. La carte NFC offre un geste plus simple et une présentation plus
              soignée.
            </SectionHeading>
          </Reveal>
          <Reveal delayMs={100}>
            <div className="mt-10 overflow-hidden rounded-3xl border border-stone-200/70 bg-white shadow-soft">
              <div className="hidden grid-cols-3 gap-4 border-b border-stone-200/70 bg-stone-50 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-stone-500 sm:grid">
                <span />
                <span>QR code</span>
                <span>Carte NFC Nourevo</span>
              </div>
              <div className="divide-y divide-stone-100">
                {NFC_VS_QR.map((row) => (
                  <div key={row.label} className="grid grid-cols-1 gap-2 px-6 py-5 sm:grid-cols-3 sm:items-center sm:gap-4">
                    <span className="text-sm font-bold text-stone-800">{row.label}</span>
                    <span className="flex items-start gap-2 text-sm text-stone-500">
                      <span className="text-rose-400">✕</span> {row.qr}
                    </span>
                    <span className="flex items-start gap-2 rounded-xl bg-emerald-50/70 px-3 py-1.5 text-sm font-semibold text-navy-700 sm:bg-transparent sm:px-0 sm:py-0">
                      <span className="text-emerald-600">✓</span> {row.nfc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="Mise en place" title="Prêt en trois étapes" />
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {SETUP_STEPS.map((step, index) => (
              <Reveal key={step.title} delayMs={index * 100}>
                <div className="h-full rounded-3xl border border-stone-200/70 bg-white p-7 shadow-soft">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800 font-display text-base font-bold text-white shadow-glow">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-stone-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-500">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="commander" className="mx-auto w-full max-w-5xl scroll-mt-24 px-4 pt-20 sm:px-8 lg:px-10">
          <Reveal>
            <div className="flex flex-col items-start gap-6 rounded-3xl bg-gradient-to-br from-navy-50 to-white p-7 ring-1 ring-navy-100 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <h2 className="font-display text-xl font-bold text-stone-900 sm:text-2xl">Commander vos cartes</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Fournies avec l’abonnement et déjà configurées. Livraison en France sous 2 à 4 jours ouvrés, remise en
                  main propre possible en Île-de-France.
                </p>
              </div>
              <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:items-end">
                <a
                  href={WHATSAPP_NFC_HREF}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
                >
                  💬 Commander sur WhatsApp
                </a>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-center text-sm font-semibold text-navy-700 underline-offset-2 hover:underline sm:text-right"
                >
                  ou par email : {CONTACT_EMAIL}
                </a>
              </div>
            </div>
          </Reveal>
        </section>

        <CtaBand />
      </main>
      <SiteFooter />
    </>
  );
}
