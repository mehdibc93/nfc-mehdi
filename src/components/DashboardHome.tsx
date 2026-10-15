import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Order, OrderStatus, RestaurantWithMenu } from '../lib/types';
import { money } from '../lib/format';
import { useDashboardLocale, useDt } from '../lib/dashboardLocale';

export type DashboardOverview = {
  views: number;
  orders: number;
  revenue: number;
  /** Commandes du jour, les plus récentes d'abord. */
  recentOrders: Order[];
};

export type ChecklistItem = { label: string; done: boolean; actionLabel: string; onAction: () => void };

type Props = {
  restaurant: RestaurantWithMenu;
  overview: DashboardOverview | null;
  pendingRequestsCount: number;
  checklistItems: ChecklistItem[];
  showChecklist: boolean;
  onDismissChecklist: () => void;
  onToast: (message: string) => void;
};

const PLAN_NAMES: Record<string, { fr: string; en: string }> = {
  monthly: { fr: 'Offre Liberté', en: 'Freedom plan' },
  annual_monthly: { fr: 'Offre Pro', en: 'Pro plan' },
  annual_upfront: { fr: 'Offre Annuelle', en: 'Annual plan' },
};

const STATUS_LABEL: Record<OrderStatus, { fr: string; en: string; tone: string }> = {
  new: { fr: 'Nouvelle', en: 'New', tone: 'bg-amber-50 text-amber-700' },
  confirmed: { fr: 'En préparation', en: 'Preparing', tone: 'bg-navy-50 text-navy-700' },
  served: { fr: 'Servie', en: 'Served', tone: 'bg-emerald-50 text-emerald-700' },
  done: { fr: 'Terminée', en: 'Done', tone: 'bg-stone-100 text-stone-500' },
  refused: { fr: 'Refusée', en: 'Declined', tone: 'bg-red-50 text-red-600' },
};

function Chip({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        ok ? 'bg-white/15 text-white' : 'bg-amber-300/90 text-amber-950'
      }`}
    >
      <span aria-hidden="true">{ok ? '●' : '!'}</span>
      {children}
    </span>
  );
}

// Accueil du dashboard restaurateur : état de l'établissement, chiffres du jour, dernières
// commandes, partage de la carte et accès aux différents espaces.
export function DashboardHome({
  restaurant,
  overview,
  pendingRequestsCount,
  checklistItems,
  showChecklist,
  onDismissChecklist,
  onToast,
}: Props) {
  const dt = useDt();
  const { locale } = useDashboardLocale();
  const [copied, setCopied] = useState<string | null>(null);

  const now = new Date();
  const greeting = now.getHours() >= 18 ? dt('Bonsoir', 'Good evening') : dt('Bonjour', 'Hello');
  const today = now.toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const totalDishes = restaurant.categories.reduce((sum, category) => sum + category.dishes.length, 0);
  const totalCategories = restaurant.categories.length;
  const plan = PLAN_NAMES[restaurant.subscriptionPlan ?? 'monthly'] ?? PLAN_NAMES.monthly;
  const doneSteps = checklistItems.filter((item) => item.done).length;
  const averageBasket = overview && overview.orders > 0 ? overview.revenue / overview.orders : null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareLinks = [
    { id: 'menu', label: dt('Lien de votre carte', 'Your menu link'), url: `${origin}/r/${restaurant.slug}` },
    ...(restaurant.takeawayEnabled
      ? [{ id: 'emporter', label: dt('Commande à emporter', 'Takeaway ordering'), url: `${origin}/r/${restaurant.slug}?mode=emporter` }]
      : []),
    ...(restaurant.deliveryEnabled
      ? [{ id: 'livraison', label: dt('Commande en livraison', 'Delivery ordering'), url: `${origin}/r/${restaurant.slug}?mode=livraison` }]
      : []),
  ];
  const copy = (id: string, url: string) => {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(id);
      onToast(dt('Lien copié !', 'Link copied!'));
      window.setTimeout(() => setCopied(null), 2000);
    });
  };

  const orderTitle = (order: Order) => {
    if (order.fulfillment === 'takeaway') return `🥡 ${dt('À emporter', 'Takeaway')}${order.customerName ? ` — ${order.customerName}` : ''}`;
    if (order.fulfillment === 'delivery') return `🛵 ${dt('Livraison', 'Delivery')}${order.customerName ? ` — ${order.customerName}` : ''}`;
    return `${dt('Table', 'Table')} ${order.tableLabel}`;
  };

  const kpis = [
    { icon: '🧾', label: dt('Commandes', 'Orders'), value: overview ? String(overview.orders) : '—' },
    { icon: '💶', label: dt("Chiffre d'affaires", 'Revenue'), value: overview ? money(overview.revenue) : '—' },
    { icon: '🛒', label: dt('Panier moyen', 'Average basket'), value: averageBasket !== null ? money(averageBasket) : '—' },
    { icon: '👀', label: dt('Plats consultés', 'Dish views'), value: overview ? String(overview.views) : '—' },
  ];

  const tiles = [
    {
      to: '/dashboard/carte',
      icon: '📋',
      title: dt('Carte', 'Menu'),
      text: dt('Plats, photos, prix, stocks et suppléments', 'Dishes, photos, prices, stock and extras'),
      badge: dt(
        `${totalCategories} catégorie${totalCategories > 1 ? 's' : ''} · ${totalDishes} plat${totalDishes > 1 ? 's' : ''}`,
        `${totalCategories} categor${totalCategories > 1 ? 'ies' : 'y'} · ${totalDishes} dish${totalDishes > 1 ? 'es' : ''}`,
      ),
      tone: 'neutral' as const,
    },
    {
      to: '/dashboard/restaurant',
      icon: '🎨',
      title: dt('Restaurant & apparence', 'Restaurant & look'),
      text: dt('Infos, horaires, couleurs, vidéos, emporter, livraison, pourboires', 'Info, hours, colours, videos, takeaway, delivery, tips'),
      badge: null,
      tone: 'neutral' as const,
    },
    {
      to: '/dashboard/paiements',
      icon: '💳',
      title: dt('Paiements', 'Payments'),
      text: dt('Paiement par carte, Apple Pay et Google Pay, abonnement', 'Card, Apple Pay and Google Pay, subscription'),
      badge: restaurant.stripeOnboarded ? dt('Connecté', 'Connected') : dt('À connecter', 'To connect'),
      tone: restaurant.stripeOnboarded ? ('ok' as const) : ('warn' as const),
    },
    {
      to: '/dashboard/stats',
      icon: '📊',
      title: dt('Statistiques', 'Statistics'),
      text: dt('Plats consultés, ajoutés au panier et commandés', 'Dishes viewed, added to cart and ordered'),
      badge: null,
      tone: 'neutral' as const,
    },
    {
      to: '/dashboard/rentabilite',
      icon: '📈',
      title: dt('Rentabilité', 'Profitability'),
      text: dt('Marge plat par plat et recommandations', 'Margin per dish and recommendations'),
      badge: null,
      tone: 'neutral' as const,
    },
    {
      to: '/dashboard/configuration',
      icon: '⚙️',
      title: dt('Configuration', 'Settings'),
      text: dt('Carte NFC, code PIN du personnel, avis Google', 'NFC card, staff PIN code, Google reviews'),
      badge: restaurant.servicePin ? dt('PIN activé', 'PIN on') : null,
      tone: 'ok' as const,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Bandeau d'accueil */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-600 via-navy-700 to-navy-900 p-6 text-white shadow-glow sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm capitalize text-white/70">{today}</p>
            <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
              {greeting}, {restaurant.name}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <Chip ok>
                {dt(plan.fr, plan.en)} · {dt('active', 'active')}
              </Chip>
              <Chip ok={restaurant.stripeOnboarded}>
                {restaurant.stripeOnboarded ? dt('Paiement en ligne actif', 'Online payment on') : dt('Paiement en ligne à connecter', 'Online payment to connect')}
              </Chip>
              <Chip ok={totalDishes > 0}>
                {totalDishes > 0
                  ? dt(`Carte en ligne · ${totalDishes} plat${totalDishes > 1 ? 's' : ''}`, `Menu online · ${totalDishes} dish${totalDishes > 1 ? 'es' : ''}`)
                  : dt('Carte vide', 'Empty menu')}
              </Chip>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to="/service"
              className="relative inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-navy-800 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              🔔 {dt('Ouvrir le Mode Service', 'Open Service Mode')}
              {pendingRequestsCount > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{pendingRequestsCount}</span>
              )}
            </Link>
            <a
              href={`/r/${restaurant.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10"
            >
              {dt('Voir ma carte ↗', 'View my menu ↗')}
            </a>
          </div>
        </div>
      </section>

      {/* Bien démarrer */}
      {showChecklist && (
        <section className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-stone-900">{dt('Bien démarrer', 'Get started')}</h2>
              <p className="mt-0.5 text-sm text-stone-500">
                {dt(`${doneSteps} étape${doneSteps > 1 ? 's' : ''} sur ${checklistItems.length}`, `${doneSteps} of ${checklistItems.length} steps`)}
              </p>
            </div>
            <button
              type="button"
              onClick={onDismissChecklist}
              className="text-xs font-semibold text-stone-500 transition-colors duration-300 hover:text-stone-700"
            >
              {dt('Masquer', 'Hide')}
            </button>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${(doneSteps / checklistItems.length) * 100}%` }}
            />
          </div>
          <ol className="mt-5 grid gap-3 md:grid-cols-3">
            {checklistItems.map((item, index) => (
              <li
                key={item.label}
                className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 ${
                  item.done ? 'border-emerald-200 bg-emerald-50/60' : 'border-stone-200 bg-stone-50/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      item.done ? 'bg-emerald-500 text-white' : 'bg-white text-stone-500 ring-1 ring-stone-200'
                    }`}
                  >
                    {item.done ? '✓' : index + 1}
                  </span>
                  <p className={`text-sm font-semibold ${item.done ? 'text-emerald-800' : 'text-stone-800'}`}>{item.label}</p>
                </div>
                {!item.done && (
                  <button
                    type="button"
                    onClick={item.onAction}
                    className="self-start rounded-full bg-navy-700 px-4 py-2 text-xs font-bold text-white transition-all duration-300 hover:bg-navy-800"
                  >
                    {item.actionLabel}
                  </button>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Chiffres du jour */}
      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-stone-900">{dt("Aujourd'hui", 'Today')}</h2>
          <Link to="/dashboard/stats" className="text-sm font-semibold text-navy-700 hover:underline">
            {dt('Voir les statistiques →', 'View statistics →')}
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-3xl border border-stone-200/70 bg-white p-5 shadow-soft">
              <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy-50 text-lg">
                {kpi.icon}
              </span>
              <p className="mt-4 font-display text-2xl font-bold text-stone-900 sm:text-3xl">{kpi.value}</p>
              <p className="mt-0.5 text-sm text-stone-500">{kpi.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Commandes du jour + partage de la carte */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="min-w-0 rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-stone-900">{dt('Dernières commandes', 'Latest orders')}</h2>
            <Link to="/service" className="whitespace-nowrap text-sm font-semibold text-navy-700 hover:underline">
              {dt('Mode Service →', 'Service Mode →')}
            </Link>
          </div>
          {overview && overview.recentOrders.length > 0 ? (
            <ul className="mt-4 divide-y divide-stone-100">
              {overview.recentOrders.map((order) => {
                const status = STATUS_LABEL[order.status];
                return (
                  <li key={order.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-stone-900">{orderTitle(order)}</p>
                      <p className="text-xs text-stone-500">
                        {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} ·{' '}
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} {dt('article(s)', 'item(s)')}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.tone}`}>{dt(status.fr, status.en)}</span>
                      <span className="w-16 text-right font-semibold text-stone-900 sm:w-20">{money(order.total)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-stone-200 p-6 text-center">
              <p className="text-2xl" aria-hidden="true">🍽️</p>
              <p className="mt-2 font-semibold text-stone-800">{dt("Pas encore de commande aujourd'hui", 'No orders yet today')}</p>
              <p className="mt-1 text-sm text-stone-500">
                {dt(
                  'Elles apparaîtront ici en temps réel, et dans le Mode Service avec une alerte sonore.',
                  'They will appear here in real time, and in Service Mode with a sound alert.',
                )}
              </p>
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg font-bold text-stone-900">{dt('Partager ma carte', 'Share my menu')}</h2>
          <p className="mt-1 text-sm text-stone-500">
            {dt('Sur vos tables grâce aux cartes NFC, ou en ligne : site, Google, réseaux sociaux.', 'On your tables with NFC cards, or online: website, Google, social media.')}
          </p>
          <ul className="mt-4 space-y-2">
            {shareLinks.map((link) => (
              <li key={link.id} className="rounded-2xl bg-stone-50 p-3">
                <p className="text-xs font-semibold text-stone-600">{link.label}</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate text-xs text-stone-500">{link.url}</code>
                  <button
                    type="button"
                    onClick={() => copy(link.id, link.url)}
                    className="shrink-0 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-navy-300 hover:text-navy-700"
                  >
                    {copied === link.id ? dt('Copié ✓', 'Copied ✓') : dt('Copier', 'Copy')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <Link
            to="/dashboard/configuration"
            className="mt-4 inline-flex text-sm font-semibold text-navy-700 hover:underline"
          >
            {dt('Programmer une carte NFC →', 'Program an NFC card →')}
          </Link>
        </section>
      </div>

      {/* Accès aux espaces */}
      <section>
        <h2 className="font-display text-lg font-bold text-stone-900">{dt('Gérer mon établissement', 'Manage my venue')}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <Link
              key={tile.to}
              to={tile.to}
              className="group flex items-start gap-4 rounded-3xl border border-stone-200/70 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-300/50"
            >
              <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-2xl">
                {tile.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-display font-bold text-stone-900">{tile.title}</span>
                  {tile.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        tile.tone === 'warn'
                          ? 'bg-amber-100 text-amber-800'
                          : tile.tone === 'ok'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {tile.badge}
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-sm leading-5 text-stone-500">{tile.text}</span>
              </span>
              <span aria-hidden="true" className="text-stone-300 transition-colors duration-300 group-hover:text-navy-500">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
