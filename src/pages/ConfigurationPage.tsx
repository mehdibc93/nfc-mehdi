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
