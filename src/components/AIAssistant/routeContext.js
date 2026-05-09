/**
 * Route awareness for the in-app assistant (no imports from AppKnowledge — avoids cycles).
 */

export const TODAY_HOME = 'TodayMain';
export const EXPLORE_HOME = 'ExploreMain';
export const PROFILE_HOME = 'ProfileMain';

const TREND_STACK_SCREENS = new Set(['Predict', 'Health', 'Score', 'HealthRecords']);

/** Purchase / plan management — don’t send user to Checkout again if they’re already here. */
const SUBSCRIPTION_FLOW_SCREENS = new Set(['Checkout', 'PaymentDetails', 'RenewSubscription']);

/** Any focused route inside the Profile tab stack (see ProfileStack in navigation). */
const PROFILE_STACK_SCREENS = new Set([
  PROFILE_HOME,
  'EditProfile',
  'HealthRecords',
  'Support',
  'EditCaregiver',
  'EditDoctor',
  'SelectPersona',
  'DeleteAccount',
  'TermsAndConditions',
  'RenewSubscription',
  'Doctor',
]);

/** Flows before the main tab shell — avoid jumping to tabs until the user is in Home. */
export const PRE_HOME_SCREENS = new Set([
  'Splash',
  'Login',
  'Signup',
  'OtpScreen',
  'NewAccount',
  'OnBoarding',
]);

/** Safe to call from login / onboarding without assuming tabs exist. */
const ALLOW_NAVIGATE_FROM_PRE_HOME = new Set([
  'Splash',
  'Login',
  'Signup',
  'OtpScreen',
  'NewAccount',
  'OnBoarding',
  'Checkout',
  'PaymentDetails',
]);

const ROUTE_LABELS = {
  [TODAY_HOME]: 'Today — home',
  [EXPLORE_HOME]: 'Explore',
  Predict: 'Trend — predictions & charts',
  Notes: 'Notes',
  [PROFILE_HOME]: 'Profile — overview',
  Today: 'Today tab',
  Explore: 'Explore tab',
  Trend: 'Trend tab',
  Profile: 'Profile tab',
  Score: 'Heart score',
  ScoreMeter: 'Score meter',
  Health: 'Health',
  Nutrition: 'Nutrition',
  Fitness: 'Fitness',
  Mind: 'Mind',
  Tobacco: 'Tobacco',
  HealthRecords: 'Health records',
  EditProfile: 'Edit profile',
  EditDoctor: 'Edit doctor',
  EditCaregiver: 'Edit caregiver',
  Support: 'Support',
  RenewSubscription: 'Renew subscription',
  Doctor: 'Doctor',
  CuoreKnowledge: 'Cuore Knowledge',
  KnowledgeDetails: 'Article',
  MealBuilder: 'Meal builder',
  MealBuilder1: 'Meal builder',
  MealBuilder2: 'Meal builder',
  Recipe: 'Recipes',
  Search: 'Search',
  Checkout: 'Checkout',
  PaymentDetails: 'Payment details',
  CalorieIgnite: 'Calorie Ignite',
  MidMorningBoost: 'Mid Morning Boost',
  RefreshRefuel: 'Refresh Refuel',
  FitnessDetails: 'Fitness details',
  MindDetails: 'Mind details',
  DeleteAccount: 'Delete account',
  TermsAndConditions: 'Terms & conditions',
  SelectPersona: 'Persona',
  Home: 'Home (tabs)',
};

/**
 * @param {string | null | undefined} routeName
 * @returns {string}
 */
export function humanizeRoute(routeName) {
  if (!routeName) return 'an unknown screen';
  return ROUTE_LABELS[routeName] || routeName.replace(/([A-Z])/g, ' $1').trim();
}

/**
 * @param {{ parent?: string, screen?: string } | string | null | undefined} spec
 * @returns {string | null}
 */
export function navigationTargetScreen(spec) {
  if (!spec) return null;
  if (typeof spec === 'string') return spec;
  if (spec.screen) return spec.screen;
  return null;
}

/**
 * Whether opening this destination is redundant given the focused route.
 * @param {string | null | undefined} currentRoute
 * @param {string | { parent: string, screen: string }} navigateSpec
 */
export function isAlreadyAtDestination(currentRoute, navigateSpec) {
  if (!currentRoute || !navigateSpec) return false;

  if (typeof navigateSpec === 'string') {
    const target = navigateSpec;
    if (currentRoute === target) return true;
    if (target === 'Checkout' && SUBSCRIPTION_FLOW_SCREENS.has(currentRoute)) return true;
    if (target === 'Today' && currentRoute === TODAY_HOME) return true;
    if (target === 'Trend' && TREND_STACK_SCREENS.has(currentRoute)) return true;
    if (target === 'Explore' && currentRoute === EXPLORE_HOME) return true;
    if (target === 'Profile' && PROFILE_STACK_SCREENS.has(currentRoute)) return true;
    if (target === 'Notes' && currentRoute === 'Notes') return true;
    return false;
  }

  if (navigateSpec.parent === 'Profile' && navigateSpec.screen) {
    return currentRoute === navigateSpec.screen;
  }

  return false;
}

/**
 * @param {string | null | undefined} currentRoute
 * @param {string | { parent: string, screen: string } | null | undefined} navigateSpec
 */
export function shouldBlockNavigationFromPreHome(currentRoute, navigateSpec) {
  if (!currentRoute || !navigateSpec || !PRE_HOME_SCREENS.has(currentRoute)) {
    return false;
  }
  const leaf = navigationTargetScreen(navigateSpec);
  if (!leaf) return false;
  return !ALLOW_NAVIGATE_FROM_PRE_HOME.has(leaf);
}

/**
 * @param {string} baseText
 * @param {string | null | undefined} currentRoute
 * @param {boolean} alreadyThere
 */
export function contextualizeNavigationText(baseText, currentRoute, alreadyThere) {
  if (!alreadyThere || !currentRoute) return baseText;
  const label = humanizeRoute(currentRoute);
  const stripped = baseText.replace(/\s*Let me take you there!\.?\s*$/i, '').trim();
  return `You’re already on **${label}** — you’re in the right place.\n\n${stripped}`;
}

/**
 * @param {string | null | undefined} currentRoute
 */
export function formatWhereAmI(currentRoute) {
  const label = humanizeRoute(currentRoute);
  const core = currentRoute
    ? `You’re on **${label}** right now.`
    : "I couldn’t read the current screen (navigation may still be starting).";

  return `${core}

**Bottom tabs:** **Today** · **Explore** · **Trend** · **Notes** · **Profile**

Ask me to open nutrition, fitness, mind, checkout, renew subscription, support, or any other area — I’ll route you when you’re signed in to the home experience.`;
}

/**
 * @param {string | null | undefined} currentRoute
 */
export function formatPreHomeNavigationHint(currentRoute) {
  const label = humanizeRoute(currentRoute);
  return `\n\n_Finish **sign-in** or **onboarding** first — you’re on **${label}**, so tab shortcuts open after you reach the home experience._`;
}
