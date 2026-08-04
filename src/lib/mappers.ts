import type {
  CategoryRow,
  Dish,
  DishRow,
  Order,
  OrderRow,
  Restaurant,
  RestaurantRow,
  RestaurantWithMenu,
  TableRequest,
  TableRequestRow,
} from './types';

export function toDishRowPatch(patch: Partial<Dish>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.description !== undefined) out.description = patch.description;
  if (patch.price !== undefined) out.price = patch.price;
  if (patch.image !== undefined) out.image = patch.image;
  if (patch.images !== undefined) out.images = patch.images;
  if (patch.recommended !== undefined) out.recommended = patch.recommended;
  if (patch.bestSeller !== undefined) out.best_seller = patch.bestSeller;
  if (patch.categoryId !== undefined) out.category_id = patch.categoryId;
  if (patch.translations !== undefined) out.translations = patch.translations;
  if (patch.dietTags !== undefined) out.diet_tags = patch.dietTags;
  if (patch.allergens !== undefined) out.allergens = patch.allergens;
  if (patch.spiceLevel !== undefined) out.spice_level = patch.spiceLevel;
  if (patch.calories !== undefined) out.calories = patch.calories;
  if (patch.outOfStock !== undefined) out.out_of_stock = patch.outOfStock;
  if (patch.extras !== undefined) out.extras = patch.extras;
  if (patch.costEnabled !== undefined) out.cost_enabled = patch.costEnabled;
  if (patch.costIngredients !== undefined) out.cost_ingredients = patch.costIngredients;
  if (patch.costPrep !== undefined) out.cost_prep = patch.costPrep;
  if (patch.costBreakdown !== undefined) out.cost_breakdown = patch.costBreakdown;
  if (patch.service !== undefined) out.service = patch.service;
  if (patch.stockQuantity !== undefined) out.stock_quantity = patch.stockQuantity;
  if (patch.prepTimeMinutes !== undefined) out.prep_time_minutes = patch.prepTimeMinutes;
  return out;
}

export function toRestaurantRowPatch(patch: Partial<Restaurant>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.heroImage !== undefined) out.hero_image = patch.heroImage;
  if (patch.address !== undefined) out.address = patch.address;
  if (patch.prepTime !== undefined) out.prep_time = patch.prepTime;
  if (patch.tags !== undefined) out.tags = patch.tags;
  if (patch.rating !== undefined) out.rating = patch.rating;
  if (patch.reviewCount !== undefined) out.review_count = patch.reviewCount;
  if (patch.translations !== undefined) out.translations = patch.translations;
  if (patch.accentColor !== undefined) out.accent_color = patch.accentColor;
  if (patch.introVideo !== undefined) out.intro_video = patch.introVideo;
  if (patch.waitAnimation !== undefined) out.wait_animation = patch.waitAnimation;
  if (patch.subscriptionStatus !== undefined) out.subscription_status = patch.subscriptionStatus;
  if (patch.tableCount !== undefined) out.table_count = patch.tableCount;
  if (patch.lunchStart !== undefined) out.lunch_start = patch.lunchStart;
  if (patch.lunchEnd !== undefined) out.lunch_end = patch.lunchEnd;
  if (patch.dinnerStart !== undefined) out.dinner_start = patch.dinnerStart;
  if (patch.dinnerEnd !== undefined) out.dinner_end = patch.dinnerEnd;
  if (patch.reviewUrl !== undefined) out.review_url = patch.reviewUrl;
  if (patch.servicePin !== undefined) out.service_pin = patch.servicePin;
  if (patch.openingHours !== undefined) out.opening_hours = patch.openingHours;
  if (patch.lunchEnabled !== undefined) out.lunch_enabled = patch.lunchEnabled;
  if (patch.dinnerEnabled !== undefined) out.dinner_enabled = patch.dinnerEnabled;
  if (patch.customIntroVideo !== undefined) out.custom_intro_video = patch.customIntroVideo;
  if (patch.customWaitVideo !== undefined) out.custom_wait_video = patch.customWaitVideo;
  if (patch.pinProtectedSections !== undefined) out.pin_protected_sections = patch.pinProtectedSections;
  return out;
}

export function mapDish(row: DishRow): Dish {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    price: row.price,
    image: row.image ?? '',
    images: row.images ?? undefined,
    recommended: row.recommended,
    bestSeller: row.best_seller,
    ingredients: row.ingredients ?? [],
    accompaniments: row.accompaniments ?? [],
    drink: row.drink,
    dessertSuggestion: row.dessert_suggestion,
    position: row.position,
    translations: row.translations ?? {},
    dietTags: row.diet_tags ?? [],
    allergens: row.allergens ?? [],
    spiceLevel: row.spice_level ?? 0,
    calories: row.calories ?? null,
    outOfStock: row.out_of_stock ?? false,
    extras: row.extras ?? [],
    costEnabled: row.cost_enabled ?? false,
    costIngredients: row.cost_ingredients ?? 0,
    costPrep: row.cost_prep ?? 0,
    costBreakdown: row.cost_breakdown ?? [],
    service: row.service ?? 'all_day',
    stockQuantity: row.stock_quantity,
    prepTimeMinutes: row.prep_time_minutes,
  };
}

export function mapCategory(row: CategoryRow) {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    name: row.name,
    position: row.position,
    dishes: (row.dishes ?? []).slice().sort((a, b) => a.position - b.position).map(mapDish),
  };
}

export function mapRestaurant(row: RestaurantRow): Restaurant {
  return {
    id: row.id,
    ownerId: row.owner_id,
    slug: row.slug,
    name: row.name,
    heroImage: row.hero_image ?? '',
    rating: row.rating,
    reviewCount: row.review_count,
    prepTime: row.prep_time,
    address: row.address,
    tags: row.tags ?? [],
    translations: row.translations ?? {},
    stripeAccountId: row.stripe_account_id,
    stripeOnboarded: row.stripe_onboarded,
    accentColor: row.accent_color,
    introVideo: row.intro_video,
    waitAnimation: row.wait_animation,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    subscriptionStatus: row.subscription_status,
    subscriptionPlan: row.subscription_plan,
    tableCount: row.table_count,
    lunchStart: row.lunch_start,
    lunchEnd: row.lunch_end,
    dinnerStart: row.dinner_start,
    dinnerEnd: row.dinner_end,
    reviewUrl: row.review_url,
    servicePin: row.service_pin,
    openingHours: row.opening_hours,
    lunchEnabled: row.lunch_enabled,
    dinnerEnabled: row.dinner_enabled,
    customIntroVideo: row.custom_intro_video,
    customWaitVideo: row.custom_wait_video,
    pinProtectedSections: row.pin_protected_sections ?? [],
  };
}

export function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    tableLabel: row.table_label,
    status: row.status,
    paid: row.paid,
    total: row.total,
    items: row.items ?? [],
    specialInstructions: row.special_instructions ?? '',
    createdAt: row.created_at,
  };
}

export function mapTableRequest(row: TableRequestRow): TableRequest {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    tableLabel: row.table_label,
    type: row.type,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function mapRestaurantWithMenu(row: RestaurantRow): RestaurantWithMenu {
  return {
    ...mapRestaurant(row),
    categories: (row.categories ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(mapCategory),
  };
}
