import { Linking } from 'react-native';
import { navigationRef } from '../navigation/navigationRef';
import { navigateFromNotification } from './notificationNavigation';

/**
 * Deep links (WhatsApp messages, SMS, web) into the patient app.
 *
 * Accepted shapes — both resolve to the same targets:
 *   https://cuore.health/app/consultation/<appointmentId>   (universal / app link)
 *   https://cuore.health/app/cuorecare/book
 *   cuore://consultation/<appointmentId>                     (custom scheme)
 *   cuore://app/consultation/<appointmentId>
 *   cuore://cuorecare/book
 *
 * Deliberately NOT a React Navigation `linking` config: the targets live three navigators
 * deep (root stack → drawer 'Tabs' → bottom tab 'CuoreCare' → stack), the CuoreCare tab only
 * exists once access has resolved, and Splash resets the root stack on boot. A linking
 * config would push the route before Splash and get wiped. Instead the URL is parked here
 * and handed to navigateFromNotification — the exact path a push-notification tap takes —
 * only once the user is signed in and sitting on the drawer.
 */

const HOSTS = ['cuore.health', 'www.cuore.health'];

// Turn a URL into { screen, data } for navigateFromNotification, or null if it is not ours.
export function parseDeepLink(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.trim().match(/^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)([^?#]*)/i);
  if (!match) return null;
  const scheme = match[1].toLowerCase();
  const host = match[2].toLowerCase();
  let segments = (match[3] || '')
    .split('/')
    .filter(Boolean)
    .map(s => {
      try {
        return decodeURIComponent(s);
      } catch (_e) {
        return s;
      }
    });

  if (scheme === 'https' || scheme === 'http') {
    if (!HOSTS.includes(host)) return null;
    if (segments[0] !== 'app') return null;
    segments = segments.slice(1);
  } else if (scheme === 'cuore') {
    // cuore://consultation/123 parses "consultation" as the host.
    if (host && host !== 'app') segments = [host, ...segments];
  } else {
    return null;
  }

  const [first, second] = segments.map(s => s.toLowerCase());
  if (first === 'consultation' && segments[1]) {
    return { screen: 'AppointmentDetails', data: { appointmentId: segments[1] } };
  }
  if (first === 'cuorecare' && (second === 'book' || !second)) {
    return { screen: 'BookConsultation', data: {} };
  }
  return null;
}

let pending = null; // { screen, data, parkedAt }
let retryTimer = null;
const MAX_WAIT_FOR_TAB_MS = 15000;

// Walk the navigation state to see whether the CuoreCare bottom tab is mounted yet.
function cuoreCareTabMounted(rootState) {
  const home = rootState?.routes?.[rootState.index ?? 0];
  if (home?.name !== 'Home') return { onHome: false, hasTab: false };
  const drawer = home.state;
  const tabsRoute = drawer?.routes?.find(r => r.name === 'Tabs');
  const tabNames = tabsRoute?.state?.routeNames || [];
  return { onHome: true, hasTab: tabNames.includes('CuoreCare') };
}

/**
 * Try to open the parked link. Called on every navigation state change and on a short
 * timer while waiting for the CuoreCare tab, so it fires the moment the app is ready.
 */
export function flushPendingDeepLink() {
  if (!pending) return;
  if (!navigationRef.current?.isReady?.()) return;
  const rootState = navigationRef.current.getRootState?.();
  const { onHome, hasTab } = cuoreCareTabMounted(rootState);
  // Still on Splash / Login / OnBoarding: keep it parked; a later state change retries.
  if (!onHome) return;

  if (!hasTab) {
    // Signed in, but the CuoreCare tab appears only after access resolves. Give it a
    // moment; if the patient has no CuoreCare access the link is dropped (Home stays).
    if (Date.now() - pending.homeSince > MAX_WAIT_FOR_TAB_MS) {
      pending = null;
      return;
    }
    if (!retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        flushPendingDeepLink();
      }, 300);
    }
    return;
  }

  const { screen, data } = pending;
  pending = null;
  navigateFromNotification(navigationRef, screen, data);
}

export function handleDeepLinkUrl(url) {
  const target = parseDeepLink(url);
  if (!target) return false;
  pending = { ...target, homeSince: Date.now() };
  flushPendingDeepLink();
  return true;
}

// Track when the user reached Home, so the tab-wait timeout counts from there rather than
// from the moment the URL arrived (a cold start may sit on Splash/Login for a while).
export function onNavigationStateChange() {
  if (pending) {
    const rootState = navigationRef.current?.getRootState?.();
    const { onHome } = cuoreCareTabMounted(rootState);
    if (!onHome) pending.homeSince = Date.now();
  }
  flushPendingDeepLink();
}

// Cold start (getInitialURL) + warm (url event). Returns an unsubscribe function.
export function initDeepLinks() {
  Linking.getInitialURL()
    .then(url => {
      if (url) handleDeepLinkUrl(url);
    })
    .catch(() => {});
  const sub = Linking.addEventListener('url', ({ url }) => handleDeepLinkUrl(url));
  return () => {
    sub?.remove?.();
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  };
}
