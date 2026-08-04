export type DishTranslation = { name: string; description: string };
export type RestaurantTranslation = { name: string; address: string; tags: string[] };
export type DishExtra = { name: string; price: number };
export type CostBreakdownItem = { name: string; cost: number };
export type MenuService = 'all_day' | 'lunch' | 'dinner';
export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type DayHours = { closed: boolean; open: string; close: string };
export type OpeningHours = Record<DayKey, DayHours>;

// Lignes brutes telles que renvoyées par Postgres (snake_case)
export type DishRow = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  images: string[] | null;
  recommended: boolean;
  best_seller: boolean;
  ingredients: string[] | null;
  accompaniments: string[] | null;
  drink: string;
  dessert_suggestion: string;
  position: number;
  translations: Record<string, DishTranslation> | null;
  diet_tags: string[] | null;
  allergens: string[] | null;
  spice_level: number;
  calories: number | null;
  out_of_stock: boolean;
  extras: DishExtra[] | null;
  cost_enabled: boolean;
  cost_ingredients: number;
  cost_prep: number;
  cost_breakdown: CostBreakdownItem[] | null;
  service: MenuService;
  stock_quantity: number | null;
  prep_time_minutes: number | null;
};

export type CategoryRow = {
  id: string;
  restaurant_id: string;
  name: string;
  position: number;
  dishes?: DishRow[];
};

export type RestaurantRow = {
  id: string;
  owner_id: string | null;
  slug: string;
  name: string;
  hero_image: string | null;
  rating: number;
  review_count: number;
  prep_time: string;
  address: string;
  tags: string[] | null;
  translations: Record<string, RestaurantTranslation> | null;
  stripe_account_id: string | null;
  stripe_onboarded: boolean;
  accent_color: string | null;
  intro_video: string | null;
  wait_animation: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan | null;
  table_count: number;
  lunch_start: string | null;
  lunch_end: string | null;
  dinner_start: string | null;
  dinner_end: string | null;
  review_url: string | null;
  service_pin: string | null;
  opening_hours: OpeningHours | null;
  lunch_enabled: boolean;
  dinner_enabled: boolean;
  custom_intro_video: string | null;
  custom_wait_video: string | null;
  pin_protected_sections: string[];
  categories?: CategoryRow[];
};

// Types applicatifs (camelCase), utilisés dans les composants
export type Dish = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images?: string[];
  recommended: boolean;
  bestSeller: boolean;
  ingredients: string[];
  accompaniments: string[];
  drink: string;
  dessertSuggestion: string;
  position: number;
  translations: Record<string, DishTranslation>;
  dietTags: string[];
  allergens: string[];
  spiceLevel: number;
  calories: number | null;
  outOfStock: boolean;
  extras: DishExtra[];
  costEnabled: boolean;
  costIngredients: number;
  costPrep: number;
  costBreakdown: CostBreakdownItem[];
  service: MenuService;
  stockQuantity: number | null;
  prepTimeMinutes: number | null;
};

export type Category = {
  id: string;
  restaurantId: string;
  name: string;
  position: number;
  dishes: Dish[];
};

export type Restaurant = {
  id: string;
  ownerId: string | null;
  slug: string;
  name: string;
  heroImage: string;
  rating: number;
  reviewCount: number;
  prepTime: string;
  address: string;
  tags: string[];
  translations: Record<string, RestaurantTranslation>;
  stripeAccountId: string | null;
  stripeOnboarded: boolean;
  accentColor: string | null;
  introVideo: string | null;
  waitAnimation: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: SubscriptionPlan | null;
  tableCount: number;
  lunchStart: string | null;
  lunchEnd: string | null;
  dinnerStart: string | null;
  dinnerEnd: string | null;
  reviewUrl: string | null;
  servicePin: string | null;
  openingHours: OpeningHours | null;
  lunchEnabled: boolean;
  dinnerEnabled: boolean;
  customIntroVideo: string | null;
  customWaitVideo: string | null;
  pinProtectedSections: string[];
};

export type RestaurantWithMenu = Restaurant & { categories: Category[] };

export type SubscriptionStatus = 'inactive' | 'active' | 'past_due' | 'canceled';
export type SubscriptionPlan = 'monthly' | 'annual_monthly' | 'annual_upfront';

export type OrderStatus = 'new' | 'confirmed' | 'served' | 'done';
export type OrderItem = { name: string; price: number; quantity: number; extraNames?: string[] };

export type OrderRow = {
  id: string;
  restaurant_id: string;
  table_label: string;
  status: OrderStatus;
  paid: boolean;
  total: number;
  items: OrderItem[] | null;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  restaurantId: string;
  tableLabel: string;
  status: OrderStatus;
  paid: boolean;
  total: number;
  items: OrderItem[];
  specialInstructions: string;
  createdAt: string;
};

export type RequestType = 'bill' | 'waiter';
export type RequestStatus = 'pending' | 'handled';

export type TableRequestRow = {
  id: string;
  restaurant_id: string;
  table_label: string;
  type: RequestType;
  status: RequestStatus;
  created_at: string;
};

export type TableRequest = {
  id: string;
  restaurantId: string;
  tableLabel: string;
  type: RequestType;
  status: RequestStatus;
  createdAt: string;
};
