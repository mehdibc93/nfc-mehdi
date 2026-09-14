import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { LoadingScreen } from '../components/LoadingScreen';
import { PinSectionGate } from '../components/PinSectionGate';
import { STAFF_SECTIONS } from '../lib/staffMode';
import { slugify } from '../lib/slug';
import { DashboardLanguageSwitch } from '../components/DashboardLanguageSwitch';
import { useDt } from '../lib/dashboardLocale';
import { useOrderNotifications } from '../hooks/useOrderNotifications';
import { areNotificationsEnabled, setNotificationsEnabled } from '../lib/notificationPrefs';
import { getPushSubscriptionState, isPushSupported, subscribeToPush, unsubscribeFromPush } from '../lib/pushNotifications';
import type { PushState } from '../lib/pushNotifications';
import { DAY_LABELS_SHORT } from '../lib/discounts';
import { mapDiscountRule } from '../lib/mappers';
import type { DiscountRule } from '../lib/types';

type ConfigRestaurant = {
  id: string;
  slug: string;
  name: string;
  servicePin: string | null;
  pinProtectedSections: string[];
  reviewUrl: string | null;
};

export function ConfigurationPage() {
  const dt = useDt();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<ConfigRestaurant | null>(null);
  const [toast, setToast] = useState('');

  const [writingNfc, setWritingNfc] = useState(false);

  const [pinAction, setPinAction] = useState<'change' | 'remove' | null>(null);
  const [pinConfirmed, setPinConfirmed] = useState(false);
  const [pinConfirmValue, setPinConfirmValue] = useState('');
  const [pinNewValue, setPinNewValue] = useState('');
  const [pinError, setPinError] = useState('');

  const [reviewUrl, setReviewUrl] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);

  const [discountRules, setDiscountRulesState] = useState<DiscountRule[]>([]);
  const [newDiscountLabel, setNewDiscountLabel] = useState('');
  const [newDiscountPercent, setNewDiscountPercent] = useState('10');
  const [newDiscountDays, setNewDiscountDays] = useState<Set<number>>(new Set());
  const [newDiscountAllDay, setNewDiscountAllDay] = useState(true);
  const [newDiscountStart, setNewDiscountStart] = useState('17:00');
  const [newDiscountEnd, setNewDiscountEnd] = useState('19:00');
  const [savingDiscount, setSavingDiscount] = useState(false);

  const [editingSlug, setEditingSlug] = useState(false);
  const [slugInput, setSlugInput] = useState('');
  const [savingSlug, setSavingSlug] = useState(false);
  const [slugError, setSlugError] = useState('');

  const [notificationsEnabled, setNotificationsEnabledState] = useState(areNotificationsEnabled);
  const toggleNotifications = () => {
    const next = !notificationsEnabled;
    setNotificationsEnabledState(next);
    setNotificationsEnabled(next);
  };

  const [pushState, setPushState] = useState<PushState>('unsupported');
  const [pushBusy, setPushBusy] = useState(false);
  useEffect(() => {
    getPushSubscriptionState().then(setPushState);
  }, []);
  const togglePush = async () => {
    if (!restaurant || pushBusy) return;
    setPushBusy(true);
    try {
      if (pushState === 'subscribed') {
        await unsubscribeFromPush(restaurant.id);
        setPushState('unsubscribed');
      } else {
        await subscribeToPush(restaurant.id);
        setPushState('subscribed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'permission-denied') {
        setToast(
          dt(
            'Notifications bloquées par le navigateur — autorisez-les dans les réglages du site (icône à côté de l\'adresse).',
            'Notifications blocked by the browser — allow them in the site settings (icon next to the address bar).',
          ),
        );
      } else {
        setToast(dt('Échec de l\'activation des notifications push.', 'Failed to enable push notifications.'));
      }
    } finally {
      setPushBusy(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('restaurants')
        .select('id, slug, name, service_pin, pin_protected_sections, review_url')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!data) {
        setLoading(false);
        return;
      }
      setRestaurant({
        id: data.id,
        slug: data.slug,
        name: data.name,
        servicePin: data.service_pin,
        pinProtectedSections: data.pin_protected_sections ?? [],
        reviewUrl: data.review_url,
      });
      setReviewUrl(data.review_url ?? '');
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!restaurant) return undefined;
    let cancelled = false;
    supabase
      .from('discount_rules')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!cancelled && data) setDiscountRulesState(data.map(mapDiscountRule));
      });
    return () => {
      cancelled = true;
    };
  }, [restaurant?.id]);

  const toggleNewDiscountDay = (day: number) => {
    setNewDiscountDays((current) => {
      const next = new Set(current);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const createDiscountRule = async () => {
    if (!restaurant || newDiscountDays.size === 0) return;
    const percent = Number.parseFloat(newDiscountPercent);
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      setToast(dt('Pourcentage invalide.', 'Invalid percentage.'));
      return;
    }
    setSavingDiscount(true);
    const { data, error } = await supabase
      .from('discount_rules')
      .insert({
        restaurant_id: restaurant.id,
        label: newDiscountLabel.trim(),
        percent,
        days_of_week: Array.from(newDiscountDays),
        start_time: newDiscountAllDay ? null : newDiscountStart,
        end_time: newDiscountAllDay ? null : newDiscountEnd,
      })
      .select('*')
      .single();
    setSavingDiscount(false);
    if (error || !data) {
      setToast(
        dt(`Échec de la création : ${error?.message ?? 'erreur inconnue'}`, `Failed to create: ${error?.message ?? 'unknown error'}`),
      );
      return;
    }
    setDiscountRulesState((current) => [...current, mapDiscountRule(data)]);
    setNewDiscountLabel('');
    setNewDiscountPercent('10');
    setNewDiscountDays(new Set());
    setNewDiscountAllDay(true);
    setToast(dt('Réduction créée !', 'Discount created!'));
  };

  const toggleDiscountActive = async (rule: DiscountRule) => {
    setDiscountRulesState((current) => current.map((r) => (r.id === rule.id ? { ...r, active: !r.active } : r)));
    const { error } = await supabase.from('discount_rules').update({ active: !rule.active }).eq('id', rule.id);
    if (error) setToast(dt(`Échec : ${error.message}`, `Failed: ${error.message}`));
  };

  const deleteDiscountRule = async (ruleId: string) => {
    if (!window.confirm(dt('Supprimer cette réduction ?', 'Delete this discount?'))) return;
    setDiscountRulesState((current) => current.filter((r) => r.id !== ruleId));
    const { error } = await supabase.from('discount_rules').delete().eq('id', ruleId);
    if (error) setToast(dt(`Échec de la suppression : ${error.message}`, `Delete failed: ${error.message}`));
  };

  const updateRestaurantField = async (patch: Partial<Pick<ConfigRestaurant, 'servicePin' | 'pinProtectedSections'>>) => {
    if (!restaurant) return;
    setRestaurant((current) => (current ? { ...current, ...patch } : current));
    const dbPatch: Record<string, unknown> = {};
    if (patch.servicePin !== undefined) dbPatch.service_pin = patch.servicePin;
    if (patch.pinProtectedSections !== undefined) dbPatch.pin_protected_sections = patch.pinProtectedSections;
    const { error } = await supabase.from('restaurants').update(dbPatch).eq('id', restaurant.id);
    if (error) setToast(dt(`Échec de l'enregistrement : ${error.message}`, `Save failed: ${error.message}`));
  };

  const copyNfcLink = () => {
    if (!restaurant) return;
    const url = `${window.location.origin}/r/${restaurant.slug}?nfc=1`;
    navigator.clipboard?.writeText(url).then(() => setToast(dt('Lien copié !', 'Link copied!')));
  };

  const startEditSlug = () => {
    if (!restaurant) return;
    setSlugInput(restaurant.slug);
    setSlugError('');
    setEditingSlug(true);
  };

  const cancelEditSlug = () => {
    setEditingSlug(false);
    setSlugError('');
  };

  const saveSlug = async () => {
    if (!restaurant) return;
    const nextSlug = slugify(slugInput);
    if (nextSlug === restaurant.slug) {
      setEditingSlug(false);
      return;
    }
    if (
      !window.confirm(
        dt(
          "Changer ce lien rendra invalide toute carte NFC déjà programmée avec l'ancien lien : elle devra être reprogrammée. Continuer ?",
          'Changing this link will invalidate any NFC card already programmed with the old link: it will need to be reprogrammed. Continue?',
        ),
      )
    ) {
      return;
    }
    setSavingSlug(true);
    setSlugError('');
    const { error } = await supabase.from('restaurants').update({ slug: nextSlug }).eq('id', restaurant.id);
    setSavingSlug(false);
    if (error) {
      setSlugError(
        error.code === '23505'
          ? dt('Ce lien est déjà utilisé par un autre restaurant, choisissez-en un autre.', 'This link is already used by another restaurant, choose a different one.')
          : error.message,
      );
      return;
    }
    setRestaurant({ ...restaurant, slug: nextSlug });
    setEditingSlug(false);
    setToast(dt('Lien mis à jour !', 'Link updated!'));
  };

  const nfcSupported = typeof window !== 'undefined' && Boolean(window.NDEFReader);
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  const handleWriteNfc = async () => {
    if (!restaurant || !window.NDEFReader) return;
    setWritingNfc(true);
    try {
      const reader = new window.NDEFReader();
      const url = `${window.location.origin}/r/${restaurant.slug}?nfc=1`;
      await reader.write({ records: [{ recordType: 'url', data: url }] });
      setToast(dt('Carte NFC programmée avec succès !', 'NFC card programmed successfully!'));
    } catch (err) {
      setToast(
        dt(
          `Échec de l'écriture : ${err instanceof Error ? err.message : 'approchez une carte NFC vierge et réessayez'}`,
          `Write failed: ${err instanceof Error ? err.message : 'bring a blank NFC card close and try again'}`,
        ),
      );
    } finally {
      setWritingNfc(false);
    }
  };

  const resetPinFlow = () => {
    setPinAction(null);
    setPinConfirmed(false);
    setPinConfirmValue('');
    setPinNewValue('');
    setPinError('');
  };

  const startPinAction = (action: 'change' | 'remove') => {
    setPinAction(action);
    setPinConfirmValue('');
    setPinNewValue('');
    setPinError('');
    setPinConfirmed(!restaurant?.servicePin);
  };

  const confirmCurrentPin = () => {
    if (!restaurant) return;
    if (pinConfirmValue === restaurant.servicePin) {
      setPinConfirmed(true);
      setPinError('');
    } else {
      setPinError(dt('Code actuel incorrect.', 'Incorrect current code.'));
      setPinConfirmValue('');
    }
  };

  const savePinRemoval = async () => {
    await updateRestaurantField({ servicePin: null });
    setToast(dt('Code PIN retiré.', 'PIN code removed.'));
    resetPinFlow();
  };

  const saveNewPin = async () => {
    if (pinNewValue.length !== 4) {
      setPinError(dt('Le code doit contenir 4 chiffres.', 'The code must contain 4 digits.'));
      return;
    }
    await updateRestaurantField({ servicePin: pinNewValue });
    setToast(dt('Code PIN mis à jour.', 'PIN code updated.'));
    resetPinFlow();
  };

  const handleSaveReview = async () => {
    if (!restaurant) return;
    setSavingReview(true);
    const { error } = await supabase
      .from('restaurants')
      .update({ review_url: reviewUrl || null })
      .eq('id', restaurant.id);
    setSavingReview(false);
    if (!error) {
      setRestaurant({ ...restaurant, reviewUrl: reviewUrl || null });
      setReviewSaved(true);
      window.setTimeout(() => setReviewSaved(false), 2000);
    }
  };

  useOrderNotifications(restaurant);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-stone-900">{dt('Aucun restaurant', 'No restaurant')}</h1>
        <p className="text-stone-500">{dt("Créez votre restaurant avant d'accéder à la configuration.", 'Create your restaurant before accessing settings.')}</p>
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
    <PinSectionGate restaurant={restaurant} section="configuration">
      <div className="min-h-screen pb-20">
        <header className="sticky top-0 z-40 border-b border-stone-900/5 bg-[#f6f8fb]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-3xl flex-col gap-1 px-4 py-5 sm:px-8">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-lg font-semibold text-stone-900">{dt('Configuration', 'Settings')} — {restaurant.name}</p>
              <DashboardLanguageSwitch />
            </div>
            <Link to="/dashboard" className="text-xs font-semibold uppercase tracking-[0.3em] text-navy-700">
              {dt('← Retour au dashboard', '← Back to dashboard')}
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-8">
          {/* Carte NFC */}
          <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
            <h2 className="font-display text-xl font-bold text-stone-900">{dt('📲 Carte NFC', '📲 NFC card')}</h2>
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-navy-300/25 bg-navy-300/8 p-4">
              <span className="text-sm text-stone-600">{dt('Lien à associer à votre tag NFC :', 'Link to associate with your NFC tag:')}</span>
              {editingSlug ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-stone-500">{window.location.origin}/r/</span>
                  <input
                    type="text"
                    value={slugInput}
                    onChange={(event) => setSlugInput(event.target.value)}
                    className="rounded-full border border-navy-300/40 bg-white px-3 py-1.5 text-xs text-stone-700 focus:border-navy-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={saveSlug}
                    disabled={savingSlug || !slugInput.trim()}
                    className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-4 py-1.5 text-xs font-bold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {savingSlug ? dt('Enregistrement...', 'Saving...') : dt('Enregistrer', 'Save')}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditSlug}
                    disabled={savingSlug}
                    className="rounded-full border border-stone-300 bg-white px-4 py-1.5 text-xs font-bold text-stone-600 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    {dt('Annuler', 'Cancel')}
                  </button>
                  {slugError && <span className="w-full text-xs font-semibold text-red-600">{slugError}</span>}
                </div>
              ) : (
                <>
                  <code className="rounded-full bg-white px-3 py-1.5 text-xs text-stone-700">
                    {window.location.origin}/r/{restaurant.slug}
                  </code>
                  <button
                    type="button"
                    onClick={copyNfcLink}
                    className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-4 py-1.5 text-xs font-bold text-white transition-all duration-300 hover:-translate-y-0.5"
                  >
                    {dt('Copier', 'Copy')}
                  </button>
                  <button
                    type="button"
                    onClick={startEditSlug}
                    className="rounded-full border border-navy-400 bg-white px-4 py-1.5 text-xs font-bold text-navy-700 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    {dt('✎ Modifier', '✎ Edit')}
                  </button>
                </>
              )}
              {!editingSlug && nfcSupported ? (
                <button
                  type="button"
                  onClick={handleWriteNfc}
                  disabled={writingNfc}
                  className="rounded-full border border-navy-400 bg-white px-4 py-1.5 text-xs font-bold text-navy-700 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {writingNfc ? dt('Approchez la carte...', 'Bring the card close...') : dt('📲 Écrire sur une carte NFC', '📲 Write to an NFC card')}
                </button>
              ) : isIOS ? (
                <span className="text-xs text-stone-500">
                  {dt('Écriture NFC indisponible sur iPhone (limite Apple, pas de notre site). Copiez le lien ci-dessus et collez-le dans une app gratuite comme', 'NFC writing is unavailable on iPhone (an Apple limitation, not our site). Copy the link above and paste it into a free app like')}{' '}
                  <a
                    href="https://apps.apple.com/app/nfc-tools/id1252962749"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-navy-700 underline"
                  >
                    NFC Tools
                  </a>{' '}
                  {dt('pour programmer votre carte en 30 secondes.', 'to program your card in 30 seconds.')}
                </span>
              ) : (
                <span className="text-xs text-stone-500" title={dt('Fonctionne uniquement sur Chrome pour Android', 'Only works on Chrome for Android')}>
                  {dt('Écriture NFC : ouvrez cette page sur Chrome Android pour programmer une carte directement', 'NFC writing: open this page on Chrome for Android to program a card directly')}
                </span>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-stone-900">{dt('🔔 Notifications', '🔔 Notifications')}</h2>
                <p className="mt-2 text-sm text-stone-500">
                  {dt(
                    "Son et notification affichés dès qu'une commande ou une demande client arrive, tant qu'une page du dashboard reste ouverte quelque part.",
                    'Sound and popup shown as soon as an order or customer request comes in, as long as a dashboard page stays open somewhere.',
                  )}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notificationsEnabled}
                onClick={toggleNotifications}
                className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-300 ${
                  notificationsEnabled ? 'justify-end bg-emerald-500' : 'justify-start bg-stone-300'
                }`}
              >
                <span className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300" />
              </button>
            </div>
            {notificationsEnabled &&
              typeof window !== 'undefined' &&
              'Notification' in window &&
              Notification.permission === 'denied' && (
                <p className="mt-3 text-xs text-red-500">
                  {dt(
                    "Les notifications sont bloquées au niveau de votre navigateur — le son restera actif, mais la popup système n'apparaîtra pas tant que vous ne l'autorisez pas dans les réglages du site (icône à côté de l'adresse).",
                    "Notifications are blocked at the browser level — the sound will still play, but the system popup won't show until you allow it in the site settings (icon next to the address bar).",
                  )}
                </p>
              )}
          </div>

          {/* Notifications push */}
          {isPushSupported() && (
            <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-stone-900">
                    {dt('🔔 Notifications push', '🔔 Push notifications')}
                  </h2>
                  <p className="mt-2 text-sm text-stone-500">
                    {dt(
                      "Reçues sur cet appareil même si le dashboard n'est pas ouvert dans un onglet — utile sur votre téléphone pour ne rater aucune commande ni demande client.",
                      "Received on this device even when the dashboard isn't open in a tab — handy on your phone so you never miss an order or customer request.",
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={pushState === 'subscribed'}
                  disabled={pushBusy}
                  onClick={togglePush}
                  className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-300 disabled:opacity-50 ${
                    pushState === 'subscribed' ? 'justify-end bg-emerald-500' : 'justify-start bg-stone-300'
                  }`}
                >
                  <span className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300" />
                </button>
              </div>
            </div>
          )}

          {/* Code PIN */}
          <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
            <h2 className="font-display text-xl font-bold text-stone-900">{dt('🔒 Code PIN — Mode Service', '🔒 PIN code — Service Mode')}</h2>
            <p className="mt-2 text-sm text-stone-500">
              {dt(
                "Demandé pour quitter le Mode Service — utile si vous laissez une tablette à un serveur. Modifier ou retirer le code nécessite de connaître le code actuel, même depuis le dashboard, pour éviter qu'un serveur désactive lui-même la protection.",
                "Required to leave Service Mode — useful if you hand a tablet to a server. Changing or removing the code requires knowing the current code, even from the dashboard, so a server can't disable the protection themselves.",
              )}
            </p>

            {pinAction === null && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {restaurant.servicePin ? (
                  <>
                    <span className="rounded-full bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-700">
                      {dt('🔒 Code activé', '🔒 Code enabled')}
                    </span>
                    <button
                      type="button"
                      onClick={() => startPinAction('change')}
                      className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:border-navy-300 hover:text-navy-700"
                    >
                      {dt('Modifier', 'Edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => startPinAction('remove')}
                      className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:border-red-300 hover:text-red-600"
                    >
                      {dt('Retirer', 'Remove')}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => startPinAction('change')}
                    className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:border-navy-300 hover:text-navy-700"
                  >
                    {dt('Définir un code PIN', 'Set a PIN code')}
                  </button>
                )}
              </div>
            )}

            {pinAction !== null && !pinConfirmed && (
              <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-3">
                <p className="text-xs font-semibold text-stone-600">{dt('Entrez le code actuel pour continuer', 'Enter the current code to continue')}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinConfirmValue}
                    onChange={(event) => {
                      setPinConfirmValue(event.target.value.replace(/\D/g, '').slice(0, 4));
                      setPinError('');
                    }}
                    onKeyDown={(event) => event.key === 'Enter' && confirmCurrentPin()}
                    placeholder="••••"
                    className="w-24 rounded-xl border border-stone-200 bg-white px-3 py-2 text-center text-sm tracking-[0.3em] text-stone-700 outline-none focus:border-navy-300"
                  />
                  <button
                    type="button"
                    onClick={confirmCurrentPin}
                    className="rounded-full bg-navy-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy-800"
                  >
                    {dt('Valider', 'Confirm')}
                  </button>
                  <button
                    type="button"
                    onClick={resetPinFlow}
                    className="rounded-full px-3 py-2 text-xs font-semibold text-stone-400 transition hover:text-stone-600"
                  >
                    {dt('Annuler', 'Cancel')}
                  </button>
                </div>
                {pinError && <p className="mt-1.5 text-xs font-normal text-red-600">{pinError}</p>}
              </div>
            )}

            {pinAction === 'change' && pinConfirmed && (
              <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-3">
                <p className="text-xs font-semibold text-stone-600">{dt('Nouveau code (4 chiffres)', 'New code (4 digits)')}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinNewValue}
                    onChange={(event) => {
                      setPinNewValue(event.target.value.replace(/\D/g, '').slice(0, 4));
                      setPinError('');
                    }}
                    onKeyDown={(event) => event.key === 'Enter' && saveNewPin()}
                    placeholder={dt('Ex : 1234', 'E.g. 1234')}
                    className="w-24 rounded-xl border border-stone-200 bg-white px-3 py-2 text-center text-sm tracking-[0.3em] text-stone-700 outline-none focus:border-navy-300"
                  />
                  <button
                    type="button"
                    onClick={saveNewPin}
                    className="rounded-full bg-navy-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy-800"
                  >
                    {dt('Enregistrer', 'Save')}
                  </button>
                  <button
                    type="button"
                    onClick={resetPinFlow}
                    className="rounded-full px-3 py-2 text-xs font-semibold text-stone-400 transition hover:text-stone-600"
                  >
                    {dt('Annuler', 'Cancel')}
                  </button>
                </div>
                {pinError && <p className="mt-1.5 text-xs font-normal text-red-600">{pinError}</p>}
              </div>
            )}

            {pinAction === 'remove' && pinConfirmed && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-700">{dt('Retirer définitivement la protection par code ?', 'Permanently remove the code protection?')}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={savePinRemoval}
                    className="rounded-full bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                  >
                    {dt('Oui, retirer', 'Yes, remove it')}
                  </button>
                  <button
                    type="button"
                    onClick={resetPinFlow}
                    className="rounded-full px-3 py-2 text-xs font-semibold text-stone-500 transition hover:text-stone-700"
                  >
                    {dt('Annuler', 'Cancel')}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-stone-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                {dt('Pages protégées par le code PIN', 'Pages protected by the PIN code')}{' '}
                <span className="font-normal normal-case tracking-normal text-stone-400">
                  ({dt('cochez une page pour qu\'elle demande le code à l\'ouverture', 'check a page so it asks for the code on open')})
                </span>
              </p>
              {!restaurant.servicePin ? (
                <p className="mt-1.5 text-xs text-stone-400">
                  {dt("Configurez d'abord un code PIN ci-dessus pour pouvoir protéger des pages.", 'Set up a PIN code above first to be able to protect pages.')}
                </p>
              ) : (
                <>
                  <p className="mt-1.5 text-xs text-stone-500">
                    {dt("Le code sera redemandé à chaque ouverture d'une page cochée, à chaque fois.", 'The code will be asked for every time a checked page is opened.')}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {STAFF_SECTIONS.map((section) => {
                      const checked = restaurant.pinProtectedSections.includes(section.key);
                      return (
                        <button
                          key={section.key}
                          type="button"
                          onClick={() =>
                            updateRestaurantField({
                              pinProtectedSections: checked
                                ? restaurant.pinProtectedSections.filter((key) => key !== section.key)
                                : [...restaurant.pinProtectedSections, section.key],
                            })
                          }
                          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ${
                            checked
                              ? 'border-navy-400 bg-navy-300/15 text-navy-700'
                              : 'border-stone-200 bg-white text-stone-500 hover:border-navy-300/40'
                          }`}
                        >
                          {checked ? '🔒' : '🔓'} {section.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Avis client */}
          <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
            <h2 className="font-display text-xl font-bold text-stone-900">{dt('⭐ Avis client', '⭐ Customer reviews')}</h2>
            <p className="mt-2 text-sm text-stone-500">
              {dt(
                'Affiché à vos clients pendant l\'attente de leur commande, avec un bouton "Laisser un avis". Pour l\'obtenir sur Google : Google Business Profile → "Demander des avis" → copier le lien.',
                'Shown to your customers while they wait for their order, with a "Leave a review" button. To get it from Google: Google Business Profile → "Ask for reviews" → copy the link.',
              )}
            </p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
              {dt("Lien vers votre page d'avis", 'Link to your review page')}{' '}
              <span className="font-normal normal-case tracking-normal text-stone-500">({dt('facultatif', 'optional')})</span>
              <input
                type="url"
                value={reviewUrl}
                onChange={(event) => setReviewUrl(event.target.value)}
                placeholder="https://g.page/r/votre-restaurant/review"
                className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none focus:border-navy-300"
              />
            </label>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveReview}
                disabled={savingReview}
                className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
              >
                {savingReview ? dt('Enregistrement...', 'Saving...') : dt('Enregistrer', 'Save')}
              </button>
              {reviewSaved && <span className="text-sm font-semibold text-emerald-600">{dt('✓ Enregistré', '✓ Saved')}</span>}
            </div>
          </div>

          {/* Réductions automatiques */}
          <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
            <h2 className="font-display text-xl font-bold text-stone-900">{dt('🏷️ Réductions automatiques', '🏷️ Automatic discounts')}</h2>
            <p className="mt-2 text-sm text-stone-500">
              {dt(
                "Réduction appliquée automatiquement sur tout le menu selon le jour et l'horaire — aucune action requise du client (ex : -10% tous les mardis, ou -20% de 17h à 19h). Si plusieurs réductions sont actives en même temps, la plus avantageuse pour le client s'applique.",
                'Discount applied automatically to the whole menu based on day and time — no action needed from the customer (e.g. -10% every Tuesday, or -20% from 5pm to 7pm). If several discounts are active at once, the best one for the customer applies.',
              )}
            </p>

            {discountRules.length > 0 && (
              <div className="mt-4 space-y-2">
                {discountRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50/60 p-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-900">
                        {rule.label || dt('Réduction', 'Discount')} — {rule.percent}%
                      </p>
                      <p className="text-xs text-stone-500">
                        {DAY_LABELS_SHORT.filter((day) => rule.daysOfWeek.includes(day.value))
                          .map((day) => dt(day.fr, day.en))
                          .join(', ')}
                        {' · '}
                        {rule.startTime && rule.endTime
                          ? `${rule.startTime}–${rule.endTime}`
                          : dt('Toute la journée', 'All day')}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={rule.active}
                        onClick={() => toggleDiscountActive(rule)}
                        className={`flex h-6 w-11 items-center rounded-full p-1 transition-colors duration-300 ${
                          rule.active ? 'justify-end bg-emerald-500' : 'justify-start bg-stone-300'
                        }`}
                      >
                        <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDiscountRule(rule.id)}
                        className="text-xs font-semibold text-red-500 hover:text-red-600"
                      >
                        {dt('Supprimer', 'Delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-dashed border-navy-300/60 bg-navy-300/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                {dt('Nouvelle réduction', 'New discount')}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-stone-500">
                  {dt('Nom (facultatif)', 'Name (optional)')}
                  <input
                    value={newDiscountLabel}
                    onChange={(event) => setNewDiscountLabel(event.target.value)}
                    placeholder={dt('Ex : Happy hour', 'E.g.: Happy hour')}
                    className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-normal text-stone-700 outline-none focus:border-navy-300"
                  />
                </label>
                <label className="block text-xs font-semibold text-stone-500">
                  {dt('Réduction (%)', 'Discount (%)')}
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newDiscountPercent}
                    onChange={(event) => setNewDiscountPercent(event.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-normal text-stone-700 outline-none focus:border-navy-300"
                  />
                </label>
              </div>

              <p className="mt-3 text-xs font-semibold text-stone-500">{dt('Jours', 'Days')}</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {DAY_LABELS_SHORT.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleNewDiscountDay(day.value)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ${
                      newDiscountDays.has(day.value)
                        ? 'border-navy-400 bg-navy-300/15 text-navy-700'
                        : 'border-stone-200 bg-white text-stone-500 hover:border-navy-300/40'
                    }`}
                  >
                    {dt(day.fr, day.en)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setNewDiscountDays(new Set(DAY_LABELS_SHORT.map((day) => day.value)))}
                  className="rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-500 transition-all duration-300 hover:border-navy-300/40"
                >
                  {dt('Tous les jours', 'Every day')}
                </button>
              </div>

              <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-stone-500">
                <input
                  type="checkbox"
                  checked={newDiscountAllDay}
                  onChange={(event) => setNewDiscountAllDay(event.target.checked)}
                  className="h-4 w-4 rounded border-stone-300"
                />
                {dt('Toute la journée', 'All day')}
              </label>
              {!newDiscountAllDay && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="time"
                    value={newDiscountStart}
                    onChange={(event) => setNewDiscountStart(event.target.value)}
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 outline-none focus:border-navy-300"
                  />
                  <span className="text-xs text-stone-400">{dt('à', 'to')}</span>
                  <input
                    type="time"
                    value={newDiscountEnd}
                    onChange={(event) => setNewDiscountEnd(event.target.value)}
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 outline-none focus:border-navy-300"
                  />
                </div>
              )}

              <button
                type="button"
                disabled={newDiscountDays.size === 0 || savingDiscount}
                onClick={createDiscountRule}
                className="mt-4 rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
              >
                {savingDiscount ? dt('Création...', 'Creating...') : dt('+ Créer la réduction', '+ Create discount')}
              </button>
            </div>
          </div>
        </main>

        {toast && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </PinSectionGate>
  );
}
