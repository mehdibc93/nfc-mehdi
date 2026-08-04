import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { mapRestaurantWithMenu } from '../lib/mappers';
import type { Dish, RestaurantWithMenu } from '../lib/types';
import { money, formatCountdown } from '../lib/format';
import { LOCALES, t } from '../lib/i18n';
import type { Locale } from '../lib/i18n';
import { logDishEvent } from '../lib/analytics';
import { getOrderStatus, placeOrder, sendTableRequest } from '../lib/orders';
import type { OrderStatus } from '../lib/types';
import { accentGradient, accentTextColor } from '../lib/color';
import { getIntroVideo } from '../lib/introVideos';
import { ChefCookingIllustration } from '../components/ChefCookingIllustration';
import { getActiveMenuServices } from '../lib/menuSlots';
import { getOpenStatus } from '../lib/openingHours';
import { ALLERGENS, DIET_TAGS, allergenLabel, dietIcon, dietLabel } from '../lib/dietInfo';
import { getStripe } from '../lib/stripeClient';
import { StripeCheckoutForm } from '../components/StripeCheckoutForm';
import { LoadingScreen } from '../components/LoadingScreen';
import { setPageMeta } from '../lib/seo';

type Phase = 'scan' | 'cinematic' | 'menu' | 'checkout' | 'success';
type ModalStep = 'dish' | 'added' | 'drink' | 'drink-added' | 'dessert' | 'dessert-added' | null;
type FlatDish = Dish & { category: string };

type CartItem = {
  name: string;
  price: number;
  quantity: number;
  dishId?: string;
  extraNames?: string[];
};

// Clé stable pour le pseudo-filtre "Populaire" — indépendante de la langue affichée,
// contrairement au libellé traduit qui, lui, change quand on change de langue.
const POPULAR_CATEGORY_KEY = '__popular__';

// Photo utilisée pour le badge "Suggestion du chef" — à remplacer par une vraie photo du chef si besoin
const CHEF_AVATAR =
  'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=100&q=80';

function ChefBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-300/15 py-1 pl-1 pr-2.5 text-[11px] font-semibold text-navy-700">
      <img src={CHEF_AVATAR} alt={label} className="h-5 w-5 rounded-full object-cover" />
      {label}
    </span>
  );
}

export function RestaurantExperience() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<RestaurantWithMenu | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    supabase
      .from('restaurants')
      .select('*, categories(*, dishes(*))')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setRestaurant(data ? mapRestaurantWithMenu(data) : null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <LoadingScreen label={t('fr', 'loading')} />;
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-stone-900">{t('fr', 'notFound.title')}</h1>
        <p className="text-stone-500">{t('fr', 'notFound.subtitle')}</p>
        <Link to="/" className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-6 py-3 text-sm font-bold text-white">
          {t('fr', 'notFound.backHome')}
        </Link>
      </div>
    );
  }

  // Le restaurant de démonstration (owner_id nul) reste public quel que soit le statut
  // d'abonnement — seuls les vrais comptes restaurateur sont soumis à cette condition.
  if (restaurant.ownerId && restaurant.subscriptionStatus !== 'active') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-stone-900">Carte momentanément indisponible</h1>
        <p className="max-w-sm text-stone-500">
          Ce restaurant n'a pas encore activé sa carte digitale. Merci de vous rapprocher directement de
          l'établissement.
        </p>
        <Link to="/" className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-6 py-3 text-sm font-bold text-white">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return <RestaurantFlow restaurant={restaurant} />;
}

function RestaurantFlow({ restaurant }: { restaurant: RestaurantWithMenu }) {
  const [language, setLanguage] = useState<Locale>('fr');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const tr = (key: Parameters<typeof t>[1], vars?: Record<string, string | number>) => t(language, key, vars);

  const tableNumbers = useMemo(
    () => Array.from({ length: Math.max(1, restaurant.tableCount) }, (_, index) => String(index + 1)),
    [restaurant.tableCount],
  );

  const accentButtonStyle = restaurant.accentColor
    ? { backgroundImage: accentGradient(restaurant.accentColor), color: accentTextColor(restaurant.accentColor) }
    : undefined;

  const localizedDishName = (dish: FlatDish) =>
    language === 'fr' ? dish.name : dish.translations[language]?.name || dish.name;
  const localizedDishDescription = (dish: FlatDish) =>
    language === 'fr' ? dish.description : dish.translations[language]?.description || dish.description;
  const restaurantName = language === 'fr' ? restaurant.name : restaurant.translations[language]?.name || restaurant.name;
  const restaurantAddress =
    language === 'fr' ? restaurant.address : restaurant.translations[language]?.address || restaurant.address;
  const restaurantTags =
    language === 'fr'
      ? restaurant.tags
      : restaurant.translations[language]?.tags?.length
        ? restaurant.translations[language].tags
        : restaurant.tags;
  const openStatus = useMemo(() => getOpenStatus(restaurant.openingHours), [restaurant.openingHours]);

  useEffect(() => {
    const description = restaurantAddress
      ? `Menu digital de ${restaurantName} — ${restaurantAddress}. Consultez la carte et commandez directement depuis votre téléphone.`
      : `Menu digital de ${restaurantName}. Consultez la carte et commandez directement depuis votre téléphone.`;
    setPageMeta({
      title: `${restaurantName} — Menu digital | Nourevo`,
      description,
      image: restaurant.heroImage || undefined,
    });
  }, [restaurantName, restaurantAddress, restaurant.heroImage]);

  const paymentOptions = useMemo(
    () =>
      [
        restaurant.stripeOnboarded
          ? { id: 'app', label: tr('checkout.appPay'), description: tr('checkout.appPayDesc') }
          : null,
        { id: 'counter', label: tr('checkout.counter'), description: tr('checkout.counterDesc') },
      ].filter((option): option is { id: string; label: string; description: string } => option !== null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language, restaurant.stripeOnboarded],
  );
  const cookingSteps = useMemo(
    () => [tr('success.step1'), tr('success.step2'), tr('success.step3')],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language],
  );

  // null si le restaurateur n'a pas configuré d'horaires midi/soir : dans ce cas, tous les
  // plats restent visibles quel que soit leur créneau.
  const activeMenuServices = useMemo(() => getActiveMenuServices(restaurant), [restaurant]);

  const menuDishes = useMemo(
    () =>
      restaurant.categories.flatMap((category) =>
        category.dishes
          .filter((dish) => !activeMenuServices || activeMenuServices.includes(dish.service))
          .filter((dish) => dish.stockQuantity === null || dish.stockQuantity > 0)
          .map((dish) => ({ ...dish, category: category.name }) as FlatDish),
      ),
    [restaurant, activeMenuServices],
  );

  const bestSellers = useMemo(
    () => menuDishes.filter((dish) => dish.bestSeller && !dish.outOfStock).slice(0, 3),
    [menuDishes],
  );
  const recommendations = useMemo(
    () => menuDishes.filter((dish) => dish.recommended && !dish.outOfStock).slice(0, 4),
    [menuDishes],
  );
  const dessertMenu = useMemo(
    () => menuDishes.filter((dish) => dish.category === 'Desserts' && !dish.outOfStock),
    [menuDishes],
  );
  const drinkMenu = useMemo(
    () => menuDishes.filter((dish) => dish.category === 'Boissons' && !dish.outOfStock),
    [menuDishes],
  );
  const menuCategoryFilters = useMemo(
    () => [
      { key: POPULAR_CATEGORY_KEY, label: tr('menu.categoryPopular') },
      ...restaurant.categories.map((category) => ({ key: category.name, label: category.name })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [restaurant, language],
  );

  const [phase, setPhase] = useState<Phase>('scan');
  const [scanPing, setScanPing] = useState(0);
  const [selectedDish, setSelectedDish] = useState<FlatDish | null>(null);
  const [modalStep, setModalStep] = useState<ModalStep>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedDrink, setSelectedDrink] = useState<FlatDish | null>(drinkMenu[0] ?? null);
  const [selectedDessert, setSelectedDessert] = useState<FlatDish | null>(dessertMenu[0] ?? null);
  const [selectedTable, setSelectedTable] = useState('4');
  const [paymentMode, setPaymentMode] = useState(paymentOptions[0].id);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [enteringRestaurant, setEnteringRestaurant] = useState(false);
  const [activeMenuCategory, setActiveMenuCategory] = useState(POPULAR_CATEGORY_KEY);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [dietFilters, setDietFilters] = useState<Set<string>>(new Set());
  const [allergenExclusions, setAllergenExclusions] = useState<Set<string>>(new Set());
  const [showDietFilters, setShowDietFilters] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [selectedExtraIndexes, setSelectedExtraIndexes] = useState<Set<number>>(new Set());
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [creatingPaymentIntent, setCreatingPaymentIntent] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [sendingRequestType, setSendingRequestType] = useState<'bill' | 'waiter' | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [liveOrderStatus, setLiveOrderStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setScanPing((value) => (value + 1) % 4);
    }, 850);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (phase !== 'cinematic') return undefined;
    const timer = window.setTimeout(() => setVideoReady(true), 15000);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (modalStep !== 'added' && modalStep !== 'drink-added' && modalStep !== 'dessert-added') {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      if (modalStep === 'added') {
        if (drinkMenu.length > 0) {
          setModalStep('drink');
        } else if (dessertMenu.length > 0) {
          setModalStep('dessert');
        } else {
          setModalStep(null);
          setPhase('checkout');
        }
      } else if (modalStep === 'drink-added') {
        if (dessertMenu.length > 0) {
          setModalStep('dessert');
        } else {
          setModalStep(null);
          setPhase('checkout');
        }
      } else if (modalStep === 'dessert-added') {
        setModalStep(null);
        setPhase('checkout');
      }
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [modalStep, dessertMenu.length, drinkMenu.length]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [phase]);

  useEffect(() => {
    document.body.style.overflow = modalStep ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalStep]);

  useEffect(() => {
    if (!selectedDish || !modalStep) return undefined;
    const timer = window.setTimeout(() => {
      const target = document.getElementById('modal-scroll-area');
      target?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [modalStep, selectedDish]);

  useEffect(() => {
    setGalleryIndex(0);
    setSelectedExtraIndexes(new Set());
  }, [selectedDish?.id]);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  // Prépare le paiement carte/Apple Pay/Google Pay dès qu'on arrive sur l'étape paiement avec ce mode choisi.
  useEffect(() => {
    if (phase !== 'checkout' || paymentMode !== 'app' || !restaurant.stripeOnboarded || cart.length === 0) {
      return undefined;
    }
    let cancelled = false;
    setStripeClientSecret(null);
    setPaymentError(null);
    setCreatingPaymentIntent(true);
    supabase.functions
      .invoke<{ clientSecret?: string; error?: string }>('create-payment-intent', {
        body: {
          restaurantId: restaurant.id,
          items: cart.map((item) => ({ dishId: item.dishId, quantity: item.quantity, extraNames: item.extraNames })),
        },
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.clientSecret) {
          setPaymentError(data?.error ?? error?.message ?? 'Impossible de préparer le paiement.');
        } else {
          setStripeClientSecret(data.clientSecret);
        }
        setCreatingPaymentIntent(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paymentMode, restaurant.id, restaurant.stripeOnboarded]);

  // Somme les temps de préparation renseignés par le restaurateur (un par plat distinct du
  // panier, pas multiplié par la quantité) — `null` si aucun plat du panier n'a de temps
  // configuré, auquel cas on retombe sur l'estimation générique ci-dessous.
  const accumulatedPrepMinutes = useMemo(() => {
    const seenDishIds = new Set<string>();
    let sum = 0;
    let anyConfigured = false;
    cart.forEach((item) => {
      if (!item.dishId || seenDishIds.has(item.dishId)) return;
      seenDishIds.add(item.dishId);
      const dish = menuDishes.find((candidate) => candidate.id === item.dishId);
      if (dish?.prepTimeMinutes != null) {
        sum += dish.prepTimeMinutes;
        anyConfigured = true;
      }
    });
    return anyConfigured ? sum : null;
  }, [cart, menuDishes]);

  const estimatedMinutes = useMemo(() => {
    if (accumulatedPrepMinutes !== null) return Math.max(1, accumulatedPrepMinutes);
    const tableOffset = Number.parseInt(selectedTable, 10) || 4;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const hasDrink = selectedDrink ? cart.some((item) => item.name === selectedDrink.name) : false;
    const hasDessert = selectedDessert ? cart.some((item) => item.name === selectedDessert.name) : false;
    return 12 + Math.min(10, itemCount * 2 + (hasDrink ? 2 : 0) + (hasDessert ? 2 : 0) + (tableOffset % 4));
  }, [accumulatedPrepMinutes, cart, selectedDessert, selectedDrink, selectedTable]);

  const estimatedTime = `${estimatedMinutes} min`;

  useEffect(() => {
    if (phase !== 'success') return undefined;
    setRemainingSeconds(estimatedMinutes * 60);
    const timer = window.setInterval(() => {
      setRemainingSeconds((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Interroge le vrai statut de la commande pendant l'attente, pour refléter ce que le
  // restaurateur fait réellement dans le Mode Service plutôt qu'une simple simulation.
  useEffect(() => {
    if (phase !== 'success' || !placedOrderId) return undefined;
    let cancelled = false;
    let interval: number | undefined;
    const poll = () => {
      getOrderStatus(placedOrderId).then((status) => {
        if (cancelled || !status) return;
        setLiveOrderStatus(status);
        if ((status === 'served' || status === 'done') && interval) {
          window.clearInterval(interval);
        }
      });
    };
    poll();
    interval = window.setInterval(poll, 5000);
    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
    };
  }, [phase, placedOrderId]);

  const cookingProgress = estimatedMinutes > 0 ? 1 - remainingSeconds / (estimatedMinutes * 60) : 0;
  const timerStepIndex = remainingSeconds <= 0 ? 2 : cookingProgress < 0.12 ? 0 : cookingProgress < 0.92 ? 1 : 2;
  const statusStepIndex =
    liveOrderStatus === 'new'
      ? 0
      : liveOrderStatus === 'confirmed'
        ? 1
        : liveOrderStatus === 'served' || liveOrderStatus === 'done'
          ? 2
          : null;
  const activeStepIndex = statusStepIndex ?? timerStepIndex;

  const activeDishPhotos = useMemo(() => {
    if (!selectedDish) return [] as string[];
    return selectedDish.images && selectedDish.images.length > 0 ? selectedDish.images : [selectedDish.image];
  }, [selectedDish]);

  const activePhotoIndex = activeDishPhotos.length > 0 ? Math.min(galleryIndex, activeDishPhotos.length - 1) : 0;

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timer = window.setTimeout(() => setToastMessage(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const resetFlow = () => {
    setPhase('scan');
    setSelectedDish(null);
    setModalStep(null);
    setCart([]);
    setSelectedDrink(drinkMenu[0] ?? null);
    setSelectedDessert(dessertMenu[0] ?? null);
    setSelectedTable('4');
    setPaymentMode(paymentOptions[0].id);
    setSpecialInstructions('');
    setToastMessage(null);
    setVideoReady(false);
    setRemainingSeconds(0);
    setEnteringRestaurant(false);
    setActiveMenuCategory(POPULAR_CATEGORY_KEY);
    setMenuSearchQuery('');
  };

  const addToCart = (name: string, price: number, dishId?: string, extraNames?: string[]) => {
    setCart((current) => {
      const existing = current.find((item) => item.name === name);
      if (existing) {
        return current.map((item) => (item.name === name ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...current, { name, price, quantity: 1, dishId, extraNames }];
    });
  };

  const removeFromCart = (name: string) => {
    setCart((current) => {
      const removed = current.find((item) => item.name === name);
      if (removed) {
        logDishEvent(restaurant.id, removed.dishId ?? null, removed.name, 'remove_from_cart');
      }
      return current.filter((item) => item.name !== name);
    });
  };

  const openDish = (dish: FlatDish) => {
    setSelectedDish(dish);
    setModalStep('dish');
    logDishEvent(restaurant.id, dish.id, dish.name, 'view');
  };

  const startOrderForDish = (dish?: FlatDish | null) => {
    const dishToOrder = dish ?? selectedDish;
    if (!dishToOrder || dishToOrder.outOfStock) return;
    setSelectedDish(dishToOrder);
    // Les suppléments ne sont proposés que depuis la fiche plat, pas depuis l'ajout rapide sur une carte.
    const chosenExtras = dish ? [] : Array.from(selectedExtraIndexes).map((index) => dishToOrder.extras[index]).filter(Boolean);
    const extrasTotal = chosenExtras.reduce((sum, extra) => sum + extra.price, 0);
    const composedName =
      chosenExtras.length > 0
        ? `${localizedDishName(dishToOrder)} (+ ${chosenExtras.map((extra) => extra.name).join(', ')})`
        : localizedDishName(dishToOrder);
    addToCart(
      composedName,
      dishToOrder.price + extrasTotal,
      dishToOrder.id,
      chosenExtras.length > 0 ? chosenExtras.map((extra) => extra.name) : undefined,
    );
    logDishEvent(restaurant.id, dishToOrder.id, dishToOrder.name, 'add_to_cart');
    setSelectedDrink(drinkMenu[0] ?? null);
    setSelectedExtraIndexes(new Set());
    setModalStep('added');
  };

  const acceptDrink = () => {
    if (!selectedDrink) return;
    addToCart(localizedDishName(selectedDrink), selectedDrink.price, selectedDrink.id);
    logDishEvent(restaurant.id, selectedDrink.id, selectedDrink.name, 'add_to_cart');
    setModalStep('drink-added');
  };

  const acceptDessert = () => {
    if (!selectedDessert) return;
    addToCart(localizedDishName(selectedDessert), selectedDessert.price, selectedDessert.id);
    logDishEvent(restaurant.id, selectedDessert.id, selectedDessert.name, 'add_to_cart');
    setModalStep('dessert-added');
  };

  const startScan = () => {
    setVideoReady(false);
    setPhase('cinematic');
  };

  const enterRestaurant = () => {
    if (enteringRestaurant) return;
    setEnteringRestaurant(true);
    window.setTimeout(() => {
      setPhase('menu');
      setEnteringRestaurant(false);
    }, 550);
  };

  const finalizeOrder = () => {
    cart.forEach((item) => {
      logDishEvent(restaurant.id, item.dishId ?? null, item.name, 'purchase');
    });
    setPlacedOrderId(null);
    setLiveOrderStatus(null);
    placeOrder(
      restaurant.id,
      selectedTable,
      cart.map((item) => ({ name: item.name, price: item.price, quantity: item.quantity, extraNames: item.extraNames })),
      total,
      paymentMode === 'app',
      specialInstructions,
      cart
        .filter((item): item is typeof item & { dishId: string } => Boolean(item.dishId))
        .map((item) => ({ dishId: item.dishId, quantity: item.quantity })),
    ).then((orderId) => setPlacedOrderId(orderId));
    setModalStep(null);
    setPhase('success');
    setToastMessage(tr('success.paymentToast'));
  };

  const requestTableService = (type: 'bill' | 'waiter') => {
    sendTableRequest(restaurant.id, selectedTable, type);
    setSendingRequestType(type);
    window.setTimeout(() => setSendingRequestType(null), 2200);
    setToastMessage(type === 'waiter' ? tr('service.waiterToast') : tr('service.billToast'));
  };

  const confirmation =
    modalStep === 'added' && selectedDish
      ? {
          title: tr('confirmation.dishAddedTitle', { name: localizedDishName(selectedDish) }),
          subtitle: tr('confirmation.dishAddedSubtitle'),
          advance: () => {
            if (drinkMenu.length > 0) {
              setModalStep('drink');
            } else if (dessertMenu.length > 0) {
              setModalStep('dessert');
            } else {
              setModalStep(null);
              setPhase('checkout');
            }
          },
        }
      : modalStep === 'drink-added' && selectedDrink
        ? {
            title: tr('confirmation.drinkAddedTitle', { name: selectedDrink.name }),
            subtitle:
              dessertMenu.length > 0
                ? tr('confirmation.drinkAddedSubtitleWithDessert')
                : tr('confirmation.drinkAddedSubtitleNoDessert'),
            advance: () => {
              if (dessertMenu.length > 0) {
                setModalStep('dessert');
              } else {
                setModalStep(null);
                setPhase('checkout');
              }
            },
          }
        : modalStep === 'dessert-added' && selectedDessert
          ? {
              title: tr('confirmation.dessertAddedTitle', { name: localizedDishName(selectedDessert) }),
              subtitle: tr('confirmation.dessertAddedSubtitle'),
              advance: () => {
                setModalStep(null);
                setPhase('checkout');
              },
            }
          : null;

  const isBrowsingAllDishes =
    activeMenuCategory === POPULAR_CATEGORY_KEY &&
    !menuSearchQuery.trim() &&
    dietFilters.size === 0 &&
    allergenExclusions.size === 0;

  // On ne propose que les filtres qui ont vraiment un sens pour ce restaurant — inutile
  // d'afficher "Végan" si aucun plat de la carte n'est tagué comme tel.
  const availableDietTags = useMemo(
    () => DIET_TAGS.filter((tag) => menuDishes.some((dish) => dish.dietTags.includes(tag.key))),
    [menuDishes],
  );
  const availableAllergens = useMemo(
    () => ALLERGENS.filter((allergen) => menuDishes.some((dish) => dish.allergens.includes(allergen.key))),
    [menuDishes],
  );
  const hasFilterOptions = availableDietTags.length > 0 || availableAllergens.length > 0;
  const activeFilterCount = dietFilters.size + allergenExclusions.size;

  const toggleDietFilter = (key: string) => {
    setDietFilters((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAllergenExclusion = (key: string) => {
    setAllergenExclusions((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredMenuDishes = useMemo(() => {
    let list = menuDishes;
    if (activeMenuCategory !== POPULAR_CATEGORY_KEY) {
      list = list.filter((dish) => dish.category === activeMenuCategory);
    }
    const query = menuSearchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (dish) =>
          localizedDishName(dish).toLowerCase().includes(query) ||
          localizedDishDescription(dish).toLowerCase().includes(query),
      );
    }
    if (dietFilters.size > 0) {
      list = list.filter((dish) => Array.from(dietFilters).every((tag) => dish.dietTags.includes(tag)));
    }
    if (allergenExclusions.size > 0) {
      list = list.filter((dish) => !Array.from(allergenExclusions).some((allergen) => dish.allergens.includes(allergen)));
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuDishes, activeMenuCategory, menuCategoryFilters, menuSearchQuery, language, dietFilters, allergenExclusions]);

  const renderDishCard = (dish: FlatDish) => (
    <div
      key={dish.id}
      onClick={() => openDish(dish)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDish(dish);
        }
      }}
      role="button"
      tabIndex={0}
      className="group overflow-hidden rounded-3xl border border-stone-200/70 bg-white text-left shadow-soft transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-card"
    >
      <div className="relative overflow-hidden">
        <img
          src={dish.image}
          alt={localizedDishName(dish)}
          loading="lazy"
          decoding="async"
          className={`aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
            dish.outOfStock ? 'grayscale' : ''
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
        {dish.outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              {tr('menu.outOfStock')}
            </span>
          </div>
        )}
        <div className="absolute bottom-4 left-4 flex gap-2">
          {dish.bestSeller && (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-stone-900 backdrop-blur">
              {tr('menu.bestSellerBadge')}
            </span>
          )}
          {dish.recommended && (
            <span className="rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-white backdrop-blur">
              {tr('menu.recommendedBadge')}
            </span>
          )}
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-stone-900">{localizedDishName(dish)}</h3>
          <span className="text-sm font-bold text-stone-900">{money(dish.price)}</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-stone-500">{localizedDishDescription(dish)}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {dish.recommended && <ChefBadge label={tr('menu.chefBadge')} />}
          {dish.dietTags.map((tag) => (
            <span key={tag} title={dietLabel(tag)} className="text-base">
              {dietIcon(tag)}
            </span>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          {dish.outOfStock ? (
            <span className="rounded-full border border-stone-200 bg-stone-100 px-5 py-2.5 text-xs font-bold text-stone-400">
              {tr('menu.unavailable')}
            </span>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                startOrderForDish(dish);
              }}
              className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-2.5 text-xs font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5" style={accentButtonStyle}
            >
              {tr('menu.chooseDish')}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderScan = () => (
    <section className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl items-center px-4 py-14 sm:px-8 sm:py-20 lg:px-10">
      <div className="grid w-full gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
        <div className="space-y-8 sm:space-y-10">
          <div className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.32em] text-stone-500">
            <span className="h-1.5 w-1.5 rounded-full bg-navy-400" />
            Nourevo
          </div>
          <div className="space-y-5 sm:space-y-6">
            <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-stone-900 sm:text-5xl lg:text-7xl">
              {tr('scan.heroTitle')}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-stone-500 sm:text-lg sm:leading-8 lg:text-xl">
              {tr('scan.heroSubtitle')}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <button
              onClick={startScan}
              className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-8 py-[1.125rem] text-sm font-bold text-white shadow-glow transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg" style={accentButtonStyle}
            >
              {tr('scan.scanButton')}
            </button>
            <div className="rounded-full border border-stone-200/70 bg-white/60 px-6 py-4 text-sm text-stone-500">
              {tr('scan.noAppNote')}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {[
              [tr('scan.feature1Title'), tr('scan.feature1Sub')],
              [tr('scan.feature2Title'), tr('scan.feature2Sub')],
              [tr('scan.feature3Title'), tr('scan.feature3Sub')],
            ].map(([title, subtitle]) => (
              <div key={title} className="glass rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1">
                <div className="mb-4 h-9 w-9 rounded-2xl bg-navy-300/12" />
                <p className="font-semibold text-stone-900">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{subtitle}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <div className="absolute inset-0 mx-auto h-[320px] w-[320px] rounded-full bg-navy-300/8 blur-3xl sm:h-[430px] sm:w-[430px]" />
          <div className="relative w-full max-w-[420px] rounded-3xl border border-stone-200/70 bg-white p-3 shadow-soft sm:p-4">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#090909] p-3 sm:p-5">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-stone-500">
                <span>{tr('scan.previewLabel')}</span>
                <span className="text-navy-100">{restaurantName}</span>
              </div>

              <div className="relative mt-4 flex h-[320px] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(240,221,139,0.24),transparent_35%),linear-gradient(180deg,#1a1aa1,#090909)] sm:mt-6 sm:h-[420px] lg:h-[460px]">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.6))]" />
                <div
                  className={`absolute inset-x-10 top-8 h-2 rounded-full bg-white/5 transition-all duration-500 ${
                    scanPing % 2 === 0 ? 'opacity-70' : 'opacity-30'
                  }`}
                >
                  <div
                    className={`h-full rounded-full bg-gradient-to-r from-navy-600 to-navy-800 transition-all duration-500 ${
                      scanPing === 0 ? 'w-1/4' : scanPing === 1 ? 'w-1/2' : scanPing === 2 ? 'w-3/4' : 'w-full'
                    }`}
                  />
                </div>

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(60,90,134,0.16),transparent_42%)]" />
                <div className="absolute h-28 w-28 rounded-full border border-navy-200/30 bg-navy-300/10 blur-sm" />

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="relative mb-6 h-36 w-36 animate-float">
                    <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-[34%] bg-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" />
                    <div className="absolute left-[36%] top-[26%] h-7 w-7 rounded-full bg-stone-300" />
                    <div className="absolute right-[36%] top-[26%] h-7 w-7 rounded-full bg-stone-300" />
                    <div className="absolute left-[29%] top-[30%] h-4 w-4 rounded-full bg-black/70" />
                    <div className="absolute right-[29%] top-[30%] h-4 w-4 rounded-full bg-black/70" />
                    <div className="absolute left-1/2 top-[47%] h-5 w-5 -translate-x-1/2 rounded-full bg-rose-200/80" />
                    <div className="absolute left-1/2 top-[50%] h-8 w-16 -translate-x-1/2 rounded-b-[30px] border-b-4 border-stone-700/80" />
                    <div className="absolute left-1/2 top-[63%] h-16 w-10 -translate-x-1/2 rounded-b-[24px] bg-white" />
                    <div className="absolute left-[20%] top-[55%] h-14 w-8 -rotate-12 rounded-b-[18px] bg-stone-300" />
                    <div className="absolute right-[20%] top-[55%] h-14 w-8 rotate-12 rounded-b-[18px] bg-stone-300" />
                    <div className="absolute bottom-0 left-1/2 h-8 w-28 -translate-x-1/2 rounded-[50%] bg-navy-300/20 blur-lg" />
                  </div>

                  <p className="text-xs uppercase tracking-[0.35em] text-navy-100">{tr('scan.chefOpening')}</p>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-stone-300">{tr('scan.chefDescription')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderCinematic = () => (
    <section className="fixed inset-0 z-50 h-dvh w-screen overflow-hidden bg-black">
      <video
        autoPlay
        muted
        playsInline
        onEnded={(event) => {
          // Boucle gérée manuellement (plutôt que l'attribut `loop`) pour pouvoir détecter
          // la toute première fin de lecture et afficher le bouton dès ce moment-là, pas
          // seulement après un deuxième passage de la vidéo.
          setVideoReady(true);
          const video = event.currentTarget;
          video.currentTime = 0;
          video.play().catch(() => {});
        }}
        onError={() => setVideoReady(true)}
        className="absolute inset-0 h-full w-full object-cover"
        src={restaurant.customIntroVideo || getIntroVideo(restaurant.introVideo).file}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />

      {videoReady && (
        <>
          <div className="absolute inset-x-0 bottom-0 animate-slideUp px-6 pb-40 text-center sm:px-12 sm:pb-48 lg:px-20 lg:pb-56">
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-white/70">{tr('cinematic.welcome')}</p>
            <h1 className="mx-auto mt-4 max-w-3xl font-display text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              {restaurantName}
            </h1>
            <p className="mt-4 text-lg text-white/80">{tr('cinematic.discover')}</p>
          </div>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto relative animate-slideUp">
              <button
                onClick={enterRestaurant}
                disabled={enteringRestaurant}
                className={`relative z-10 rounded-full bg-white px-10 py-5 text-sm font-bold text-stone-900 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-300 ease-out hover:-translate-y-0.5 ${
                  enteringRestaurant ? 'scale-90 shadow-[0_0_70px_22px_rgba(212,175,110,0.85)]' : ''
                }`}
              >
                {tr('cinematic.enterButton')}
              </button>
              {enteringRestaurant && (
                <>
                  <span className="pointer-events-none absolute inset-0 rounded-full border-2 border-navy-300 enter-ripple" />
                  <span
                    className="pointer-events-none absolute inset-0 rounded-full bg-navy-300/40 enter-ripple"
                    style={{ animationDelay: '0.12s' }}
                  />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );

  const renderMenu = () => (
    <section className="w-full">
      <div className="relative h-64 w-full overflow-hidden sm:h-80 animate-fadeIn">
        <img src={restaurant.heroImage} alt={restaurantName} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-black/25" />
        <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-8 sm:top-6">
          <button
            onClick={resetFlow}
            className="rounded-full border border-white/30 bg-black/40 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition-all duration-300 hover:bg-black/55 sm:text-sm"
          >
            {tr('menu.restart')}
          </button>
        </div>
      </div>

      <div className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-10 sm:px-8 sm:pb-14 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.14fr_0.86fr] lg:gap-12">
          <div className="space-y-8">
            <div className="relative -mt-12 rounded-3xl border border-stone-200/70 bg-white p-6 shadow-card sm:-mt-16 sm:p-7">
              <h1 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">{restaurantName}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone-500">
                <span className="flex items-center gap-1.5 font-semibold text-stone-900">
                  <span className="text-navy-500">★</span>
                  {restaurant.rating}
                  <span className="font-normal text-stone-400">
                    ({restaurant.reviewCount} {tr('menu.reviewsSuffix')})
                  </span>
                </span>
                <span className="flex items-center gap-1.5">🕒 {restaurant.prepTime}</span>
                <span className="flex items-center gap-1.5">📍 {restaurantAddress}</span>
                {openStatus && (
                  <span
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      openStatus.isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {openStatus.isOpen ? '🟢' : '🔴'} {openStatus.label}
                  </span>
                )}
              </div>
              {restaurantTags.length > 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-400">
                  <span>ⓘ</span> {restaurantTags.join(' · ')}
                </p>
              )}
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-stone-400">🔍</span>
              <input
                value={menuSearchQuery}
                onChange={(event) => setMenuSearchQuery(event.target.value)}
                placeholder={tr('menu.searchPlaceholder')}
                className="w-full rounded-full border border-stone-200 bg-white py-4 pl-12 pr-28 text-sm text-stone-700 outline-none transition-colors duration-300 focus:border-navy-300"
              />
              {hasFilterOptions && (
                <button
                  type="button"
                  onClick={() => setShowDietFilters((value) => !value)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                    activeFilterCount > 0
                      ? 'bg-navy-700 text-white'
                      : 'border border-stone-200 bg-white text-stone-500 hover:border-navy-300/40'
                  }`}
                >
                  ⚙️ Filtres{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </button>
              )}
            </div>

            {showDietFilters && hasFilterOptions && (
              <div className="space-y-4 rounded-3xl border border-stone-200/70 bg-white p-5">
                {availableDietTags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Régime</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {availableDietTags.map((tag) => (
                        <button
                          key={tag.key}
                          type="button"
                          onClick={() => toggleDietFilter(tag.key)}
                          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ${
                            dietFilters.has(tag.key)
                              ? 'border-navy-400 bg-navy-300/15 text-navy-700'
                              : 'border-stone-200 bg-white text-stone-500 hover:border-navy-300/40'
                          }`}
                        >
                          {tag.icon} {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {availableAllergens.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
                      Allergènes à éviter
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {availableAllergens.map((allergen) => (
                        <button
                          key={allergen.key}
                          type="button"
                          onClick={() => toggleAllergenExclusion(allergen.key)}
                          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ${
                            allergenExclusions.has(allergen.key)
                              ? 'border-red-300 bg-red-50 text-red-600'
                              : 'border-stone-200 bg-white text-stone-500 hover:border-red-200'
                          }`}
                        >
                          {allergen.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDietFilters(new Set());
                      setAllergenExclusions(new Set());
                    }}
                    className="text-xs font-semibold text-stone-400 underline hover:text-stone-600"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}

            {activeMenuServices && (
              <p className="text-xs font-semibold text-navy-700">
                {activeMenuServices.includes('lunch')
                  ? '🥗 Menu du midi actuellement proposé'
                  : activeMenuServices.includes('dinner')
                    ? '🌙 Menu du soir actuellement proposé'
                    : "Carte permanente actuellement proposée — le menu midi/soir n'est pas disponible pour le moment."}
              </p>
            )}

            <div className="flex flex-wrap gap-2.5">
              {menuCategoryFilters.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => setActiveMenuCategory(category.key)}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                    activeMenuCategory === category.key
                      ? 'bg-stone-900 text-white'
                      : 'border border-stone-200 bg-white text-stone-600 hover:border-navy-300/40'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {isBrowsingAllDishes ? (
              <>
                {bestSellers.length > 0 && (
                <div className="space-y-5">
                  <div className="flex items-end justify-between">
                    <h2 className="font-display text-2xl font-bold text-stone-900">{tr('menu.bestSellersTitle')}</h2>
                    <p className="text-sm text-stone-400">{tr('menu.bestSellersSubtitle')}</p>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {bestSellers.map((dish) => (
                      <div
                        key={dish.id}
                        onClick={() => openDish(dish)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openDish(dish);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className="group overflow-hidden rounded-3xl border border-stone-200/70 bg-white text-left shadow-soft transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-card"
                      >
                        <div className="overflow-hidden">
                          <img
                            src={dish.image}
                            alt={localizedDishName(dish)}
                            loading="lazy"
                            decoding="async"
                            className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                        </div>
                        <div className="p-6">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-navy-300/15 px-2.5 py-1 text-[11px] font-semibold text-navy-700">
                              {tr('menu.bestSellerBadge')}
                            </span>
                            {dish.recommended && <ChefBadge label={tr('menu.chefBadge')} />}
                            <span className="text-[11px] uppercase tracking-[0.2em] text-stone-400">{dish.category}</span>
                          </div>
                          <h3 className="mt-3 text-2xl font-semibold text-stone-900">{localizedDishName(dish)}</h3>
                          <p className="mt-1.5 text-base font-bold text-stone-900">{money(dish.price)}</p>
                          <div className="mt-5 flex justify-end">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                startOrderForDish(dish);
                              }}
                              className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-2.5 text-xs font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5" style={accentButtonStyle}
                            >
                              {tr('menu.chooseDish')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {recommendations.length > 0 && (
                <div className="space-y-5">
                  <div className="flex items-end justify-between">
                    <h2 className="font-display text-2xl font-bold text-stone-900">{tr('menu.chefPicksTitle')}</h2>
                    <p className="text-sm text-stone-400">{tr('menu.chefPicksSubtitle')}</p>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {recommendations.map((dish) => (
                      <div
                        key={dish.id}
                        onClick={() => openDish(dish)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openDish(dish);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className="grid grid-cols-1 gap-0 overflow-hidden rounded-3xl border border-stone-200/70 bg-white text-left shadow-soft transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-card sm:grid-cols-[150px_1fr]"
                      >
                        <img
                          src={dish.image}
                          alt={localizedDishName(dish)}
                          loading="lazy"
                          decoding="async"
                          className="h-full min-h-[180px] w-full object-cover sm:min-h-[220px]"
                        />
                        <div className="p-6">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-navy-300/15 px-2.5 py-1 text-[11px] font-semibold text-navy-700">
                              {tr('menu.recommendedBadge')}
                            </span>
                            <ChefBadge label={tr('menu.chefBadge')} />
                          </div>
                          <h3 className="mt-3 text-lg font-semibold text-stone-900">{localizedDishName(dish)}</h3>
                          <p className="mt-1.5 text-sm text-stone-500">{localizedDishDescription(dish)}</p>
                          <div className="mt-5 flex justify-start">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                startOrderForDish(dish);
                              }}
                              className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-2.5 text-xs font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5" style={accentButtonStyle}
                            >
                              {tr('menu.chooseDish')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}

                <div className="space-y-5">
                  <h2 className="font-display text-2xl font-bold text-stone-900">{tr('menu.allDishesTitle')}</h2>
                  <div className="grid gap-6 sm:grid-cols-2">{menuDishes.map(renderDishCard)}</div>
                </div>
              </>
            ) : (
              <div className="space-y-5">
                <div className="flex items-end justify-between">
                  <h2 className="font-display text-2xl font-bold text-stone-900">
                    {menuSearchQuery.trim()
                      ? tr('menu.searchResultsTitle', { query: menuSearchQuery.trim() })
                      : activeMenuCategory}
                  </h2>
                  <p className="text-sm text-stone-400">{tr('menu.dishCount', { count: filteredMenuDishes.length })}</p>
                </div>
                {filteredMenuDishes.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50/60 p-8 text-center text-sm text-stone-500">
                    {tr('menu.noResults')}
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2">{filteredMenuDishes.map(renderDishCard)}</div>
                )}
              </div>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <div className="glass rounded-3xl p-8">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-stone-900">{tr('menu.yourOrder')}</h2>
                <span className="rounded-full bg-stone-900/5 px-3 py-1 text-xs font-semibold text-stone-500">
                  {tr('menu.itemsCount', { count: cart.length })}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {cart.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 p-5 text-sm text-stone-500">
                    {tr('menu.emptyCart')}
                  </div>
                )}
                {cart.map((item) => (
                  <div key={item.name} className="rounded-2xl border border-stone-200/80 bg-white p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-stone-900">{item.name}</p>
                        <p className="mt-1 text-sm text-stone-400">{tr('menu.quantity', { count: item.quantity })}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-stone-900">{money(item.price * item.quantity)}</p>
                        <button onClick={() => removeFromCart(item.name)} className="mt-2 text-xs text-stone-400 transition-colors duration-300 hover:text-stone-900">
                          {tr('menu.remove')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-3xl border border-navy-300/25 bg-navy-300/8 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-600">{tr('menu.total')}</span>
                  <span className="text-2xl font-bold text-navy-700">{money(total)}</span>
                </div>
                <p className="mt-2 text-sm text-stone-500">{tr('menu.estimatedTimeAfterPayment')}</p>
              </div>

              <button
                onClick={() => setPhase('checkout')}
                className="mt-6 w-full rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-[1.125rem] text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg" style={accentButtonStyle}
              >
                {tr('menu.goToPayment')}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );

  const renderCheckout = () => (
    <section className="mx-auto min-h-screen w-full max-w-7xl px-4 py-10 sm:px-8 sm:py-14 lg:px-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:gap-12">
        <div className="space-y-6">
          <div className="glass rounded-3xl p-8">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">{tr('checkout.badge')}</span>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
              {tr('checkout.title')}
            </h1>
            <p className="mt-4 max-w-3xl text-stone-500">{tr('checkout.subtitle')}</p>
          </div>

          <div className="glass rounded-3xl p-8">
            <h2 className="font-display text-2xl font-bold text-stone-900">{tr('checkout.tableNumber')}</h2>
            <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-6">
              {tableNumbers.map((table) => (
                <button
                  key={table}
                  onClick={() => setSelectedTable(table)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                    selectedTable === table
                      ? 'border-navy-300/50 bg-navy-300/15 text-stone-900'
                      : 'border-stone-200 bg-white text-stone-500 hover:border-navy-300/30 hover:bg-navy-300/5'
                  }`}
                >
                  {table}
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-8">
            <h2 className="font-display text-2xl font-bold text-stone-900">{tr('checkout.paymentMode')}</h2>
            <div className="mt-5 space-y-3">
              {paymentOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setPaymentMode(option.id)}
                  className={`w-full rounded-2xl border p-5 text-left transition-all duration-300 ${
                    paymentMode === option.id
                      ? 'border-navy-300/50 bg-navy-300/10'
                      : 'border-stone-200 bg-white hover:border-navy-300/30 hover:bg-navy-300/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-stone-900">{option.label}</p>
                      <p className="mt-1 text-sm text-stone-500">{option.description}</p>
                    </div>
                    <span className={`mt-1 h-3 w-3 rounded-full transition-colors duration-300 ${paymentMode === option.id ? 'bg-navy-400' : 'bg-stone-200'}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-8">
            <h2 className="font-display text-2xl font-bold text-stone-900">{tr('checkout.instructionsTitle')}</h2>
            <p className="mt-2 text-sm text-stone-500">{tr('checkout.instructionsSubtitle')}</p>
            <textarea
              value={specialInstructions}
              onChange={(event) => setSpecialInstructions(event.target.value)}
              placeholder={tr('checkout.instructionsPlaceholder')}
              rows={3}
              className="mt-4 w-full resize-none rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition-colors duration-300 focus:border-navy-300"
            />
          </div>

          <div className="glass rounded-3xl p-8">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">{tr('checkout.afterPaymentBadge')}</span>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-3xl font-bold text-stone-900">{tr('checkout.afterPaymentTitle')}</h2>
              <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-500">
                {tr('checkout.table', { number: selectedTable })}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          <div className="glass rounded-3xl p-8">
            <h2 className="font-display text-2xl font-bold text-stone-900">{tr('checkout.summary')}</h2>
            <div className="mt-6 space-y-3">
              {cart.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-2xl bg-stone-50/70 px-4 py-3">
                  <div>
                    <p className="font-medium text-stone-900">{item.name}</p>
                    <p className="text-sm text-stone-400">x{item.quantity}</p>
                  </div>
                  <p className="font-semibold text-stone-900">{money(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            {specialInstructions.trim() && (
              <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">{tr('checkout.kitchenInstructions')}</p>
                <p className="mt-2 text-sm text-stone-600">{specialInstructions}</p>
              </div>
            )}

            <div className="mt-6 rounded-3xl border border-navy-300/25 bg-navy-300/8 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">{tr('checkout.totalDue')}</span>
                <span className="text-3xl font-bold text-navy-700">{money(total)}</span>
              </div>
              <p className="mt-2 text-sm text-stone-500">{tr('checkout.timeAfterValidation')}</p>
            </div>

            {paymentMode === 'app' ? (
              <div className="mt-6">
                {creatingPaymentIntent && (
                  <p className="text-center text-sm text-stone-400">Préparation du paiement...</p>
                )}
                {paymentError && (
                  <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    {paymentError}
                  </p>
                )}
                {stripeClientSecret && restaurant.stripeAccountId && (
                  <StripeCheckoutForm
                    stripePromise={getStripe(restaurant.stripeAccountId)}
                    clientSecret={stripeClientSecret}
                    payLabel={tr('checkout.payWithApp')}
                    onSuccess={finalizeOrder}
                    onError={setPaymentError}
                  />
                )}
              </div>
            ) : (
              <button
                onClick={finalizeOrder}
                className="mt-6 w-full rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-[1.125rem] text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg" style={accentButtonStyle}
              >
                {tr('checkout.payAtCounter')}
              </button>
            )}

            <button
              onClick={() => setPhase('menu')}
              className="mt-3 w-full rounded-full border border-stone-200 bg-white px-5 py-4 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/30 hover:bg-navy-300/5"
            >
              {tr('checkout.backToMenu')}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );

  const renderSuccess = () => (
    <section className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-14 sm:px-8 sm:py-20 lg:px-10">
      <div className="relative w-full overflow-hidden rounded-3xl border border-stone-200/70 bg-white p-6 shadow-soft sm:p-10">
        <div className="absolute inset-0 opacity-70">
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-navy-300/8 blur-3xl" />
          <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-navy-300/8 blur-3xl" />
        </div>
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
              <span>✓</span>
              {tr('success.confirmed')}
            </div>
            <h1 className="font-display text-5xl font-bold tracking-tight text-stone-900 sm:text-6xl">
              {tr('success.title')}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-stone-500">{tr('success.subtitle')}</p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-stone-200/80 bg-stone-50/60 p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-stone-400">{tr('success.table')}</p>
                <p className="mt-2 text-3xl font-bold text-stone-900">{selectedTable}</p>
              </div>
              <div className="rounded-3xl border border-navy-300/25 bg-navy-300/8 p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">{tr('success.totalPaid')}</p>
                <p className="mt-2 text-3xl font-bold text-navy-700">{money(total)}</p>
              </div>
              <div className="rounded-3xl border border-stone-200/80 bg-stone-50/60 p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-stone-400">{tr('success.estimatedTime')}</p>
                <p className="mt-2 text-3xl font-bold text-stone-900">{estimatedTime}</p>
                {statusStepIndex !== null && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Suivi en direct par le restaurant
                  </p>
                )}
              </div>
            </div>

            {specialInstructions.trim() && (
              <div className="rounded-3xl border border-navy-300/25 bg-navy-300/8 p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-navy-700">{tr('success.kitchenInstructionsSent')}</p>
                <p className="mt-2 text-sm text-stone-700">{specialInstructions}</p>
              </div>
            )}

            {restaurant.reviewUrl && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-stone-200/80 bg-stone-50/60 p-6">
                <div>
                  <p className="font-semibold text-stone-900">⭐ Vous appréciez {restaurantName} ?</p>
                  <p className="mt-1 text-sm text-stone-500">Un avis prend 30 secondes et nous aide énormément.</p>
                </div>
                <a
                  href={restaurant.reviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5"
                >
                  Laisser un avis
                </a>
              </div>
            )}
          </div>

          <div className="relative flex flex-col items-center gap-6">
            <div className="absolute inset-0 m-auto h-72 w-72 rounded-full bg-navy-300/10 blur-3xl" />

            <div className="relative z-10 flex w-full max-w-xs items-start justify-between">
              {cookingSteps.map((label, index) => (
                <div key={index} className="flex flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full transition-colors duration-500 ${
                        index <= activeStepIndex ? 'bg-navy-400' : 'bg-stone-200'
                      }`}
                    />
                    {index < cookingSteps.length - 1 && (
                      <span
                        className={`mx-1 h-0.5 flex-1 rounded-full transition-colors duration-500 ${
                          index < activeStepIndex ? 'bg-navy-400' : 'bg-stone-200'
                        }`}
                      />
                    )}
                  </div>
                  <p
                    className={`mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors duration-500 ${
                      index <= activeStepIndex ? 'text-stone-900' : 'text-stone-400'
                    }`}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative z-10 flex items-center gap-3 rounded-full border border-stone-200 bg-white px-5 py-3 shadow-soft">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
                  <circle cx="20" cy="20" r="17" fill="none" stroke="#ece5d6" strokeWidth="3" />
                  <circle
                    cx="20"
                    cy="20"
                    r="17"
                    fill="none"
                    stroke="#d4af37"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={106.8}
                    strokeDashoffset={106.8 * (1 - cookingProgress)}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <span className="absolute text-sm">⏱️</span>
              </span>
              <div className="text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-400">{tr('success.readyIn')}</p>
                <p className="font-display text-lg font-bold tabular-nums text-stone-900">
                  {formatCountdown(remainingSeconds)}
                </p>
              </div>
            </div>

            {restaurant.customWaitVideo ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                src={restaurant.customWaitVideo}
                className="relative z-10 h-48 w-48 rounded-3xl object-cover sm:h-64 sm:w-64"
              />
            ) : (
              <ChefCookingIllustration className="relative z-10 h-48 w-48 sm:h-64 sm:w-64" />
            )}
          </div>
        </div>

        <div className="relative z-10 mt-10 flex flex-wrap gap-3">
          <button
            onClick={resetFlow}
            className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-6 py-4 text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg" style={accentButtonStyle}
          >
            {tr('success.newOrder')}
          </button>
          <button
            onClick={() => setPhase('menu')}
            className="rounded-full border border-stone-200 bg-white px-6 py-4 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/30"
          >
            {tr('success.backToMenu')}
          </button>
        </div>
      </div>
    </section>
  );

  const showFloatingControls = !confirmation && !(selectedDish && modalStep);
  const currentLocaleInfo = LOCALES.find((locale) => locale.code === language) ?? LOCALES[0];

  return (
    <div className="relative min-h-screen overflow-hidden text-stone-900">
      {showFloatingControls && (
        <div className="fixed right-4 top-4 z-[55] sm:right-6 sm:top-5">
          <button
            type="button"
            onClick={() => setShowLangMenu((value) => !value)}
            className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition-all duration-300 hover:bg-black/60"
          >
            <span>{currentLocaleInfo.flag}</span>
            <span className="hidden sm:inline">{currentLocaleInfo.label}</span>
          </button>
          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card">
              {LOCALES.map((locale) => (
                <button
                  key={locale.code}
                  type="button"
                  onClick={() => {
                    setLanguage(locale.code);
                    setShowLangMenu(false);
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-stone-50 ${
                    language === locale.code ? 'font-semibold text-navy-700' : 'text-stone-700'
                  }`}
                >
                  <span>{locale.flag}</span> {locale.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {phase !== 'menu' && (
        <header className="sticky top-0 z-40 border-b border-stone-900/5 bg-[#f6f8fb]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-stone-900">{restaurantName}</p>
              <Link to="/" className="text-xs uppercase tracking-[0.32em] text-stone-400 hover:text-navy-700">
                {tr('poweredBy')}
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="rounded-full bg-stone-900/5 px-3 py-1.5 text-xs font-semibold text-stone-500">
                {phase === 'scan'
                  ? tr('phase.scan')
                  : phase === 'cinematic'
                    ? tr('phase.cinematic')
                    : phase === 'checkout'
                      ? tr('phase.checkout')
                      : tr('phase.success')}
              </span>
              <button
                onClick={resetFlow}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/40 hover:text-navy-700"
              >
                {tr('menu.restart')}
              </button>
            </div>
          </div>
        </header>
      )}

      {toastMessage && (
        <div className="fixed left-1/2 top-6 z-[60] -translate-x-1/2 animate-slideUp rounded-full bg-white px-5 py-3 text-sm font-semibold text-stone-800 shadow-card">
          {toastMessage}
        </div>
      )}

      {showFloatingControls && (phase === 'menu' || phase === 'checkout') && (
        <div className="fixed bottom-4 right-4 z-[55] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
          <button
            type="button"
            onClick={() => requestTableService('waiter')}
            disabled={sendingRequestType === 'waiter'}
            className="rounded-full border border-white/20 bg-black/70 px-4 py-2.5 text-xs font-semibold text-white shadow-card backdrop-blur transition-all duration-300 hover:bg-black/85 disabled:opacity-60"
          >
            {sendingRequestType === 'waiter' ? '✓' : '🔔'} {tr('service.callWaiter')}
          </button>
          <button
            type="button"
            onClick={() => requestTableService('bill')}
            disabled={sendingRequestType === 'bill'}
            className="rounded-full border border-white/20 bg-black/70 px-4 py-2.5 text-xs font-semibold text-white shadow-card backdrop-blur transition-all duration-300 hover:bg-black/85 disabled:opacity-60"
          >
            {sendingRequestType === 'bill' ? '✓' : '💶'} {tr('service.requestBill')}
          </button>
        </div>
      )}

      <main>
        {phase === 'scan' && renderScan()}
        {phase === 'cinematic' && renderCinematic()}
        {phase === 'menu' && renderMenu()}
        {phase === 'checkout' && renderCheckout()}
        {phase === 'success' && renderSuccess()}
      </main>

      {confirmation && (
        <div
          onClick={confirmation.advance}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-9 text-center shadow-[0_30px_90px_rgba(0,0,0,0.35)] animate-slideUp">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-emerald-500">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75l2.25 2.25L15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-stone-900">{confirmation.title}</h3>
            <p className="mt-3 text-sm text-stone-400">{confirmation.subtitle}</p>
          </div>
        </div>
      )}

      {selectedDish && (modalStep === 'dish' || modalStep === 'drink' || modalStep === 'dessert') && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4">
          <div id="modal-scroll-area" className="relative max-h-[94vh] w-full max-w-5xl overflow-y-auto overflow-x-hidden rounded-3xl border border-stone-200/70 bg-white shadow-[0_45px_120px_rgba(30,25,15,0.25)] dish-reveal">
            <button
              onClick={() => {
                setModalStep(null);
                setSelectedDish(null);
              }}
              className="absolute right-4 top-4 z-20 rounded-full border border-white/10 bg-black/50 px-3 py-2 text-sm text-white transition-colors duration-300 hover:bg-black/65"
            >
              {tr('modal.close')}
            </button>

            <div className="grid lg:grid-cols-[1fr_0.95fr]">
              <div className="relative min-h-[280px] sm:min-h-[340px] lg:min-h-[680px]">
                <img
                  src={activeDishPhotos[activePhotoIndex] ?? selectedDish.image}
                  alt={`${localizedDishName(selectedDish)} — ${activePhotoIndex + 1}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />

                {activeDishPhotos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setGalleryIndex((i) => (i - 1 + activeDishPhotos.length) % activeDishPhotos.length)
                      }
                      className="absolute left-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-lg text-white backdrop-blur transition-colors duration-300 hover:bg-black/65"
                      aria-label="Photo précédente"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => setGalleryIndex((i) => (i + 1) % activeDishPhotos.length)}
                      className="absolute right-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-lg text-white backdrop-blur transition-colors duration-300 hover:bg-black/65"
                      aria-label="Photo suivante"
                    >
                      ›
                    </button>
                    <div className="absolute top-5 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
                      {activeDishPhotos.map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            i === activePhotoIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <div className="flex flex-wrap gap-2">
                    {selectedDish.bestSeller && (
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-stone-900 backdrop-blur">
                        {tr('menu.bestSellerBadge')}
                      </span>
                    )}
                    {selectedDish.recommended && (
                      <span className="rounded-full bg-black/45 px-3 py-1 text-xs uppercase tracking-[0.28em] text-white backdrop-blur">
                        {tr('menu.recommendedBadge')}
                      </span>
                    )}
                    {selectedDish.outOfStock && (
                      <span className="rounded-full bg-red-500/90 px-3 py-1 text-xs uppercase tracking-[0.28em] text-white backdrop-blur">
                        {tr('menu.outOfStock')}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 font-display text-4xl font-bold text-white sm:text-5xl">{localizedDishName(selectedDish)}</h3>
                  <p className="mt-3 max-w-2xl text-stone-300">{localizedDishDescription(selectedDish)}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-stone-200">
                    <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1">{money(selectedDish.price)}</span>
                    <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1">{selectedDish.category}</span>
                    {selectedDish.spiceLevel > 0 && (
                      <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1">
                        {'🌶️'.repeat(selectedDish.spiceLevel)}
                      </span>
                    )}
                    {selectedDish.calories !== null && (
                      <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1">
                        {tr('modal.calories', { count: selectedDish.calories })}
                      </span>
                    )}
                    {selectedDish.dietTags.map((tagKey) => (
                      <span
                        key={tagKey}
                        className="rounded-full border border-white/10 bg-black/45 px-3 py-1"
                        title={dietLabel(tagKey)}
                      >
                        {dietIcon(tagKey)} {dietLabel(tagKey)}
                      </span>
                    ))}
                  </div>
                  {selectedDish.allergens.length > 0 && (
                    <p className="mt-3 text-xs text-stone-300">
                      Allergènes : {selectedDish.allergens.map((key) => allergenLabel(key)).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-6 p-6 sm:p-8">
                {modalStep === 'dish' && (
                  <div className="space-y-6 animate-slideUp">
                    <div className="rounded-3xl border border-stone-200 bg-stone-50/70 p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">{tr('modal.miniDescription')}</p>
                      <p className="mt-3 text-sm leading-7 text-stone-600">{localizedDishDescription(selectedDish)}</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">{tr('modal.ingredients')}</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {selectedDish.accompaniments.map((item) => (
                          <div key={item} className="rounded-2xl border border-stone-200 bg-stone-50/70 px-4 py-3 text-sm text-stone-700">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedDish.extras.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">{tr('modal.extras')}</p>
                        <div className="mt-3 space-y-2">
                          {selectedDish.extras.map((extra, index) => (
                            <label
                              key={index}
                              className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50/70 px-4 py-3 text-sm text-stone-700"
                            >
                              <span className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedExtraIndexes.has(index)}
                                  onChange={() => {
                                    setSelectedExtraIndexes((current) => {
                                      const next = new Set(current);
                                      if (next.has(index)) {
                                        next.delete(index);
                                      } else {
                                        next.add(index);
                                      }
                                      return next;
                                    });
                                  }}
                                />
                                {extra.name}
                              </span>
                              <span className="font-semibold text-navy-700">+{money(extra.price)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      {selectedDish.outOfStock ? (
                        <span className="w-full rounded-full border border-stone-200 bg-stone-100 px-5 py-4 text-center text-sm font-bold text-stone-400 sm:col-span-2">
                          {tr('menu.outOfStock')}
                        </span>
                      ) : (
                        <button
                          onClick={() => startOrderForDish()}
                          className="w-full rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-4 text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5" style={accentButtonStyle}
                        >
                          {tr('menu.chooseDish')}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedDish(null);
                          setModalStep(null);
                        }}
                        className="w-full rounded-full border border-stone-200 bg-white px-5 py-4 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/30"
                      >
                        {tr('modal.continueBrowsing')}
                      </button>
                    </div>
                  </div>
                )}

                {modalStep === 'drink' && (
                  <div className="space-y-6 animate-slideUp">
                    <div className="rounded-3xl border border-navy-300/25 bg-navy-300/8 p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-navy-700">{tr('modal.recommendedDrink')}</p>
                      <h4 className="mt-3 text-2xl font-semibold text-stone-900">{selectedDish.drink}</h4>
                      <p className="mt-2 text-sm leading-6 text-stone-500">{tr('modal.drinkHint')}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      {drinkMenu.map((drink) => (
                        <button
                          key={drink.id}
                          onClick={() => setSelectedDrink(drink)}
                          className={`overflow-hidden rounded-2xl border text-left transition-all duration-300 hover:-translate-y-1 ${
                            selectedDrink?.name === drink.name ? 'border-navy-300/50 bg-navy-300/10' : 'border-stone-200 bg-white'
                          }`}
                        >
                          <img
                            src={drink.image}
                            alt={localizedDishName(drink)}
                            loading="lazy"
                            decoding="async"
                            className="h-32 w-full object-cover"
                          />
                          <div className="p-3.5">
                            <p className="font-semibold text-stone-900">{localizedDishName(drink)}</p>
                            <p className="mt-1 text-xs text-stone-500">{localizedDishDescription(drink)}</p>
                            <p className="mt-2 text-sm font-semibold text-navy-700">{money(drink.price)}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={acceptDrink}
                        className="flex-1 rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-4 text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5" style={accentButtonStyle}
                      >
                        {tr('modal.addDrink')}
                      </button>
                      <button
                        onClick={() => {
                          if (dessertMenu.length > 0) {
                            setModalStep('dessert');
                          } else {
                            setModalStep(null);
                            setPhase('checkout');
                          }
                        }}
                        className="flex-1 rounded-full border border-stone-200 bg-white px-5 py-4 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/30"
                      >
                        {dessertMenu.length > 0 ? tr('modal.goToDessert') : tr('modal.goToPayment')}
                      </button>
                    </div>
                  </div>
                )}

                {modalStep === 'dessert' && (
                  <div className="space-y-6 animate-slideUp">
                    <div className="rounded-3xl border border-navy-300/25 bg-navy-300/8 p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-navy-700">{tr('modal.suggestedDessert')}</p>
                      <h4 className="mt-3 text-2xl font-semibold text-stone-900">{selectedDish.dessertSuggestion}</h4>
                      <p className="mt-2 text-sm leading-6 text-stone-500">{tr('modal.dessertHint')}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {dessertMenu.map((dessert) => (
                        <button
                          key={dessert.id}
                          onClick={() => setSelectedDessert(dessert)}
                          className={`overflow-hidden rounded-2xl border text-left transition-all duration-300 hover:-translate-y-1 ${
                            selectedDessert?.name === dessert.name ? 'border-navy-300/50 bg-navy-300/10' : 'border-stone-200 bg-white'
                          }`}
                        >
                          <img
                            src={dessert.image}
                            alt={localizedDishName(dessert)}
                            loading="lazy"
                            decoding="async"
                            className="h-36 w-full object-cover"
                          />
                          <div className="p-3.5">
                            <p className="font-semibold text-stone-900">{localizedDishName(dessert)}</p>
                            <p className="mt-1 text-xs text-stone-500">{localizedDishDescription(dessert)}</p>
                            <p className="mt-2 text-sm font-semibold text-navy-700">{money(dessert.price)}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={acceptDessert}
                        className="flex-1 rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-5 py-4 text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5" style={accentButtonStyle}
                      >
                        {tr('modal.addDessert')}
                      </button>
                      <button
                        onClick={() => {
                          setModalStep(null);
                          setPhase('checkout');
                        }}
                        className="flex-1 rounded-full border border-stone-200 bg-white px-5 py-4 text-sm font-semibold text-stone-600 transition-all duration-300 hover:border-navy-300/30"
                      >
                        {tr('modal.goToPayment')}
                      </button>
                    </div>
                  </div>
                )}

                {selectedDrink && (
                  <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 text-sm text-stone-500">
                    {tr('modal.footerNote', {
                      drink: selectedDrink.name,
                      dessertPart: selectedDessert ? tr('modal.footerDessertPart', { dessert: selectedDessert.name }) : '',
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
