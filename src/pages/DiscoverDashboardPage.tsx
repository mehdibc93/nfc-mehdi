import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoHorizontal from '../assets/logo-horizontal.png';
import { DashboardPreview } from '../components/DashboardPreview';
import { setPageMeta } from '../lib/seo';

const SERVICE_ORDERS = [
  { table: 'Table 4', items: '1x Burger Gourmet, 1x Limonade', status: 'Nouvelle', tone: 'new' as const },
  { table: 'Table 9', items: '2x Risotto, 1x Tiramisu', status: 'En préparation', tone: 'confirmed' as const },
  { table: 'Table 2', items: '1x Fondant chocolat', status: 'Servie', tone: 'served' as const },
];

const STATUS_STYLES: Record<'new' | 'confirmed' | 'served', string> = {
  new: 'bg-red-50 text-red-600 border-red-200',
  confirmed: 'bg-navy-300/15 text-navy-700 border-navy-300/30',
  served: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const FUNNEL_STEPS = [
  { label: 'Vues du menu', value: 312, pct: 100 },
  { label: 'Ajouts au panier', value: 89, pct: 29 },
  { label: 'Commandes finalisées', value: 47, pct: 15 },
];

const DISH_MARGINS = [
  { name: 'Burger Gourmet', margin: 68 },
  { name: 'Risotto aux champignons', margin: 54 },
  { name: 'Salade César', margin: 31 },
];

function marginColor(margin: number) {
  if (margin >= 65) return { bar: 'bg-emerald-500', emoji: '🟢' };
  if (margin >= 40) return { bar: 'bg-amber-500', emoji: '🟠' };
  return { bar: 'bg-red-500', emoji: '🔴' };
}

const CUSTOMIZATION_ITEMS = [
  { icon: '🎨', label: 'Couleur des boutons', description: "Choisissez la couleur d'accent vue par vos clients." },
  { icon: '🖼️', label: 'Photo de couverture', description: 'Galerie prête à l\'emploi, ou vos propres photos.' },
  { icon: '🎬', label: "Vidéo d'introduction", description: "Un modèle proposé, ou votre propre vidéo à l'ouverture de la carte." },
  { icon: '👨‍🍳', label: "Animation d'attente", description: 'Illustration ou vidéo personnalisée pendant que le client patiente.' },
  { icon: '🌍', label: '5 langues', description: 'Traduction automatique de toute votre carte en un clic.' },
  { icon: '🕐', label: 'Horaires sur-mesure', description: "Horaires d'ouverture, menus midi/soir, chacun activable indépendamment." },
];

export function DiscoverDashboardPage() {
  useEffect(() => {
    setPageMeta({
      title: 'Découvrir le dashboard — Nourevo',
      description: "Un aperçu concret du dashboard Nourevo avant de créer votre compte : vue d'ensemble, personnalisation, Mode Service, statistiques et rentabilité.",
    });
  }, []);

  return (
    <div className="min-h-screen px-4 py-14 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition-colors duration-300 hover:text-navy-700"
        >
          ← Retour à l'accueil
        </Link>

        <img src={logoHorizontal} alt="Nourevo" className="h-8 w-auto" />
        <h1 className="mt-4 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
          Votre dashboard, avant même de créer un compte.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-stone-500">
          Voici à quoi ressemble concrètement l'espace de gestion de votre restaurant sur Nourevo. Les chiffres
          ci-dessous sont fictifs, à titre d'exemple — mais l'interface est celle que vous utiliserez vraiment.
        </p>

        {/* 1. Vue d'ensemble */}
        <section className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
            01 — L'accueil de votre espace
          </p>
          <div className="mt-3">
            <DashboardPreview />
          </div>
        </section>

        {/* 2. Personnalisation */}
        <section className="mt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
            02 — Personnalisation illimitée
          </p>
          <h2 className="mt-2 font-display text-xl font-bold text-stone-900 sm:text-2xl">
            Votre carte, à l'image de votre restaurant.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
            Aucun modèle imposé : chaque élément visible par vos clients se personnalise depuis votre dashboard,
            sans limite de changements.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CUSTOMIZATION_ITEMS.map((item) => (
              <div key={item.label} className="rounded-3xl border border-stone-200/70 bg-white p-5 shadow-soft">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy-300/10 text-lg">
                  {item.icon}
                </span>
                <p className="mt-3 text-sm font-bold text-stone-900">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-stone-500">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Mode Service + Stats/Rentabilité */}
        <section className="mt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
            03 — Piloter le service et vos chiffres
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
              <p className="font-display text-base font-bold text-stone-900">🔔 Mode Service</p>
              <p className="mt-1.5 text-sm text-stone-500">
                Les commandes arrivent en direct, table par table, avec leur statut à jour d'un clic.
              </p>
              <div className="mt-4 space-y-2">
                {SERVICE_ORDERS.map((order) => (
                  <div
                    key={order.table}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-stone-100 bg-stone-50/60 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{order.table}</p>
                      <p className="text-xs text-stone-500">{order.items}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[order.tone]}`}
                    >
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
                <p className="font-display text-base font-bold text-stone-900">📊 Statistiques</p>
                <p className="mt-1.5 text-sm text-stone-500">Du premier coup d'œil à la commande finalisée.</p>
                <div className="mt-4 space-y-3">
                  {FUNNEL_STEPS.map((step) => (
                    <div key={step.label}>
                      <div className="flex items-center justify-between text-xs text-stone-600">
                        <span>{step.label}</span>
                        <span className="tabular-nums font-semibold text-stone-900">{step.value}</span>
                      </div>
                      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-2.5 rounded-full bg-navy-600 transition-all duration-500"
                          style={{ width: `${step.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
                <p className="font-display text-base font-bold text-stone-900">💰 Rentabilité</p>
                <p className="mt-1.5 text-sm text-stone-500">La marge réelle de chaque plat, au premier coup d'œil.</p>
                <div className="mt-4 space-y-3">
                  {DISH_MARGINS.map((dish) => {
                    const { bar, emoji } = marginColor(dish.margin);
                    return (
                      <div key={dish.name}>
                        <div className="flex items-center justify-between text-xs text-stone-600">
                          <span>
                            {emoji} {dish.name}
                          </span>
                          <span className="tabular-nums font-semibold text-stone-900">{dish.margin}%</span>
                        </div>
                        <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
                          <div
                            className={`h-2.5 rounded-full ${bar} transition-all duration-500`}
                            style={{ width: `${dish.margin}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="mt-14 flex flex-col items-center gap-5 rounded-3xl bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 p-10 text-center shadow-glow sm:p-14">
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Prêt à essayer avec votre carte ?</h2>
          <p className="max-w-xl text-sm text-white/80 sm:text-base">
            Créez votre compte et composez votre propre carte en quelques minutes.
          </p>
          <Link
            to="/inscription"
            className="rounded-full bg-white px-8 py-4 text-sm font-bold text-navy-800 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
          >
            Créer mon compte
          </Link>
        </div>
      </div>
    </div>
  );
}
