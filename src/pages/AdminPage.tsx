import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { setPageMeta } from '../lib/seo';

// Administration Nourevo (nourevo.fr/admin) : réservée aux comptes listés dans la table `admins`
// (voir migration_032_admin.sql). Abonnés, cartes NFC à envoyer, et tous les comptes.

type Subscriber = {
  restaurant_id: string;
  name: string;
  slug: string;
  email: string | null;
  subscription_status: string;
  subscription_plan: string | null;
  table_count: number;
  signed_up_at: string | null;
};

type Shipment = {
  restaurant_id: string;
  contact_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  postal_code: string;
  city: string;
  country: string;
  cards_count: number;
  notes: string;
  status: 'to_ship' | 'shipped';
  shipped_at: string | null;
  created_at: string;
};

type Tab = 'to_ship' | 'missing' | 'shipped' | 'all';

const PLAN_LABELS: Record<string, string> = { monthly: 'Liberté · 59 €/mois', annual_monthly: 'Pro · 54 €/mois', annual_upfront: 'Annuelle · 588 €/an' };
const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: { label: 'Actif', className: 'bg-emerald-100 text-emerald-800' },
  past_due: { label: 'Impayé', className: 'bg-red-100 text-red-700' },
  canceled: { label: 'Résilié', className: 'bg-stone-200 text-stone-600' },
  inactive: { label: 'Pas abonné', className: 'bg-stone-100 text-stone-500' },
};

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/** Numéro français « 06 12… » → format WhatsApp « 336 12… ». */
function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0') && digits.length === 10) return `33${digits.slice(1)}`;
  return digits;
}

const fullAddress = (s: Shipment) =>
  [s.contact_name, s.address_line1, s.address_line2, `${s.postal_code} ${s.city}`, s.country].filter((part) => part && part.trim()).join('\n');

export function AdminPage() {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [tab, setTab] = useState<Tab>('to_ship');
  const [loadError, setLoadError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setPageMeta({ title: 'Administration — Nourevo', description: 'Administration Nourevo', canonicalPath: '/admin', noindex: true });
  }, []);

  const load = useCallback(async () => {
    setLoadError('');
    const [subs, ships] = await Promise.all([
      supabase.rpc('admin_subscribers'),
      supabase.from('nfc_shipments').select('*').order('created_at', { ascending: false }),
    ]);
    if (subs.error || ships.error) {
      setLoadError((subs.error ?? ships.error)?.message ?? 'Erreur de chargement');
      return;
    }
    setSubscribers((subs.data ?? []) as Subscriber[]);
    setShipments((ships.data ?? []) as Shipment[]);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        const ok = !error && Boolean(data);
        setAllowed(ok);
        if (ok) void load();
      });
  }, [user, load]);

  const byRestaurant = useMemo(() => new Map(subscribers.map((sub) => [sub.restaurant_id, sub])), [subscribers]);
  const shipped = new Set(shipments.map((s) => s.restaurant_id));
  const toShip = shipments.filter((s) => s.status === 'to_ship');
  const done = shipments.filter((s) => s.status === 'shipped');
  const missing = subscribers.filter((sub) => sub.subscription_status === 'active' && !shipped.has(sub.restaurant_id));
  const activeCount = subscribers.filter((sub) => sub.subscription_status === 'active').length;

  const setStatus = async (restaurantId: string, status: 'to_ship' | 'shipped') => {
    setBusy(restaurantId);
    const shippedAt = status === 'shipped' ? new Date().toISOString() : null;
    const { error } = await supabase.from('nfc_shipments').update({ status, shipped_at: shippedAt }).eq('restaurant_id', restaurantId);
    setBusy(null);
    if (error) {
      setLoadError(error.message);
      return;
    }
    setShipments((list) => list.map((s) => (s.restaurant_id === restaurantId ? { ...s, status, shipped_at: shippedAt } : s)));
  };

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // presse-papiers indisponible
    }
  };

  if (allowed === null) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-stone-500">Chargement…</div>;
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-4xl">🔒</p>
        <p className="font-display text-xl font-bold">Accès réservé à l’administrateur</p>
        <Link to="/dashboard" className="text-sm font-semibold text-navy-700">
          ← Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const shipmentCard = (s: Shipment) => {
    const sub = byRestaurant.get(s.restaurant_id);
    const address = fullAddress(s);
    return (
      <li key={s.restaurant_id} className="rounded-3xl border border-stone-200/70 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-lg font-bold text-stone-900">{sub?.name ?? 'Restaurant'}</p>
            <p className="text-xs text-stone-500">
              Demande du {formatDate(s.created_at)}
              {s.status === 'shipped' && ` · expédiée le ${formatDate(s.shipped_at)}`}
            </p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
            {s.cards_count} carte{s.cards_count > 1 ? 's' : ''}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-stone-50 p-3 text-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-stone-400">Contact</p>
            <p className="mt-1 font-semibold text-stone-800">{s.contact_name}</p>
            <p className="text-stone-600">{s.phone}</p>
            {sub?.email && <p className="truncate text-stone-600">{sub.email}</p>}
          </div>
          <div className="rounded-2xl bg-stone-50 p-3 text-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-stone-400">Adresse d’envoi</p>
            <p className="mt-1 whitespace-pre-line text-stone-700">{address}</p>
          </div>
        </div>
        {s.notes && <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-900">📝 {s.notes}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          <a href={`tel:${s.phone.replace(/\s/g, '')}`} className="rounded-full border border-stone-200 px-4 py-2 text-xs font-bold text-stone-700">
            📞 Appeler
          </a>
          <a
            href={`https://wa.me/${whatsappNumber(s.phone)}?text=${encodeURIComponent(`Bonjour ${s.contact_name}, c’est Nourevo ! `)}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#25D366] px-4 py-2 text-xs font-bold text-white"
          >
            💬 WhatsApp
          </a>
          {sub?.email && (
            <a href={`mailto:${sub.email}?subject=${encodeURIComponent('Vos cartes NFC Nourevo')}`} className="rounded-full border border-stone-200 px-4 py-2 text-xs font-bold text-stone-700">
              ✉️ Email
            </a>
          )}
          <button type="button" onClick={() => copy(s.restaurant_id, address)} className="rounded-full border border-stone-200 px-4 py-2 text-xs font-bold text-stone-700">
            {copied === s.restaurant_id ? '✓ Copiée' : '📋 Copier l’adresse'}
          </button>
          {s.status === 'to_ship' ? (
            <button
              type="button"
              disabled={busy === s.restaurant_id}
              onClick={() => setStatus(s.restaurant_id, 'shipped')}
              className="rounded-full bg-stone-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              📬 Marquer comme expédiée
            </button>
          ) : (
            <button
              type="button"
              disabled={busy === s.restaurant_id}
              onClick={() => setStatus(s.restaurant_id, 'to_ship')}
              className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-500 disabled:opacity-50"
            >
              Annuler l’expédition
            </button>
          )}
        </div>
      </li>
    );
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'to_ship', label: '📦 À envoyer', count: toShip.length },
    { id: 'missing', label: '⏳ Sans adresse', count: missing.length },
    { id: 'shipped', label: '📬 Expédiées', count: done.length },
    { id: 'all', label: '👥 Tous les comptes', count: subscribers.length },
  ];

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Nourevo</p>
          <h1 className="font-display text-3xl font-bold text-stone-900">Administration</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void load()} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600">
            ↻ Actualiser
          </button>
          <Link to="/dashboard" className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600">
            Tableau de bord
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Abonnés actifs', value: activeCount },
          { label: 'Cartes à envoyer', value: toShip.reduce((sum, s) => sum + s.cards_count, 0) },
          { label: 'Sans adresse', value: missing.length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-stone-200/70 bg-white p-4 text-center shadow-soft">
            <p className="font-display text-3xl font-bold text-stone-900">{stat.value}</p>
            <p className="mt-1 text-xs text-stone-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {loadError && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>}

      <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              tab === item.id ? 'bg-stone-900 text-white' : 'border border-stone-200 bg-white text-stone-600'
            }`}
          >
            {item.label} <span className="opacity-60">{item.count}</span>
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'to_ship' &&
          (toShip.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">Aucune carte à envoyer pour l’instant. 🎉</p>
          ) : (
            <ul className="space-y-4">{toShip.map(shipmentCard)}</ul>
          ))}

        {tab === 'shipped' &&
          (done.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">Aucune carte expédiée pour l’instant.</p>
          ) : (
            <ul className="space-y-4">{done.map(shipmentCard)}</ul>
          ))}

        {tab === 'missing' &&
          (missing.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">Tous vos abonnés ont indiqué leur adresse.</p>
          ) : (
            <ul className="space-y-3">
              <p className="text-sm text-stone-500">Abonnés actifs qui n’ont pas encore indiqué où envoyer leurs cartes. Relancez-les par email.</p>
              {missing.map((sub) => (
                <li key={sub.restaurant_id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-stone-200/70 bg-white p-4 shadow-soft">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-stone-900">{sub.name}</p>
                    <p className="truncate text-sm text-stone-500">
                      {sub.email ?? '—'} · {sub.table_count} table{sub.table_count > 1 ? 's' : ''} · inscrit le {formatDate(sub.signed_up_at)}
                    </p>
                  </div>
                  {sub.email && (
                    <a
                      href={`mailto:${sub.email}?subject=${encodeURIComponent('Où envoyer vos cartes NFC Nourevo ?')}&body=${encodeURIComponent(
                        `Bonjour,\n\nMerci pour votre abonnement à Nourevo ! Pour vous envoyer vos cartes NFC, il vous suffit d’indiquer votre adresse et votre numéro dans votre tableau de bord : https://nourevo.fr/dashboard\n\nÀ très vite,\nL’équipe Nourevo`,
                      )}`}
                      className="shrink-0 rounded-full bg-stone-900 px-4 py-2 text-xs font-bold text-white"
                    >
                      ✉️ Relancer par email
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ))}

        {tab === 'all' && (
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-3xl border border-stone-200/70 bg-white shadow-soft">
            {subscribers.map((sub) => {
              const status = STATUS_LABELS[sub.subscription_status] ?? STATUS_LABELS.inactive;
              return (
                <li key={sub.restaurant_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
                    <p className="truncate font-semibold text-stone-900">{sub.name}</p>
                    <p className="truncate text-xs text-stone-500">
                      {sub.email ?? '—'} · inscrit le {formatDate(sub.signed_up_at)}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
                  {sub.subscription_plan && <span className="text-xs text-stone-500">{PLAN_LABELS[sub.subscription_plan] ?? sub.subscription_plan}</span>}
                  <a href={`/r/${sub.slug}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-navy-700">
                    Voir la carte ↗
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
