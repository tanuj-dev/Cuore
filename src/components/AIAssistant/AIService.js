import { INTENTS } from './AppKnowledge';
import { navigate, navigateNested } from '../../utilities/NavigationService';
import {
  contextualizeNavigationText,
  formatPreHomeNavigationHint,
  humanizeRoute,
  isAlreadyAtDestination,
  PRE_HOME_SCREENS,
  shouldBlockNavigationFromPreHome,
} from './routeContext';

/**
 * Finds the best matching intent for a user message and returns a response object.
 * Skips the catch-all (last) entry until no other match is found.
 *
 * @param {string} userInput
 * @param {string | null} [currentRouteName] from NavigationService.getCurrentRoute()
 */
export function processMessage(userInput, currentRouteName = null) {
  const trimmed = userInput.trim();
  if (!trimmed) return null;

  const context = { currentRoute: currentRouteName };
  const intents = INTENTS;

  for (let i = 0; i < intents.length - 1; i++) {
    const intent = intents[i];
    if (intent.patterns.some(p => p.test(trimmed))) {
      const base = buildResponse(intent, trimmed, context);
      return mergeRouteContext(base, currentRouteName, intent.id);
    }
  }

  const fallback = intents[intents.length - 1];
  const base = buildResponse(fallback, trimmed, context);
  return mergeRouteContext(base, currentRouteName, fallback.id);
}

/**
 * @param {object} intent
 * @param {string} input
 * @param {{ currentRoute: string | null }} context
 */
function buildResponse(intent, input, context = {}) {
  const text =
    typeof intent.response === 'function' ? intent.response(input, context) : intent.response;
  return {
    text,
    navigate: intent.navigate ?? null,
    suggestions: intent.suggestions ?? [],
  };
}

/**
 * @param {{ text: string, navigate: string | { parent: string, screen: string, params?: object } | null, suggestions: string[] }} base
 * @param {string | null} currentRoute
 * @param {string | undefined} intentId
 */
function mergeRouteContext(base, currentRoute, intentId) {
  let { text, navigate, suggestions } = base;

  if (intentId === 'greeting' && currentRoute) {
    if (PRE_HOME_SCREENS.has(currentRoute)) {
      text += `\n\n_You’re on **${humanizeRoute(currentRoute)}** — complete sign-in or onboarding, then I can open any tab for you._`;
    } else {
      text += `\n\n_I see you’re on **${humanizeRoute(currentRoute)}** — ask me to open Nutrition, Trend, Profile, checkout, or anything else._`;
    }
  }

  if (navigate && shouldBlockNavigationFromPreHome(currentRoute, navigate)) {
    navigate = null;
    text += formatPreHomeNavigationHint(currentRoute);
  } else if (navigate && isAlreadyAtDestination(currentRoute, navigate)) {
    text = contextualizeNavigationText(text, currentRoute, true);
    navigate = null;
  }

  return { text, navigate, suggestions };
}

/**
 * Executes a navigation action returned from processMessage.
 * `navigate` may be a screen name string or `{ parent, screen, params? }` for nested stacks (e.g. Profile → RenewSubscription).
 *
 * @param {string | { parent: string, screen: string, params?: object } | null} spec
 * @param {number} [delayMs]
 */
export function executeNavigation(spec, delayMs = 600) {
  if (!spec) return;
  setTimeout(() => {
    if (typeof spec === 'string') {
      navigate(spec);
    } else if (spec?.parent && spec?.screen) {
      navigateNested(spec.parent, spec.screen, spec.params);
    }
  }, delayMs);
}
