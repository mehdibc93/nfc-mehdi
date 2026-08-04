import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { LoadingScreen } from '../components/LoadingScreen';
import { PinSectionGate } from '../components/PinSectionGate';
import { STAFF_SECTIONS } from '../lib/staffMode';

type ConfigRestaurant = {
  id: string;
  slug: string;
  name: string;
  servicePin: string | null;
  pinProtectedSections: string[];
  reviewUrl: string | null;
};

export function ConfigurationPage() {
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
    if (error) setToast(`Échec de l'enregistrement : ${error.message}`);
  };

  const copyNfcLink = () => {
    if (!restaurant) return;
    const url = `${window.location.origin}/r/${restaurant.slug}`;
    navigator.clipboard?.writeText(url).then(() => setToast('Lien copié !'));
  };

  const nfcSupported = typeof window !== 'undefined' && Boolean(window.NDEFReader);
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  const handleWriteNfc = async () => {
    if (!restaurant || !window.NDEFReader) return;
    setWritingNfc(true);
    try {
      const reader = new window.NDEFReader();
      const url = `${window.location.origin}/r/${restaurant.slug}`;
      await reader.write({ records: [{ recordType: 'url', data: url }] });
      setToast('Carte NFC programmée avec succès !');
    } catch (err) {
      setToast(
        `Échec de l'écriture : ${err instanceof Error ? err.message : 'approchez une carte NFC vierge et réessayez'}`,
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
      setPinError('Code actuel incorrect.');
      setPinConfirmValue('');
    }
  };

  const savePinRemoval = async () => {
    await updateRestaurantField({ servicePin: null });
    setToast('Code PIN retiré.');
    resetPinFlow();
  };

  const saveNewPin = async () => {
    if (pinNewValue.length !== 4) {
      setPinError('Le code doit contenir 4 chiffres.');
      return;
    }
    await updateRestaurantField({ servicePin: pinNewValue });
    setToast('Code PIN mis à jour.');
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

  if (loading) {
    return <LoadingScreen />;
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-stone-900">Aucun restaurant</h1>
        <p className="text-stone-500">Créez votre restaurant avant d'accéder à la configuration.</p>
        <Link
          to="/dashboard"
          className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-6 py-3 text-sm font-bold text-white"
        >
          Aller au dashboard
        </Link>
      </div>
    );
  }

  return (
    <PinSectionGate restaurant={restaurant} section="configuration">
      <div className="min-h-screen pb-20">
        <header className="sticky top-0 z-40 border-b border-stone-900/5 bg-[#f6f8fb]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-3xl flex-col gap-1 px-4 py-5 sm:px-8">
            <p className="font-display text-lg font-semibold text-stone-900">Configuration — {restaurant.name}</p>
            <Link to="/dashboard" className="text-xs font-semibold uppercase tracking-[0.3em] text-navy-700">
              ← Retour au dashboard
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-8">
          {/* Carte NFC */}
          <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
            <h2 className="font-display text-xl font-bold text-stone-900">📲 Carte NFC</h2>
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-navy-300/25 bg-navy-300/8 p-4">
              <span className="text-sm text-stone-600">Lien à associer à votre tag NFC :</span>
              <code className="rounded-full bg-white px-3 py-1.5 text-xs text-stone-700">
                {window.location.origin}/r/{restaurant.slug}
              </code>
              <button
                type="button"
                onClick={copyNfcLink}
                className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-4 py-1.5 text-xs font-bold text-white transition-all duration-300 hover:-translate-y-0.5"
              >
                Copier
              </button>
              {nfcSupported ? (
                <button
                  type="button"
                  onClick={handleWriteNfc}
                  disabled={writingNfc}
                  className="rounded-full border border-navy-400 bg-white px-4 py-1.5 text-xs font-bold text-navy-700 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {writingNfc ? 'Approchez la carte...' : '📲 Écrire sur une carte NFC'}
                </button>
              ) : isIOS ? (
                <span className="text-xs text-stone-500">
                  Écriture NFC indisponible sur iPhone (limite Apple, pas de notre site). Copiez le lien ci-dessus et
                  collez-le dans une app gratuite comme{' '}
                  <a
                    href="https://apps.apple.com/app/nfc-tools/id1252962749"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-navy-700 underline"
                  >
                    NFC Tools
                  </a>{' '}
                  pour programmer votre carte en 30 secondes.
                </span>
              ) : (
                <span className="text-xs text-stone-500" title="Fonctionne uniquement sur Chrome pour Android">
                  Écriture NFC : ouvrez cette page sur Chrome Android pour programmer une carte directement
                </span>
              )}
            </div>
          </div>

          {/* Code PIN */}
          <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
            <h2 className="font-display text-xl font-bold text-stone-900">🔒 Code PIN — Mode Service</h2>
            <p className="mt-2 text-sm text-stone-500">
              Demandé pour quitter le Mode Service — utile si vous laissez une tablette à un serveur. Modifier ou
              retirer le code nécessite de connaître le code actuel, même depuis le dashboard, pour éviter qu'un
              serveur désactive lui-même la protection.
            </p>

            {pinAction === null && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {restaurant.servicePin ? (
                  <>
                    <span className="rounded-full bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-700">
                      🔒 Code activé
                    </span>
                    <button
                      type="button"
                      onClick={() => startPinAction('change')}
                      className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:border-navy-300 hover:text-navy-700"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => startPinAction('remove')}
                      className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:border-red-300 hover:text-red-600"
                    >
                      Retirer
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => startPinAction('change')}
                    className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:border-navy-300 hover:text-navy-700"
                  >
                    Définir un code PIN
                  </button>
                )}
              </div>
            )}

            {pinAction !== null && !pinConfirmed && (
              <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-3">
                <p className="text-xs font-semibold text-stone-600">Entrez le code actuel pour continuer</p>
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
                    Valider
                  </button>
                  <button
                    type="button"
                    onClick={resetPinFlow}
                    className="rounded-full px-3 py-2 text-xs font-semibold text-stone-400 transition hover:text-stone-600"
                  >
                    Annuler
                  </button>
                </div>
                {pinError && <p className="mt-1.5 text-xs font-normal text-red-600">{pinError}</p>}
              </div>
            )}

            {pinAction === 'change' && pinConfirmed && (
              <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-3">
                <p className="text-xs font-semibold text-stone-600">Nouveau code (4 chiffres)</p>
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
                    placeholder="Ex : 1234"
                    className="w-24 rounded-xl border border-stone-200 bg-white px-3 py-2 text-center text-sm tracking-[0.3em] text-stone-700 outline-none focus:border-navy-300"
                  />
                  <button
                    type="button"
                    onClick={saveNewPin}
                    className="rounded-full bg-navy-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy-800"
                  >
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={resetPinFlow}
                    className="rounded-full px-3 py-2 text-xs font-semibold text-stone-400 transition hover:text-stone-600"
                  >
                    Annuler
                  </button>
                </div>
                {pinError && <p className="mt-1.5 text-xs font-normal text-red-600">{pinError}</p>}
              </div>
            )}

            {pinAction === 'remove' && pinConfirmed && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-700">Retirer définitivement la protection par code ?</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={savePinRemoval}
                    className="rounded-full bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                  >
                    Oui, retirer
                  </button>
                  <button
                    type="button"
                    onClick={resetPinFlow}
                    className="rounded-full px-3 py-2 text-xs font-semibold text-stone-500 transition hover:text-stone-700"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-stone-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                Pages protégées par le code PIN{' '}
                <span className="font-normal normal-case tracking-normal text-stone-400">
                  (cochez une page pour qu'elle demande le code à l'ouverture)
                </span>
              </p>
              {!restaurant.servicePin ? (
                <p className="mt-1.5 text-xs text-stone-400">
                  Configurez d'abord un code PIN ci-dessus pour pouvoir protéger des pages.
                </p>
              ) : (
                <>
                  <p className="mt-1.5 text-xs text-stone-500">
                    Le code sera redemandé à chaque ouverture d'une page cochée, à chaque fois.
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
            <h2 className="font-display text-xl font-bold text-stone-900">⭐ Avis client</h2>
            <p className="mt-2 text-sm text-stone-500">
              Affiché à vos clients pendant l'attente de leur commande, avec un bouton "Laisser un avis". Pour
              l'obtenir sur Google : Google Business Profile → "Demander des avis" → copier le lien.
            </p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
              Lien vers votre page d'avis{' '}
              <span className="font-normal normal-case tracking-normal text-stone-500">(facultatif)</span>
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
                {savingReview ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              {reviewSaved && <span className="text-sm font-semibold text-emerald-600">✓ Enregistré</span>}
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
