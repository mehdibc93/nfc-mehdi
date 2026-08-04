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

const TARGET_LOCALES = LOCALES.filter((locale) => locale.code !== 'fr');
const DEFAULT_CATEGORY_NAMES = ['Entrées', 'Plats', 'Desserts', 'Boissons'];
const ACCENT_PRESETS = ['#1c2f47', '#6b2737', '#2f5233', '#a5522d', '#4a2545', '#1f2328'];
const SUBSCRIPTION_PLAN_LABELS: Record<'monthly' | 'annual_monthly' | 'annual_upfront', string> = {
  monthly: '59€/mois',
  annual_monthly: '49€/mois (engagement 1 an)',
  annual_upfront: '588€/an',
};

export function DashboardPage() {
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
              data.stripe_onboarded
                ? 'Compte Stripe connecté !'
                : 'Configuration Stripe enregistrée — vérification en cours.',
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
      setToast('Abonnement annulé.');
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
            data.subscription_status === 'active' ? 'Abonnement activé !' : 'Paiement en cours de confirmation...',
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
        setToast(`Échec de la connexion Stripe : ${data?.error ?? error?.message ?? 'erreur inconnue'}`);
        setConnectingStripe(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setToast(`Échec de la connexion Stripe : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
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
        setToast(data.stripe_onboarded ? 'Compte Stripe connecté !' : "Toujours en attente côté Stripe.");
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
      setStripeConfirmError('Code incorrect.');
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
        setToast(`Échec : ${data?.error ?? error?.message ?? 'erreur inconnue'}`);
        setManagingStripeAccount(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setToast(`Échec : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
      setManagingStripeAccount(false);
    }
  };

  const handleDisconnectStripe = async () => {
    if (!user) return;
    if (!window.confirm('Déconnecter ce compte Stripe ? Vous pourrez en reconnecter un autre ensuite.')) return;
    setDisconnectingStripe(true);
    try {
      const { error } = await supabase.functions.invoke('stripe-disconnect-account');
      if (error) {
        setToast(`Échec de la déconnexion : ${error.message}`);
        return;
      }
      const { data } = await supabase
        .from('restaurants')
        .select('*, categories(*, dishes(*))')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (data) setRestaurant(mapRestaurantWithMenu(data));
      setToast('Compte Stripe déconnecté.');
    } finally {
      setDisconnectingStripe(false);
    }
  };

  const handleSubscribe = async (plan: 'monthly' | 'annual_monthly' | 'annual_upfront') => {
    setSubscribingPlan(plan);
    try {
      const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
        'billing-create-checkout',
        { body: { plan } },
      );
      if (error || !data?.url) {
        setToast(`Échec : ${data?.error ?? error?.message ?? 'erreur inconnue'}`);
        setSubscribingPlan(null);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setToast(`Échec : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
      setSubscribingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    setManagingBilling(true);
    try {
      const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>('billing-portal');
      if (error || !data?.url) {
        setToast(`Échec : ${data?.error ?? error?.message ?? 'erreur inconnue'}`);
        setManagingBilling(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setToast(`Échec : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
      setManagingBilling(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleFinishEditing = () => {
    if (hasUnsavedChanges && !window.confirm('Des modifications ne sont pas enregistrées. Quitter sans les sauvegarder ?')) {
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
      setToast('Traduction du restaurant mise à jour !');
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
      setToast(`Échec de l'ajout de la catégorie : ${error?.message ?? 'erreur inconnue'}`);
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
    if (!window.confirm('Supprimer cette catégorie et tous ses plats ?')) return;
    setRestaurant((current) =>
      current ? { ...current, categories: current.categories.filter((category) => category.id !== categoryId) } : current,
    );
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) setToast(`Échec de la suppression : ${error.message}`);
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
      setToast(`Échec de l'ajout du plat : ${error?.message ?? 'erreur inconnue'}`);
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
      setToast(`Échec de la duplication : ${error?.message ?? 'erreur inconnue'}`);
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
    setToast('Plat dupliqué !');
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
    setToast(failures > 0 ? `Échec de l'enregistrement de ${failures} changement(s).` : '✓ Modifications enregistrées !');
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
        `⚠️ Coût de "${dish.name}" en hausse : ${money(oldTotal)} → ${money(newTotal)}. Votre marge a diminué.`,
      );
    }
    updateDish(dish.id, patch);
  };

  const translateDish = async (dish: Dish) => {
    setTranslatingDishId(dish.id);
    try {
      const translations = await translateDishFields(dish.name, dish.description);
      await updateDish(dish.id, { translations });
      setToast('Traduction du plat mise à jour !');
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
    if (error) setToast(`Échec du déplacement : ${error.message}`);
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
    if (failed?.error) setToast(`Échec de la réorganisation : ${failed.error.message}`);
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
    if (failed?.error) setToast(`Échec de la réorganisation : ${failed.error.message}`);
  };

  const deleteDish = async (dishId: string) => {
    if (!window.confirm('Supprimer ce plat de la carte ?')) return;
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
    if (error) setToast(`Échec de la suppression : ${error.message}`);
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
      setToast("Échec de l'envoi de la photo.");
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
      setToast('Photo mise à jour !');
    } catch {
      setToast("Échec de l'envoi de la photo.");
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
      setToast('Vidéo d\'introduction mise à jour !');
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Échec de l'envoi de la vidéo.");
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
      setToast('Animation d\'attente mise à jour !');
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Échec de l'envoi de la vidéo.");
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
      setToast('Photo mise à jour !');
    } catch {
      setToast("Échec de l'envoi de la photo.");
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
      setToast('Photo ajoutée !');
    } catch {
      setToast("Échec de l'envoi de la photo.");
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
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-navy-700">Bienvenue</p>
          <h1 className="mt-3 font-display text-2xl font-bold text-stone-900">Créez votre restaurant</h1>
          <p className="mt-2 text-sm text-stone-500">
            Juste le nom pour commencer — le reste est facultatif et modifiable à tout moment. On crée pour vous
            4 catégories de départ (Entrées, Plats, Desserts, Boissons) que vous pourrez renommer, supprimer ou
            compléter juste après.
          </p>

          <label className="mt-6 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
            Nom du restaurant
            <input
              required
              autoFocus
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Ex : Le Jardin Parisien"
              className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none transition-colors duration-300 focus:border-navy-300"
            />
          </label>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
            Adresse <span className="font-normal normal-case tracking-normal text-stone-400">(facultatif)</span>
            <input
              value={newAddress}
              onChange={(event) => setNewAddress(event.target.value)}
              placeholder="14 rue des Vertus, Paris 3e"
              className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none transition-colors duration-300 focus:border-navy-300"
            />
          </label>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
              Photo <span className="font-normal normal-case tracking-normal text-stone-400">(facultatif — vous pourrez en ajouter une plus tard)</span>
            </p>
            <div className="mt-1.5 flex items-center gap-3">
              {newHeroImage && <img src={newHeroImage} alt="" className="h-14 w-14 rounded-xl object-cover" />}
              <label className="cursor-pointer rounded-full border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40">
                {uploadingNewHero ? 'Envoi...' : newHeroImage ? 'Changer la photo' : 'Choisir une photo'}
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
            Tags <span className="font-normal normal-case tracking-normal text-stone-400">(facultatif, séparés par des virgules)</span>
            <input
              value={newTags}
              onChange={(event) => setNewTags(event.target.value)}
              placeholder="Cuisine de saison, Produits frais"
              className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none transition-colors duration-300 focus:border-navy-300"
            />
          </label>

          {createError && <p className="mt-3 text-sm font-semibold text-red-500">{createError}</p>}

          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="mt-6 w-full rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-3.5 text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 disabled:opacity-60"
          >
            {creating ? 'Création...' : 'Créer mon restaurant'}
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
            <button
              onClick={handleLogout}
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700"
            >
              Déconnexion
            </button>
          </div>
        </header>
        <div className="flex min-h-[calc(100vh-88px)] items-center justify-center px-4 py-14">
          <div className="w-full max-w-lg rounded-3xl border border-stone-200/70 bg-white p-8 text-center shadow-soft sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-navy-700">{restaurant.name}</p>
            <h1 className="mt-3 font-display text-2xl font-bold text-stone-900">
              {restaurant.subscriptionStatus === 'past_due'
                ? 'Paiement en retard'
                : 'Activez votre abonnement pour continuer'}
            </h1>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              {restaurant.subscriptionStatus === 'past_due'
                ? "Votre dernier paiement n'a pas abouti. Mettez à jour votre moyen de paiement pour réactiver l'accès à votre carte, à sa gestion, et à votre carte NFC."
                : "L'accès au dashboard (gestion de la carte, personnalisation, Mode Service) et l'affichage de votre carte NFC auprès de vos clients nécessitent un abonnement actif."}
            </p>

            {restaurant.subscriptionStatus === 'past_due' ? (
              <button
                type="button"
                onClick={handleManageBilling}
                disabled={managingBilling}
                className="mt-6 w-full rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
              >
                {managingBilling ? 'Redirection...' : 'Mettre à jour mon paiement'}
              </button>
            ) : (
              <div className="mt-6 space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleSubscribe('monthly')}
                  disabled={subscribingPlan !== null}
                  className="w-full rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {subscribingPlan === 'monthly' ? 'Redirection...' : "S'abonner — 59€/mois"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubscribe('annual_monthly')}
                  disabled={subscribingPlan !== null}
                  className="w-full rounded-full border border-navy-400 bg-navy-300/10 px-5 py-3.5 text-sm font-bold text-navy-700 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {subscribingPlan === 'annual_monthly' ? 'Redirection...' : "S'abonner — 49€/mois (engagement 1 an)"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubscribe('annual_upfront')}
                  disabled={subscribingPlan !== null}
                  className="w-full rounded-full border border-navy-400 bg-navy-300/10 px-5 py-3.5 text-sm font-bold text-navy-700 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {subscribingPlan === 'annual_upfront' ? 'Redirection...' : "S'abonner — 588€/an (payé en une fois)"}
                </button>
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
      label: 'Ajoutez vos premiers plats',
      done: totalDishes > 0,
      actionLabel: 'Aller à la carte',
      onAction: () => navigate('/dashboard/carte'),
    },
    {
      label: 'Connectez votre compte bancaire (Stripe)',
      done: restaurant.stripeOnboarded,
      actionLabel: 'Connecter',
      onAction: () => navigate('/dashboard/paiements'),
    },
    {
      label: 'Programmez votre première carte NFC',
      done: nfcMarkedDone,
      actionLabel: "J'ai terminé",
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
                  Bonjour {ownerDisplayName} 👋
                </p>
                <p className="text-xs text-stone-400">{restaurant.name}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/r/${restaurant.slug}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700"
              >
                Voir ma page publique ↗
              </a>
              <button
                onClick={handleLogout}
                className="rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </header>
      ) : (
        <header className="sticky top-0 z-40 border-b border-stone-900/5 bg-[#f6f8fb]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-5 sm:px-8">
            <button
              type="button"
              onClick={handleFinishEditing}
              className="w-fit text-xs font-semibold uppercase tracking-[0.3em] text-navy-700"
            >
              ← Retour au dashboard
            </button>
            <p className="font-display text-lg font-semibold text-stone-900">
              {routeTab === 'menu' ? 'Carte' : routeTab === 'restaurant' ? 'Restaurant' : 'Paiements'} —{' '}
              {restaurant.name}
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
              <h2 className="font-display text-lg font-bold text-stone-900">Bien démarrer</h2>
              <button
                type="button"
                onClick={dismissChecklist}
                className="text-xs font-semibold text-stone-400 transition-colors duration-300 hover:text-stone-600"
              >
                Masquer
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
            Vue d'ensemble — aujourd'hui
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-3xl border border-stone-200/70 bg-white p-5 shadow-soft">
              <p className="text-2xl">👀</p>
              <p className="mt-2 text-2xl font-bold text-stone-900">{overview ? overview.views : '—'}</p>
              <p className="text-xs text-stone-400">Vues du menu</p>
            </div>
            <div className="rounded-3xl border border-stone-200/70 bg-white p-5 shadow-soft">
              <p className="text-2xl">🍽️</p>
              <p className="mt-2 text-2xl font-bold text-stone-900">{overview ? overview.orders : '—'}</p>
              <p className="text-xs text-stone-400">Commandes</p>
            </div>
            <div className="rounded-3xl border border-navy-300/25 bg-navy-300/8 p-5">
              <p className="text-2xl">💰</p>
              <p className="mt-2 text-2xl font-bold text-navy-700">{overview ? money(overview.revenue) : '—'}</p>
              <p className="text-xs text-navy-700/70">Chiffre d'affaires</p>
            </div>
            <Link to="/dashboard/configuration" className="rounded-3xl border border-stone-200/70 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-300/40">
              <p className="text-2xl">⚙️</p>
              <p className="mt-2 text-sm font-semibold text-stone-700">
                {restaurant.servicePin ? '🔒 PIN activé' : 'Code PIN, NFC, avis'}
              </p>
              <p className="text-xs text-stone-500 underline">Configuration</p>
            </Link>
          </div>
        </section>

        <nav className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Link to="/dashboard/carte" className={navCardClass}>
            <span className="text-2xl">📋</span>
            <p className="mt-2 font-semibold text-stone-900">Carte</p>
            <p className="text-xs text-stone-400">
              {totalCategories} catégorie{totalCategories > 1 ? 's' : ''} · {totalDishes} plat
              {totalDishes > 1 ? 's' : ''}
            </p>
          </Link>
          <Link to="/dashboard/restaurant" className={navCardClass}>
            <span className="text-2xl">🏠</span>
            <p className="mt-2 font-semibold text-stone-900">Restaurant</p>
            <p className="text-xs text-stone-400">Infos, photo, traductions</p>
          </Link>
          <Link to="/dashboard/paiements" className={navCardClass}>
            <span className="text-2xl">{restaurant.stripeOnboarded ? '✅' : '💳'}</span>
            <p className="mt-2 font-semibold text-stone-900">Paiements</p>
            <p className="text-xs text-stone-400">{restaurant.stripeOnboarded ? 'Stripe connecté' : 'Non connecté'}</p>
          </Link>
          <Link to="/dashboard/stats" className={navCardClass}>
            <span className="text-2xl">📊</span>
            <p className="mt-2 font-semibold text-stone-900">Statistiques</p>
            <p className="text-xs text-stone-400">Vues, paniers, conversions</p>
          </Link>
          <Link to="/dashboard/rentabilite" className={navCardClass}>
            <span className="text-2xl">💰</span>
            <p className="mt-2 font-semibold text-stone-900">Rentabilité</p>
            <p className="text-xs text-stone-400">Marge et plats les plus rentables</p>
          </Link>
          <Link to="/service" className={`relative ${navCardClass}`}>
            {pendingRequestsCount > 0 && (
              <span className="absolute right-5 top-5 h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            )}
            <span className="text-2xl">🔔</span>
            <p className="mt-2 font-semibold text-stone-900">Mode Service</p>
            <p className={`text-xs ${pendingRequestsCount > 0 ? 'font-semibold text-red-600' : 'text-stone-400'}`}>
              {pendingRequestsCount > 0
                ? `${pendingRequestsCount} demande${pendingRequestsCount > 1 ? 's' : ''} en attente`
                : 'Aucune demande en attente'}
            </p>
          </Link>
        </nav>
        </>
        )}

        {routeTab === 'payments' && (
        <PinSectionGate restaurant={restaurant} section="payments">
        <>
        <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold text-stone-900">Paiements</h2>
          <p className="mt-2 text-sm text-stone-500">
            Connectez votre compte bancaire pour encaisser directement les paiements par carte, Apple Pay et
            Google Pay de vos clients — l'argent arrive sur votre compte, sans commission prélevée par
            Nourevo.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {restaurant.stripeOnboarded ? (
              <>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  ✓ Compte Stripe connecté
                </span>
                <button
                  type="button"
                  onClick={() => requestStripeAction('manage')}
                  disabled={managingStripeAccount}
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700 disabled:opacity-60"
                >
                  {managingStripeAccount ? 'Redirection...' : 'Modifier mes infos bancaires'}
                </button>
                <button
                  type="button"
                  onClick={() => requestStripeAction('disconnect')}
                  disabled={disconnectingStripe}
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-500 transition-all duration-300 hover:border-red-300/50 hover:text-red-600 disabled:opacity-60"
                >
                  {disconnectingStripe ? 'Déconnexion...' : 'Déconnecter'}
                </button>
              </>
            ) : restaurant.stripeAccountId ? (
              <>
                <span className="inline-flex items-center gap-2 rounded-full border border-navy-300/50 bg-navy-300/10 px-4 py-2 text-sm font-semibold text-navy-700">
                  Vérification Stripe en cours...
                </span>
                <button
                  type="button"
                  onClick={handleRefreshStripeStatus}
                  disabled={refreshingStripeStatus}
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700 disabled:opacity-60"
                >
                  {refreshingStripeStatus ? 'Vérification...' : 'Vérifier maintenant'}
                </button>
                <button
                  type="button"
                  onClick={handleConnectStripe}
                  disabled={connectingStripe}
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700 disabled:opacity-60"
                >
                  {connectingStripe ? 'Redirection...' : 'Reprendre la configuration'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnectStripe}
                disabled={connectingStripe}
                className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
              >
                {connectingStripe ? 'Redirection...' : 'Connecter mon compte bancaire'}
              </button>
            )}
          </div>

          {stripeConfirmAction !== null && (
            <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-3">
              <p className="text-xs font-semibold text-stone-600">
                Entrez le code PIN pour{' '}
                {stripeConfirmAction === 'manage' ? 'modifier les infos bancaires' : 'déconnecter le compte'}
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
                  Valider
                </button>
                <button
                  type="button"
                  onClick={cancelStripeConfirm}
                  className="rounded-full px-3 py-2 text-xs font-semibold text-stone-400 transition hover:text-stone-600"
                >
                  Annuler
                </button>
              </div>
              {stripeConfirmError && <p className="mt-1.5 text-xs text-red-600">{stripeConfirmError}</p>}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold text-stone-900">Abonnement Nourevo</h2>
          <p className="mt-2 text-sm text-stone-500">
            L'abonnement à la plateforme (accès au dashboard, à la carte digitale et au Mode Service) — à ne pas
            confondre avec le compte Stripe ci-dessus, qui sert uniquement à encaisser vos propres clients.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              ✓ Abonnement actif — {SUBSCRIPTION_PLAN_LABELS[restaurant.subscriptionPlan ?? 'monthly']}
            </span>
            <button
              type="button"
              onClick={handleManageBilling}
              disabled={managingBilling}
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700 disabled:opacity-60"
            >
              {managingBilling ? 'Redirection...' : 'Gérer mon abonnement'}
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
            <h2 className="font-display text-xl font-bold text-stone-900">Informations du restaurant</h2>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {TARGET_LOCALES.map((locale) => (
                  <span
                    key={locale.code}
                    title={restaurant.translations[locale.code] ? `Traduit en ${locale.label}` : `Pas encore traduit en ${locale.label}`}
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
                {translatingRestaurant ? 'Traduction...' : 'Traduire automatiquement'}
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
              Nom
              <input
                value={restaurant.name}
                onChange={(event) => updateRestaurantField({ name: event.target.value })}
                className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none focus:border-navy-300"
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
              Adresse
              <input
                value={restaurant.address}
                onChange={(event) => updateRestaurantField({ address: event.target.value })}
                className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none focus:border-navy-300"
              />
            </label>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Photo d'en-tête</p>
              <div className="mt-1.5 flex items-center gap-3">
                {restaurant.heroImage && (
                  <img src={restaurant.heroImage} alt="" className="h-16 w-16 rounded-xl object-cover" />
                )}
                <label className="cursor-pointer rounded-full border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40">
                  {uploadingHero ? 'Envoi...' : restaurant.heroImage ? 'Changer la photo' : 'Choisir une photo'}
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
                Pas encore vos propres photos ? Choisissez-en une parmi cette sélection :
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
              Tags (séparés par des virgules)
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
              Nombre de tables
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
                Détermine les numéros proposés à vos clients et la vue du Mode Service.
              </span>
            </label>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                Horaires d'ouverture{' '}
                <span className="font-normal normal-case tracking-normal text-stone-400">
                  (facultatif — affiché à vos clients sur la page menu)
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
                        Fermé
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
                  Retirer les horaires (ne plus afficher aux clients)
                </button>
              )}
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                Horaires menu midi / menu soir{' '}
                <span className="font-normal normal-case tracking-normal text-stone-500">
                  (facultatif — laissez vide pour proposer la carte toute la journée)
                </span>
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-stone-700">🥗 Menu midi</p>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={restaurant.lunchEnabled}
                      onClick={() => updateRestaurantField({ lunchEnabled: !restaurant.lunchEnabled })}
                      className={`relative h-7 w-[52px] shrink-0 rounded-full transition-colors duration-300 ${
                        restaurant.lunchEnabled ? 'bg-emerald-500' : 'bg-red-400'
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                          restaurant.lunchEnabled ? 'translate-x-[28px]' : 'translate-x-1'
                        }`}
                      />
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
                      Réinitialiser (vider les horaires)
                    </button>
                  )}
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-stone-700">🌙 Menu soir</p>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={restaurant.dinnerEnabled}
                      onClick={() => updateRestaurantField({ dinnerEnabled: !restaurant.dinnerEnabled })}
                      className={`relative h-7 w-[52px] shrink-0 rounded-full transition-colors duration-300 ${
                        restaurant.dinnerEnabled ? 'bg-emerald-500' : 'bg-red-400'
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                          restaurant.dinnerEnabled ? 'translate-x-[28px]' : 'translate-x-1'
                        }`}
                      />
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
                      Réinitialiser (vider les horaires)
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-stone-500">
                Un plat marqué "Menu midi" ou "Menu soir" (dans l'édition de chaque plat, onglet Carte) n'apparaît
                à vos clients que pendant cette plage horaire. Les plats "Toute la journée" restent toujours visibles.
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                Couleur des boutons (page client)
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
                    aria-label={`Couleur ${color}`}
                  />
                ))}
                <label
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-dashed border-stone-300 text-xs text-stone-400 hover:border-navy-300/50"
                  title="Choisir une couleur personnalisée"
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
                    Réinitialiser
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-stone-400">
                S'applique aux boutons vus par vos clients sur votre carte publique.
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                Vidéo d'introduction
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
                  {uploadingIntroVideo ? 'Envoi...' : restaurant.customIntroVideo ? '✓ Ma vidéo' : '📤 Ma propre vidéo'}
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
                    Retirer
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-stone-400">
                La vidéo jouée à l'ouverture de votre carte, avant l'affichage du menu. Format vertical conseillé,
                courte et en boucle, {MAX_VIDEO_SIZE_MB} Mo max.
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                Animation « commande en préparation »
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
                  {uploadingWaitVideo ? 'Envoi...' : restaurant.customWaitVideo ? '✓ Ma vidéo' : '📤 Ma propre vidéo'}
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
                    Retirer
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-stone-400">
                Affichée à l'écran une fois la commande validée, pendant que le client patiente. Vidéo courte en
                boucle, {MAX_VIDEO_SIZE_MB} Mo max.
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
                  title="Glisser pour réordonner"
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
                Supprimer la catégorie
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
                        title="Glisser pour réordonner"
                      >
                        ⠿
                      </span>
                      <span className="truncate font-semibold text-stone-900">{dish.name || 'Sans nom'}</span>
                    </span>
                    <span className="shrink-0 text-sm text-stone-500">{money(dish.price)}</span>
                  </summary>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                      Nom
                      <input
                        value={dish.name}
                        onChange={(event) => updateDish(dish.id, { name: event.target.value })}
                        className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none focus:border-navy-300"
                      />
                    </label>
                    <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                      Prix (€)
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
                      Description
                      <textarea
                        value={dish.description}
                        onChange={(event) => updateDish(dish.id, { description: event.target.value })}
                        rows={2}
                        className="mt-1.5 w-full resize-none rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none focus:border-navy-300"
                      />
                    </label>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Photo principale</p>
                      <div className="mt-1.5 flex items-center gap-3">
                        {dish.image && <img src={dish.image} alt="" className="h-14 w-14 rounded-xl object-cover" />}
                        <label className="cursor-pointer rounded-full border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40">
                          {uploadingDishImageId === dish.id ? 'Envoi...' : dish.image ? 'Changer' : 'Choisir une photo'}
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
                      Catégorie
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
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Galerie de photos</p>
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
                              aria-label="Supprimer cette photo"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <label className="flex h-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50/60 text-center text-xs font-semibold text-stone-500 transition-all duration-300 hover:border-navy-300/50 hover:text-navy-700">
                          {uploadingGalleryDishId === dish.id ? 'Envoi...' : '+ Ajouter'}
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
                        Suggestion du chef
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={dish.bestSeller}
                          onChange={(event) => updateDish(dish.id, { bestSeller: event.target.checked })}
                        />
                        Best seller
                      </label>
                      <label className="flex items-center gap-2 text-red-600">
                        <input
                          type="checkbox"
                          checked={dish.outOfStock}
                          onChange={(event) => updateDish(dish.id, { outOfStock: event.target.checked })}
                        />
                        Rupture de stock
                      </label>
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => toggleAdvanced(dish.id)}
                        className="text-xs font-semibold text-navy-700 hover:text-navy-800"
                      >
                        {advancedOpenIds.has(dish.id)
                          ? 'Masquer les options avancées ▲'
                          : 'Options avancées (créneau, stock, temps de prépa, rentabilité, régime, allergènes, piment, calories, suppléments) ▾'}
                      </button>
                    </div>

                    {advancedOpenIds.has(dish.id) && (
                      <>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Créneau</p>
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
                        📦 Suivre le stock de ce plat
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
                            en stock — le plat disparaît automatiquement de la carte une fois à 0.
                          </span>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs normal-case text-stone-400">
                          Stock illimité (par défaut). Le plat baisse tout seul à chaque commande une fois le suivi
                          activé — vous pouvez aussi corriger le chiffre manuellement à tout moment.
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
                        ⏱️ Indiquer un temps de préparation
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
                          <span className="text-xs normal-case text-stone-400">minutes</span>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs normal-case text-stone-400">
                          Facultatif — dès qu'au moins un plat a un temps renseigné, le temps d'attente affiché au
                          client se base sur les plats réellement commandés au lieu d'une estimation générique.
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Régime</p>
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
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Allergènes</p>
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
                      Piment
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
                            {level === 0 ? 'Aucun' : '🌶️'.repeat(level)}
                          </button>
                        ))}
                      </div>
                    </label>

                    <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                      Calories <span className="font-normal normal-case tracking-normal text-stone-400">(facultatif)</span>
                      <input
                        type="number"
                        min="0"
                        value={dish.calories ?? ''}
                        onChange={(event) =>
                          updateDish(dish.id, {
                            calories: event.target.value === '' ? null : Number.parseInt(event.target.value, 10),
                          })
                        }
                        placeholder="Ex : 450"
                        className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none focus:border-navy-300"
                      />
                    </label>

                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                        Suppléments <span className="font-normal normal-case tracking-normal text-stone-400">(facultatif, ex : Sauce fromage — 2€)</span>
                      </p>
                      <div className="mt-2 space-y-2">
                        {dish.extras.map((extra, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              value={extra.name}
                              onChange={(event) => updateExtra(dish, index, { name: event.target.value })}
                              placeholder="Nom (ex : Sauce fromage)"
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
                              placeholder="Prix"
                              className="w-24 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 outline-none focus:border-navy-300"
                            />
                            <button
                              type="button"
                              onClick={() => removeExtra(dish, index)}
                              className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-600"
                              aria-label="Supprimer ce supplément"
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
                          + Ajouter un supplément
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
                      💰 Activer l'analyse de rentabilité pour ce plat
                    </label>
                    <p className="mt-1 text-xs normal-case text-stone-400">
                      Facultatif — renseignez le coût de fabrication pour connaître votre marge réelle sur ce plat.
                    </p>

                    {dish.costEnabled && (
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                            Coût matières premières (€)
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
                                Calculé depuis le détail par ingrédient ci-dessous.
                              </span>
                            )}
                          </label>
                          <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                            Coût préparation / emballage (€)
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
                            Détail par ingrédient{' '}
                            <span className="font-normal normal-case tracking-normal text-stone-400">
                              (optionnel, avancé)
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
                                  placeholder="Ingrédient (ex : Steak haché 150g)"
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
                                  placeholder="Coût"
                                  className="w-24 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 outline-none focus:border-navy-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeCostBreakdownItem(dish, index)}
                                  className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-600"
                                  aria-label="Supprimer cet ingrédient"
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
                              + Ajouter un ingrédient
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
                                  Coût total
                                </p>
                                <p className="text-sm font-bold text-stone-900">{money(totalCost)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400">
                                  Marge brute
                                </p>
                                <p className="text-sm font-bold text-stone-900">{money(margin)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400">
                                  Taux de marge
                                </p>
                                <p className="text-sm font-bold text-stone-900">{Math.round(marginRate * 100)}%</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400">
                                  Rentabilité
                                </p>
                                <p className="text-sm font-bold text-stone-900">
                                  {PROFITABILITY_TIER_EMOJI[tier]} {PROFITABILITY_TIER_LABEL[tier]}
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
                        Supprimer ce plat
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateDish(category.id, dish)}
                        disabled={duplicatingDishId === dish.id}
                        className="text-xs font-semibold text-stone-500 hover:text-navy-700 disabled:opacity-60"
                      >
                        {duplicatingDishId === dish.id ? 'Duplication...' : '⧉ Dupliquer'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {TARGET_LOCALES.map((locale) => (
                          <span
                            key={locale.code}
                            title={dish.translations[locale.code] ? `Traduit en ${locale.label}` : `Pas encore traduit en ${locale.label}`}
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
                        {translatingDishId === dish.id ? 'Traduction...' : 'Traduire automatiquement'}
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
              + Ajouter un plat
            </button>
          </div>
        ))}

        <div className="flex gap-2 rounded-3xl border border-dashed border-navy-400/60 bg-navy-300/5 p-6">
          <input
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            placeholder="Nouvelle catégorie (ex : Boissons)"
            className="flex-1 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 outline-none transition-colors duration-300 focus:border-navy-300"
          />
          <button
            type="button"
            onClick={addCategory}
            className="shrink-0 rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-2.5 text-xs font-bold text-white transition-all duration-300 hover:-translate-y-0.5"
          >
            Ajouter
          </button>
        </div>
        </>
        </PinSectionGate>
        )}

        {routeTab !== null && (
          <div className="sticky bottom-4 z-30 flex flex-col items-center gap-3 rounded-3xl border border-stone-200/70 bg-white p-8 text-center shadow-card">
            <p className="text-sm text-stone-500">
              {hasUnsavedChanges
                ? '● Modifications non enregistrées — cliquez sur "Sauvegarder" pour les valider.'
                : 'Tout est enregistré.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={saveAllChanges}
                disabled={!hasUnsavedChanges || savingChanges}
                className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
              >
                {savingChanges ? 'Enregistrement...' : '💾 Sauvegarder'}
              </button>
              <button
                type="button"
                onClick={handleFinishEditing}
                className="rounded-full border border-stone-200 bg-white px-6 py-3.5 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40"
              >
                ✓ Terminé
              </button>
              <a
                href={`/r/${restaurant.slug}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-stone-200 bg-white px-6 py-3.5 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40"
              >
                Voir ma carte publique ↗
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
