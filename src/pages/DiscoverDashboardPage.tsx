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

// Palette catégorielle sans danger pour le daltonisme (Okabe-Ito + un indigo), validée avec
// scripts/validate_palette.js du skill dataviz avant utilisation.
const DASHBOARD_PAGES = [
  {
    icon: '📋',
    color: '#E69F00',
    label: 'Carte',
    description: "C'est ici que vous construisez votre menu : plats, photos, prix, catégories, suppléments. Le cœur de la carte que vos clients voient.",
  },
  {
    icon: '🏠',
    color: '#56B4E9',
    label: 'Restaurant',
    description: 'Les informations générales de votre établissement : nom, adresse, photo de couverture, horaires, couleurs, vidéos.',
  },
  {
    icon: '💳',
    color: '#009E73',
    label: 'Paiements',
    description: 'Connectez votre compte bancaire pour encaisser vos clients (carte, Apple Pay, Google Pay), et gérez votre propre abonnement Nourevo.',
  },
  {
    icon: '📊',
    color: '#0072B2',
    label: 'Statistiques',
    description: 'Combien de personnes consultent votre menu, ajoutent au panier, commandent — pour comprendre ce qui marche vraiment.',
  },
  {
    icon: '💰',
    color: '#D55E00',
    label: 'Rentabilité',
    description: 'Quels plats vous rapportent vraiment de l\'argent une fois les coûts pris en compte — pas juste ceux qui se vendent le plus.',
  },
  {
    icon: '🔔',
    color: '#CC79A7',
    label: 'Mode Service',
    description: "L'écran utilisé pendant le service : les commandes arrivent en direct table par table, avec les demandes des clients (addition, serveur).",
  },
  {
    icon: '🔐',
    color: '#4338CA',
    label: 'Configuration',
    description: 'Les réglages plus sensibles : code PIN pour protéger vos pages, carte NFC, lien vers vos avis clients.',
  },
];

const CUSTOMIZATION_ITEMS = [
  {
    icon: '🎨',
    color: '#E69F00',
    label: 'Couleur des boutons',
    description: "À quoi ça sert : que vos boutons de commande reprennent les couleurs de votre restaurant, pas un thème générique.",
  },
  {
    icon: '🖼️',
    color: '#56B4E9',
    label: 'Photo de couverture',
    description: "À quoi ça sert : donner une première impression soignée. Piochez dans une galerie prête à l'emploi ou envoyez vos propres photos.",
  },
  {
    icon: '🎬',
    color: '#009E73',
    label: "Vidéo d'introduction",
    description: "À quoi ça sert : accueillir le client en vidéo avant qu'il découvre la carte, comme une porte d'entrée à votre restaurant.",
  },
  {
    icon: '👨‍🍳',
    color: '#0072B2',
    label: "Animation d'attente",
    description: "À quoi ça sert : occuper l'écran du client pendant la préparation, avec votre propre vidéo si vous en avez une.",
  },
  {
    icon: '🌍',
    color: '#D55E00',
    label: '5 langues',
    description: "À quoi ça sert : accueillir une clientèle internationale sans traduire vous-même — un clic suffit.",
  },
  {
    icon: '🕐',
    color: '#CC79A7',
    label: 'Horaires sur-mesure',
    description: "À quoi ça sert : que la carte du midi et celle du soir se gèrent seules, sans jamais dupliquer un plat.",
  },
];

function SectionBadge({ number }: { number: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-white">
      {number}
    </span>
  );
}

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
          <div className="flex items-center gap-3">
            <SectionBadge number="1" />
            <div>
              <p className="font-display text-lg font-bold text-stone-900">L'accueil de votre espace</p>
              <p className="text-sm text-stone-500">
                À quoi ça sert : voir en un coup d'œil vos ventes du jour, puis accéder à chaque outil.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <DashboardPreview />
          </div>
        </section>

        {/* 2. Les 7 espaces du dashboard */}
        <section className="mt-16">
          <div className="flex items-center gap-3">
            <SectionBadge number="2" />
            <div>
              <p className="font-display text-lg font-bold text-stone-900">Les 7 espaces de votre dashboard</p>
              <p className="text-sm text-stone-500">
                À quoi ça sert, en un coup d'œil, pour ceux qui découvrent Nourevo pour la première fois.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DASHBOARD_PAGES.map((page) => (
              <div key={page.label} className="rounded-3xl border border-stone-200/70 bg-white p-5 shadow-soft">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg"
                  style={{ backgroundColor: `${page.color}20` }}
                >
                  {page.icon}
                </span>
                <p className="mt-3 text-sm font-bold text-stone-900">{page.label}</p>
                <p className="mt-1 text-xs leading-5 text-stone-500">{page.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Personnalisation */}
        <section className="mt-16 rounded-[2.5rem] bg-navy-300/6 p-6 sm:p-10">
          <div className="flex items-center gap-3">
            <SectionBadge number="3" />
            <div>
              <p className="font-display text-lg font-bold text-stone-900">Personnalisation illimitée</p>
              <p className="text-sm text-stone-500">
                À quoi ça sert : que votre carte ressemble à votre restaurant, pas à un modèle générique — et vous
                pouvez tout changer aussi souvent que vous voulez.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CUSTOMIZATION_ITEMS.map((item) => (
              <div key={item.label} className="rounded-3xl border border-stone-200/70 bg-white p-5 shadow-soft">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  {item.icon}
                </span>
                <p className="mt-3 text-sm font-bold text-stone-900">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-stone-500">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Mode Service + Stats/Rentabilité */}
        <section className="mt-16">
          <div className="flex items-center gap-3">
            <SectionBadge number="4" />
            <div>
              <p className="font-display text-lg font-bold text-stone-900">Piloter le service et vos chiffres</p>
              <p className="text-sm text-stone-500">
                À quoi ça sert : savoir ce qui se passe en cuisine et ce qui rapporte vraiment, sans jongler entre
                plusieurs outils.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
              <p className="font-display text-base font-bold text-stone-900">🔔 Mode Service</p>
              <p className="mt-1.5 text-sm text-stone-500">
                À quoi ça sert : votre équipe voit les commandes arriver en direct, table par table, sans passer par
                la cuisine ou crier à travers la salle.
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
                <p className="mt-1.5 text-sm text-stone-500">
                  À quoi ça sert : repérer où vous perdez des clients entre la découverte du menu et la commande.
                </p>
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
                <p className="mt-3 text-xs text-stone-400">
                  Exemple ici : 312 personnes ont vu le menu, 47 ont commandé — soit 15% de conversion.
                </p>
              </div>

              <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
                <p className="font-display text-base font-bold text-stone-900">💰 Rentabilité</p>
                <p className="mt-1.5 text-sm text-stone-500">
                  À quoi ça sert : savoir quels plats vous rapportent vraiment de l'argent, pas juste lesquels se
                  vendent le plus.
                </p>
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
                <p className="mt-3 text-xs text-stone-400">🟢 marge saine · 🟠 correcte · 🔴 à surveiller.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="mt-16 flex flex-col items-center gap-5 rounded-3xl bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 p-10 text-center shadow-glow sm:p-14">
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
