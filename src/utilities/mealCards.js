/**
 * Clinic-level meal-card switch (Launch edits, 5 Nov): "Meal cards (Home & Explore) should have
 * option to be disabled at chain or clinic level — card stays but doesn't open to show dishes".
 * The server resolves it (home payload `features.mealCards`, from the patient's clinic and its
 * chain). Absent → on, so an older backend changes nothing.
 */
export const MEAL_ROUTES = ['Nutrition', 'MealBuilder', 'CalorieIgnite', 'MidMorningBoost', 'RefreshRefuel', 'Recipe'];

export const mealCardsEnabled = homeData => homeData?.features?.mealCards !== false;

export const isMealRoute = route => MEAL_ROUTES.includes(route);

export const MEAL_CARDS_OFF_TITLE = 'Coming from your clinic';
export const MEAL_CARDS_OFF_BODY =
  'Your clinic will share its own nutrition plan with you here. Meal suggestions are paused until then.';
