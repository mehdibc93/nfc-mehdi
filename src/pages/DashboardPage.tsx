import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { mapCategory, mapDish, mapRestaurantWithMenu, toDishRowPatch, toRestaurantRowPatch } from '../lib/mappers';
import type { Dish, RestaurantWithMenu } from '../lib/types';
import { slugify } from '../lib/slug';
import { money } from '../lib/format';
import { translateDishFields, translateRestaurantFields } from '../lib/translate';
import { LOCALES } from '../lib/i18n';
import { MAX_VIDEO_SIZE_MB, uploadPhoto, uploadVideo } from '../lib/storage';
import { ALLERGENS, DIET_TAGS } from '../lib/dietInfo';
import { INTRO_VIDEOS } from '../lib/introVideos';
import { WAIT_ANIMATIONS, getWaitAnimationId } from '../lib/waitAnimations';
import { MENU_SERVICES } from '../lib/menuSlots';
import { DAY_KEYS, DAY_LABELS, defaultOpeningHours } from '../lib/openingHours';
import { HERO_PRESETS } from '../lib/heroPresets';
import { PinSectionGate } from '../components/PinSectionGate';
import logoHorizontal from '../assets/logo-horizontal.png';
import type { DayKey, DayHours } from '../lib/types';
import {
  PROFITABILITY_TIER_EMOJI,
  PROFITABILITY_TIER_LABEL,
  getDishMargin,
  getDishMarginRate,
  getDishTotalCost,
  getProfitabilityTier,
} from '../lib/profitability';
import { LoadingScreen } from '../components/LoadingScreen';
import { DashboardLanguageSwitch } from '../components/DashboardLanguageSwitch';
import { useDt } from '../lib/dashboardLocale';

const TARGET_LOCALES = LOCALES.filter((locale) => locale.code !== 'fr');
const DEFAULT_CATEGORY_NAMES = ['Entrées', 'Plats', 'Desserts', 'Boissons'];
const ACCENT_PRESETS = ['#1c2f47', '#6b2737', '#2f5233', '#a5522d', '#4a2545', '#1f2328'];
const SUBSCRIPTION_PLAN_LABELS: Record<'monthly' | 'annual_monthly' | 'annual_upfront', { fr: string; en: string }> = {
  monthly: { fr: '59€/mois', en: '€59/month' },
  annual_monthly: { fr: '54€/mois (engagement 1 an)', en: '€54/month (12-month commitment)' },
  annual_upfront: { fr: '588€/an', en: '€588/year' },
};

export function DashboardPage() {
  const dt = useDt();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routeTab: 'menu' | 'restaurant' | 'payments' | null =
    location.pathname === '/dashboard/carte'
      ? 'menu'
      : location.pathname === '/dashboard/restaurant'
        ? 'restaurant'
        : location.pathname === '/dashboard/paiements'
          ? 'payments'
          : null;
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<RestaurantWithMenu | null>(null);
  const [toast, setToast] = useState('');
  const [translatingRestaurant, setTranslatingRestaurant] = useState(false);
  const [translatingDishId, setTranslatingDishId] = useState<string | null>(null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingIntroVideo, setUploadingIntroVideo] = useState(false);
  const [uploadingWaitVideo, setUploadingWaitVideo] = useState(false);
  const [uploadingNewHero, setUploadingNewHero] = useState(false);
  const [uploadingDishImageId, setUploadingDishImageId] = useState<string | null>(null);
  const [uploadingGalleryDishId, setUploadingGalleryDishId] = useState<string | null>(null);
  const [connectingStripe, setConnectingStripe] = useState(false);

  // Onboarding (pas encore de restaurant)
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newHeroImage, setNewHeroImage] = useState('');
  const [newTags, setNewTags] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
  const [draggedDishId, setDraggedDishId] = useState<string | null>(null);
  const [advancedOpenIds, setAdvancedOpenIds] = useState<Set<string>>(new Set());
  const [duplicatingDishId, setDuplicatingDishId] = useState<string | null>(null);
  const [overview, setOverview] = useState<{ views: number; orders: number; revenue: number } | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [refreshingStripeStatus, setRefreshingStripeStatus] = useState(false);
  const [managingStripeAccount, setManagingStripeAccount] = useState(false);
  const [disconnectingStripe, setDisconnectingStripe] = useState(false);
  const [subscribingPlan, setSubscribingPlan] = useState<'monthly' | 'annual_monthly' | 'annual_upfront' | null>(
    null,
  );
  const [promoCode, setPromoCode] = useState('');
  const [managingBilling, setManagingBilling] = useState(false);
  const [checklistDismissed, setChecklistDismissed] = useState(false);
  const [nfcMarkedDone, setNfcMarkedDone] = useState(false);
  const [stripeConfirmAction, setStripeConfirmAction] = useState<'manage' | 'disconnect' | null>(null);
  const [stripeConfirmValue, setStripeConfirmValue] = useState('');
  const [stripeConfirmError, setStripeConfirmError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const pendingRestaurantPatchRef = useRef<Partial<RestaurantWithMenu>>({});
  const pendingCategoryPatchesRef = useRef<Map<string, string>>(new Map());
  const pendingDishPatchesRef = useRef<Map<string, Partial<Dish>>>(new Map());

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from('restaurants')
      .select('*, categories(*, dishes(*))')
      .eq('owner_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          setRestaurant(mapRestaurantWithMenu(data));
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Avertit avant de fermer/recharger l'onglet si des changements n'ont pas encore été
  // enregistrés (le bouton "Sauvegarder" n'a pas été cliqué).
  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // Retour depuis l'onboarding Stripe (?stripe=return) : on vérifie directement auprès de
  // Stripe (au lieu de dépendre uniquement du webhook, qui peut avoir du retard), puis on
  // rafraîchit pour voir le badge à jour.
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe') !== 'return') return;
    window.history.replaceState(null, '', '/dashboard');
    supabase.functions.invoke('stripe-refresh-status').finally(() => {
      supabase
        .from('restaurants')
        .select('*, categories(*, dishes(*))')
        .eq('owner_id', user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error && data) {
            setRestaurant(mapRestaurantWithMenu(data));
            setToast(
              dt(
                data.stripe_onboarded
                  ? 'Compte Stripe connecté !'
                  : 'Configuration Stripe enregistrée — vérification en cours.',
                data.stripe_onboarded ? 'Stripe account connected!' : 'Stripe setup saved — verification in progress.',
              ),
            );
          }
        });
    });
  }, [user]);

  // Retour depuis Stripe Checkout (?billing=success/cancel) : on rafraîchit pour voir le
  // statut d'abonnement à jour (mis à jour par billing-webhook, avec un léger délai possible).
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const billing = params.get('billing');
    if (billing !== 'success' && billing !== 'cancel') return;
    window.history.replaceState(null, '', '/dashboard');
    if (billing === 'cancel') {
      setToast(dt('Abonnement annulé.', 'Subscription cancelled.'));
      return;
    }
    supabase
      .from('restaurants')
      .select('*, categories(*, dishes(*))')
      .eq('owner_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          setRestaurant(mapRestaurantWithMenu(data));
          setToast(
            dt(
              data.subscription_status === 'active' ? 'Abonnement activé !' : 'Paiement en cours de confirmation...',
              data.subscription_status === 'active' ? 'Subscription activated!' : 'Payment confirmation in progress...',
            ),
          );
        }
      });
  }, [user]);

  // Vue d'ensemble : quelques chiffres du jour (vues, commandes, chiffre d'affaires).
  useEffect(() => {
    if (!restaurant) return undefined;
    let cancelled = false;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const since = startOfDay.toISOString();
    Promise.all([
      supabase
        .from('dish_events')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id)
        .eq('event_type', 'view')
        .gte('created_at', since),
      supabase.from('orders').select('total').eq('restaurant_id', restaurant.id).gte('created_at', since),
    ]).then(([{ count: viewsCount }, { data: todayOrders }]) => {
      if (cancelled) return;
      const orders = (todayOrders ?? []) as { total: number }[];
      setOverview({
        views: viewsCount ?? 0,
        orders: orders.length,
        revenue: orders.reduce((sum, order) => sum + (order.total ?? 0), 0),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [restaurant?.id]);

  // Charge l'état de la checklist "Bien démarrer" (sauvegardée localement, par restaurant).
  useEffect(() => {
    if (!restaurant) return;
    setChecklistDismissed(localStorage.getItem(`tc_onboarding_dismissed_${restaurant.id}`) === '1');
    setNfcMarkedDone(localStorage.getItem(`tc_onboarding_nfc_${restaurant.id}`) === '1');
  }, [restaurant?.id]);

  // Nombre de demandes (addition/serveur) en attente, pour le badge du raccourci Mode Service.
  useEffect(() => {
    if (!restaurant) return undefined;
    let cancelled = false;
    const refreshCount = () => {
      supabase
        .from('table_requests')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id)
        .eq('status', 'pending')
        .then(({ count }) => {
          if (!cancelled) setPendingRequestsCount(count ?? 0);
        });
    };
    refreshCount();
    const channel = supabase
      .channel(`dashboard-requests-${restaurant.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'table_requests', filter: `restaurant_id=eq.${restaurant.id}` },
        refreshCount,
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [restaurant?.id]);

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    try {
      const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
        'stripe-connect-onboarding',
      );
      if (error || !data?.url) {
        setToast(dt(`Échec de la connexion Stripe : ${data?.error ?? error?.message ?? 'erreur inconnue'}`, `Stripe connection failed: ${data?.error ?? error?.message ?? 'unknown error'}`));
        setConnectingStripe(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setToast(dt(`Échec de la connexion Stripe : ${err instanceof Error ? err.message : 'erreur inconnue'}`, `Stripe connection failed: ${err instanceof Error ? err.message : 'unknown error'}`));
      setConnectingStripe(false);
    }
  };

  const handleRefreshStripeStatus = async () => {
    if (!user) return;
    setRefreshingStripeStatus(true);
    try {
      await supabase.functions.invoke('stripe-refresh-status');
      const { data, error } = await supabase
        .from('restaurants')
        .select('*, categories(*, dishes(*))')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (!error && data) {
        setRestaurant(mapRestaurantWithMenu(data));
        setToast(dt(data.stripe_onboarded ? 'Compte Stripe connecté !' : 'Toujours en attente côté Stripe.', data.stripe_onboarded ? 'Stripe account connected!' : 'Still pending on the Stripe side.'));
      }
    } finally {
      setRefreshingStripeStatus(false);
    }
  };

  const requestStripeAction = (action: 'manage' | 'disconnect') => {
    if (!restaurant?.servicePin) {
      if (action === 'manage') handleManageStripeAccount();
      else handleDisconnectStripe();
      return;
    }
    setStripeConfirmAction(action);
    setStripeConfirmValue('');
    setStripeConfirmError('');
  };

  const cancelStripeConfirm = () => {
    setStripeConfirmAction(null);
    setStripeConfirmValue('');
    setStripeConfirmError('');
  };

  const submitStripeConfirm = () => {
    if (!restaurant || stripeConfirmValue !== restaurant.servicePin) {
      setStripeConfirmError(dt('Code incorrect.', 'Incorrect code.'));
      setStripeConfirmValue('');
      return;
    }
    const action = stripeConfirmAction;
    cancelStripeConfirm();
    if (action === 'manage') handleManageStripeAccount();
    else if (action === 'disconnect') handleDisconnectStripe();
  };

  const handleManageStripeAccount = async () => {
    setManagingStripeAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
        'stripe-account-login-link',
      );
      if (error || !data?.url) {
        setToast(dt(`Échec : ${data?.error ?? error?.message ?? 'erreur inconnue'}`, `Failed: ${data?.error ?? error?.message ?? 'unknown error'}`));
        setManagingStripeAccount(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setToast(dt(`Échec : ${err instanceof Error ? err.message : 'erreur inconnue'}`, `Failed: ${err instanceof Error ? err.message : 'unknown error'}`));
      setManagingStripeAccount(false);
    }
  };

  const handleDisconnectStripe = async () => {
    if (!user) return;
    if (!window.confirm(dt('Déconnecter ce compte Stripe ? Vous pourrez en reconnecter un autre ensuite.', 'Disconnect this Stripe account? You can connect another one afterwards.'))) return;
    setDisconnectingStripe(true);
    try {
      const { error } = await supabase.functions.invoke('stripe-disconnect-account');
      if (error) {
        setToast(dt(`Échec de la déconnexion : ${error.message}`, `Disconnect failed: ${error.message}`));
        return;
      }
      const { data } = await supabase
        .from('restaurants')
        .select('*, categories(*, dishes(*))')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (data) setRestaurant(mapRestaurantWithMenu(data));
      setToast(dt('Compte Stripe déconnecté.', 'Stripe account disconnected.'));
    } finally {
      setDisconnectingStripe(false);
    }
  };

  const handleSubscribe = async (plan: 'monthly' | 'annual_monthly' | 'annual_upfront') => {
    setSubscribingPlan(plan);
    try {
      const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
        'billing-create-checkout',
        { body: { plan, promoCode: promoCode.trim() || undefined } },
      );
      if (error || !data?.url) {
        setToast(dt(`Échec : ${data?.error ?? error?.message ?? 'erreur inconnue'}`, `Failed: ${data?.error ?? error?.message ?? 'unknown error'}`));
        setSubscribingPlan(null);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setToast(dt(`Échec : ${err instanceof Error ? err.message : 'erreur inconnue'}`, `Failed: ${err instanceof Error ? err.message : 'unknown error'}`));
      setSubscribingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    setManagingBilling(true);
    try {
      const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>('billing-portal');
      if (error || !data?.url) {
        setToast(dt(`Échec : ${data?.error ?? error?.message ?? 'erreur inconnue'}`, `Failed: ${data?.error ?? error?.message ?? 'unknown error'}`));
        setManagingBilling(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setToast(dt(`Échec : ${err instanceof Error ? err.message : 'erreur inconnue'}`, `Failed: ${err instanceof Error ? err.message : 'unknown error'}`));
      setManagingBilling(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleFinishEditing = () => {
    if (hasUnsavedChanges && !window.confirm(dt('Des modifications ne sont pas enregistrées. Quitter sans les sauvegarder ?', 'You have unsaved changes. Leave without saving?'))) {
      return;
    }
    navigate('/dashboard');
  };

  const handleCreateRestaurant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setCreating(true);
    setCreateError('');
    const baseSlug = slugify(newName);
    const tags = newTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    let slug = baseSlug;
    let created = false;
    for (let attempt = 0; attempt < 6 && !created; attempt += 1) {
      const { data, error } = await supabase
        .from('restaurants')
        .insert({
          owner_id: user.id,
          slug,
          name: newName,
          hero_image: newHeroImage || null,
          address: newAddress,
          tags,
        })
        .select('*')
        .single();

      if (!error && data) {
        const { data: categoryRows } = await supabase
          .from('categories')
          .insert(
            DEFAULT_CATEGORY_NAMES.map((name, position) => ({
              restaurant_id: data.id,
              name,
              position,
            })),
          )
          .select('*');
        setRestaurant(
          mapRestaurantWithMenu({
            ...data,
            categories: (categoryRows ?? []).map((row) => ({ ...row, dishes: [] })),
          }),
        );
        created = true;
        break;
      }

      if (error?.code === '23505') {
        slug = `${baseSlug}-${attempt + 2}`;
        continue;
      }

      setCreateError(error?.message ?? "Une erreur est survenue.");
      break;
    }
    setCreating(false);
  };

  // Les changements ne partent en base que via saveAllChanges() (bouton "Sauvegarder") — on les
  // met juste en attente ici, avec une mise à jour locale immédiate pour que l'écran reste réactif.
  const updateRestaurantField = (patch: Partial<RestaurantWithMenu>) => {
    if (!restaurant) return;
    setRestaurant((current) => (current ? { ...current, ...patch } : current));
    pendingRestaurantPatchRef.current = { ...pendingRestaurantPatchRef.current, ...patch };
    setHasUnsavedChanges(true);
  };

  const updateDayHours = (day: DayKey, patch: Partial<DayHours>) => {
    if (!restaurant) return;
    const base = restaurant.openingHours ?? defaultOpeningHours();
    const openingHours = { ...base, [day]: { ...base[day], ...patch } };
    updateRestaurantField({ openingHours });
  };

  const translateRestaurant = async () => {
    if (!restaurant) return;
    setTranslatingRestaurant(true);
    try {
      const translations = await translateRestaurantFields(restaurant.name, restaurant.address, restaurant.tags);
      await updateRestaurantField({ translations });
      setToast(dt('Traduction du restaurant mise à jour !', 'Restaurant translation updated!'));
    } finally {
      setTranslatingRestaurant(false);
    }
  };

  const addCategory = async () => {
    if (!restaurant || !newCategoryName.trim()) return;
    const { data, error } = await supabase
      .from('categories')
      .insert({
        restaurant_id: restaurant.id,
        name: newCategoryName.trim(),
        position: restaurant.categories.length,
      })
      .select('*')
      .single();
    if (error || !data) {
      setToast(dt(`Échec de l'ajout de la catégorie : ${error?.message ?? 'erreur inconnue'}`, `Failed to add category: ${error?.message ?? 'unknown error'}`));
      return;
    }
    const category = mapCategory({ ...data, dishes: [] });
    setRestaurant((current) => (current ? { ...current, categories: [...current.categories, category] } : current));
    setNewCategoryName('');
  };

  const renameCategory = (categoryId: string, name: string) => {
    setRestaurant((current) =>
      current
        ? {
            ...current,
            categories: current.categories.map((category) =>
              category.id === categoryId ? { ...category, name } : category,
            ),
          }
        : current,
    );
    pendingCategoryPatchesRef.current.set(categoryId, name);
    setHasUnsavedChanges(true);
  };

  const deleteCategory = async (categoryId: string) => {
    if (!window.confirm(dt('Supprimer cette catégorie et tous ses plats ?', 'Delete this category and all its dishes?'))) return;
    setRestaurant((current) =>
      current ? { ...current, categories: current.categories.filter((category) => category.id !== categoryId) } : current,
    );
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) setToast(dt(`Échec de la suppression : ${error.message}`, `Delete failed: ${error.message}`));
  };

  const addDish = async (categoryId: string) => {
    const { data, error } = await supabase
      .from('dishes')
      .insert({
        category_id: categoryId,
        name: 'Nouveau plat',
        description: '',
        price: 0,
        image: '',
        recommended: false,
        best_seller: false,
        ingredients: [],
        accompaniments: [],
        drink: '',
        dessert_suggestion: '',
        position: 0,
      })
      .select('*')
      .single();
    if (error || !data) {
      setToast(dt(`Échec de l'ajout du plat : ${error?.message ?? 'erreur inconnue'}`, `Failed to add dish: ${error?.message ?? 'unknown error'}`));
      return;
    }
    const dish = mapDish(data);
    setRestaurant((current) =>
      current
        ? {
            ...current,
            categories: current.categories.map((category) =>
              category.id === categoryId ? { ...category, dishes: [...category.dishes, dish] } : category,
            ),
          }
        : current,
    );
  };

  const toggleAdvanced = (dishId: string) => {
    setAdvancedOpenIds((current) => {
      const next = new Set(current);
      if (next.has(dishId)) next.delete(dishId);
      else next.add(dishId);
      return next;
    });
  };

  const duplicateDish = async (categoryId: string, dish: Dish) => {
    setDuplicatingDishId(dish.id);
    const { data, error } = await supabase
      .from('dishes')
      .insert({
        category_id: categoryId,
        name: `${dish.name} (copie)`,
        description: dish.description,
        price: dish.price,
        image: dish.image,
        images: dish.images ?? null,
        recommended: dish.recommended,
        best_seller: dish.bestSeller,
        ingredients: dish.ingredients,
        accompaniments: dish.accompaniments,
        drink: dish.drink,
        dessert_suggestion: dish.dessertSuggestion,
        position: 0,
        diet_tags: dish.dietTags,
        allergens: dish.allergens,
        spice_level: dish.spiceLevel,
        calories: dish.calories,
        out_of_stock: false,
        extras: dish.extras,
        cost_enabled: dish.costEnabled,
        cost_ingredients: dish.costIngredients,
        cost_prep: dish.costPrep,
        cost_breakdown: dish.costBreakdown,
        service: dish.service,
        stock_quantity: dish.stockQuantity,
        prep_time_minutes: dish.prepTimeMinutes,
      })
      .select('*')
      .single();
    setDuplicatingDishId(null);
    if (error || !data) {
      setToast(dt(`Échec de la duplication : ${error?.message ?? 'erreur inconnue'}`, `Duplication failed: ${error?.message ?? 'unknown error'}`));
      return;
    }
    const newDish = mapDish(data);
    setRestaurant((current) =>
      current
        ? {
            ...current,
            categories: current.categories.map((category) =>
              category.id === categoryId ? { ...category, dishes: [...category.dishes, newDish] } : category,
            ),
          }
        : current,
    );
    setToast(dt('Plat dupliqué !', 'Dish duplicated!'));
  };

  const updateDish = (dishId: string, patch: Partial<Dish>) => {
    setRestaurant((current) =>
      current
        ? {
            ...current,
            categories: current.categories.map((category) => ({
              ...category,
              dishes: category.dishes.map((dish) => (dish.id === dishId ? { ...dish, ...patch } : dish)),
            })),
          }
        : current,
    );
    const existing = pendingDishPatchesRef.current.get(dishId) ?? {};
    pendingDishPatchesRef.current.set(dishId, { ...existing, ...patch });
    setHasUnsavedChanges(true);
  };

  const saveAllChanges = async () => {
    if (!restaurant) return;
    setSavingChanges(true);
    let failures = 0;

    if (Object.keys(pendingRestaurantPatchRef.current).length > 0) {
      const { error } = await supabase
        .from('restaurants')
        .update(toRestaurantRowPatch(pendingRestaurantPatchRef.current))
        .eq('id', restaurant.id);
      if (error) failures += 1;
      pendingRestaurantPatchRef.current = {};
    }

    for (const [categoryId, name] of pendingCategoryPatchesRef.current.entries()) {
      const { error } = await supabase.from('categories').update({ name }).eq('id', categoryId);
      if (error) failures += 1;
    }
    pendingCategoryPatchesRef.current.clear();

    for (const [dishId, patch] of pendingDishPatchesRef.current.entries()) {
      const { error } = await supabase.from('dishes').update(toDishRowPatch(patch)).eq('id', dishId);
      if (error) failures += 1;
    }
    pendingDishPatchesRef.current.clear();

    setSavingChanges(false);
    setHasUnsavedChanges(false);
    setToast(
      failures > 0
        ? dt(`Échec de l'enregistrement de ${failures} changement(s).`, `Failed to save ${failures} change(s).`)
        : dt('✓ Modifications enregistrées !', '✓ Changes saved!'),
    );
  };

  const toggleDietTag = (dish: Dish, key: string) => {
    const updated = dish.dietTags.includes(key)
      ? dish.dietTags.filter((tag) => tag !== key)
      : [...dish.dietTags, key];
    updateDish(dish.id, { dietTags: updated });
  };

  const toggleAllergen = (dish: Dish, key: string) => {
    const updated = dish.allergens.includes(key)
      ? dish.allergens.filter((allergen) => allergen !== key)
      : [...dish.allergens, key];
    updateDish(dish.id, { allergens: updated });
  };

  const addExtra = (dish: Dish) => {
    updateDish(dish.id, { extras: [...dish.extras, { name: '', price: 0 }] });
  };

  const updateExtra = (dish: Dish, index: number, patch: Partial<{ name: string; price: number }>) => {
    const updated = dish.extras.map((extra, i) => (i === index ? { ...extra, ...patch } : extra));
    updateDish(dish.id, { extras: updated });
  };

  const removeExtra = (dish: Dish, index: number) => {
    updateDish(dish.id, { extras: dish.extras.filter((_, i) => i !== index) });
  };

  const addCostBreakdownItem = (dish: Dish) => {
    updateDish(dish.id, { costBreakdown: [...dish.costBreakdown, { name: '', cost: 0 }] });
  };

  const updateCostBreakdownItem = (dish: Dish, index: number, patch: Partial<{ name: string; cost: number }>) => {
    const updated = dish.costBreakdown.map((item, i) => (i === index ? { ...item, ...patch } : item));
    updateDish(dish.id, { costBreakdown: updated });
  };

  const removeCostBreakdownItem = (dish: Dish, index: number) => {
    updateDish(dish.id, { costBreakdown: dish.costBreakdown.filter((_, i) => i !== index) });
  };

  // Alerte simple : si le coût total du plat augmente suite à cette modification, on prévient
  // le restaurateur que sa marge vient de diminuer.
  const updateDishCost = (dish: Dish, patch: Partial<Pick<Dish, 'costIngredients' | 'costPrep'>>) => {
    const oldTotal = getDishTotalCost(dish);
    const newTotal = getDishTotalCost({ ...dish, ...patch });
    if (newTotal > oldTotal) {
      setToast(
        dt(
          `⚠️ Coût de "${dish.name}" en hausse : ${money(oldTotal)} → ${money(newTotal)}. Votre marge a diminué.`,
          `⚠️ Cost of "${dish.name}" increased: ${money(oldTotal)} → ${money(newTotal)}. Your margin has decreased.`,
        ),
      );
    }
    updateDish(dish.id, patch);
  };

  const translateDish = async (dish: Dish) => {
    setTranslatingDishId(dish.id);
    try {
      const translations = await translateDishFields(dish.name, dish.description);
      await updateDish(dish.id, { translations });
      setToast(dt('Traduction du plat mise à jour !', 'Dish translation updated!'));
    } finally {
      setTranslatingDishId(null);
    }
  };

  const moveDishToCategory = async (dishId: string, categoryId: string) => {
    setRestaurant((current) => {
      if (!current) return current;
      let moved: Dish | undefined;
      const withoutDish = current.categories.map((category) => {
        const found = category.dishes.find((dish) => dish.id === dishId);
        if (found) moved = found;
        return { ...category, dishes: category.dishes.filter((dish) => dish.id !== dishId) };
      });
      if (!moved) return current;
      const movedDish = { ...moved, categoryId };
      return {
        ...current,
        categories: withoutDish.map((category) =>
          category.id === categoryId ? { ...category, dishes: [...category.dishes, movedDish] } : category,
        ),
      };
    });
    const { error } = await supabase.from('dishes').update({ category_id: categoryId }).eq('id', dishId);
    if (error) setToast(dt(`Échec du déplacement : ${error.message}`, `Move failed: ${error.message}`));
  };

  const reorderCategories = async (fromId: string, toId: string) => {
    if (!restaurant || fromId === toId) return;
    const categories = [...restaurant.categories];
    const fromIndex = categories.findIndex((c) => c.id === fromId);
    const toIndex = categories.findIndex((c) => c.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = categories.splice(fromIndex, 1);
    categories.splice(toIndex, 0, moved);
    const reindexed = categories.map((c, index) => ({ ...c, position: index }));
    setRestaurant((current) => (current ? { ...current, categories: reindexed } : current));
    const results = await Promise.all(
      reindexed.map((c) => supabase.from('categories').update({ position: c.position }).eq('id', c.id)),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) setToast(dt(`Échec de la réorganisation : ${failed.error.message}`, `Reordering failed: ${failed.error.message}`));
  };

  const reorderDishes = async (categoryId: string, fromId: string, toId: string) => {
    if (!restaurant || fromId === toId) return;
    const category = restaurant.categories.find((c) => c.id === categoryId);
    if (!category) return;
    const dishes = [...category.dishes];
    const fromIndex = dishes.findIndex((d) => d.id === fromId);
    const toIndex = dishes.findIndex((d) => d.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = dishes.splice(fromIndex, 1);
    dishes.splice(toIndex, 0, moved);
    const reindexed = dishes.map((d, index) => ({ ...d, position: index }));
    setRestaurant((current) =>
      current
        ? { ...current, categories: current.categories.map((c) => (c.id === categoryId ? { ...c, dishes: reindexed } : c)) }
        : current,
    );
    const results = await Promise.all(
      reindexed.map((d) => supabase.from('dishes').update({ position: d.position }).eq('id', d.id)),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) setToast(dt(`Échec de la réorganisation : ${failed.error.message}`, `Reordering failed: ${failed.error.message}`));
  };

  const deleteDish = async (dishId: string) => {
    if (!window.confirm(dt('Supprimer ce plat de la carte ?', 'Delete this dish from the menu?'))) return;
    setRestaurant((current) =>
      current
        ? {
            ...current,
            categories: current.categories.map((category) => ({
              ...category,
              dishes: category.dishes.filter((dish) => dish.id !== dishId),
            })),
          }
        : current,
    );
    const { error } = await supabase.from('dishes').delete().eq('id', dishId);
    if (error) setToast(dt(`Échec de la suppression : ${error.message}`, `Delete failed: ${error.message}`));
  };

  const handleNewHeroUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user) return;
    setUploadingNewHero(true);
    try {
      const url = await uploadPhoto(file, user.id);
      setNewHeroImage(url);
    } catch {
      setToast(dt("Échec de l'envoi de la photo.", 'Photo upload failed.'));
    } finally {
      setUploadingNewHero(false);
    }
  };

  const handleHeroUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user) return;
    setUploadingHero(true);
    try {
      const url = await uploadPhoto(file, user.id);
      await updateRestaurantField({ heroImage: url });
      setToast(dt('Photo mise à jour !', 'Photo updated!'));
    } catch {
      setToast(dt("Échec de l'envoi de la photo.", 'Photo upload failed.'));
    } finally {
      setUploadingHero(false);
    }
  };

  const handleIntroVideoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user) return;
    setUploadingIntroVideo(true);
    try {
      const url = await uploadVideo(file, user.id);
      await updateRestaurantField({ customIntroVideo: url });
      setToast(dt("Vidéo d'introduction mise à jour !", 'Intro video updated!'));
    } catch (err) {
      setToast(err instanceof Error ? err.message : dt("Échec de l'envoi de la vidéo.", 'Video upload failed.'));
    } finally {
      setUploadingIntroVideo(false);
    }
  };

  const handleWaitVideoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user) return;
    setUploadingWaitVideo(true);
    try {
      const url = await uploadVideo(file, user.id);
      await updateRestaurantField({ customWaitVideo: url });
      setToast(dt("Animation d'attente mise à jour !", 'Wait animation updated!'));
    } catch (err) {
      setToast(err instanceof Error ? err.message : dt("Échec de l'envoi de la vidéo.", 'Video upload failed.'));
    } finally {
      setUploadingWaitVideo(false);
    }
  };

  const handleDishImageUpload = async (dishId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user) return;
    setUploadingDishImageId(dishId);
    try {
      const url = await uploadPhoto(file, user.id);
      await updateDish(dishId, { image: url });
      setToast(dt('Photo mise à jour !', 'Photo updated!'));
    } catch {
      setToast(dt("Échec de l'envoi de la photo.", 'Photo upload failed.'));
    } finally {
      setUploadingDishImageId(null);
    }
  };

  const handleGalleryUpload = async (dish: Dish, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user) return;
    setUploadingGalleryDishId(dish.id);
    try {
      const url = await uploadPhoto(file, user.id);
      await updateDish(dish.id, { images: [...(dish.images ?? []), url] });
      setToast(dt('Photo ajoutée !', 'Photo added!'));
    } catch {
      setToast(dt("Échec de l'envoi de la photo.", 'Photo upload failed.'));
    } finally {
      setUploadingGalleryDishId(null);
    }
  };

  const removeGalleryPhoto = (dish: Dish, index: number) => {
    const updated = (dish.images ?? []).filter((_, i) => i !== index);
    updateDish(dish.id, { images: updated });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-14">
        <form
          onSubmit={handleCreateRestaurant}
          className="w-full max-w-lg rounded-3xl border border-stone-200/70 bg-white p-8 shadow-soft"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-navy-700">{dt('Bienvenue', 'Welcome')}</p>
          <h1 className="mt-3 font-display text-2xl font-bold text-stone-900">{dt('Créez votre restaurant', 'Create your restaurant')}</h1>
          <p className="mt-2 text-sm text-stone-500">
            {dt(
              "Juste le nom pour commencer — le reste est facultatif et modifiable à tout moment. On crée pour vous 4 catégories de départ (Entrées, Plats, Desserts, Boissons) que vous pourrez renommer, supprimer ou compléter juste après.",
              "Just the name to get started — everything else is optional and can be changed later. We'll create 4 starter categories for you (Starters, Mains, Desserts, Drinks) that you can rename, delete, or fill in afterwards.",
            )}
          </p>

          <label className="mt-6 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
            {dt('Nom du restaurant', 'Restaurant name')}
            <input
              required
              autoFocus
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder={dt('Ex : Le Jardin Parisien', 'E.g. The Parisian Garden')}
              className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none transition-colors duration-300 focus:border-navy-300"
            />
          </label>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
            {dt('Adresse', 'Address')} <span className="font-normal normal-case tracking-normal text-stone-400">({dt('facultatif', 'optional')})</span>
            <input
              value={newAddress}
              onChange={(event) => setNewAddress(event.target.value)}
              placeholder="14 rue des Vertus, Paris 3e"
              className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none transition-colors duration-300 focus:border-navy-300"
            />
          </label>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
              {dt('Photo', 'Photo')} <span className="font-normal normal-case tracking-normal text-stone-400">({dt('facultatif — vous pourrez en ajouter une plus tard', "optional — you can add one later")})</span>
            </p>
            <div className="mt-1.5 flex items-center gap-3">
              {newHeroImage && <img src={newHeroImage} alt="" className="h-14 w-14 rounded-xl object-cover" />}
              <label className="cursor-pointer rounded-full border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40">
                {uploadingNewHero ? dt('Envoi...', 'Uploading...') : newHeroImage ? dt('Changer la photo', 'Change photo') : dt('Choisir une photo', 'Choose a photo')}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleNewHeroUpload}
                  disabled={uploadingNewHero}
                />
              </label>
            </div>
          </div>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
            {dt('Tags', 'Tags')} <span className="font-normal normal-case tracking-normal text-stone-400">({dt('facultatif, séparés par des virgules', 'optional, comma-separated')})</span>
            <input
              value={newTags}
              onChange={(event) => setNewTags(event.target.value)}
              placeholder={dt('Cuisine de saison, Produits frais', 'Seasonal cuisine, Fresh produce')}
              className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none transition-colors duration-300 focus:border-navy-300"
            />
          </label>

          {createError && <p className="mt-3 text-sm font-semibold text-red-500">{createError}</p>}

          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="mt-6 w-full rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-3.5 text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 disabled:opacity-60"
          >
            {creating ? dt('Création...', 'Creating...') : dt('Créer mon restaurant', 'Create my restaurant')}
          </button>
        </form>
      </div>
    );
  }

  if (restaurant.subscriptionStatus !== 'active') {
    return (
      <div className="min-h-screen">
        <header className="border-b border-stone-900/5 bg-[#f6f8fb]/80 px-4 py-5 backdrop-blur-xl sm:px-8">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <img src={logoHorizontal} alt="Nourevo" className="h-7 w-auto" />
            <div className="flex items-center gap-3">
              <DashboardLanguageSwitch />
              <button
                onClick={handleLogout}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700"
              >
                {dt('Déconnexion', 'Log out')}
              </button>
            </div>
          </div>
        </header>
        <div className="flex min-h-[calc(100vh-88px)] items-center justify-center px-4 py-14">
          <div className="w-full max-w-lg rounded-3xl border border-stone-200/70 bg-white p-8 text-center shadow-soft sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-navy-700">{restaurant.name}</p>
            <h1 className="mt-3 font-display text-2xl font-bold text-stone-900">
              {restaurant.subscriptionStatus === 'past_due'
                ? dt('Paiement en retard', 'Payment overdue')
                : dt('Activez votre abonnement pour continuer', 'Activate your subscription to continue')}
            </h1>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              {restaurant.subscriptionStatus === 'past_due'
                ? dt(
                    "Votre dernier paiement n'a pas abouti. Mettez à jour votre moyen de paiement pour réactiver l'accès à votre carte, à sa gestion, et à votre carte NFC.",
                    "Your last payment didn't go through. Update your payment method to restore access to your menu, its management, and your NFC card.",
                  )
                : dt(
                    "L'accès au dashboard (gestion de la carte, personnalisation, Mode Service) et l'affichage de votre carte NFC auprès de vos clients nécessitent un abonnement actif.",
                    'An active subscription is required for dashboard access (menu management, customization, Service Mode) and to display your NFC card to your customers.',
                  )}
            </p>

            {restaurant.subscriptionStatus === 'past_due' ? (
              <button
                type="button"
                onClick={handleManageBilling}
                disabled={managingBilling}
                className="mt-6 w-full rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
              >
                {managingBilling ? dt('Redirection...', 'Redirecting...') : dt('Mettre à jour mon paiement', 'Update my payment method')}
              </button>
            ) : (
              <div className="mt-6 space-y-2.5">
                {!restaurant.stripeSubscriptionId && (
                  <p className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700">
                    {dt(
                      "🎉 7 jours d'essai gratuit, quel que soit le plan choisi — annulable avant la fin de l'essai.",
                      '🎉 7-day free trial on any plan — cancel any time before the trial ends.',
                    )}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => handleSubscribe('monthly')}
                  disabled={subscribingPlan !== null}
                  className="w-full rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {subscribingPlan === 'monthly' ? dt('Redirection...', 'Redirecting...') : dt("S'abonner — 59€/mois", 'Subscribe — €59/month')}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubscribe('annual_monthly')}
                  disabled={subscribingPlan !== null}
                  className="w-full rounded-full border border-navy-400 bg-navy-300/10 px-5 py-3.5 text-sm font-bold text-navy-700 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {subscribingPlan === 'annual_monthly' ? dt('Redirection...', 'Redirecting...') : dt("S'abonner — 54€/mois (engagement 1 an)", 'Subscribe — €54/month (12-month commitment)')}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubscribe('annual_upfront')}
                  disabled={subscribingPlan !== null}
                  className="w-full rounded-full border border-navy-400 bg-navy-300/10 px-5 py-3.5 text-sm font-bold text-navy-700 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {subscribingPlan === 'annual_upfront' ? dt('Redirection...', 'Redirecting...') : dt("S'abonner — 588€/an (payé en une fois)", 'Subscribe — €588/year (paid upfront)')}
                </button>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(event) => setPromoCode(event.target.value)}
                  placeholder={dt('Code promo (facultatif)', 'Promo code (optional)')}
                  className="w-full rounded-full border border-stone-200 bg-white px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-stone-600 placeholder:normal-case placeholder:font-normal placeholder:text-stone-400 focus:border-navy-400 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const ownerDisplayName = user?.email?.split('@')[0] ?? 'vous';
  const totalDishes = restaurant.categories.reduce((sum, category) => sum + category.dishes.length, 0);
  const totalCategories = restaurant.categories.length;
  const navCardClass =
    'rounded-3xl border border-stone-200/70 bg-white p-5 text-left shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-300/40 sm:p-6';

  const dismissChecklist = () => {
    localStorage.setItem(`tc_onboarding_dismissed_${restaurant.id}`, '1');
    setChecklistDismissed(true);
  };
  const markNfcDone = () => {
    localStorage.setItem(`tc_onboarding_nfc_${restaurant.id}`, '1');
    setNfcMarkedDone(true);
  };

  const checklistItems = [
    {
      label: dt('Ajoutez vos premiers plats', 'Add your first dishes'),
      done: totalDishes > 0,
      actionLabel: dt('Aller à la carte', 'Go to menu'),
      onAction: () => navigate('/dashboard/carte'),
    },
    {
      label: dt('Connectez votre compte bancaire (Stripe)', 'Connect your bank account (Stripe)'),
      done: restaurant.stripeOnboarded,
      actionLabel: dt('Connecter', 'Connect'),
      onAction: () => navigate('/dashboard/paiements'),
    },
    {
      label: dt('Programmez votre première carte NFC', 'Program your first NFC card'),
      done: nfcMarkedDone,
      actionLabel: dt("J'ai terminé", 'Done'),
      onAction: markNfcDone,
    },
  ];
  const showOnboardingChecklist = !checklistDismissed && checklistItems.some((item) => !item.done);

  return (
    <div className="min-h-screen pb-20">
      {routeTab === null ? (
        <header className="sticky top-0 z-40 border-b border-stone-900/5 bg-[#f6f8fb]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 via-navy-700 to-navy-800 font-display text-lg font-bold text-white">
                {restaurant.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <Link to="/" className="inline-block">
                  <img src={logoHorizontal} alt="Nourevo" className="h-5 w-auto" />
                </Link>
                <p className="font-display text-lg font-semibold leading-tight text-stone-900">
                  {dt('Bonjour', 'Hello')} {ownerDisplayName} 👋
                </p>
                <p className="text-xs text-stone-400">{restaurant.name}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DashboardLanguageSwitch />
              <a
                href={`/r/${restaurant.slug}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700"
              >
                {dt('Voir ma page publique ↗', 'View my public page ↗')}
              </a>
              <button
                onClick={handleLogout}
                className="rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700"
              >
                {dt('Déconnexion', 'Log out')}
              </button>
            </div>
          </div>
        </header>
      ) : (
        <header className="sticky top-0 z-40 border-b border-stone-900/5 bg-[#f6f8fb]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-5 sm:px-8">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleFinishEditing}
                className="w-fit text-xs font-semibold uppercase tracking-[0.3em] text-navy-700"
              >
                {dt('← Retour au dashboard', '← Back to dashboard')}
              </button>
              <DashboardLanguageSwitch />
            </div>
            <p className="font-display text-lg font-semibold text-stone-900">
              {routeTab === 'menu'
                ? dt('Carte', 'Menu')
                : routeTab === 'restaurant'
                  ? dt('Restaurant', 'Restaurant')
                  : dt('Paiements', 'Payments')}{' '}
              — {restaurant.name}
            </p>
          </div>
        </header>
      )}

      {toast && (
        <div className="fixed left-1/2 top-6 z-[60] -translate-x-1/2 animate-slideUp rounded-full bg-white px-5 py-3 text-sm font-semibold text-stone-800 shadow-card">
          {toast}
        </div>
      )}

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-8">
        {routeTab === null && (
        <>
        {showOnboardingChecklist && (
          <section className="rounded-3xl border border-navy-300/25 bg-navy-300/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-stone-900">{dt('Bien démarrer', 'Get started')}</h2>
              <button
                type="button"
                onClick={dismissChecklist}
                className="text-xs font-semibold text-stone-400 transition-colors duration-300 hover:text-stone-600"
              >
                {dt('Masquer', 'Hide')}
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {checklistItems.map((item) => (
                <div key={item.label} className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.done ? '✅' : '⬜'}</span>
                    <p className={`text-sm ${item.done ? 'text-stone-400 line-through' : 'font-semibold text-stone-800'}`}>
                      {item.label}
                    </p>
                  </div>
                  {!item.done && (
                    <button
                      type="button"
                      onClick={item.onAction}
                      className="rounded-full border border-navy-400 bg-navy-300/10 px-4 py-1.5 text-xs font-semibold text-navy-700 transition-all duration-300 hover:bg-navy-300/20"
                    >
                      {item.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
            {dt("Vue d'ensemble — aujourd'hui", 'Overview — today')}
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-3xl border border-stone-200/70 bg-white p-5 shadow-soft">
              <p className="text-2xl">👀</p>
              <p className="mt-2 text-2xl font-bold text-stone-900">{overview ? overview.views : '—'}</p>
              <p className="text-xs text-stone-400">{dt('Vues du menu', 'Menu views')}</p>
            </div>
            <div className="rounded-3xl border border-stone-200/70 bg-white p-5 shadow-soft">
              <p className="text-2xl">🍽️</p>
              <p className="mt-2 text-2xl font-bold text-stone-900">{overview ? overview.orders : '—'}</p>
              <p className="text-xs text-stone-400">{dt('Commandes', 'Orders')}</p>
            </div>
            <div className="rounded-3xl border border-navy-300/25 bg-navy-300/8 p-5">
              <p className="text-2xl">💰</p>
              <p className="mt-2 text-2xl font-bold text-navy-700">{overview ? money(overview.revenue) : '—'}</p>
              <p className="text-xs text-navy-700/70">{dt("Chiffre d'affaires", 'Revenue')}</p>
            </div>
            <Link to="/dashboard/configuration" className="rounded-3xl border border-stone-200/70 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-300/40">
              <p className="text-2xl">🔐</p>
              <p className="mt-2 text-sm font-semibold text-stone-900">{dt('Configuration', 'Settings')}</p>
              <p className="text-xs text-stone-400">
                {restaurant.servicePin ? dt('🔒 PIN activé', '🔒 PIN enabled') : dt('Code PIN, NFC, avis', 'PIN code, NFC, reviews')}
              </p>
            </Link>
          </div>
        </section>

        <nav className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Link to="/dashboard/carte" className={navCardClass}>
            <span className="text-2xl">📋</span>
            <p className="mt-2 font-semibold text-stone-900">{dt('Carte', 'Menu')}</p>
            <p className="text-xs text-stone-400">
              {dt(
                `${totalCategories} catégorie${totalCategories > 1 ? 's' : ''} · ${totalDishes} plat${totalDishes > 1 ? 's' : ''}`,
                `${totalCategories} categor${totalCategories > 1 ? 'ies' : 'y'} · ${totalDishes} dish${totalDishes > 1 ? 'es' : ''}`,
              )}
            </p>
          </Link>
          <Link to="/dashboard/restaurant" className={navCardClass}>
            <span className="text-2xl">🏠</span>
            <p className="mt-2 font-semibold text-stone-900">{dt('Restaurant', 'Restaurant')}</p>
            <p className="text-xs text-stone-400">{dt('Infos, photo, traductions', 'Info, photo, translations')}</p>
          </Link>
          <Link to="/dashboard/paiements" className={navCardClass}>
            <span className="text-2xl">{restaurant.stripeOnboarded ? '✅' : '💳'}</span>
            <p className="mt-2 font-semibold text-stone-900">{dt('Paiements', 'Payments')}</p>
            <p className="text-xs text-stone-400">{restaurant.stripeOnboarded ? dt('Stripe connecté', 'Stripe connected') : dt('Non connecté', 'Not connected')}</p>
          </Link>
          <Link to="/dashboard/stats" className={navCardClass}>
            <span className="text-2xl">📊</span>
            <p className="mt-2 font-semibold text-stone-900">{dt('Statistiques', 'Statistics')}</p>
            <p className="text-xs text-stone-400">{dt('Vues, paniers, conversions', 'Views, carts, conversions')}</p>
          </Link>
          <Link to="/dashboard/rentabilite" className={navCardClass}>
            <span className="text-2xl">💰</span>
            <p className="mt-2 font-semibold text-stone-900">{dt('Rentabilité', 'Profitability')}</p>
            <p className="text-xs text-stone-400">{dt('Marge et plats les plus rentables', 'Margin and most profitable dishes')}</p>
          </Link>
          <Link to="/service" className={`relative ${navCardClass}`}>
            {pendingRequestsCount > 0 && (
              <span className="absolute right-5 top-5 h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            )}
            <span className="text-2xl">🔔</span>
            <p className="mt-2 font-semibold text-stone-900">{dt('Mode Service', 'Service Mode')}</p>
            <p className={`text-xs ${pendingRequestsCount > 0 ? 'font-semibold text-red-600' : 'text-stone-400'}`}>
              {pendingRequestsCount > 0
                ? dt(
                    `${pendingRequestsCount} demande${pendingRequestsCount > 1 ? 's' : ''} en attente`,
                    `${pendingRequestsCount} pending request${pendingRequestsCount > 1 ? 's' : ''}`,
                  )
                : dt('Aucune demande en attente', 'No pending requests')}
            </p>
          </Link>
        </nav>
        </>
        )}

        {routeTab === 'payments' && (
        <PinSectionGate restaurant={restaurant} section="payments">
        <>
        <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold text-stone-900">{dt('Paiements', 'Payments')}</h2>
          <p className="mt-2 text-sm text-stone-500">
            {dt(
              "Connectez votre compte bancaire pour encaisser directement les paiements par carte, Apple Pay et Google Pay de vos clients — l'argent arrive sur votre compte, sans commission prélevée par Nourevo.",
              "Connect your bank account to accept card, Apple Pay and Google Pay payments from your customers directly — the money lands in your account, with no commission taken by Nourevo.",
            )}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {restaurant.stripeOnboarded ? (
              <>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  {dt('✓ Compte Stripe connecté', '✓ Stripe account connected')}
                </span>
                <button
                  type="button"
                  onClick={() => requestStripeAction('manage')}
                  disabled={managingStripeAccount}
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700 disabled:opacity-60"
                >
                  {managingStripeAccount ? dt('Redirection...', 'Redirecting...') : dt('Modifier mes infos bancaires', 'Update my bank details')}
                </button>
                <button
                  type="button"
                  onClick={() => requestStripeAction('disconnect')}
                  disabled={disconnectingStripe}
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-500 transition-all duration-300 hover:border-red-300/50 hover:text-red-600 disabled:opacity-60"
                >
                  {disconnectingStripe ? dt('Déconnexion...', 'Disconnecting...') : dt('Déconnecter', 'Disconnect')}
                </button>
              </>
            ) : restaurant.stripeAccountId ? (
              <>
                <span className="inline-flex items-center gap-2 rounded-full border border-navy-300/50 bg-navy-300/10 px-4 py-2 text-sm font-semibold text-navy-700">
                  {dt('Vérification Stripe en cours...', 'Stripe verification in progress...')}
                </span>
                <button
                  type="button"
                  onClick={handleRefreshStripeStatus}
                  disabled={refreshingStripeStatus}
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700 disabled:opacity-60"
                >
                  {refreshingStripeStatus ? dt('Vérification...', 'Checking...') : dt('Vérifier maintenant', 'Check now')}
                </button>
                <button
                  type="button"
                  onClick={handleConnectStripe}
                  disabled={connectingStripe}
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700 disabled:opacity-60"
                >
                  {connectingStripe ? dt('Redirection...', 'Redirecting...') : dt('Reprendre la configuration', 'Resume setup')}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnectStripe}
                disabled={connectingStripe}
                className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
              >
                {connectingStripe ? dt('Redirection...', 'Redirecting...') : dt('Connecter mon compte bancaire', 'Connect my bank account')}
              </button>
            )}
          </div>

          {stripeConfirmAction !== null && (
            <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-3">
              <p className="text-xs font-semibold text-stone-600">
                {dt('Entrez le code PIN pour', 'Enter the PIN code to')}{' '}
                {stripeConfirmAction === 'manage' ? dt('modifier les infos bancaires', 'update the bank details') : dt('déconnecter le compte', 'disconnect the account')}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={stripeConfirmValue}
                  onChange={(event) => {
                    setStripeConfirmValue(event.target.value.replace(/\D/g, '').slice(0, 4));
                    setStripeConfirmError('');
                  }}
                  onKeyDown={(event) => event.key === 'Enter' && submitStripeConfirm()}
                  placeholder="••••"
                  className="w-24 rounded-xl border border-stone-200 bg-white px-3 py-2 text-center text-sm tracking-[0.3em] text-stone-700 outline-none focus:border-navy-300"
                />
                <button
                  type="button"
                  onClick={submitStripeConfirm}
                  className="rounded-full bg-navy-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy-800"
                >
                  {dt('Valider', 'Confirm')}
                </button>
                <button
                  type="button"
                  onClick={cancelStripeConfirm}
                  className="rounded-full px-3 py-2 text-xs font-semibold text-stone-400 transition hover:text-stone-600"
                >
                  {dt('Annuler', 'Cancel')}
                </button>
              </div>
              {stripeConfirmError && <p className="mt-1.5 text-xs text-red-600">{stripeConfirmError}</p>}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold text-stone-900">{dt('Abonnement Nourevo', 'Nourevo subscription')}</h2>
          <p className="mt-2 text-sm text-stone-500">
            {dt(
              "L'abonnement à la plateforme (accès au dashboard, à la carte digitale et au Mode Service) — à ne pas confondre avec le compte Stripe ci-dessus, qui sert uniquement à encaisser vos propres clients.",
              'The subscription to the platform (dashboard access, digital menu and Service Mode) — not to be confused with the Stripe account above, which is only used to charge your own customers.',
            )}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              {dt('✓ Abonnement actif —', '✓ Active subscription —')}{' '}
              {dt(
                SUBSCRIPTION_PLAN_LABELS[restaurant.subscriptionPlan ?? 'monthly'].fr,
                SUBSCRIPTION_PLAN_LABELS[restaurant.subscriptionPlan ?? 'monthly'].en,
              )}
            </span>
            <button
              type="button"
              onClick={handleManageBilling}
              disabled={managingBilling}
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700 disabled:opacity-60"
            >
              {managingBilling ? dt('Redirection...', 'Redirecting...') : dt('Gérer mon abonnement', 'Manage my subscription')}
            </button>
          </div>
        </div>
        </>
        </PinSectionGate>
        )}

        {routeTab === 'restaurant' && (
        <PinSectionGate restaurant={restaurant} section="restaurant">
        <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-stone-900">{dt('Informations du restaurant', 'Restaurant information')}</h2>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {TARGET_LOCALES.map((locale) => (
                  <span
                    key={locale.code}
                    title={
                      restaurant.translations[locale.code]
                        ? dt(`Traduit en ${locale.label}`, `Translated to ${locale.label}`)
                        : dt(`Pas encore traduit en ${locale.label}`, `Not yet translated to ${locale.label}`)
                    }
                    className={`flex h-6 w-6 items-center justify-center rounded-full border border-white bg-stone-100 text-xs ${
                      restaurant.translations[locale.code] ? '' : 'opacity-30 grayscale'
                    }`}
                  >
                    {locale.flag}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={translateRestaurant}
                disabled={translatingRestaurant}
                className="rounded-full border border-navy-300/50 bg-navy-300/10 px-4 py-2 text-xs font-semibold text-navy-700 transition-all duration-300 hover:bg-navy-300/20 disabled:opacity-60"
              >
                {translatingRestaurant ? dt('Traduction...', 'Translating...') : dt('Traduire automatiquement', 'Auto-translate')}
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
              {dt('Nom', 'Name')}
              <input
                value={restaurant.name}
                onChange={(event) => updateRestaurantField({ name: event.target.value })}
                className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none focus:border-navy-300"
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
              {dt('Adresse', 'Address')}
              <input
                value={restaurant.address}
                onChange={(event) => updateRestaurantField({ address: event.target.value })}
                className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none focus:border-navy-300"
              />
            </label>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">{dt("Photo d'en-tête", 'Header photo')}</p>
              <div className="mt-1.5 flex items-center gap-3">
                {restaurant.heroImage && (
                  <img src={restaurant.heroImage} alt="" className="h-16 w-16 rounded-xl object-cover" />
                )}
                <label className="cursor-pointer rounded-full border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40">
                  {uploadingHero ? dt('Envoi...', 'Uploading...') : restaurant.heroImage ? dt('Changer la photo', 'Change photo') : dt('Choisir une photo', 'Choose a photo')}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleHeroUpload}
                    disabled={uploadingHero}
                  />
                </label>
              </div>
              <p className="mt-3 text-xs font-normal normal-case tracking-normal text-stone-400">
                {dt('Pas encore vos propres photos ? Choisissez-en une parmi cette sélection :', "Don't have your own photos yet? Pick one from this selection:")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {HERO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => updateRestaurantField({ heroImage: preset.url })}
                    title={preset.label}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                      restaurant.heroImage === preset.url
                        ? 'border-navy-600 ring-2 ring-navy-300/50'
                        : 'border-transparent hover:border-navy-300/50'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400 sm:col-span-2">
              {dt('Tags (séparés par des virgules)', 'Tags (comma-separated)')}
              <input
                value={restaurant.tags.join(', ')}
                onChange={(event) =>
                  updateRestaurantField({
                    tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean),
                  })
                }
                className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none focus:border-navy-300"
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
              {dt('Nombre de tables', 'Number of tables')}
              <input
                type="number"
                min={1}
                max={200}
                value={restaurant.tableCount}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  if (!Number.isNaN(value) && value >= 1 && value <= 200) {
                    updateRestaurantField({ tableCount: value });
                  }
                }}
                className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none focus:border-navy-300"
              />
              <span className="mt-1 block text-xs font-normal normal-case tracking-normal text-stone-400">
                {dt('Détermine les numéros proposés à vos clients et la vue du Mode Service.', 'Determines the table numbers offered to your customers and the Service Mode view.')}
              </span>
            </label>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                {dt("Horaires d'ouverture", 'Opening hours')}{' '}
                <span className="font-normal normal-case tracking-normal text-stone-400">
                  ({dt('facultatif — affiché à vos clients sur la page menu', 'optional — shown to your customers on the menu page')})
                </span>
              </p>
              <div className="mt-2 space-y-1.5">
                {DAY_KEYS.map((day) => {
                  const hours = restaurant.openingHours?.[day] ?? { closed: false, open: '09:00', close: '22:00' };
                  return (
                    <div
                      key={day}
                      className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2"
                    >
                      <span className="w-24 text-xs font-semibold normal-case tracking-normal text-stone-600">
                        {DAY_LABELS[day]}
                      </span>
                      <label className="flex items-center gap-1.5 text-xs font-normal normal-case tracking-normal text-stone-500">
                        <input
                          type="checkbox"
                          checked={hours.closed}
                          onChange={(event) => updateDayHours(day, { closed: event.target.checked })}
                        />
                        {dt('Fermé', 'Closed')}
                      </label>
                      {!hours.closed && (
                        <>
                          <input
                            type="time"
                            value={hours.open}
                            onChange={(event) => updateDayHours(day, { open: event.target.value })}
                            className="rounded-xl border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-700 outline-none focus:border-navy-300"
                          />
                          <span className="text-stone-400">→</span>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(event) => updateDayHours(day, { close: event.target.value })}
                            className="rounded-xl border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-700 outline-none focus:border-navy-300"
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              {restaurant.openingHours && (
                <button
                  type="button"
                  onClick={() => updateRestaurantField({ openingHours: null })}
                  className="mt-2 text-xs font-semibold normal-case tracking-normal text-stone-400 underline hover:text-red-600"
                >
                  {dt('Retirer les horaires (ne plus afficher aux clients)', 'Remove hours (stop showing to customers)')}
                </button>
              )}
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                {dt('Horaires menu midi / menu soir', 'Lunch menu / dinner menu hours')}{' '}
                <span className="font-normal normal-case tracking-normal text-stone-500">
                  ({dt('facultatif — laissez vide pour proposer la carte toute la journée', 'optional — leave blank to offer the menu all day')})
                </span>
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-stone-700">{dt('🥗 Menu midi', '🥗 Lunch menu')}</p>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={restaurant.lunchEnabled}
                      onClick={() => updateRestaurantField({ lunchEnabled: !restaurant.lunchEnabled })}
                      className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-300 ${
                        restaurant.lunchEnabled ? 'justify-end bg-emerald-500' : 'justify-start bg-red-400'
                      }`}
                    >
                      <span className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300" />
                    </button>
                  </div>
                  <div
                    className={`mt-3 flex items-center gap-2 transition-opacity duration-300 ${
                      restaurant.lunchEnabled ? '' : 'pointer-events-none opacity-40'
                    }`}
                  >
                    <input
                      type="time"
                      disabled={!restaurant.lunchEnabled}
                      value={restaurant.lunchStart ?? ''}
                      onChange={(event) => updateRestaurantField({ lunchStart: event.target.value || null })}
                      className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-navy-300"
                    />
                    <span className="text-stone-400">→</span>
                    <input
                      type="time"
                      disabled={!restaurant.lunchEnabled}
                      value={restaurant.lunchEnd ?? ''}
                      onChange={(event) => updateRestaurantField({ lunchEnd: event.target.value || null })}
                      className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-navy-300"
                    />
                  </div>
                  {(restaurant.lunchStart || restaurant.lunchEnd) && (
                    <button
                      type="button"
                      onClick={() => updateRestaurantField({ lunchStart: null, lunchEnd: null })}
                      className="mt-2 text-xs font-semibold text-stone-400 underline hover:text-red-600"
                    >
                      {dt('Réinitialiser (vider les horaires)', 'Reset (clear hours)')}
                    </button>
                  )}
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-stone-700">{dt('🌙 Menu soir', '🌙 Dinner menu')}</p>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={restaurant.dinnerEnabled}
                      onClick={() => updateRestaurantField({ dinnerEnabled: !restaurant.dinnerEnabled })}
                      className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-300 ${
                        restaurant.dinnerEnabled ? 'justify-end bg-emerald-500' : 'justify-start bg-red-400'
                      }`}
                    >
                      <span className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300" />
                    </button>
                  </div>
                  <div
                    className={`mt-3 flex items-center gap-2 transition-opacity duration-300 ${
                      restaurant.dinnerEnabled ? '' : 'pointer-events-none opacity-40'
                    }`}
                  >
                    <input
                      type="time"
                      disabled={!restaurant.dinnerEnabled}
                      value={restaurant.dinnerStart ?? ''}
                      onChange={(event) => updateRestaurantField({ dinnerStart: event.target.value || null })}
                      className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-navy-300"
                    />
                    <span className="text-stone-400">→</span>
                    <input
                      type="time"
                      disabled={!restaurant.dinnerEnabled}
                      value={restaurant.dinnerEnd ?? ''}
                      onChange={(event) => updateRestaurantField({ dinnerEnd: event.target.value || null })}
                      className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-navy-300"
                    />
                  </div>
                  {(restaurant.dinnerStart || restaurant.dinnerEnd) && (
                    <button
                      type="button"
                      onClick={() => updateRestaurantField({ dinnerStart: null, dinnerEnd: null })}
                      className="mt-2 text-xs font-semibold text-stone-400 underline hover:text-red-600"
                    >
                      {dt('Réinitialiser (vider les horaires)', 'Reset (clear hours)')}
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-stone-500">
                {dt(
                  'Un plat marqué "Menu midi" ou "Menu soir" (dans l\'édition de chaque plat, onglet Carte) n\'apparaît à vos clients que pendant cette plage horaire. Les plats "Toute la journée" restent toujours visibles.',
                  'A dish marked "Lunch menu" or "Dinner menu" (in each dish\'s edit screen, Menu tab) only shows to your customers during that time window. "All day" dishes are always visible.',
                )}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                {dt('Couleur des boutons (page client)', 'Button color (customer page)')}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {ACCENT_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => updateRestaurantField({ accentColor: color })}
                    className={`h-8 w-8 rounded-full transition-all duration-300 ${
                      restaurant.accentColor === color
                        ? 'scale-110 ring-2 ring-stone-900 ring-offset-2'
                        : 'shadow-soft hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={dt(`Couleur ${color}`, `Color ${color}`)}
                  />
                ))}
                <label
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-dashed border-stone-300 text-xs text-stone-400 hover:border-navy-300/50"
                  title={dt('Choisir une couleur personnalisée', 'Choose a custom color')}
                >
                  🎨
                  <input
                    type="color"
                    value={restaurant.accentColor ?? '#1c2f47'}
                    onChange={(event) => updateRestaurantField({ accentColor: event.target.value })}
                    className="sr-only"
                  />
                </label>
                {restaurant.accentColor && (
                  <button
                    type="button"
                    onClick={() => updateRestaurantField({ accentColor: null })}
                    className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-500 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700"
                  >
                    {dt('Réinitialiser', 'Reset')}
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-stone-400">
                {dt('S\'applique aux boutons vus par vos clients sur votre carte publique.', 'Applies to the buttons your customers see on your public menu.')}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                {dt("Vidéo d'introduction", 'Intro video')}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {INTRO_VIDEOS.map((video) => (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => updateRestaurantField({ introVideo: video.id, customIntroVideo: null })}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                      !restaurant.customIntroVideo && (restaurant.introVideo ?? INTRO_VIDEOS[0].id) === video.id
                        ? 'border-navy-400 bg-navy-300/15 text-navy-700'
                        : 'border-stone-200 bg-white text-stone-500 hover:border-navy-300/40'
                    }`}
                  >
                    ▶ {video.label}
                  </button>
                ))}
                <label
                  className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                    restaurant.customIntroVideo
                      ? 'border-navy-400 bg-navy-300/15 text-navy-700'
                      : 'border-stone-200 bg-white text-stone-500 hover:border-navy-300/40'
                  }`}
                >
                  {uploadingIntroVideo ? dt('Envoi...', 'Uploading...') : restaurant.customIntroVideo ? dt('✓ Ma vidéo', '✓ My video') : dt('📤 Ma propre vidéo', '📤 My own video')}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleIntroVideoUpload}
                    disabled={uploadingIntroVideo}
                  />
                </label>
                {restaurant.customIntroVideo && (
                  <button
                    type="button"
                    onClick={() => updateRestaurantField({ customIntroVideo: null })}
                    className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-400 transition-all duration-300 hover:border-red-300 hover:text-red-600"
                  >
                    {dt('Retirer', 'Remove')}
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-stone-400">
                {dt(
                  `La vidéo jouée à l'ouverture de votre carte, avant l'affichage du menu. Format vertical conseillé, courte et en boucle, ${MAX_VIDEO_SIZE_MB} Mo max.`,
                  `The video played when your menu opens, before the dishes are shown. Vertical format recommended, short and looping, ${MAX_VIDEO_SIZE_MB} MB max.`,
                )}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                {dt('Animation « commande en préparation »', '"Order in progress" animation')}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {WAIT_ANIMATIONS.map((animation) => (
                  <button
                    key={animation.id}
                    type="button"
                    onClick={() => updateRestaurantField({ waitAnimation: animation.id, customWaitVideo: null })}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                      !restaurant.customWaitVideo && getWaitAnimationId(restaurant.waitAnimation) === animation.id
                        ? 'border-navy-400 bg-navy-300/15 text-navy-700'
                        : 'border-stone-200 bg-white text-stone-500 hover:border-navy-300/40'
                    }`}
                  >
                    ▶ {animation.label}
                  </button>
                ))}
                <label
                  className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                    restaurant.customWaitVideo
                      ? 'border-navy-400 bg-navy-300/15 text-navy-700'
                      : 'border-stone-200 bg-white text-stone-500 hover:border-navy-300/40'
                  }`}
                >
                  {uploadingWaitVideo ? dt('Envoi...', 'Uploading...') : restaurant.customWaitVideo ? dt('✓ Ma vidéo', '✓ My video') : dt('📤 Ma propre vidéo', '📤 My own video')}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleWaitVideoUpload}
                    disabled={uploadingWaitVideo}
                  />
                </label>
                {restaurant.customWaitVideo && (
                  <button
                    type="button"
                    onClick={() => updateRestaurantField({ customWaitVideo: null })}
                    className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-400 transition-all duration-300 hover:border-red-300 hover:text-red-600"
                  >
                    {dt('Retirer', 'Remove')}
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-stone-400">
                {dt(
                  `Affichée à l'écran une fois la commande validée, pendant que le client patiente. Vidéo courte en boucle, ${MAX_VIDEO_SIZE_MB} Mo max.`,
                  `Shown on screen once the order is confirmed, while the customer waits. Short looping video, ${MAX_VIDEO_SIZE_MB} MB max.`,
                )}
              </p>
            </div>
          </div>
        </div>
        </PinSectionGate>
        )}

        {routeTab === 'menu' && (
        <PinSectionGate restaurant={restaurant} section="menu">
        <>
        {restaurant.categories.map((category) => (
          <div
            key={category.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (draggedCategoryId) reorderCategories(draggedCategoryId, category.id);
              setDraggedCategoryId(null);
            }}
            className={`rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft transition-opacity duration-200 ${
              draggedCategoryId === category.id ? 'opacity-40' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  draggable
                  onDragStart={() => setDraggedCategoryId(category.id)}
                  onDragEnd={() => setDraggedCategoryId(null)}
                  className="shrink-0 cursor-grab select-none text-lg text-stone-300 hover:text-stone-500 active:cursor-grabbing"
                  title={dt('Glisser pour réordonner', 'Drag to reorder')}
                >
                  ⠿
                </span>
                <input
                  value={category.name}
                  onChange={(event) => renameCategory(category.id, event.target.value)}
                  className="min-w-0 flex-1 font-display text-xl font-bold text-stone-900 outline-none focus:border-b focus:border-navy-300"
                />
              </div>
              <button
                type="button"
                onClick={() => deleteCategory(category.id)}
                className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-600"
              >
                {dt('Supprimer la catégorie', 'Delete category')}
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {category.dishes.map((dish) => (
                <details
                  key={dish.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggedDishId) reorderDishes(category.id, draggedDishId, dish.id);
                    setDraggedDishId(null);
                  }}
                  className={`group rounded-2xl border border-stone-200 bg-stone-50/60 p-4 transition-opacity duration-200 ${
                    draggedDishId === dish.id ? 'opacity-40' : ''
                  }`}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        draggable
                        onDragStart={(event) => {
                          event.stopPropagation();
                          setDraggedDishId(dish.id);
                        }}
                        onDragEnd={() => setDraggedDishId(null)}
                        onClick={(event) => event.preventDefault()}
                        className="shrink-0 cursor-grab select-none text-lg text-stone-300 hover:text-stone-500 active:cursor-grabbing"
                        title={dt('Glisser pour réordonner', 'Drag to reorder')}
                      >
                        ⠿
                      </span>
                      <span className="truncate font-semibold text-stone-900">{dish.name || dt('Sans nom', 'Unnamed')}</span>
                    </span>
                    <span className="shrink-0 text-sm text-stone-500">{money(dish.price)}</span>
                  </summary>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                      {dt('Nom', 'Name')}
                      <input
                        value={dish.name}
                        onChange={(event) => updateDish(dish.id, { name: event.target.value })}
                        className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none focus:border-navy-300"
                      />
                    </label>
                    <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                      {dt('Prix (€)', 'Price (€)')}
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={dish.price}
                        onChange={(event) => updateDish(dish.id, { price: Number.parseFloat(event.target.value) || 0 })}
                        className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none focus:border-navy-300"
                      />
                    </label>
                    <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400 sm:col-span-2">
                      {dt('Description', 'Description')}
                      <textarea
                        value={dish.description}
                        onChange={(event) => updateDish(dish.id, { description: event.target.value })}
                        rows={2}
                        className="mt-1.5 w-full resize-none rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none focus:border-navy-300"
                      />
                    </label>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">{dt('Photo principale', 'Main photo')}</p>
                      <div className="mt-1.5 flex items-center gap-3">
                        {dish.image && <img src={dish.image} alt="" className="h-14 w-14 rounded-xl object-cover" />}
                        <label className="cursor-pointer rounded-full border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40">
                          {uploadingDishImageId === dish.id ? dt('Envoi...', 'Uploading...') : dish.image ? dt('Changer', 'Change') : dt('Choisir une photo', 'Choose a photo')}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => handleDishImageUpload(dish.id, event)}
                            disabled={uploadingDishImageId === dish.id}
                          />
                        </label>
                      </div>
                    </div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                      {dt('Catégorie', 'Category')}
                      <select
                        value={category.id}
                        onChange={(event) => moveDishToCategory(dish.id, event.target.value)}
                        className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none focus:border-navy-300"
                      >
                        {restaurant.categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">{dt('Galerie de photos', 'Photo gallery')}</p>
                      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {(dish.images ?? []).map((photo, index) => (
                          <div
                            key={`${photo}-${index}`}
                            className="group relative overflow-hidden rounded-xl border border-stone-200 bg-white"
                          >
                            <img src={photo} alt="" className="h-20 w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeGalleryPhoto(dish, index)}
                              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[11px] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                              aria-label={dt('Supprimer cette photo', 'Delete this photo')}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <label className="flex h-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50/60 text-center text-xs font-semibold text-stone-500 transition-all duration-300 hover:border-navy-300/50 hover:text-navy-700">
                          {uploadingGalleryDishId === dish.id ? dt('Envoi...', 'Uploading...') : dt('+ Ajouter', '+ Add')}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => handleGalleryUpload(dish, event)}
                            disabled={uploadingGalleryDishId === dish.id}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-stone-600 sm:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={dish.recommended}
                          onChange={(event) => updateDish(dish.id, { recommended: event.target.checked })}
                        />
                        {dt('Suggestion du chef', "Chef's suggestion")}
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={dish.bestSeller}
                          onChange={(event) => updateDish(dish.id, { bestSeller: event.target.checked })}
                        />
                        {dt('Best seller', 'Best seller')}
                      </label>
                      <label className="flex items-center gap-2 text-red-600">
                        <input
                          type="checkbox"
                          checked={dish.outOfStock}
                          onChange={(event) => updateDish(dish.id, { outOfStock: event.target.checked })}
                        />
                        {dt('Rupture de stock', 'Out of stock')}
                      </label>
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => toggleAdvanced(dish.id)}
                        className="text-xs font-semibold text-navy-700 hover:text-navy-800"
                      >
                        {advancedOpenIds.has(dish.id)
                          ? dt('Masquer les options avancées ▲', 'Hide advanced options ▲')
                          : dt(
                              'Options avancées (créneau, stock, temps de prépa, rentabilité, régime, allergènes, piment, calories, suppléments) ▾',
                              'Advanced options (time slot, stock, prep time, profitability, diet, allergens, spice, calories, extras) ▾',
                            )}
                      </button>
                    </div>

                    {advancedOpenIds.has(dish.id) && (
                      <>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">{dt('Créneau', 'Time slot')}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {MENU_SERVICES.map((service) => (
                          <button
                            key={service.key}
                            type="button"
                            onClick={() => updateDish(dish.id, { service: service.key })}
                            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ${
                              dish.service === service.key
                                ? 'border-navy-400 bg-navy-300/15 text-navy-700'
                                : 'border-stone-200 bg-white text-stone-500 hover:border-navy-300/40'
                            }`}
                          >
                            {service.icon} {service.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                        <input
                          type="checkbox"
                          checked={dish.stockQuantity !== null}
                          onChange={(event) =>
                            updateDish(dish.id, { stockQuantity: event.target.checked ? 0 : null })
                          }
                        />
                        {dt('📦 Suivre le stock de ce plat', '📦 Track stock for this dish')}
                      </label>
                      {dish.stockQuantity !== null ? (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            value={dish.stockQuantity}
                            onChange={(event) =>
                              updateDish(dish.id, {
                                stockQuantity: Math.max(0, Number.parseInt(event.target.value, 10) || 0),
                              })
                            }
                            className="w-28 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 outline-none focus:border-navy-300"
                          />
                          <span className="text-xs normal-case text-stone-400">
                            {dt('en stock — le plat disparaît automatiquement de la carte une fois à 0.', 'in stock — the dish disappears from the menu automatically once it reaches 0.')}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs normal-case text-stone-400">
                          {dt(
                            "Stock illimité (par défaut). Le plat baisse tout seul à chaque commande une fois le suivi activé — vous pouvez aussi corriger le chiffre manuellement à tout moment.",
                            'Unlimited stock (default). The count goes down automatically with each order once tracking is on — you can also correct the number manually at any time.',
                          )}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                        <input
                          type="checkbox"
                          checked={dish.prepTimeMinutes !== null}
                          onChange={(event) =>
                            updateDish(dish.id, { prepTimeMinutes: event.target.checked ? 10 : null })
                          }
                        />
                        {dt('⏱️ Indiquer un temps de préparation', '⏱️ Set a preparation time')}
                      </label>
                      {dish.prepTimeMinutes !== null ? (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            value={dish.prepTimeMinutes}
                            onChange={(event) =>
                              updateDish(dish.id, {
                                prepTimeMinutes: Math.max(0, Number.parseInt(event.target.value, 10) || 0),
                              })
                            }
                            className="w-28 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 outline-none focus:border-navy-300"
                          />
                          <span className="text-xs normal-case text-stone-400">{dt('minutes', 'minutes')}</span>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs normal-case text-stone-400">
                          {dt(
                            "Facultatif — dès qu'au moins un plat a un temps renseigné, le temps d'attente affiché au client se base sur les plats réellement commandés au lieu d'une estimation générique.",
                            "Optional — as soon as at least one dish has a time set, the wait time shown to customers is based on the dishes actually ordered instead of a generic estimate.",
                          )}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">{dt('Régime', 'Diet')}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {DIET_TAGS.map((tag) => (
                          <button
                            key={tag.key}
                            type="button"
                            onClick={() => toggleDietTag(dish, tag.key)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                              dish.dietTags.includes(tag.key)
                                ? 'border-navy-400 bg-navy-300/15 text-navy-700'
                                : 'border-stone-200 bg-white text-stone-500 hover:border-navy-300/40'
                            }`}
                          >
                            {tag.icon} {tag.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">{dt('Allergènes', 'Allergens')}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {ALLERGENS.map((allergen) => (
                          <button
                            key={allergen.key}
                            type="button"
                            onClick={() => toggleAllergen(dish, allergen.key)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                              dish.allergens.includes(allergen.key)
                                ? 'border-red-300 bg-red-50 text-red-600'
                                : 'border-stone-200 bg-white text-stone-500 hover:border-red-200'
                            }`}
                          >
                            {allergen.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                      {dt('Piment', 'Spice level')}
                      <div className="mt-1.5 flex gap-2">
                        {[0, 1, 2, 3].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => updateDish(dish.id, { spiceLevel: level })}
                            className={`flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-all duration-300 ${
                              dish.spiceLevel === level
                                ? 'border-navy-400 bg-navy-300/15 text-navy-700'
                                : 'border-stone-200 bg-white text-stone-500 hover:border-navy-300/40'
                            }`}
                          >
                            {level === 0 ? dt('Aucun', 'None') : '🌶️'.repeat(level)}
                          </button>
                        ))}
                      </div>
                    </label>

                    <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                      {dt('Calories', 'Calories')} <span className="font-normal normal-case tracking-normal text-stone-400">({dt('facultatif', 'optional')})</span>
                      <input
                        type="number"
                        min="0"
                        value={dish.calories ?? ''}
                        onChange={(event) =>
                          updateDish(dish.id, {
                            calories: event.target.value === '' ? null : Number.parseInt(event.target.value, 10),
                          })
                        }
                        placeholder={dt('Ex : 450', 'E.g. 450')}
                        className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none focus:border-navy-300"
                      />
                    </label>

                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                        {dt('Suppléments', 'Extras')} <span className="font-normal normal-case tracking-normal text-stone-400">({dt('facultatif, ex : Sauce fromage — 2€', 'optional, e.g. Cheese sauce — €2')})</span>
                      </p>
                      <div className="mt-2 space-y-2">
                        {dish.extras.map((extra, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              value={extra.name}
                              onChange={(event) => updateExtra(dish, index, { name: event.target.value })}
                              placeholder={dt('Nom (ex : Sauce fromage)', 'Name (e.g. Cheese sauce)')}
                              className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 outline-none focus:border-navy-300"
                            />
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={extra.price}
                              onChange={(event) =>
                                updateExtra(dish, index, { price: Number.parseFloat(event.target.value) || 0 })
                              }
                              placeholder={dt('Prix', 'Price')}
                              className="w-24 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 outline-none focus:border-navy-300"
                            />
                            <button
                              type="button"
                              onClick={() => removeExtra(dish, index)}
                              className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-600"
                              aria-label={dt('Supprimer ce supplément', 'Delete this extra')}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addExtra(dish)}
                          className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700"
                        >
                          {dt('+ Ajouter un supplément', '+ Add an extra')}
                        </button>
                      </div>
                    </div>
                      </>
                    )}
                  </div>

                  {advancedOpenIds.has(dish.id) && (
                  <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50/60 p-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                      <input
                        type="checkbox"
                        checked={dish.costEnabled}
                        onChange={(event) => updateDish(dish.id, { costEnabled: event.target.checked })}
                      />
                      {dt("💰 Activer l'analyse de rentabilité pour ce plat", '💰 Enable profitability analysis for this dish')}
                    </label>
                    <p className="mt-1 text-xs normal-case text-stone-400">
                      {dt(
                        'Facultatif — renseignez le coût de fabrication pour connaître votre marge réelle sur ce plat.',
                        'Optional — enter the production cost to see your real margin on this dish.',
                      )}
                    </p>

                    {dish.costEnabled && (
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                            {dt('Coût matières premières (€)', 'Ingredient cost (€)')}
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              disabled={dish.costBreakdown.length > 0}
                              value={dish.costIngredients}
                              onChange={(event) =>
                                updateDishCost(dish, { costIngredients: Number.parseFloat(event.target.value) || 0 })
                              }
                              className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none focus:border-navy-300 disabled:bg-stone-100 disabled:text-stone-400"
                            />
                            {dish.costBreakdown.length > 0 && (
                              <span className="mt-1 block text-[10px] font-normal normal-case tracking-normal text-stone-400">
                                {dt('Calculé depuis le détail par ingrédient ci-dessous.', 'Calculated from the per-ingredient breakdown below.')}
                              </span>
                            )}
                          </label>
                          <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                            {dt('Coût préparation / emballage (€)', 'Prep / packaging cost (€)')}
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={dish.costPrep}
                              onChange={(event) =>
                                updateDishCost(dish, { costPrep: Number.parseFloat(event.target.value) || 0 })
                              }
                              className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none focus:border-navy-300"
                            />
                          </label>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                            {dt('Détail par ingrédient', 'Per-ingredient breakdown')}{' '}
                            <span className="font-normal normal-case tracking-normal text-stone-400">
                              ({dt('optionnel, avancé', 'optional, advanced')})
                            </span>
                          </p>
                          <div className="mt-2 space-y-2">
                            {dish.costBreakdown.map((item, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <input
                                  value={item.name}
                                  onChange={(event) =>
                                    updateCostBreakdownItem(dish, index, { name: event.target.value })
                                  }
                                  placeholder={dt('Ingrédient (ex : Steak haché 150g)', 'Ingredient (e.g. Ground beef 150g)')}
                                  className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 outline-none focus:border-navy-300"
                                />
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={item.cost}
                                  onChange={(event) =>
                                    updateCostBreakdownItem(dish, index, {
                                      cost: Number.parseFloat(event.target.value) || 0,
                                    })
                                  }
                                  placeholder={dt('Coût', 'Cost')}
                                  className="w-24 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 outline-none focus:border-navy-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeCostBreakdownItem(dish, index)}
                                  className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-600"
                                  aria-label={dt('Supprimer cet ingrédient', 'Delete this ingredient')}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addCostBreakdownItem(dish)}
                              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700"
                            >
                              {dt('+ Ajouter un ingrédient', '+ Add an ingredient')}
                            </button>
                          </div>
                        </div>

                        {(() => {
                          const totalCost = getDishTotalCost(dish);
                          const margin = getDishMargin(dish);
                          const marginRate = getDishMarginRate(dish);
                          const tier = getProfitabilityTier(marginRate);
                          return (
                            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-navy-300/25 bg-navy-300/8 p-4">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400">
                                  {dt('Coût total', 'Total cost')}
                                </p>
                                <p className="text-sm font-bold text-stone-900">{money(totalCost)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400">
                                  {dt('Marge brute', 'Gross margin')}
                                </p>
                                <p className="text-sm font-bold text-stone-900">{money(margin)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400">
                                  {dt('Taux de marge', 'Margin rate')}
                                </p>
                                <p className="text-sm font-bold text-stone-900">{Math.round(marginRate * 100)}%</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400">
                                  {dt('Rentabilité', 'Profitability')}
                                </p>
                                <p className="text-sm font-bold text-stone-900">
                                  {PROFITABILITY_TIER_EMOJI[tier]} {dt(PROFITABILITY_TIER_LABEL[tier].fr, PROFITABILITY_TIER_LABEL[tier].en)}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => deleteDish(dish.id)}
                        className="text-xs font-semibold text-red-500 hover:text-red-600"
                      >
                        {dt('Supprimer ce plat', 'Delete this dish')}
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateDish(category.id, dish)}
                        disabled={duplicatingDishId === dish.id}
                        className="text-xs font-semibold text-stone-500 hover:text-navy-700 disabled:opacity-60"
                      >
                        {duplicatingDishId === dish.id ? dt('Duplication...', 'Duplicating...') : dt('⧉ Dupliquer', '⧉ Duplicate')}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {TARGET_LOCALES.map((locale) => (
                          <span
                            key={locale.code}
                            title={
                              dish.translations[locale.code]
                                ? dt(`Traduit en ${locale.label}`, `Translated to ${locale.label}`)
                                : dt(`Pas encore traduit en ${locale.label}`, `Not yet translated to ${locale.label}`)
                            }
                            className={`flex h-6 w-6 items-center justify-center rounded-full border border-white bg-stone-100 text-xs ${
                              dish.translations[locale.code] ? '' : 'opacity-30 grayscale'
                            }`}
                          >
                            {locale.flag}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => translateDish(dish)}
                        disabled={translatingDishId === dish.id}
                        className="rounded-full border border-navy-300/50 bg-navy-300/10 px-4 py-2 text-xs font-semibold text-navy-700 transition-all duration-300 hover:bg-navy-300/20 disabled:opacity-60"
                      >
                        {translatingDishId === dish.id ? dt('Traduction...', 'Translating...') : dt('Traduire automatiquement', 'Auto-translate')}
                      </button>
                    </div>
                  </div>
                </details>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addDish(category.id)}
              className="mt-4 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700"
            >
              {dt('+ Ajouter un plat', '+ Add a dish')}
            </button>
          </div>
        ))}

        <div className="flex gap-2 rounded-3xl border border-dashed border-navy-400/60 bg-navy-300/5 p-6">
          <input
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            placeholder={dt('Nouvelle catégorie (ex : Boissons)', 'New category (e.g. Drinks)')}
            className="flex-1 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 outline-none transition-colors duration-300 focus:border-navy-300"
          />
          <button
            type="button"
            onClick={addCategory}
            className="shrink-0 rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-2.5 text-xs font-bold text-white transition-all duration-300 hover:-translate-y-0.5"
          >
            {dt('Ajouter', 'Add')}
          </button>
        </div>
        </>
        </PinSectionGate>
        )}

        {routeTab !== null && (
          <div className="sticky bottom-4 z-30 flex flex-col items-center gap-3 rounded-3xl border border-stone-200/70 bg-white p-8 text-center shadow-card">
            <p className="text-sm text-stone-500">
              {hasUnsavedChanges
                ? dt('● Modifications non enregistrées — cliquez sur "Sauvegarder" pour les valider.', '● Unsaved changes — click "Save" to confirm them.')
                : dt('Tout est enregistré.', 'Everything is saved.')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={saveAllChanges}
                disabled={!hasUnsavedChanges || savingChanges}
                className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
              >
                {savingChanges ? dt('Enregistrement...', 'Saving...') : dt('💾 Sauvegarder', '💾 Save')}
              </button>
              <button
                type="button"
                onClick={handleFinishEditing}
                className="rounded-full border border-stone-200 bg-white px-6 py-3.5 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40"
              >
                {dt('✓ Terminé', '✓ Done')}
              </button>
              <a
                href={`/r/${restaurant.slug}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-stone-200 bg-white px-6 py-3.5 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40"
              >
                {dt('Voir ma carte publique ↗', 'View my public menu ↗')}
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
