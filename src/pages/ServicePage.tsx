import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { mapOrder, mapTableRequest } from '../lib/mappers';
import type { Order, OrderRow, OrderStatus, TableRequest, TableRequestRow } from '../lib/types';
import { money } from '../lib/format';
import { LoadingScreen } from '../components/LoadingScreen';
import { PinSectionGate } from '../components/PinSectionGate';
import { DashboardLanguageSwitch } from '../components/DashboardLanguageSwitch';
import { useDt } from '../lib/dashboardLocale';

const ORDER_STATUS_LABEL: Record<OrderStatus, { fr: string; en: string }> = {
  new: { fr: 'Nouvelle', en: 'New' },
  confirmed: { fr: 'Confirmée', en: 'Confirmed' },
  served: { fr: 'Servie', en: 'Served' },
  done: { fr: 'Terminée', en: 'Done' },
};

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  new: 'confirmed',
  confirmed: 'served',
  served: 'done',
  done: null,
};

const NEXT_ACTION_LABEL: Record<OrderStatus, { fr: string; en: string }> = {
  new: { fr: 'Prise en compte', en: 'Accept' },
  confirmed: { fr: 'Marquer servie', en: 'Mark served' },
  served: { fr: 'Terminer', en: 'Finish' },
  done: { fr: '', en: '' },
};

function playChime() {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
  } catch {
    // le son n'est pas essentiel au fonctionnement
  }
}

export function ServicePage() {
  const dt = useDt();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<{
    id: string;
    name: string;
    tableCount: number;
    servicePin: string | null;
    pinProtectedSections: string[];
  } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<TableRequest[]>([]);
  const [exportingOrders, setExportingOrders] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data: restaurantRow } = await supabase
        .from('restaurants')
        .select('id, name, table_count, service_pin, pin_protected_sections')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!restaurantRow) {
        setLoading(false);
        return;
      }
      setRestaurant({
        id: restaurantRow.id,
        name: restaurantRow.name,
        tableCount: restaurantRow.table_count,
        servicePin: restaurantRow.service_pin,
        pinProtectedSections: restaurantRow.pin_protected_sections ?? [],
      });

      const [{ data: orderRows }, { data: requestRows }] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('restaurant_id', restaurantRow.id)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('table_requests')
          .select('*')
          .eq('restaurant_id', restaurantRow.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      if (cancelled) return;
      setOrders(((orderRows ?? []) as OrderRow[]).map(mapOrder));
      setRequests(((requestRows ?? []) as TableRequestRow[]).map(mapTableRequest));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!restaurant) return undefined;
    const channel = supabase
      .channel(`service-${restaurant.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
        (payload) => {
          setOrders((current) => [mapOrder(payload.new as unknown as OrderRow), ...current]);
          playChime();
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
        (payload) => {
          const updated = mapOrder(payload.new as unknown as OrderRow);
          setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'table_requests', filter: `restaurant_id=eq.${restaurant.id}` },
        (payload) => {
          const created = mapTableRequest(payload.new as unknown as TableRequestRow);
          if (created.status === 'pending') {
            setRequests((current) => [created, ...current]);
            playChime();
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'table_requests', filter: `restaurant_id=eq.${restaurant.id}` },
        (payload) => {
          const updated = mapTableRequest(payload.new as unknown as TableRequestRow);
          setRequests((current) =>
            updated.status === 'handled'
              ? current.filter((request) => request.id !== updated.id)
              : current.map((request) => (request.id === updated.id ? updated : request)),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurant]);

  const advanceOrder = async (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setOrders((current) => current.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
    await supabase.from('orders').update({ status: next }).eq('id', order.id);
  };

  const handleLeaveClick = () => {
    if (!restaurant?.servicePin) {
      navigate('/dashboard');
      return;
    }
    setPinInput('');
    setPinError(false);
    setShowPinModal(true);
  };

  const handleValidatePin = () => {
    if (pinInput === restaurant?.servicePin) {
      setShowPinModal(false);
      navigate('/dashboard');
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleExportOrders = async () => {
    if (!restaurant) return;
    setExportingOrders(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })
        .limit(5000);
      const allOrders = ((data ?? []) as OrderRow[]).map(mapOrder);

      const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const header = dt(
        ['Date', 'Table', 'Statut', 'Payé', 'Total (€)', 'Articles', 'Instructions'],
        ['Date', 'Table', 'Status', 'Paid', 'Total (€)', 'Items', 'Instructions'],
      );
      const rows = allOrders.map((order) => [
        new Date(order.createdAt).toLocaleString('fr-FR'),
        order.tableLabel,
        dt(ORDER_STATUS_LABEL[order.status].fr, ORDER_STATUS_LABEL[order.status].en),
        order.paid ? dt('Oui', 'Yes') : dt('Non', 'No'),
        order.total.toFixed(2),
        order.items.map((item) => `${item.name} x${item.quantity}`).join(' | '),
        order.specialInstructions,
      ]);
      const csv = [header, ...rows].map((row) => row.map((cell) => escapeCell(String(cell))).join(';')).join('\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `commandes-${restaurant.name}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingOrders(false);
    }
  };

  const handleRequest = async (request: TableRequest) => {
    setRequests((current) => current.filter((r) => r.id !== request.id));
    await supabase.from('table_requests').update({ status: 'handled' }).eq('id', request.id);
  };

  const tableLabels = useMemo(
    () => Array.from({ length: Math.max(1, restaurant?.tableCount ?? 12) }, (_, index) => String(index + 1)),
    [restaurant?.tableCount],
  );

  const tableStatus = useMemo(() => {
    const map = new Map<string, { emoji: string; label: string }>();
    tableLabels.forEach((label) => map.set(label, { emoji: '🟢', label: dt('Rien à signaler', 'Nothing to report') }));
    orders
      .filter((order) => order.status === 'new' || order.status === 'confirmed' || order.status === 'served')
      .forEach((order) => {
        if (map.has(order.tableLabel)) map.set(order.tableLabel, { emoji: '🟡', label: dt('Commande en cours', 'Order in progress') });
      });
    requests.forEach((request) => {
      if (!map.has(request.tableLabel)) return;
      map.set(
        request.tableLabel,
        request.type === 'waiter'
          ? { emoji: '🔔', label: dt('Demande serveur', 'Waiter requested') }
          : { emoji: '💶', label: dt('Demande addition', 'Bill requested') },
      );
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, requests, tableLabels]);

  const activeOrders = useMemo(() => orders.filter((order) => order.status !== 'done'), [orders]);
  const doneOrders = useMemo(() => orders.filter((order) => order.status === 'done').slice(0, 10), [orders]);
  const pendingCount = useMemo(
    () => orders.filter((order) => order.status === 'new').length + requests.length,
    [orders, requests],
  );

  // Fait clignoter le titre de l'onglet quand du personnel a laissé la page en arrière-plan
  // avec une commande ou une demande en attente, pour ne pas rater d'activité en Mode Service.
  useEffect(() => {
    const baseTitle = dt('Mode Service — Nourevo', 'Service Mode — Nourevo');
    if (pendingCount === 0) {
      document.title = baseTitle;
      return undefined;
    }
    let flashOn = false;
    const interval = window.setInterval(() => {
      if (document.hidden) {
        flashOn = !flashOn;
        document.title = flashOn ? dt(`🔔 (${pendingCount}) Nouvelle activité !`, `🔔 (${pendingCount}) New activity!`) : baseTitle;
      } else {
        document.title = baseTitle;
      }
    }, 1200);
    const handleVisibility = () => {
      if (!document.hidden) document.title = baseTitle;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.title = baseTitle;
    };
  }, [pendingCount]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-stone-900">{dt('Aucun restaurant', 'No restaurant')}</h1>
        <p className="text-stone-500">{dt("Créez votre restaurant avant d'utiliser le mode service.", 'Create your restaurant before using Service Mode.')}</p>
        <Link
          to="/dashboard"
          className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-6 py-3 text-sm font-bold text-white"
        >
          {dt('Aller au dashboard', 'Go to dashboard')}
        </Link>
      </div>
    );
  }

  return (
    <PinSectionGate restaurant={restaurant} section="service">
    <div className="min-h-screen bg-stone-50 pb-20">
      <header className="sticky top-0 z-40 border-b border-stone-900/5 bg-[#f6f8fb]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleLeaveClick}
              className="w-fit text-xs font-semibold uppercase tracking-[0.3em] text-navy-700"
            >
              {dt('← Retour au dashboard', '← Back to dashboard')}
            </button>
            <DashboardLanguageSwitch />
          </div>
          <p className="font-display text-lg font-semibold text-stone-900">{dt('Mode Service', 'Service Mode')} — {restaurant.name}</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-8">
        <section>
          <h2 className="font-display text-xl font-bold text-stone-900">{dt('Vue rapide des tables', 'Quick table view')}</h2>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {tableLabels.map((label) => {
              const status = tableStatus.get(label)!;
              return (
                <div key={label} className="rounded-2xl border border-stone-200 bg-white p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{dt('Table', 'Table')} {label}</p>
                  <p className="mt-2 text-2xl">{status.emoji}</p>
                  <p className="mt-1 text-xs text-stone-500">{status.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        {requests.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold text-stone-900">{dt('Demandes', 'Requests')}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-navy-300/40 bg-navy-300/10 p-5"
                >
                  <div>
                    <p className="font-semibold text-stone-900">
                      {request.type === 'waiter' ? '🔔' : '💶'} {dt('Table', 'Table')} {request.tableLabel}
                    </p>
                    <p className="text-sm text-stone-500">
                      {request.type === 'waiter' ? dt('Un client demande un serveur', 'A customer is requesting a waiter') : dt("Demande l'addition", 'Requesting the bill')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRequest(request)}
                    className="shrink-0 rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-4 py-2 text-xs font-bold text-white transition-all duration-300 hover:-translate-y-0.5"
                  >
                    {dt('Traiter', 'Handle')}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-stone-900">{dt('Commandes', 'Orders')}</h2>
            <button
              type="button"
              onClick={handleExportOrders}
              disabled={exportingOrders}
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700 disabled:opacity-60"
            >
              {exportingOrders ? dt('Export...', 'Exporting...') : dt('⬇️ Exporter (CSV)', '⬇️ Export (CSV)')}
            </button>
          </div>
          {activeOrders.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">{dt('Aucune commande en cours.', 'No orders in progress.')}</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {activeOrders.map((order) => (
                <div key={order.id} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-soft">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-lg font-bold text-stone-900">{dt('Table', 'Table')} {order.tableLabel}</p>
                    <span className="rounded-full bg-stone-900/5 px-3 py-1 text-xs font-semibold text-stone-500">
                      {dt(ORDER_STATUS_LABEL[order.status].fr, ORDER_STATUS_LABEL[order.status].en)}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-stone-600">
                    {order.items.map((item, index) => (
                      <li key={index}>
                        {item.name} x{item.quantity}
                      </li>
                    ))}
                  </ul>
                  {order.specialInstructions && (
                    <p className="mt-2 rounded-xl bg-stone-50 p-2 text-xs text-stone-500">
                      📝 {order.specialInstructions}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <p className="font-semibold text-stone-900">{dt('Total :', 'Total:')} {money(order.total)}</p>
                    <span className={`text-xs font-semibold ${order.paid ? 'text-emerald-600' : 'text-stone-400'}`}>
                      {order.paid ? dt('✅ Payé', '✅ Paid') : dt('⏳ À encaisser', '⏳ To collect')}
                    </span>
                  </div>
                  {NEXT_STATUS[order.status] && (
                    <button
                      type="button"
                      onClick={() => advanceOrder(order)}
                      className="mt-4 w-full rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5"
                    >
                      {dt(NEXT_ACTION_LABEL[order.status].fr, NEXT_ACTION_LABEL[order.status].en)}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {doneOrders.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold text-stone-900">{dt('Commandes terminées récemment', 'Recently completed orders')}</h2>
            <div className="mt-4 space-y-2">
              {doneOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm text-stone-500"
                >
                  <span>{dt('Table', 'Table')} {order.tableLabel}</span>
                  <span>{money(order.total)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {showPinModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-3xl bg-white p-8 text-center shadow-card">
            <p className="text-3xl">🔒</p>
            <h2 className="mt-3 font-display text-lg font-bold text-stone-900">{dt('Code requis', 'Code required')}</h2>
            <p className="mt-2 text-sm text-stone-500">
              {dt('Entrez le code à 4 chiffres pour retourner au dashboard complet.', 'Enter the 4-digit code to return to the full dashboard.')}
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              value={pinInput}
              onChange={(event) => {
                setPinError(false);
                setPinInput(event.target.value.replace(/\D/g, '').slice(0, 4));
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleValidatePin();
              }}
              className={`mt-5 w-full rounded-2xl border bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none transition-colors duration-300 ${
                pinError ? 'border-red-400' : 'border-stone-200 focus:border-navy-300'
              }`}
              placeholder="••••"
            />
            {pinError && <p className="mt-2 text-xs font-semibold text-red-500">{dt('Code incorrect.', 'Incorrect code.')}</p>}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="flex-1 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40"
              >
                {dt('Annuler', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleValidatePin}
                disabled={pinInput.length !== 4}
                className="flex-1 rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-4 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
              >
                {dt('Valider', 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PinSectionGate>
  );
}
